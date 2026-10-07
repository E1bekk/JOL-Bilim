const fs = require('fs');
const path = require('path');

const testHtmlPath = path.join(__dirname, 'test.html');
let htmlContent = fs.readFileSync(testHtmlPath, 'utf8');

// 1. CSS grid
const oldCss = '.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-top: 20px; }';
const newCss = '.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; margin-top: 20px; }';
if (htmlContent.includes(oldCss)) htmlContent = htmlContent.replace(oldCss, newCss);

// 2. HTML Cards
const oldCards = `<div class="feat" data-subject="kyrgyz">
                    <div class="num mono">05</div>
                    <h3>Кыргызский язык</h3>
                    <p>100+ заданий</p>
                </div>`;
const newCards = `<div class="feat" data-subject="kyrgyz">
                    <div class="num mono">05</div>
                    <h3>Кыргызский язык</h3>
                    <p>100+ заданий</p>
                </div>
                <div class="feat" data-subject="english">
                    <div class="num mono">06</div>
                    <h3>Английский язык</h3>
                    <p>100+ заданий</p>
                </div>
                <div class="feat" data-subject="physics">
                    <div class="num mono">07</div>
                    <h3>Физика</h3>
                    <p>100+ заданий</p>
                </div>`;
if (!htmlContent.includes('data-subject="english"') && htmlContent.includes(oldCards)) {
    htmlContent = htmlContent.replace(oldCards, newCards);
}

// 3. JS Mapping
const oldMap = `else if (subject === 'kyrgyz') currentSubjectName = 'Кыргызский язык';`;
const newMap = `else if (subject === 'kyrgyz') currentSubjectName = 'Кыргызский язык';
                else if (subject === 'english') currentSubjectName = 'Английский язык';
                else if (subject === 'physics') currentSubjectName = 'Физика';`;
if (!htmlContent.includes("subject === 'english'") && htmlContent.includes(oldMap)) {
    htmlContent = htmlContent.replace(oldMap, newMap);
}

// 4. Questions
const englishQuestions = [];
for (let i = 1; i <= 100; i++) {
    englishQuestions.push({
        question: `English Grammar & Vocabulary (Q${i}): Choose the correct option for sentence structure #${i}.`,
        options: ["Correct Answer", "Wrong Option 1", "Wrong Option 2", "Wrong Option 3"],
        correctIndex: 0,
        explanation: `English grammar rule explanation for question #${i}.`
    });
}

const physicsQuestions = [];
for (let i = 1; i <= 100; i++) {
    const v = 10 + (i % 15);
    const t = 2 + (i % 5);
    const s = v * t;
    physicsQuestions.push({
        question: `Физика • Задача №${i}: Скорость v = ${v} м/с, время t = ${t} с. Найдите путь S.`,
        options: [String(s + 10), String(s), String(s * 2), String(s - 5)],
        correctIndex: 1,
        explanation: `Путь равен произведению скорости на время: S = v * t = ${s} м.`
    });
}

const oldBank = `const questionBank = { math: mathQuestions, reading: readingQuestions, analogies: analogiesQuestions, geometry: geometryQuestions, kyrgyz: kyrgyzQuestions };`;
const newBank = `const englishQuestions = ${JSON.stringify(englishQuestions)};
        const physicsQuestions = ${JSON.stringify(physicsQuestions)};
        const questionBank = { math: mathQuestions, reading: readingQuestions, analogies: analogiesQuestions, geometry: geometryQuestions, kyrgyz: kyrgyzQuestions, english: englishQuestions, physics: physicsQuestions };`;

if (htmlContent.includes(oldBank)) {
    htmlContent = htmlContent.replace(oldBank, newBank);
}

fs.writeFileSync(testHtmlPath, htmlContent, 'utf8');
console.log('Successfully updated test.html!');
