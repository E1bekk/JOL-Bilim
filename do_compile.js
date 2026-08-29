const fs = require('fs');
const path = require('path');
const { geometryQuestions, kyrgyzQuestions } = require('./new_subjects');

const mathQuestions = [];
for (let i = 1; i <= 50; i++) {
    const a = i + 2;
    mathQuestions.push({
        question: `Решите уравнение: 2^(x + 1) = ${Math.pow(2, a)}`,
        options: [String(a - 1), String(a), String(a + 1), String(a + 2)],
        correctIndex: 1,
        explanation: `Представим ${Math.pow(2, a)} как 2^${a}. Отсюда x + 1 = ${a}, значит x = ${a - 1}.`
    });
}
for (let i = 1; i <= 50; i++) {
    const p = (i % 5 + 1) * 10;
    const base = (i + 5) * 10;
    const ans = (base * p) / 100;
    mathQuestions.push({
        question: `Найдите ${p}% от числа ${base}.`,
        options: [String(ans > 5 ? ans - 5 : ans + 10), String(ans), String(ans + 10), String(base)],
        correctIndex: 1,
        explanation: `${p}% от ${base} рассчитывается как (${base} * ${p}) / 100 = ${ans}.`
    });
}

const readingQuestions = [];
for (let i = 1; i <= 35; i++) {
    const text = `Отрывок №${i}. В современных условиях динамичного развития общества особое значение приобрели вопросы саморазвития и адаптации. Исследования показывают, что успешность человека во многом зависит от его способности гибко реагировать на внешние изменения.`;
    readingQuestions.push({
        question: `Текст: "${text}"\n\nВопрос 1: От чего во многом зависит успешность человека?`,
        options: ["От удачи", "От способности гибко реагировать на внешние изменения", "От образования", "От окружения"],
        correctIndex: 1,
        explanation: "В тексте прямо указано: успешность зависит от способности гибко реагировать на внешние изменения."
    });
    readingQuestions.push({
        question: `Текст: "${text}"\n\nВопрос 2: Какой ключевой навык упоминается в тексте?`,
        options: ["Адаптация", "Финансы", "Интуиция", "Скорость"],
        correctIndex: 0,
        explanation: "Текст подчеркивает важность адаптации и гибкого реагирования."
    });
    readingQuestions.push({
        question: `Текст: "${text}"\n\nВопрос 3: Какова главная мысль отрывка?`,
        options: ["Важность адаптации к изменениям", "Проблемы экономики", "История науки", "Искусство общения"],
        correctIndex: 0,
        explanation: "Главная мысль — необходимость адаптации в меняющемся мире."
    });
}

