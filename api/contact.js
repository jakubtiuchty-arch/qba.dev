// Formularz kontaktowy qba.dev (funkcja Vercel, Node). Adres: /api/contact/ (vercel.json ma trailingSlash: true,
// więc formularz wysyła od razu na adres z ukośnikiem i omija przekierowanie 308).
//
// Dwa tryby odpowiedzi:
// - żądanie z JavaScriptu (fetch z JSON, nagłówek Accept: application/json) → odpowiedź JSON,
// - zwykłe wysłanie formularza bez JavaScriptu (application/x-www-form-urlencoded) → przekierowanie 303
//   na /kontakt/wyslano/ albo /kontakt/blad/ (także przy limicie zapytań i błędach walidacji).
//
// Treść wiadomości i dane z formularza nie trafiają do logów.

// Prosty limit wysyłek w pamięci (zeruje się przy zimnym starcie funkcji). Liczy tylko żądania, które przeszły
// pułapkę na boty i walidację, czyli te, które naprawdę wysyłają maila — błędy w formularzu go nie zjadają.
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuta
const RATE_LIMIT_MAX = 3; // najwyżej 3 wysyłki na minutę z jednego IP

const PAGE_SENT = '/kontakt/wyslano/';
const PAGE_ERROR = '/kontakt/blad/';
const PAGE_FORM = '/kontakt/';

const LIMITS = { name: 100, email: 100, phone: 30, message: 5000 };

// Dozwolone wartości pola „Pakiet lub budżet” (formularz: src/components/ContactForm.astro).
// Kwot tu nie powtarzam — są w src/data/site.ts — żeby mail nie rozjechał się z cennikiem.
const BUDGETS = {
    starter: 'Pakiet Starter',
    pro: 'Pakiet Pro',
    premium: 'Pakiet Premium',
    custom: 'Spoza pakietów (wycena osobno)',
    unknown: 'Jeszcze nie wiem',
};

