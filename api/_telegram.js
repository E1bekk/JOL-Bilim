// Общие функции для входа через бота @jolbilim_bot.
// Файл начинается с "_", поэтому Vercel не делает из него отдельный эндпоинт.
const crypto = require('crypto');

const SITE_URL = 'https://jol-bilim.vercel.app';

// Секрет, по которому вебхук узнаёт, что запрос пришёл именно от Telegram
function webhookSecret(botToken) {
    return crypto.createHash('sha256').update('webhook:' + botToken).digest('hex').slice(0, 48);
}

// Подпись данных входа: подделать без токена бота невозможно
function signLogin(botToken, code, id, username, firstName, ts) {
    const key = crypto.createHash('sha256').update(botToken).digest();
    const payload = ['bot-login', code, id, username, firstName, ts].join('\n');
    return crypto.createHmac('sha256', key).update(payload).digest('hex');
}

function safeEqual(a, b) {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function tg(botToken, method, body) {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return r.json();
}

module.exports = { SITE_URL, webhookSecret, signLogin, safeEqual, tg };
