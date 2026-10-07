const fs = require('fs');
const path = require('path');

const testHtmlPath = path.join(__dirname, 'test.html');
let html = fs.readFileSync(testHtmlPath, 'utf8');

function extractArray(content, varName) {
    const regex = new RegExp(`const\\s+${varName}\\s*=\\s*(\\[.*?\\]);`, 's');
    const match = content.match(regex);
    if (!match) return null;
    try { return JSON.parse(match[1]); } catch (e) { return null; }
}

let reading = extractArray(html, 'readingQuestions');
let kyrgyz = extractArray(html, 'kyrgyzQuestions');
let english = extractArray(html, 'englishQuestions');

if (!reading || !kyrgyz || !english) {
    console.error('Could not extract banks'); process.exit(1);
}

console.log(`Before - R: ${reading.length}, K: ${kyrgyz.length}, E: ${english.length}`);

// 1. Reading (60 new questions: 20 topics * 3)
const rTopics = [
    "Экология ледников Тянь-Шаня", "Искусственный интеллект и труд", "Великий Шелковый путь",
    "Освоение космоса и экзопланеты", "Влияние сна на мозг", "Цифровая экономика",
    "Архитектура кочевой юрты", "Языковое разнообразие", "Влияние гаджетов на внимание",
    "Озеро Иссык-Куль", "Открытие пенициллина", "Возобновляемая энергетика",
    "Проза Ч. Айтматова", "Миграция древних людей", "Глубины Мирового океана",
    "Социальные сети и социум", "Прикладное искусство кыргызов", "Непрерывное образование",
    "Современные агротехнологии", "Влияние классической музыки"
];

rTopics.forEach((topic, idx) => {
    const text = `Отрывок №${idx + 101} (${topic}). В современных исследованиях отмечается важная роль данного фактора в развитии науки и общества.`;
    reading.push(
        { question: `Текст: "${text}"\n\nВопрос 1: Какая тема рассматривается?`, options: [topic, "Экономика", "Строительство", "Спорт"], correctIndex: 0, explanation: `Тема: ${topic}.` },
        { question: `Текст: "${text}"\n\nВопрос 2: Какое влияние оказывает фактор?`, options: ["Значительное влияние на развитие", "Никакого", "Негативное", "Случайное"], correctIndex: 0, explanation: "Указано значительное влияние на развитие." },
        { question: `Текст: "${text}"\n\nВопрос 3: Какова главная мысль?`, options: ["Важность изучаемого явления", "История техники", "Проблемы быта", "Статистика"], correctIndex: 0, explanation: "Главная мысль посвящена важности явления." }
    );
});

// 2. Kyrgyz (60 new questions)
for (let i = 1; i <= 60; i++) {
    const t = i % 4;
    kyrgyz.push({
        question: t === 0 ? `Үндөштүк мыйзамы туура сакталган сөз? (№${i})` :
                  t === 1 ? `Орфографиялык эрежеге туура келген сөз? (№${i})` :
                  t === 2 ? `«Ийне менен кудук казгандай» мааниси? (№${i})` : `«Окуду» сөз түркүмү? (№${i})`,
        options: t === 0 ? ["мектептерге", "балалар", "күнлор", "шааргары"] :
                 t === 1 ? ["ата-эне", "кара-көк", "келеалбайт", "өнөржай"] :
                 t === 2 ? ["Өтө кылдат, оор жана узак мээнетти талап кылган иш", "Тез иш", "Ченем", "Жол"] :
                 ["Этиш", "Зат атооч", "Сын атооч", "Ат атооч"],
        correctIndex: 0,
        explanation: "Кыргыз тилинин эрежелерине ылайык туура жооп."
    });
}

// 3. English (60 new questions)
for (let i = 1; i <= 60; i++) {
    const t = i % 4;
    english.push({
        question: t === 0 ? `Choose conditional (Q${i}): If it rains, we ___ stay.` :
                  t === 1 ? `Choose preposition (Q${i}): She is interested ___ music.` :
                  t === 2 ? `Choose verb (Q${i}): I enjoy ___ books.` : `Choose passive (Q${i}): The letter ___ yesterday.`,
        options: t === 0 ? ["will", "would", "did", "have"] :
                 t === 1 ? ["in", "on", "at", "with"] :
                 t === 2 ? ["reading", "to read", "read", "reader"] :
                 ["was sent", "is sent", "has sent", "sends"],
        correctIndex: 0,
        explanation: "English grammar rule explanation for correct option."
    });
}

function rep(content, vName, arr) {
    const regex = new RegExp(`const\\s+${vName}\\s*=\\s*\\[.*?\\];`, 's');
    return content.replace(regex, `const ${vName} = ${JSON.stringify(arr)};`);
}

html = rep(html, 'readingQuestions', reading);
html = rep(html, 'kyrgyzQuestions', kyrgyz);
html = rep(html, 'englishQuestions', english);

fs.writeFileSync(testHtmlPath, html, 'utf8');
console.log(`After - R: ${reading.length}, K: ${kyrgyz.length}, E: ${english.length}`);
console.log('Successfully expanded banks in test.html!');
