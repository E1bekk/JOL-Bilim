// Вебхук бота @jolbilim_bot.
// Ученик нажимает Start по ссылке t.me/jolbilim_bot?start=login_<code> ->
// бот подписывает его Telegram-данные и кладёт их в Firestore (telegramLogins/<code>) ->
// сайт видит документ, проверяет подпись через /api/verify-telegram и пускает в кабинет.
const { SITE_URL, webhookSecret, signLogin, safeEqual, tg } = require('./_telegram');

const FIREBASE_PROJECT = 'jol-bilim';
const FIREBASE_API_KEY = 'AIzaSyAmru1-7SS3dwAMEborymtJJudtcflQYzU';

async function saveLogin(code, f) {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/telegramLogins/${code}?key=${FIREBASE_API_KEY}`;
    const r = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fields: {
                id: { stringValue: f.id },
                username: { stringValue: f.username },
                first_name: { stringValue: f.first_name },
                ts: { integerValue: String(f.ts) },
                sig: { stringValue: f.sig }
            }
        })
    });
    if (!r.ok) throw new Error('Firestore write failed: ' + r.status + ' ' + (await r.text()));
}

module.exports = async (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return res.status(500).json({ ok: false, error: 'Bot token not configured' });

    if (req.method !== 'POST') return res.status(200).json({ ok: true, info: 'Telegram webhook endpoint' });

    // Принимаем запросы только от Telegram
    if (!safeEqual(req.headers['x-telegram-bot-api-secret-token'] || '', webhookSecret(botToken))) {
        return res.status(401).json({ ok: false });
    }

    try {
        const msg = req.body && req.body.message;
        if (!msg || !msg.from || typeof msg.text !== 'string') return res.status(200).json({ ok: true });

        const chatId = msg.chat.id;
        const match = msg.text.trim().match(/^\/start\s+login_([a-f0-9]{16,64})$/);

        if (!match) {
            await tg(botToken, 'sendMessage', {
                chat_id: chatId,
                text: 'Привет! Это бот JOL-Bilim 👋\nЧтобы войти, открой сайт, введи имя и нажми «Войти через Telegram».',
                reply_markup: { inline_keyboard: [[{ text: 'Открыть JOL-Bilim', url: `${SITE_URL}/cabinet.html` }]] }
            });
            return res.status(200).json({ ok: true });
        }

        const code = match[1];
        const id = String(msg.from.id);
        const username = msg.from.username || '';
        const firstName = msg.from.first_name || '';
        const ts = Math.floor(Date.now() / 1000);
        const sig = signLogin(botToken, code, id, username, firstName, ts);

        await saveLogin(code, { id, username, first_name: firstName, ts, sig });

        await tg(botToken, 'sendMessage', {
            chat_id: chatId,
            text: '✅ Вход подтверждён!\nВернись на сайт JOL-Bilim — вход произойдёт автоматически.\nЕсли страница закрылась, нажми кнопку ниже.',
            reply_markup: { inline_keyboard: [[{ text: 'Войти в JOL-Bilim', url: `${SITE_URL}/cabinet.html?tgcode=${code}` }]] }
        });

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        // Всегда 200, иначе Telegram будет бесконечно повторять запрос
        return res.status(200).json({ ok: false });
    }
};
