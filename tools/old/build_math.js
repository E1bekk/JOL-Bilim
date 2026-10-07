const fs = require('fs');
const path = require('path');

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
fs.writeFileSync(path.join(__dirname, 'math_q.json'), JSON.stringify(mathQuestions));
console.log('Math questions generated');
