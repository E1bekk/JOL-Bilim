// Вебхук бота @jolbilim_bot.
// 1) Вход: ученик нажимает Start по ссылке t.me/jolbilim_bot?start=login_<code> ->
//    бот подписывает его Telegram-данные и кладёт их в Firestore (telegramLogins/<code>).
// 2) Оплата: администратор нажимает «Подтвердить» / «Отклонить» под заявкой ->
//    бот включает тариф ученику и пишет ему об этом.
// 3) ИИ-репетитор: любое другое сообщение (текст или фото задачи) — вопрос репетитору.
const {
    SITE_URL, ADMIN_CHAT_ID, PLANS, PLAN_DAYS,
    webhookSecret, signLogin, safeEqual, tg, fsGet, fsPatch, formatDate
} = require('./_telegram');

const { askAI, plainText } = require('./_ai');

const TUTOR_DAILY_LIMIT = 25;   // вопросов репетитору в день на человека
const TUTOR_HISTORY = 6;        // сколько последних сообщений бот помнит

const TUTOR_SYSTEM = [
    'Ты — ИИ-репетитор JOL-Bilim. Помогаешь школьникам Кыргызстана готовиться к ОРТ (общереспубликанскому тестированию):',
    'математика, геометрия, аналогии и дополнения, чтение и понимание, практическая грамматика (русский и кыргызский), английский, физика, химия, биология, история.',
    'Правила:',
    '— Отвечай на языке ученика (по-русски или по-кыргызски), на «ты», доброжелательно.',
    '— Объясняй по шагам и коротко: обычно до 150 слов. Если просят подробнее — можно длиннее.',
    '— Если ученик прислал задачу, не давай только ответ: покажи ход решения и в конце — ответ.',
    '— Если на фото несколько задач — разбери первую и предложи прислать остальные по одной.',
    '— Формулы пиши обычным текстом (x² + 3x = 10, S = v × t). Без markdown-заголовков, таблиц и звёздочек.',
    '— Не выдумывай факты. Если не уверен — так и скажи.',
    '— На вопросы не про учёбу отвечай кратко и мягко возвращай к подготовке к ОРТ.'
].join('\n');

function welcomeText() {
    return [
        'Привет! Это бот JOL-Bilim 👋',
        '',
        '🤖 Я — ИИ-репетитор по ОРТ. Напиши вопрос или пришли фото задачи — разберу по шагам.',
        'Например: «Как быстро находить проценты?» или «Объясни аналогии».',
        '',
        '🔑 Чтобы войти на сайт: открой JOL-Bilim, введи имя и нажми «Войти через Telegram». Если сайт показал код из 8 символов — отправь его сюда.',
        '',
        'Все команды — в кнопке «Меню» слева от поля ввода 👇'
    ].join('\n');
}

async function confirmLogin(botToken, msg, code) {
    const id = String(msg.from.id);
    const username = msg.from.username || '';
    const firstName = msg.from.first_name || '';
    const ts = Math.floor(Date.now() / 1000);
    const sig = signLogin(botToken, code, id, username, firstName, ts);

    await fsPatch(`telegramLogins/${code}`, { id, username, first_name: firstName, ts, sig });

    await tg(botToken, 'sendMessage', {
        chat_id: msg.chat.id,
        text: '✅ Вход подтверждён!\nВернись на сайт JOL-Bilim — вход произойдёт автоматически.\nЕсли страница закрылась, нажми кнопку ниже.',
        reply_markup: { inline_keyboard: [[{ text: 'Войти в JOL-Bilim', url: `${SITE_URL}/cabinet.html?tgcode=${code}` }]] }
    });
}

// Самое большое фото не больше ~1.5 МБ -> base64 для Gemini
async function downloadPhoto(botToken, photos) {
    const fitting = photos.filter(p => !p.file_size || p.file_size <= 1500000);
    const best = (fitting.length ? fitting : photos)[(fitting.length ? fitting : photos).length - 1];
    const info = await tg(botToken, 'getFile', { file_id: best.file_id });
    if (!info.ok) throw new Error('getFile failed');
    const r = await fetch(`https://api.telegram.org/file/bot${botToken}/${info.result.file_path}`);
    if (!r.ok) throw new Error('photo download failed');
    const buf = Buffer.from(await r.arrayBuffer());
    return { mimeType: 'image/jpeg', data: buf.toString('base64') };
}

