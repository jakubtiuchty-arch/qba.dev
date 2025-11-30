// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 requests per minute per IP

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function checkRateLimit(ip) {
    const now = Date.now();
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

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get client IP for rate limiting
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Zbyt wiele zapytań. Spróbuj za minutę.' });
    }

    const { name, email, phone, budget, message, website } = req.body;

    // Honeypot check - if filled, it's a bot
    if (website) {
        // Silently accept but don't send email (fool the bot)
        return res.status(200).json({ success: true });
    }

    // Validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Wymagane pola: imię, email, wiadomość' });
    }

    // Email validation
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Nieprawidłowy adres email' });
    }

    // Length limits
    if (name.length > 100 || email.length > 100 || message.length > 5000) {
        return res.status(400).json({ error: 'Przekroczono limit znaków' });
    }

    // Sanitize inputs for HTML email
    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safePhone = escapeHtml(phone?.trim() || '');
    const safeBudget = escapeHtml(budget?.trim() || '');
    const safeMessage = escapeHtml(message.trim());

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
                reply_to: email.trim(),
                subject: `Nowe zapytanie od ${safeName} - qba.dev`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #6366f1;">Nowe zapytanie z qba.dev</h2>
                        <hr style="border: 1px solid #e5e7eb;">

                        <p><strong>Imię i nazwisko:</strong> ${safeName}</p>
                        <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                        ${safePhone ? `<p><strong>Telefon:</strong> <a href="tel:${safePhone}">${safePhone}</a></p>` : ''}
                        ${safeBudget ? `<p><strong>Budżet:</strong> ${safeBudget}</p>` : ''}

                        <h3 style="color: #374151;">Wiadomość:</h3>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                            <p style="white-space: pre-wrap; margin: 0;">${safeMessage}</p>
                        </div>

                        <hr style="border: 1px solid #e5e7eb; margin-top: 30px;">
                        <p style="color: #6b7280; font-size: 12px;">
                            Wysłano z formularza kontaktowego na qba.dev<br>
                            IP: ${ip}
                        </p>
                    </div>
                `,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend error:', data);
            return res.status(500).json({ error: 'Błąd wysyłania emaila' });
        }

        return res.status(200).json({ success: true, id: data.id });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Błąd serwera' });
    }
}
