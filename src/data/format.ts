// Wspólne funkcje formatowania cen i tekstu. Kwoty zawsze z src/data/site.ts.
import { pricing, formatPLN, gross } from './site';

export const NBSP = ' ';

/** true = kwoty w danych są netto (obok pokazujemy brutto). */
export const isNet = pricing.pricesAreNet;
export const vatPercent = Math.round(pricing.vatRate * 100);

/** „2 500 zł netto” albo „2 500 zł brutto”, zależnie od `pricesAreNet`. */
export const priceMain = (amount: number) => `${formatPLN(amount)}${NBSP}${isNet ? 'netto' : 'brutto'}`;

/** „3 075 zł brutto” — tylko wtedy, gdy kwoty w danych są netto. */
export const priceGross = (amount: number) => (isNet ? `${formatPLN(gross(amount))}${NBSP}brutto` : null);

/** „2 500 zł netto (3 075 zł brutto)” albo samo „2 500 zł brutto”. */
export const priceText = (amount: number) => {
  const second = priceGross(amount);
  return second ? `${priceMain(amount)} (${second})` : priceMain(amount);
};

/** Twarda spacja po jednoliterowych słowach i po liczbach („w dni”, „14 dni”). */
export const tie = (text: string) => text.replace(/(?<=^|\s)([aiouwzAIOUWZ]|\d+) /g, `$1${NBSP}`);

/** „A, B i C” (albo „A, B albo C”). */
export const joinPl = (items: readonly string[], last = 'i') =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ${last}${NBSP}${items[items.length - 1]}`;

/** Pierwsza litera wielka („dwie rundy” → „Dwie rundy”). */
export const upperFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Pierwsza litera mała, chyba że słowo to skrót (CMS, SEO). */
export const lowerFirst = (text: string) => (/^\p{Lu}{2}/u.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1));