async function handleTutor(botToken, msg, text) {
    const chatId = msg.chat.id;
    const docPath = `botChats/${chatId}`;
    const today = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10); // дата в Бишкеке

    const state = (await fsGet(docPath).catch(() => null)) || {};
    let history = [];
    try { history = JSON.parse(state.history || '[]'); } catch (e) { history = []; }
    const count = state.day === today ? (state.count || 0) : 0;

    if (count >= TUTOR_DAILY_LIMIT) {
        await tg(botToken, 'sendMessage', {
            chat_id: chatId,
            text: `На сегодня лимит вопросов репетитору исчерпан (${TUTOR_DAILY_LIMIT} в день). Возвращайся завтра — а пока можно порешать тесты на сайте 💪`,
            reply_markup: { inline_keyboard: [[{ text: 'Открыть тесты', url: `${SITE_URL}/test.html` }]] }
        });
        return;
    }

    await tg(botToken, 'sendChatAction', { chat_id: chatId, action: 'typing' });

    let images = [];
    if (msg.photo && msg.photo.length) {
        try { images = [await downloadPhoto(botToken, msg.photo)]; }
        catch (e) { console.error('photo error:', e.message); }
    }
    const userText = (text || '').slice(0, 2000) || (images.length ? 'Реши задачу на фото и объясни по шагам.' : '');

    let answer;
    try {
        const ai = await askAI(TUTOR_SYSTEM, [...history, { role: 'user', content: userText, images }], 900, 40000);
        answer = plainText(ai.text).slice(0, 3800);
    } catch (e) {
        console.error('tutor AI error:', e.message, e.details || '');
        await tg(botToken, 'sendMessage', {
            chat_id: chatId,
            text: images.length
                ? 'Не получилось разобрать фото — ИИ сейчас перегружен. Попробуй ещё раз через минуту или перепиши задачу текстом.'
                : 'ИИ-репетитор сейчас перегружен. Попробуй ещё раз через минуту 🙏'
        });
        return;
    }

    await tg(botToken, 'sendMessage', { chat_id: chatId, text: answer });

    // Запоминаем последние сообщения (фото не храним — только подпись)
    history.push({ role: 'user', content: images.length ? `[фото задачи] ${userText}` : userText });
    history.push({ role: 'assistant', content: answer.slice(0, 1500) });
    history = history.slice(-TUTOR_HISTORY);
    await fsPatch(docPath, { history: JSON.stringify(history), day: today, count: count + 1, updatedAt: Date.now() })
        .catch(e => console.error('chat state save failed:', e.message));
}

async function handleMessage(botToken, msg) {
    const chatId = msg.chat.id;
    const text = (msg.text || msg.caption || '').trim();

    // 1) пришли по ссылке с сайта: /start login_<код>
    const deepLink = text.match(/^\/start\s+login_([A-Za-z0-9]{8,64})$/);
    if (deepLink) return confirmLogin(botToken, msg, deepLink[1]);

    // 2) код вручную (если Telegram не открылся по кнопке): 8 символов, обязательно с цифрой, напр. K7M2Q9XP
    const manual = text.toUpperCase().replace(/[\s-]/g, '');
    if (!msg.photo && /^[A-HJ-NP-Z2-9]{8}$/.test(manual) && /\d/.test(manual)) {
        return confirmLogin(botToken, msg, manual);
    }

    const cmd = (text.match(/^\/([a-z]+)(@\w+)?\b/i) || [])[1];
    const cmdLower = cmd ? cmd.toLowerCase() : null;

    if (cmdLower === 'start') {
        await tg(botToken, 'sendMessage', {
            chat_id: chatId,
            text: welcomeText(),
            reply_markup: { inline_keyboard: [
                [{ text: '📝 Пройти тест', url: `${SITE_URL}/test.html` }, { text: '👤 Мой кабинет', url: `${SITE_URL}/dashboard.html` }],
                [{ text: '💎 Тарифы', url: `${SITE_URL}/index.html#pricing` }, { text: '👨‍👩‍👧 Для родителей', url: `${SITE_URL}/parent.html` }]
            ] }
        });
        return;
    }

    if (cmdLower === 'help') {
        await tg(botToken, 'sendMessage', { chat_id: chatId, text: [
            '❓ Как пользоваться ботом',
            '',
            '🤖 Вопрос репетитору — просто напиши сообщение: «Объясни, как решать задачи на скорость».',
            '📷 Задача с фото — сфотографируй задачу и отправь. Можно добавить подпись: «реши 3-е задание».',
            '💬 Бот помнит последние сообщения, поэтому можно уточнять: «а почему так?».',
            '🆕 /new — начать новую тему, если хочешь спросить про другое.',
            `📊 Лимит — ${TUTOR_DAILY_LIMIT} вопросов в день.`,
            '',
            '🔑 Вход на сайт: на странице входа нажми «Войти через Telegram» и затем «Start» здесь. Если сайт показал код из 8 символов — отправь его сюда.',
            '',
            'Все команды — в кнопке «Меню» слева от поля ввода.'
        ].join('\n') });
        return;
    }

    const LINKS = {
        test: { text: '📝 Тесты в формате ОРТ: основной тест (математика, аналогии, чтение, грамматика) и предметные — физика, химия, биология, история, английский, кыргызский и русский язык. По 100 заданий в каждом разделе, разбор каждой ошибки и ИИ-объяснения.', button: 'Пройти тест', url: `${SITE_URL}/test.html` },
        cabinet: { text: '👤 В кабинете — твой прогноз балла, история тестов, тариф и код для родителей.', button: 'Открыть кабинет', url: `${SITE_URL}/dashboard.html` },
        tariffs: { text: '💎 Тарифы JOL-Bilim:\n\n• Диагностика — бесплатно: по тесту в каждом разделе ОРТ\n• Полный доступ — 990 сом/мес: безлимит тестов\n• Максимум — 1990 сом/мес: + персональный план и поддержка\n\nОформить можно на сайте, оплата переводом — после проверки тариф включится, и я напишу тебе здесь.', button: 'Выбрать тариф', url: `${SITE_URL}/index.html#pricing` },
        parent: { text: '👨‍👩‍👧 Для родителей: введите код, который ребёнок видит у себя в кабинете, — и увидите его баллы и прогресс.', button: 'Кабинет родителя', url: `${SITE_URL}/parent.html` }
    };
    if (cmdLower && LINKS[cmdLower]) {
        const l = LINKS[cmdLower];
        await tg(botToken, 'sendMessage', {
            chat_id: chatId, text: l.text,
            reply_markup: { inline_keyboard: [[{ text: l.button, url: l.url }]] }
        });
        return;
    }

    if (cmdLower === 'new') {
        await fsPatch(`botChats/${chatId}`, { history: '[]' }).catch(() => {});
        await tg(botToken, 'sendMessage', { chat_id: chatId, text: '🆕 Начинаем новую тему. Задавай вопрос!' });
        return;
    }

    if (text.startsWith('/')) {
        await tg(botToken, 'sendMessage', { chat_id: chatId, text: 'Не знаю такую команду. Просто напиши вопрос или пришли фото задачи 🙂' });
        return;
    }

    if (!text && !(msg.photo && msg.photo.length)) {
        await tg(botToken, 'sendMessage', { chat_id: chatId, text: 'Я понимаю текст и фото задач. Напиши вопрос 🙂' });
        return;
    }

    return handleTutor(botToken, msg, text);
}

