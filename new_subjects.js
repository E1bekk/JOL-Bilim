const geometryQuestions = [];
for (let i = 1; i <= 100; i++) {
    if (i <= 25) {
        const a = 4 + i, b = 3 + (i % 7), area = a * b;
        geometryQuestions.push({
            question: `Найдите площадь прямоугольника со сторонами ${a} см и ${b} см.`,
            options: [String(area + 4), String(area), String(2*(a+b)), String(area - 2)],
            correctIndex: 1,
            explanation: `Площадь прямоугольника S = a * b = ${a} * ${b} = ${area} см².`
        });
    } else if (i <= 50) {
        const a = 3 + (i % 5), b = 4 + (i % 6), c = Math.round(Math.sqrt(a*a + b*b)*10)/10;
        geometryQuestions.push({
            question: `В прямоугольном треугольнике катеты равны ${a} см и ${b} см. Найдите гипотенузу. (№${i})`,
            options: [String(c + 2), String(c), String(c - 1), String(a + b)],
            correctIndex: 1,
            explanation: `По теореме Пифагора гипотенуза равна √(a² + b²) = √(${a*a} + ${b*b}) = ${c} см.`
        });
    } else if (i <= 75) {
        const r = 2 + (i % 10), area = 3 * r * r;
        geometryQuestions.push({
            question: `Найдите площадь круга радиуса ${r} см. (Примите π ≈ 3) (№${i})`,
            options: [String(area + 6), String(area), String(6 * r), String(3 * r)],
            correctIndex: 1,
            explanation: `Площадь круга S = π * r² = 3 * ${r}² = ${area} см².`
        });
    } else {
        const a = 2 + (i % 5), vol = a * a * a;
        geometryQuestions.push({
            question: `Найдите объем куба с ребром ${a} см. (№${i})`,
            options: [String(6 * a * a), String(vol), String(a * a), String(12 * a)],
            correctIndex: 1,
            explanation: `Объем куба V = a³ = ${a}³ = ${vol} см³.`
        });
    }
}

const kyrgyzQuestions = [];
for (let i = 1; i <= 100; i++) {
    if (i <= 25) {
        kyrgyzQuestions.push({
            question: `Кайсы сөздө үндөштүк мыйзамы (сингармонизм) туура сакталган? (№${i})`,
            options: ["китептерге", "жазгылар", "түнкүлүк", "үйлор"],
            correctIndex: 0,
            explanation: "Мүчөлөр үндөштүк мыйзамына (ичке үндүүлөр) так ылайык уланган."
        });
    } else if (i <= 50) {
        kyrgyzQuestions.push({
            question: `Төмөндөгү сөздөрдүн ичинен орфографиялык эрежеге ылайык ТУУРА жазылганын аныктаңыз: (№${i})`,
            options: ["жаман көрүү", "ак жүрөк", "келе-албайт", "өнөр-жай"],
            correctIndex: 1,
            explanation: "Кош сөздөр же сөз айкаштары эрежеге ылайык туура жазылган."
        });
    } else if (i <= 75) {
        kyrgyzQuestions.push({
            question: `"Ийне менен кудук казгандай" фразеологизминин маанисин туура көрсөтүңүз: (№${i})`,
            options: ["Өтө кылдат, оор жана узак мээнетти талап кылган иш", "Тез жасалган иш", "Артка кайтпаган чечим", "Бекем достук"],
            correctIndex: 0,
            explanation: "Бул туруктуу сөз айкашы өтө кылдат жана оор эмгектти түшүндүрөт."
        });
    } else {
        kyrgyzQuestions.push({
            question: `"жүгүрдү" сөзү кайсы сөз түркүмүнө кирет? (№${i})`,
            options: ["Этиш (глагол)", "Зат атооч", "Сын атооч", "Ат атооч"],
            correctIndex: 0,
            explanation: "Жүгүрдү — кыймыл-аракетти билдирген этиш сөз түркүмү."
        });
    }
}

module.exports = { geometryQuestions, kyrgyzQuestions };
