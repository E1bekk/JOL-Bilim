// Одноразовая настройка: подключает вебхук бота к сайту.
// Просто открой в браузере https://jol-bilim.vercel.app/api/telegram-setup
// Токен бота берётся из переменной окружения Vercel и никуда не выводится.
const { SITE_URL, webhookSecret, tg } = require('./_telegram');

module.exports = async (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return res.status(500).json({ ok: false, error: 'Bot token not configured' });

    try {
        const result = await tg(botToken, 'setWebhook', {
            url: `${SITE_URL}/api/telegram-webhook`,
            secret_token: webhookSecret(botToken),
            allowed_updates: ['message', 'callback_query'],
            drop_pending_updates: true
        });
        const info = await tg(botToken, 'getWebhookInfo', {});
        return res.status(200).json({
            ok: !!result.ok,
            setWebhook: result.description,
            webhookUrl: info.result && info.result.url,
            lastError: (info.result && info.result.last_error_message) || null
        });
    } catch (error) {
        return res.status(500).json({ ok: false, error: String(error) });
    }
};