// Komunikat dla odwiedzającego przy awarii po stronie serwera. Skrypt formularza dokleja go do zdania
// „Nie udało się wysłać wiadomości.” i podaje telefon oraz e-mail.
const SERVER_ERROR = 'Formularz chwilowo nie działa';

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Odrzuca znaki, które w adresie są zwykle literówką albo śmieciem (, ; : < > ( ) [ ] " \), i wymaga
// co najmniej dwuznakowej końcówki domeny bez kropki na końcu. Taki adres trafia do reply_to w Resend,
// więc lepiej wskazać błąd przy polu niż zgubić wiadomość na odrzuceniu po stronie Resend.
// To samo wyrażenie ma stała EMAIL w src/components/ContactForm.astro.
function isValidEmail(email) {
    const regex = /^[^\s@,;:<>()[\]"\\]+@[^\s@,;:<>()[\]"\\]+\.[^\s@,;:<>()[\]"\\.]{2,}$/;
    return regex.test(email);
}

// Cyfry, spacje, nawiasy, myślniki i „+”; od 6 do 15 cyfr.
function isValidPhone(phone) {
    if (!/^[\d\s()+-]+$/.test(phone)) return false;
    const digits = phone.replace(/\D/g, '').length;
    return digits >= 6 && digits <= 15;
}

function checkRateLimit(ip) {
    const now = Date.now();

    // Sprzątanie starych wpisów, żeby mapa nie rosła bez końca.
    if (rateLimitMap.size > 1000) {
        for (const [key, record] of rateLimitMap) {
            if (now - record.timestamp > RATE_LIMIT_WINDOW) rateLimitMap.delete(key);
        }
    }

    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return true;
    }

    if (now - record.timestamp > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return true;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return false;
    }

    record.count++;
    return true;
}

function header(req, name) {
    const value = req.headers[name];
    return String(Array.isArray(value) ? value.join(',') : value || '').toLowerCase();
}

// JSON dla fetch z JavaScriptu; przekierowanie dla zwykłego formularza.
function wantsJson(req) {
    return header(req, 'accept').includes('application/json') || header(req, 'content-type').includes('application/json');
}

function redirect(res, location) {
    res.statusCode = 303;
    res.setHeader('Location', location);
    res.setHeader('Cache-Control', 'no-store');
    return res.end();
}

// Jedno miejsce, które decyduje o formie odpowiedzi.
function reply(req, res, status, payload) {
    if (!wantsJson(req)) {
        return redirect(res, status >= 200 && status < 300 ? PAGE_SENT : PAGE_ERROR);
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(payload);
}

// Vercel parsuje JSON i x-www-form-urlencoded sam; inne typy przychodzą jako tekst albo bufor.
function readBody(req) {
    const body = req.body;
    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
        const text = String(body);
        try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch {
            // To nie JSON — próbujemy jak formularz.
        }
        return Object.fromEntries(new URLSearchParams(text));
    }
    return {};
}

// Tylko pojedyncze wartości tekstowe; tablice (powtórzone pola) i inne typy traktujemy jak brak.
function text(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function validate({ name, email, phone, budget, message }) {
    const fields = {};

    if (!name) fields.name = 'Wpisz imię i nazwisko.';
    else if (name.length > LIMITS.name) fields.name = `Imię i nazwisko może mieć najwyżej ${LIMITS.name} znaków.`;

    if (!email) fields.email = 'Wpisz adres e-mail.';
    else if (email.length > LIMITS.email) fields.email = `Adres e-mail może mieć najwyżej ${LIMITS.email} znaków.`;
    else if (!isValidEmail(email)) fields.email = 'Wpisz adres e-mail w formacie nazwa@domena.pl.';

    if (phone && (phone.length > LIMITS.phone || !isValidPhone(phone))) {
        fields.phone = 'Numer telefonu może zawierać tylko cyfry, spacje, nawiasy, myślniki i znak +.';
    }

    if (budget && !Object.hasOwn(BUDGETS, budget)) fields.budget = 'Wybierz jedną z opcji z listy.';

    if (!message) fields.message = 'Opisz krótko projekt.';
    else if (message.length > LIMITS.message) fields.message = `Opis może mieć najwyżej ${LIMITS.message} znaków.`;

    return fields;
}

export default async function handler(req, res) {
    // Tylko POST. Ktoś, kto otworzy adres w przeglądarce, trafia na stronę kontaktu.
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        if (!wantsJson(req) && header(req, 'accept').includes('text/html')) {
            return redirect(res, PAGE_FORM);
        }
        return res.status(405).json({ error: 'Formularz przyjmuje tylko wysyłkę metodą POST' });
    }

    // IP klienta do limitu wysyłek i do stopki maila (ochrona przed spamem).
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               'unknown';

    let body;
    try {
        // Przy niepoprawnym JSON-ie Vercel rzuca błąd przy odczycie req.body.
        body = readBody(req);
    } catch {
        return reply(req, res, 400, { error: 'Nieprawidłowe dane formularza.' });
    }

    const name = text(body.name);
    const email = text(body.email);
    const phone = text(body.phone);
    const budget = text(body.budget);
    const message = text(body.message);

    // Pułapka na boty: ukryte pole „hp_extra” wypełniają tylko boty. Udajemy sukces, ale nic nie wysyłamy.
    // Nazwa pola nie przypomina niczego, co wypełnia autouzupełnianie, żeby nie odrzucić po cichu człowieka.
    if (text(body.hp_extra)) {
        return reply(req, res, 200, { success: true });
    }

    const fields = validate({ name, email, phone, budget, message });
    if (Object.keys(fields).length > 0) {
        return reply(req, res, 400, { error: 'Popraw zaznaczone pola formularza.', fields });
    }

    // Limit chroni wysyłkę maili, więc stoi tuż przed nią (po tanich sprawdzeniach wyżej).
    if (!checkRateLimit(ip)) {
        return reply(req, res, 429, { error: 'Zbyt wiele prób. Spróbuj za minutę.' });
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('Contact form: RESEND_API_KEY is not set');
        return reply(req, res, 500, { error: SERVER_ERROR });
    }

    // Dane do maila w HTML — zawsze escapowane.
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const phoneHref = phone.replace(/[^\d+]/g, '');
    const safeBudget = budget ? escapeHtml(BUDGETS[budget]) : '';
    const safeMessage = escapeHtml(message);
    const safeIp = escapeHtml(String(ip));
    // Temat to zwykły tekst: bez znaków nowej linii, bez escapowania HTML.
    const subjectName = name.replace(/[\r\n\t]+/g, ' ');

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'qba.dev <kontakt@qba.dev>',
                to: ['hello@qba.dev'],
                reply_to: email,
                subject: `Nowe zapytanie: ${subjectName} – qba.dev`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1f6b47;">Nowe zapytanie z qba.dev</h2>
                        <hr style="border: 1px solid #e5e7eb;">

                        <p><strong>Imię i nazwisko:</strong> ${safeName}</p>
                        <p><strong>E-mail:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                        ${safePhone ? `<p><strong>Telefon:</strong> <a href="tel:${phoneHref}">${safePhone}</a></p>` : ''}
                        ${safeBudget ? `<p><strong>Pakiet lub budżet:</strong> ${safeBudget}</p>` : ''}

                        <h3 style="color: #374151;">Opis projektu:</h3>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
                            <p style="white-space: pre-wrap; margin: 0;">${safeMessage}</p>
                        </div>

                        <hr style="border: 1px solid #e5e7eb; margin-top: 30px;">
                        <p style="color: #6b7280; font-size: 12px;">
                            Wysłano z formularza kontaktowego na qba.dev<br>
                            IP: ${safeIp}
                        </p>
                    </div>
                `,
            }),
            signal: AbortSignal.timeout(8000),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Tylko status i nazwa błędu Resend — bez danych z formularza.
            console.error('Resend error:', response.status, data?.name || 'unknown');
            return reply(req, res, 500, { error: SERVER_ERROR });
        }

        return reply(req, res, 200, { success: true, id: data.id });

    } catch (error) {
        console.error('Server error:', error?.name || 'Error');
        return reply(req, res, 500, { error: SERVER_ERROR });
    }
}