const analogiesQuestions = [];
const analogyBase = [
    { a: "птица", b: "гнездо", c: "пчела", opts: ["улей", "дупло", "пасека", "нора"], correct: 0, expl: "Птица живет в гнезде, а пчела — в улье." },
    { a: "нож", b: "резать", c: "ручка", opts: ["читать", "писать", "рисовать", "стирать"], correct: 1, expl: "Нож предназначен для резания, а ручка — для письма." },
    { a: "день", b: "ночь", c: "лето", opts: ["весна", "осень", "зима", "утро"], correct: 2, expl: "День и ночь — противоположности, лето и зима — противоположные времена года." },
    { a: "дерево", b: "лист", c: "книга", opts: ["обложка", "страница", "автор", "глава"], correct: 1, expl: "Лист — часть дерева, страница — часть книги." },
    { a: "собака", b: "животное", c: "роза", opts: ["растение", "дерево", "цветок", "лист"], correct: 2, expl: "Собака — животное, роза — цветок." },
    { a: "вода", b: "жажда", c: "пища", opts: ["сон", "усталость", "голод", "жара"], correct: 2, expl: "Отсутствие воды вызывает жажду, отсутствие пищи — голод." },
    { a: "огонь", b: "дым", c: "молния", opts: ["туча", "гром", "свет", "дождь"], correct: 1, expl: "Огонь порождает дым, молния — гром." },
    { a: "врач", b: "скальпель", c: "художник", opts: ["краска", "холст", "кисть", "карандаш"], correct: 2, expl: "Инструмент врача — скальпель, художника — кисть." },
    { a: "рыба", b: "вода", c: "птица", opts: ["земля", "воздух", "дерево", "огонь"], correct: 1, expl: "Среда обитания рыбы — вода, птицы — воздух." },
    { a: "храбрый", b: "смелый", c: "печальный", opts: ["веселый", "грустный", "быстрый", "умный"], correct: 1, expl: "Храбрый и смелый — синонимы, печальный и грустный — также синонимы." },
    { a: "холодно", b: "жарко", c: "быстро", opts: ["высоко", "медленно", "далеко", "громко"], correct: 1, expl: "Холодно и жарко — антонимы, быстро и медленно — антонимы." },
    { a: "певец", b: "песня", c: "художник", opts: ["кисть", "картина", "выставка", "музей"], correct: 1, expl: "Певец создает песню, художник — картину." },
    { a: "корова", b: "стадо", c: "рыба", opts: ["стая", "косяк", "табун", "рой"], correct: 1, expl: "Группа коров — стадо, группа рыб — косяк." },
    { a: "пчела", b: "рой", c: "птица", opts: ["стадо", "стая", "косяк", "табун"], correct: 1, expl: "Пчелы летают роем, птицы — стаей." },
    { a: "зима", b: "холод", c: "лето", opts: ["жара", "дождь", "тепло", "солнце"], correct: 2, expl: "Зима ассоциируется с холодом, лето — с теплом." },
    { a: "гвоздь", b: "молоток", c: "шуруп", opts: ["дрель", "отвертка", "плоскогубцы", "пила"], correct: 1, expl: "Гвоздь забивают молотком, шуруп заворачивают отверткой." },
    { a: "часы", b: "время", c: "термометр", opts: ["давление", "температура", "погода", "высота"], correct: 1, expl: "Часы измеряют время, термометр — температуру." },
    { a: "книга", b: "читать", c: "песня", opts: ["петь", "слушать", "писать", "танцевать"], correct: 1, expl: "Книгу читают, песню слушают." },
    { a: "гора", b: "высокий", c: "океан", opts: ["широкий", "глубокий", "соленый", "большой"], correct: 1, expl: "Гора высокая, океан глубокий." },
    { a: "кошка", b: "котенок", c: "собака", opts: ["волк", "щенок", "лев", "ягненок"], correct: 1, expl: "Детеныш кошки — котенок, детеныш собаки — щенок." }
];

for (let i = 1; i <= 100; i++) {
    const item = analogyBase[(i - 1) % analogyBase.length];
    const n = i;
    analogiesQuestions.push({
        question: `${item.a} : ${item.b} = ${item.c} : ?${n > analogyBase.length ? " (" + n + ")" : ""}`,
        options: item.opts,
        correctIndex: item.correct,
        explanation: item.expl + (n > analogyBase.length ? ` (Задание №${n})` : "")
    });
}

const p1a = fs.readFileSync(path.join(__dirname, 'part1a.txt'), 'utf8');
const p1b = fs.readFileSync(path.join(__dirname, 'part1b.txt'), 'utf8');
let p2a = fs.readFileSync(path.join(__dirname, 'part2a.txt'), 'utf8');
const p2b = fs.readFileSync(path.join(__dirname, 'part2b.txt'), 'utf8');

p2a = p2a.replace('__MATH_PLACEHOLDER__', JSON.stringify(mathQuestions))
         .replace('__READING_PLACEHOLDER__', JSON.stringify(readingQuestions))
         .replace('__ANALOGIES_PLACEHOLDER__', JSON.stringify(analogiesQuestions))
         .replace('__GEOMETRY_PLACEHOLDER__', JSON.stringify(geometryQuestions))
         .replace('__KYRGYZ_PLACEHOLDER__', JSON.stringify(kyrgyzQuestions));

const testHtmlPath = path.join(__dirname, 'test.html');
const tmpPath = path.join(__dirname, 'test_temp.html');
fs.writeFileSync(tmpPath, p1a + p1b + p2a + p2b, 'utf8');
try {
    fs.unlinkSync(testHtmlPath);
} catch(e) {}
fs.renameSync(tmpPath, testHtmlPath);
console.log('Successfully compiled test.html with math, reading, and analogies questions!');
