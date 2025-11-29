export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, budget, message } = req.body;

    // Validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Wymagane pola: imię, email, wiadomość' });
    }

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
                subject: `Nowe zapytanie od ${name} - qba.dev`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #6366f1;">Nowe zapytanie z qba.dev</h2>
                        <hr style="border: 1px solid #e5e7eb;">

                        <p><strong>Imię i nazwisko:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        ${phone ? `<p><strong>Telefon:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
                        ${budget ? `<p><strong>Budżet:</strong> ${budget}</p>` : ''}

                        <h3 style="color: #374151;">Wiadomość:</h3>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                            <p style="white-space: pre-wrap; margin: 0;">${message}</p>
                        </div>

                        <hr style="border: 1px solid #e5e7eb; margin-top: 30px;">
                        <p style="color: #6b7280; font-size: 12px;">
                            Wysłano z formularza kontaktowego na qba.dev
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
