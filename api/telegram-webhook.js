// Вебхук бота @jolbilim_bot.
// 1) Вход: ученик нажимает Start по ссылке t.me/jolbilim_bot?start=login_<code> ->
//    бот подписывает его Telegram-данные и кладёт их в Firestore (telegramLogins/<code>).
// 2) Оплата: администратор нажимает «Подтвердить» / «Отклонить» под заявкой ->
//    бот включает тариф ученику и пишет ему об этом.
const {
    SITE_URL, ADMIN_CHAT_ID, PLANS, PLAN_DAYS,
    webhookSecret, signLogin, safeEqual, tg, fsGet, fsPatch, formatDate
} = require('./_telegram');

async function handleStart(botToken, msg) {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // 1) пришли по ссылке с сайта: /start login_<код>
    // 2) или отправили код вручную (если Telegram не открылся по кнопке): например K7M2Q9XP
    let code = null;
    const deepLink = text.match(/^\/start\s+login_([A-Za-z0-9]{8,64})$/);
    const manual = text.toUpperCase().replace(/[\s-]/g, '');
    if (deepLink) code = deepLink[1];
    else if (/^[A-HJ-NP-Z2-9]{8}$/.test(manual)) code = manual;

    if (!code) {
        await tg(botToken, 'sendMessage', {
            chat_id: chatId,
            text: 'Привет! Это бот JOL-Bilim 👋\nЧтобы войти, открой сайт, введи имя и нажми «Войти через Telegram».\nЕсли сайт показал тебе код из 8 символов — просто отправь его сюда.',
            reply_markup: { inline_keyboard: [[{ text: 'Открыть JOL-Bilim', url: `${SITE_URL}/cabinet.html` }]] }
        });
        return;
    }

    const id = String(msg.from.id);
    const username = msg.from.username || '';
    const firstName = msg.from.first_name || '';
    const ts = Math.floor(Date.now() / 1000);
    const sig = signLogin(botToken, code, id, username, firstName, ts);

    await fsPatch(`telegramLogins/${code}`, { id, username, first_name: firstName, ts, sig });

    await tg(botToken, 'sendMessage', {
        chat_id: chatId,
        text: '✅ Вход подтверждён!\nВернись на сайт JOL-Bilim — вход произойдёт автоматически.\nЕсли страница закрылась, нажми кнопку ниже.',
        reply_markup: { inline_keyboard: [[{ text: 'Войти в JOL-Bilim', url: `${SITE_URL}/cabinet.html?tgcode=${code}` }]] }
    });
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
        } else if (update.message && update.message.from && typeof update.message.text === 'string') {
            await handleStart(botToken, update.message);
        }
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        // Всегда 200, иначе Telegram будет бесконечно повторять запрос
        return res.status(200).json({ ok: false });
    }
};
