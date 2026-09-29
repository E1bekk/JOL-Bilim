// Настройка бота: подключает вебхук к сайту, задаёт меню команд и описание.
// Просто открой в браузере https://jol-bilim.vercel.app/api/telegram-setup
// Токен бота берётся из переменной окружения Vercel и никуда не выводится.
const { SITE_URL, webhookSecret, tg } = require('./_telegram');

// Меню команд — кнопка «Меню» слева от поля ввода в Telegram
const COMMANDS = [
    { command: 'start', description: '🏠 Главное меню' },
    { command: 'new', description: '🆕 Новая тема для ИИ-репетитора' },
    { command: 'test', description: '📝 Пройти тест на сайте' },
    { command: 'cabinet', description: '👤 Мой кабинет' },
    { command: 'tariffs', description: '💎 Тарифы и оплата' },
    { command: 'parent', description: '👨‍👩‍👧 Для родителей' },
    { command: 'help', description: '❓ Как пользоваться ботом' }
];

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
        const commands = await tg(botToken, 'setMyCommands', { commands: COMMANDS });
        const menu = await tg(botToken, 'setChatMenuButton', { menu_button: { type: 'commands' } });
        const about = await tg(botToken, 'setMyShortDescription', {
            short_description: 'ИИ-репетитор для подготовки к ОРТ: объясняет задачи по шагам, понимает фото. Вход на сайт JOL-Bilim.'
        });
        const description = await tg(botToken, 'setMyDescription', {
            description: 'Привет! Я — ИИ-репетитор JOL-Bilim 🤖\n\nПомогаю готовиться к ОРТ: математика, аналогии, чтение, грамматика, английский, физика и другое.\n\n• Задай вопрос — объясню по шагам\n• Пришли фото задачи — разберу решение\n• Через меня входят на сайт JOL-Bilim\n\nНажми «Старт», чтобы начать.'
        });
        const info = await tg(botToken, 'getWebhookInfo', {});
        return res.status(200).json({
            ok: !!result.ok && !!commands.ok,
            setWebhook: result.description,
            commandsMenu: commands.ok ? 'ok' : commands.description,
            menuButton: menu.ok ? 'ok' : menu.description,
            descriptions: (about.ok && description.ok) ? 'ok' : (about.description || description.description),
            webhookUrl: info.result && info.result.url,
            lastError: (info.result && info.result.last_error_message) || null
        });
    } catch (error) {
        return res.status(500).json({ ok: false, error: String(error) });
    }
};
