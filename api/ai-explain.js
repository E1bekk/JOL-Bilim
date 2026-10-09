// ИИ-разбор ошибки в тесте: «Объясни подробнее».
// Сайт присылает вопрос, варианты, правильный ответ и ответ ученика.
// Готовые объяснения кэшируются в Firestore (aiExplanations/<hash>): следующий ученик
// с той же ошибкой получает ответ мгновенно и без расхода бесплатного лимита ИИ.
const cors = require('./_cors');
const crypto = require('crypto');
const { askAI, plainText } = require('./_ai');
const { fsGet, fsPatch } = require('./_telegram');

const SYSTEM = [
    'Ты — доброжелательный репетитор, который готовит школьников Кыргызстана к ОРТ (общереспубликанскому тестированию).',
    'Ученик ответил на тестовый вопрос неправильно. Объясни ему:',
    '1) почему его ответ неверный — конкретно, какую ошибку в рассуждении он, скорее всего, допустил;',
    '2) как прийти к правильному ответу — по шагам, коротко;',
    '3) один практический совет, как не ошибаться в таких заданиях на ОРТ.',
    'Пиши по-русски, простыми словами, на «ты». Объём — до 130 слов.',
    'Для кыргызского языка приводи примеры на кыргызском, а объясняй по-русски. Для английского — примеры на английском.',
    'Без markdown-заголовков и таблиц, без звёздочек. Формулы пиши обычным текстом (например: S = v × t).',
    'Не выдумывай факты. Если в вопросе или в варианте «правильного ответа» есть ошибка — честно скажи об этом.'
].join('\n');

const clip = (v, n) => String(v == null ? '' : v).slice(0, n);

module.exports = async (req, res) => {
    if (cors(req, res)) return; // запросы из Android-приложения
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }

    const b = req.body || {};
    const question = clip(b.question, 4000).trim();
    const options = Array.isArray(b.options) ? b.options.slice(0, 6).map(o => clip(o, 300)) : [];
    const correct = clip(b.correct, 300).trim();
    const chosen = clip(b.chosen, 300).trim();
    const subject = clip(b.subject, 60).trim();
    const baseExplanation = clip(b.explanation, 800).trim();

    if (!question || !correct || !chosen) {
        return res.status(400).json({ ok: false, error: 'Missing question data' });
    }

    const hash = crypto.createHash('sha256')
        .update([subject, question, correct, chosen].join('\u0001'))
        .digest('hex').slice(0, 40);

    try {
        const cached = await fsGet(`aiExplanations/${hash}`).catch(() => null);
        if (cached && cached.text) {
            return res.status(200).json({ ok: true, text: cached.text, cached: true });
        }

        const prompt = [
            subject ? `Предмет: ${subject}` : '',
            `Вопрос: ${question}`,
            options.length ? `Варианты: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('; ')}` : '',
            `Ответ ученика: ${chosen}`,
            `Правильный ответ: ${correct}`,
            baseExplanation ? `Краткое объяснение из учебника: ${baseExplanation}` : ''
        ].filter(Boolean).join('\n');

        const ai = await askAI(SYSTEM, [{ role: 'user', content: prompt }], 600);
        const text = plainText(ai.text).slice(0, 3000);

        // ждём запись: после ответа Vercel может «заморозить» функцию и запись не успеет уйти
        await fsPatch(`aiExplanations/${hash}`, {
            text, provider: ai.provider, subject, createdAt: Date.now()
        }).catch(e => console.error('cache write failed:', e.message));

        return res.status(200).json({ ok: true, text, cached: false });
    } catch (error) {
        console.error('ai-explain error:', error.message, error.details || '');
        return res.status(503).json({ ok: false, error: 'AI unavailable' });
    }
};
