// Разрешаем запросы к серверу из Android-приложения.
// Приложение Capacitor открывает страницы с адреса https://localhost,
// поэтому браузер внутри приложения сначала спрашивает сервер (запрос OPTIONS),
// можно ли отправлять данные. Без этого ответа вход и ИИ в приложении не работают.
// Файл начинается с "_", поэтому Vercel не делает из него отдельный эндпоинт.
const ALLOWED_ORIGINS = ['https://localhost', 'http://localhost', 'capacitor://localhost'];

// Возвращает true, если это был предварительный запрос OPTIONS и ответ уже отправлен
module.exports = function cors(req, res) {
    const origin = req.headers && req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '86400');
    }
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return true;
    }
    return false;
};
