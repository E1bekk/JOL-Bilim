// Ученик нажал «Я оплатил» -> сайт создал документ paymentRequests/<id> и вызвал этот эндпоинт.
// Мы берём данные заявки из базы и присылаем администратору в Telegram
// с кнопками «Подтвердить» / «Отклонить».
const cors = require('./_cors');
const { ADMIN_CHAT_ID, PLANS, tg, fsGet, fsPatch } = require('./_telegram');

module.exports = async (req, res) => {
    if (cors(req, res)) return; // запросы из Android-приложения
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return res.status(500).json({ ok: false, error: 'Bot token not configured' });

    try {
        const requestId = String((req.body && req.body.requestId) || '');
        if (!/^[A-Za-z0-9]{10,40}$/.test(requestId)) {
            return res.status(400).json({ ok: false, error: 'Bad request id' });
        }

        const r = await fsGet(`paymentRequests/${requestId}`);
        if (!r) return res.status(404).json({ ok: false, error: 'Request not found' });
        if (r.status !== 'pending') return res.status(409).json({ ok: false, error: 'Already processed' });
        if (r.notified) return res.status(200).json({ ok: true }); // уже отправляли — не дублируем

        const plan = PLANS[r.plan];
        if (!plan) return res.status(400).json({ ok: false, error: 'Unknown plan' });

        const lines = [
            '💳 Новая заявка на оплату',
            '',
            `Тариф: ${plan.title} — ${plan.price} сом`,
            `Ученик: ${r.name || '—'} (${r.grade || '—'})`,
            `Telegram: ${r.telegramUsername ? '@' + r.telegramUsername : (r.telegramId ? 'id ' + r.telegramId : 'не привязан')}`,
            `Код ученика: ${r.familyCode}`,
            '',
            `Проверь, пришёл ли перевод ${plan.price} сом с комментарием ${r.familyCode}.`
        ];

        const sent = await tg(botToken, 'sendMessage', {
            chat_id: ADMIN_CHAT_ID,
            text: lines.join('\n'),
            reply_markup: {
                inline_keyboard: [[
                    { text: '✅ Подтвердить', callback_data: `pay:ok:${requestId}` },
                    { text: '❌ Отклонить', callback_data: `pay:no:${requestId}` }
                ]]
            }
        });
        if (!sent.ok) {
            console.error('Telegram sendMessage failed:', sent.description);
            return res.status(502).json({ ok: false, error: 'Telegram error' });
        }

        await fsPatch(`paymentRequests/${requestId}`, { notified: true });
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('payment-request error:', error);
        return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
};
