const crypto = require('crypto');

module.exports = (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    try {
        const data = req.body;
        if (!data || !data.hash || !data.auth_date || !data.id) {
            return res.status(401).json({ ok: false, error: 'Invalid auth data' });
        }

        const { hash, ...fields } = data;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return res.status(500).json({ ok: false, error: 'Bot token not configured on server' });
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime - Number(fields.auth_date) > 86400) {
            return res.status(401).json({ ok: false, error: 'Auth date expired' });
        }

        const dataCheckString = Object.keys(fields)
            .filter(key => fields[key] !== undefined && fields[key] !== null && fields[key] !== '')
            .sort()
            .map(key => `${key}=${fields[key]}`)
            .join('\n');

        const secretKey = crypto.createHash('sha256').update(botToken).digest();
        const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (hmac !== hash) {
            return res.status(401).json({ ok: false, error: 'Invalid signature' });
        }

        return res.status(200).json({
            ok: true,
            telegram_id: fields.id,
            first_name: fields.first_name || '',
            username: fields.username || ''
        });
    } catch (error) {
        console.error('Telegram auth verification error:', error);
        return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
};
