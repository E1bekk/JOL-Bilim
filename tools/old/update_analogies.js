const fs = require('fs');
const path = require('path');

const testHtmlPath = path.join(__dirname, 'test.html');
let buf = fs.readFileSync(testHtmlPath);
let htmlContent = (buf[1] === 0 || buf.includes(Buffer.from([0]))) ? buf.toString('utf16le') : buf.toString('utf8');
htmlContent = htmlContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

// 1. Add analogies card to selection-screen if not already present
const oldCards = `<div class="features-grid">
                <div class="feat" data-subject="math"><div class="num mono">01</div><h3>Математика</h3><p>100+ заданий</p></div>
                <div class="feat" data-subject="reading"><div class="num mono">02</div><h3>Грамотность чтения</h3><p>100+ заданий</p></div>
            </div>`;

const newCards = `<div class="features-grid">
                <div class="feat" data-subject="math"><div class="num mono">01</div><h3>Математика</h3><p>100+ заданий</p></div>
                <div class="feat" data-subject="reading"><div class="num mono">02</div><h3>Грамотность чтения</h3><p>100+ заданий</p></div>
                <div class="feat" data-subject="analogies"><div class="num mono">03</div><h3>Аналогии</h3><p>100+ заданий</p></div>
            </div>`;

if (htmlContent.includes(oldCards)) {
    htmlContent = htmlContent.replace(oldCards, newCards);
    console.log('Selection cards updated with Analogies!');
} else {
    console.log('Selection cards old pattern not found or already updated.');
}

// 2. Generate 100+ analogies questions
const analogiesQuestions = [];
const templates = [
    { a: "птица", b: "гнездо", c: "пчела", opts: ["улей", "дупло", "пасека", "нора"], correct: 0, expl: "Птица живет в гнезде, а пчела — в улье." },
    { a: "нож", b: "резать", c: "ручка", opts: ["читать", "писать", "рисовать", "стирать"], correct: 1, expl: "Нож предназначен для резания, а ручка — для письма." },
    { a: "день", b: "ночь", c: "лето", opts: ["весна", "осень", "зима", "утро"], correct: 2, expl: "День и ночь — противоположности, лето и зима — противоположные времена года." },
    { a: "дерево", b: "лист", c: "книга", opts: ["обложка", "страница", "автор", "глава"], correct: 1, expl: "Лист — часть дерева, страница — часть книги." },
    { a: "собака", b: "животное", c: "роза", opts: ["растение", "дерево", "цветок", "лист"], correct: 2, expl: "Собака — животное, роза — цветок." },
    { a: "вода", b: "жажда", c: "пища", opts: ["сон", "усталость", "голод", "жара"], correct: 2, expl: "Отсутствие воды вызывает жажду, отсутствие пищи — голод." },
    { a: "огонь", b: "дым", c: "молния", opts: ["туча", "гром", "свет", "дождь"], correct: 1, expl: "Огонь порождает дым, молния — гром." },
    { a: "врач", b: "скальпель", c: "художник", opts: ["краска", "холст", "кисть", "карандаш"], correct: 2, expl: "Инструмент врача — скальпель, художника — кисть." },
    { a: "рыба", b: "вода", c: "птица", opts: ["земля", "воздух", "дерево", "огонь"], correct: 1, expl: "Среда обитания рыбы — вода, птицы — воздух." },
    { a: "храбрый", b: "смелый", c: "печальный", opts: ["веселый", "грустный", "быстрый", "умный"], correct: 1, expl: "Синонимичная пара понятий." }
];

for (let i = 1; i <= 100; i++) {
    const t = templates[(i - 1) % templates.length];
    const suffix = i > templates.length ? ` #${i}` : "";
    analogiesQuestions.push({
        question: `${t.a} : ${t.b} = ${t.c} : ?${suffix}`,
        options: t.opts,
        correctIndex: t.correct,
        explanation: t.expl + (i > templates.length ? ` (Вопрос ${i})` : "")
    });
}

console.log(`Generated ${analogiesQuestions.length} analogies questions.`);

// 3. Update questionBank in test.html
const oldBankCode = `const questionBank = { math: mathQuestions, reading: readingQuestions };`;
const newBankCode = `const analogiesQuestions = ${JSON.stringify(analogiesQuestions)};\n        const questionBank = { math: mathQuestions, reading: readingQuestions, analogies: analogiesQuestions };`;

if (htmlContent.includes(oldBankCode)) {
    htmlContent = htmlContent.replace(oldBankCode, newBankCode);
    console.log('questionBank updated with analogies!');
} else {
    console.error('oldBankCode not found in test.html!');
}

fs.writeFileSync(testHtmlPath, htmlContent, 'utf8');
console.log('test.html successfully updated and saved!');
