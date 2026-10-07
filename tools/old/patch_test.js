const fs = require('fs');
const path = require('path');

const testHtmlPath = path.join(__dirname, 'test.html');
const newQuestionsPath = path.join(__dirname, 'new_questions.js');

let buf = fs.readFileSync(testHtmlPath);
let htmlContent = (buf[1] === 0 || buf.includes(Buffer.from([0]))) ? buf.toString('utf16le') : buf.toString('utf8');
htmlContent = htmlContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

const questionsJs = fs.readFileSync(newQuestionsPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

// 1. CSS grid update
const oldCss = '.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-top: 20px; }';
const newCss = '.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; margin-top: 20px; }';
if (htmlContent.includes(oldCss)) {
    htmlContent = htmlContent.replace(oldCss, newCss);
    console.log('1. CSS Grid updated');
} else {
    console.log('1. CSS Grid pattern not found');
}

// 2. HTML Cards update
const oldCards = `<div class="feat" data-subject="analogies">
                <div class="num mono">03</div>
                <h3>Аналогии</h3>
                <p>100+ заданий</p>
            </div>`;

const newCards = `<div class="feat" data-subject="analogies">
                <div class="num mono">03</div>
                <h3>Аналогии</h3>
                <p>100+ заданий</p>
            </div>
            <div class="feat" data-subject="geometry">
                <div class="num mono">04</div>
                <h3>Геометрия</h3>
                <p>100+ заданий</p>
            </div>
            <div class="feat" data-subject="kyrgyz">
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

if (htmlContent.includes(oldCards)) {
    htmlContent = htmlContent.replace(oldCards, newCards);
    console.log('2. HTML Cards updated');
} else {
    console.log('2. HTML Cards pattern not found');
}

// 3. Subject Names JS Mapping update
const oldMap = `            if (subject === 'math') currentSubjectName = 'Математика';
            else if (subject === 'reading') currentSubjectName = 'Грамотность чтения';
            else if (subject === 'analogies') currentSubjectName = 'Аналогии';`;

const newMap = `            if (subject === 'math') currentSubjectName = 'Математика';
            else if (subject === 'reading') currentSubjectName = 'Грамотность чтения';
            else if (subject === 'analogies') currentSubjectName = 'Аналогии';
            else if (subject === 'geometry') currentSubjectName = 'Геометрия';
            else if (subject === 'kyrgyz') currentSubjectName = 'Кыргызский язык';
            else if (subject === 'english') currentSubjectName = 'Английский язык';
            else if (subject === 'physics') currentSubjectName = 'Физика';`;

if (htmlContent.includes(oldMap)) {
    htmlContent = htmlContent.replace(oldMap, newMap);
    console.log('3. JS Subject Mapping updated');
} else {
    console.log('3. JS Subject Mapping pattern not found');
}

// 4. Inject Questions Generator
const targetClosing = `    };

    let currentSubjectKey = '';`;

const injectionCode = `    };

    // --- Dynamic Generation of 4 New Subjects (Geometry, Kyrgyz, English, Physics) ---
    (function() {
` + questionsJs + `
        questionBank.geometry = geometryQuestions;
        questionBank.kyrgyz = kyrgyzQuestions;
        questionBank.english = englishQuestions;
        questionBank.physics = physicsQuestions;
    })();

    let currentSubjectKey = '';`;

if (htmlContent.includes(targetClosing)) {
    htmlContent = htmlContent.replace(targetClosing, injectionCode);
    console.log('4. Dynamic Question Generators injected into questionBank');
} else {
    console.log('4. questionBank closing target not found');
}

fs.writeFileSync(testHtmlPath, htmlContent, 'utf8');
console.log('Successfully saved updated test.html as UTF-8!');


