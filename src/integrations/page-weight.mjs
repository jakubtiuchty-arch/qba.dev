// Po zbudowaniu strony liczy wagę każdej podstrony (HTML + CSS + JS + fonty + obrazki <img src>)
// i wpisuje ją w miejsce __PAGE_WEIGHT__ w stopce. Liczone są rozmiary plików przed kompresją,
// więc wynik jest raczej zawyżony niż zaniżony.
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLACEHOLDER = '__PAGE_WEIGHT__';

async function listHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listHtml(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// Z <picture> liczymy największy wariant z pierwszego <source> (AVIF), czyli to, co pobierze
// współczesna przeglądarka na ekranie o wysokiej gęstości. Zapasowy <img src> pomijamy.
function largestCandidate(srcset) {
  let best = null;
  let bestW = -1;
  for (const part of srcset.split(',')) {
    const [url, descriptor = '1x'] = part.trim().split(/\s+/);
    const w = parseFloat(descriptor) || 0;
    if (w > bestW) { bestW = w; best = url; }
  }
  return best;
}

function pictureRefs(html) {
  const refs = [];
  const stripped = html.replace(/<picture\b[\s\S]*?<\/picture>/g, (block) => {
    const source = block.match(/<source\b[^>]*\ssrcset="([^"]+)"/);
    const img = block.match(/<img\b[^>]*\s(?:srcset)="([^"]+)"/);
    const chosen = source ? largestCandidate(source[1]) : img ? largestCandidate(img[1]) : null;
    if (chosen) refs.push(chosen);
    return '';
  });
  return { refs, stripped };
}

function localRefs(text) {
  const refs = new Set();
  const attr = /<(?:link|script|img)\b[^>]*?\s(?:href|src)="([^"]+)"/g;
  const cssUrl = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
  for (const re of [attr, cssUrl]) {
    for (const m of text.matchAll(re)) {
      const ref = m[1];
      if (ref.startsWith('/') && !ref.startsWith('//')) refs.add(ref.split(/[?#]/)[0]);
    }
  }
  return refs;
}

function isCountedLink(html, ref) {
  // Liczymy arkusze stylów, skrypty, preload fontów i obrazki. Pomijamy kanoniczne linki, ikony itp.
  const esc = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linkTag = new RegExp(`<link\\b[^>]*href="${esc}[^"]*"[^>]*>`);
  const m = html.match(linkTag);
  if (!m) return true; // <script src>, <img src>, url() w CSS
  return /rel="(stylesheet|preload|modulepreload)"/.test(m[0]);
}

// Polska typografia: jednoliterowe spójniki i przyimki (a, i, o, u, w, z) nie zostają na końcu wiersza.
// Zamieniamy spację po nich na twardą — tylko w tekście, poza <script>, <style>, <pre> i <textarea>.
// Całe bloki <script>, <style>, <pre> i <textarea> (razem z treścią) przepuszczamy bez zmian i nie dzielimy
// ich po znacznikach: w zminifikowanym CSS stoi „<” (np. „@media (width<=51.99rem)”), więc dzielenie po
// „<…>” połykało zamykające </style> i reszta strony (tak było na 404.html) zostawała bez twardych spacji.
const RAW_BLOCK = /<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
function glueOrphans(html) {
  let out = '';
  let last = 0;
  for (const m of html.matchAll(RAW_BLOCK)) {
    out += glueMarkup(html.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return out + glueMarkup(html.slice(last));
}
function glueMarkup(chunk) {
  const parts = chunk.split(/(<[^>]+>)/);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('<') || !part.trim()) continue;
    const re = /(^|[\s\u00a0(„"])([aiouwzAIOUWZ]) +(?=\S)/g;
    // Dwa przebiegi: łapiemy też sąsiadujące jednoliterowe słowa („a w razie”).
    parts[i] = part
      .replace(re, '$1$2\u00a0')
      .replace(re, '$1$2\u00a0')
      // Liczba nie odrywa się od jednostki („7 dni”, „24 godzin”, „30 minut”, „2 500 zł”).
      .replace(/(\d) (?=[\p{L}%])/gu, '$1\u00a0')
      // Grupy cyfr numeru telefonu zostają w jednym wierszu („726 151 515”).
      .replace(/\b(\d{3}) (?=\d{3}\b)/g, '$1\u00a0');
  }
  return parts.join('');
}

export default function pageWeight() {
  return {
    name: 'qba-page-weight',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = await listHtml(root);
        const sizeCache = new Map();
        const sizeOf = async (ref) => {
          if (!sizeCache.has(ref)) {
            try {
              sizeCache.set(ref, (await stat(join(root, decodeURIComponent(ref)))).size);
            } catch {
              sizeCache.set(ref, 0);
            }
          }
          return sizeCache.get(ref);
        };

        for (const file of files) {
          let html = glueOrphans(await readFile(file, 'utf8'));
          if (!html.includes(PLACEHOLDER)) {
            await writeFile(file, html);
            continue;
          }

          const seen = new Set();
          let total = Buffer.byteLength(html);
          const { refs: pictures, stripped } = pictureRefs(html);
          const queue = [
            ...pictures.filter((r) => r.startsWith('/') && !r.startsWith('//')).map((r) => r.split(/[?#]/)[0]),
            ...[...localRefs(stripped)].filter((r) => isCountedLink(stripped, r)),
          ];
          while (queue.length) {
            const ref = queue.shift();
            if (seen.has(ref)) continue;
            seen.add(ref);
            total += await sizeOf(ref);
            if (ref.endsWith('.css')) {
              try {
                const css = await readFile(join(root, ref), 'utf8');
                for (const inner of localRefs(css)) if (!seen.has(inner)) queue.push(inner);
              } catch {}
            }
          }

          const kb = Math.ceil(total / 1000);
          const label = `${new Intl.NumberFormat('pl-PL').format(kb).replace(/\s/g, ' ')} kB`;
          html = html.replaceAll(PLACEHOLDER, label);
          await writeFile(file, html);
          logger.info(`${file.replace(root, '/')} → ${label}`);
        }
      },
    },
  };
}
