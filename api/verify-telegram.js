// Проверка входа через бота @jolbilim_bot.
// Сайт присылает сюда данные из Firestore (telegramLogins/<code>), а мы проверяем подпись,
// которую поставил вебхук бота. Без токена бота такую подпись подделать нельзя.
const cors = require('./_cors');
const { signLogin, safeEqual } = require('./_telegram');

const MAX_AGE_SECONDS = 15 * 60; // подтверждение действует 15 минут

module.exports = (req, res) => {
    if (cors(req, res)) return; // запросы из Android-приложения
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return res.status(500).json({ ok: false, error: 'Bot token not configured on server' });
        }

        const d = req.body || {};
        if (!d.code || !d.id || !d.ts || !d.sig) {
            return res.status(401).json({ ok: false, error: 'Invalid auth data' });
        }

        const now = Math.floor(Date.now() / 1000);
        if (now - Number(d.ts) > MAX_AGE_SECONDS) {
            return res.status(401).json({ ok: false, error: 'Auth expired' });
        }

        const expected = signLogin(botToken, String(d.code), String(d.id), d.username || '', d.first_name || '', Number(d.ts));
        if (!safeEqual(expected, d.sig)) {
            return res.status(401).json({ ok: false, error: 'Invalid signature' });
        }

        return res.status(200).json({
            ok: true,
            telegram_id: String(d.id),
            first_name: d.first_name || '',
            username: d.username || ''
        });
    } catch (error) {
        console.error('Telegram auth verification error:', error);
        return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
};