async function handlePaymentDecision(botToken, cq) {
    const answer = (text) => tg(botToken, 'answerCallbackQuery', { callback_query_id: cq.id, text });

    // Решать по оплатам может только администратор
    if (String(cq.from.id) !== ADMIN_CHAT_ID) return answer('Нет доступа');

    const m = (cq.data || '').match(/^pay:(ok|no):([A-Za-z0-9]{10,40})$/);
    if (!m) return answer('Неизвестная команда');
    const [, decision, requestId] = m;

    const req = await fsGet(`paymentRequests/${requestId}`);
    if (!req) return answer('Заявка не найдена');
    if (req.status !== 'pending') return answer('Эта заявка уже обработана');

    const plan = PLANS[req.plan];
    const now = Date.now();
    let resultLine;

    if (decision === 'ok') {
        const family = (await fsGet(`families/${req.familyCode}`)) || {};
        // Если тариф ещё действует — продлеваем от даты окончания, иначе от сегодня
        const base = (family.planExpiresAt && family.planExpiresAt > now) ? family.planExpiresAt : now;
        const expiresAt = base + PLAN_DAYS * 24 * 3600 * 1000;

        await fsPatch(`families/${req.familyCode}`, {
            plan: req.plan, planExpiresAt: expiresAt, planActivatedAt: now, planPending: null
        });
        await fsPatch(`paymentRequests/${requestId}`, { status: 'approved', decidedAt: now });

        if (req.telegramId) {
            await tg(botToken, 'sendMessage', {
                chat_id: req.telegramId,
                text: `🎉 Оплата подтверждена!\nТариф «${plan ? plan.title : req.plan}» активен до ${formatDate(expiresAt)}.`,
                reply_markup: { inline_keyboard: [[{ text: 'Открыть кабинет', url: `${SITE_URL}/dashboard.html` }]] }
            });
        }
        resultLine = `✅ Подтверждено — тариф до ${formatDate(expiresAt)}`;
    } else {
        await fsPatch(`families/${req.familyCode}`, { planPending: null });
        await fsPatch(`paymentRequests/${requestId}`, { status: 'rejected', decidedAt: now });

        if (req.telegramId) {
            await tg(botToken, 'sendMessage', {
                chat_id: req.telegramId,
                text: `❌ Оплату тарифа «${plan ? plan.title : req.plan}» не удалось подтвердить.\nЕсли ты уже переводил деньги — напиши нам, разберёмся.`
            });
        }
        resultLine = '❌ Отклонено';
    }

    // Убираем кнопки у заявки и дописываем решение
    await tg(botToken, 'editMessageText', {
        chat_id: cq.message.chat.id,
        message_id: cq.message.message_id,
        text: (cq.message.text || '') + '\n\n' + resultLine
    });
    return answer(decision === 'ok' ? 'Тариф включён' : 'Заявка отклонена');
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
        const update = req.body || {};
        if (update.callback_query) {
            await handlePaymentDecision(botToken, update.callback_query);
        } else if (update.message && update.message.from && update.message.chat && update.message.chat.type === 'private') {
            await handleMessage(botToken, update.message);
        }
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        // Всегда 200, иначе Telegram будет бесконечно повторять запрос
        return res.status(200).json({ ok: false });
    }
};
