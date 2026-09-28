// Общие функции для бота @jolbilim_bot: вход, оплаты, работа с Firestore.
// Файл начинается с "_", поэтому Vercel не делает из него отдельный эндпоинт.
const crypto = require('crypto');

const SITE_URL = 'https://jol-bilim.vercel.app';

// Кому бот присылает заявки на оплату (Telegram ID администратора).
// Можно переопределить переменной окружения ADMIN_CHAT_ID в Vercel.
const ADMIN_CHAT_ID = String(process.env.ADMIN_CHAT_ID || '6052479440');

const PLANS = {
    full: { title: 'Полный доступ', price: 990 },
    max: { title: 'Максимум', price: 1990 }
};
const PLAN_DAYS = 30;

const FIREBASE_PROJECT = 'jol-bilim';
const FIREBASE_API_KEY = 'AIzaSyAmru1-7SS3dwAMEborymtJJudtcflQYzU';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

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

// ---------- Firestore через REST ----------
function toFs(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    return { stringValue: String(v) };
}

function fromFs(f) {
    if (!f) return undefined;
    if ('stringValue' in f) return f.stringValue;
    if ('integerValue' in f) return Number(f.integerValue);
    if ('doubleValue' in f) return f.doubleValue;
    if ('booleanValue' in f) return f.booleanValue;
    if ('timestampValue' in f) return Date.parse(f.timestampValue);
    if ('nullValue' in f) return null;
    return undefined; // массивы/объекты серверу не нужны
}

async function fsGet(path) {
    const r = await fetch(`${FIRESTORE_BASE}/${path}?key=${FIREBASE_API_KEY}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('Firestore read failed: ' + r.status + ' ' + (await r.text()));
    const doc = await r.json();
    const out = {};
    for (const [k, v] of Object.entries(doc.fields || {})) out[k] = fromFs(v);
    return out;
}

// Обновляет только перечисленные поля, остальные поля документа не трогает
async function fsPatch(path, data) {
    const mask = Object.keys(data).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
    const fields = {};
    for (const [k, v] of Object.entries(data)) fields[k] = toFs(v);
    const r = await fetch(`${FIRESTORE_BASE}/${path}?${mask}&key=${FIREBASE_API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    if (!r.ok) throw new Error('Firestore write failed: ' + r.status + ' ' + (await r.text()));
}

function formatDate(ms) {
    const d = new Date(ms + 6 * 3600 * 1000); // время Бишкека (UTC+6)
    return String(d.getUTCDate()).padStart(2, '0') + '.' + String(d.getUTCMonth() + 1).padStart(2, '0') + '.' + d.getUTCFullYear();
}

module.exports = {
    SITE_URL, ADMIN_CHAT_ID, PLANS, PLAN_DAYS,
    webhookSecret, signLogin, safeEqual, tg,
    fsGet, fsPatch, formatDate
};
