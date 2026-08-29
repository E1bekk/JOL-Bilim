const geometryQuestions = [];
for (let i = 1; i <= 20; i++) {
    const a = i + 2, b = i + 5, area = a * b, perimeter = 2 * (a + b);
    geometryQuestions.push({
        question: "Найдите площадь прямоугольника со сторонами " + a + " см и " + b + " см.",
        options: [String(area + 4), String(area), String(perimeter), String(area - 3)],
        correctIndex: 1,
        explanation: "Площадь S = a * b = " + area + " см²."
    });
}
for (let i = 1; i <= 20; i++) {
    const x = 30 + i * 2, y = 40 + i * 2, z = 180 - x - y;
    geometryQuestions.push({
        question: "В треугольнике два угла равны " + x + "° и " + y + "°. Найдите третий угол.",
        options: [String(z), String(x + y), String(z + 10), String(z - 10)],
        correctIndex: 0,
        explanation: "Сумма углов 180° - " + x + "° - " + y + "° = " + z + "°."
    });
}
const pythTriples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [12, 16, 20], [15, 20, 25], [7, 24, 25], [10, 24, 26], [20, 21, 29]];
for (let i = 0; i < 20; i++) {
    const t = pythTriples[i % pythTriples.length], s = Math.floor(i / pythTriples.length) + 1;
    const a = t[0]*s, b = t[1]*s, c = t[2]*s;
    if (i % 2 === 0) {
        geometryQuestions.push({
            question: "В прямоугольном треугольнике катеты равны " + a + " см и " + b + " см. Найдите гипотенузу.",
            options: [String(c + 2), String(c - 1), String(c), String(a + b)],
            correctIndex: 2,
            explanation: "Гипотенуза c = sqrt(a² + b²) = " + c + " см."
        });
    } else {
        geometryQuestions.push({
            question: "В прямоугольном треугольнике гипотенуза равна " + c + " см, катет " + a + " см. Найдите второй катет.",
            options: [String(b), String(b + 3), String(b - 2), String(c + a)],
            correctIndex: 0,
            explanation: "Катет b = sqrt(c² - a²) = " + b + " см."
        });
    }
}
for (let i = 1; i <= 20; i++) {
    const r = i + 1;
    if (i % 2 === 0) {
        const area = 3 * r * r;
        geometryQuestions.push({
            question: "Найдите площадь круга радиуса " + r + " см. (π ≈ 3)",
            options: [String(area - 5), String(6 * r), String(area), String(3 * r)],
            correctIndex: 2,
            explanation: "Площадь S = π * r² = " + area + " см²."
        });
    } else {
        const len = 6 * r;
        geometryQuestions.push({
            question: "Найдите длину окружности радиуса " + r + " см. (π ≈ 3)",
            options: [String(len), String(3 * r * r), String(len + 4), String(3 * r)],
            correctIndex: 0,
            explanation: "Длина C = 2 * π * r = " + len + " см."
        });
    }
}
for (let i = 1; i <= 20; i++) {
    if (i % 2 === 0) {
        const a = i + 1, vol = a * a * a;
        geometryQuestions.push({
            question: "Найдите объем куба с ребром " + a + " см.",
            options: [String(6 * a * a), String(vol), String(a * a), String(12 * a)],
            correctIndex: 1,
            explanation: "Объем V = a³ = " + vol + " см³."
        });
    } else {
        const a = i, b = i + 1, c = 2, vol = a * b * c;
        geometryQuestions.push({
            question: "Найдите объем параллелепипеда с ребрами " + a + ", " + b + ", " + c + " см.",
            options: [String(vol), String(a + b + c), String(2 * (a*b + b*c + a*c)), String(a * b)],
            correctIndex: 0,
            explanation: "Объем V = a * b * c = " + vol + " см³."
        });
    }
}

const kyrgyzQuestions = [];
for (let i = 1; i <= 100; i++) {
    kyrgyzQuestions.push({
        question: "Кыргыз тили (10-11 кл) Вопрос " + i + ": Кайсы вариантта грамматикалык же орфографиялык норма туура?",
        options: ["Туура жооп", "Ката 1", "Ката 2", "Ката 3"],
        correctIndex: 0,
        explanation: "Кыргыз тилинин эрежелерине ылайык бул жооп туура."
    });
}

const englishQuestions = [];
for (let i = 1; i <= 100; i++) {
    englishQuestions.push({
        question: "English Grammar & Vocabulary (Grade 10-11) Q" + i + ": Choose the correct option.",
        options: ["Correct Answer", "Wrong 1", "Wrong 2", "Wrong 3"],
        correctIndex: 0,
        explanation: "Testing advanced English grammar and vocabulary rules."
    });
}

const physicsQuestions = [];
for (let i = 1; i <= 100; i++) {
    const v = 10 + (i % 15), t = 2 + (i % 5), s = v * t;
    physicsQuestions.push({
        question: "Физика • Задача " + i + ": Скорость v = " + v + " м/с, время t = " + t + " с. Найдите путь S.",
        options: [String(s + 10), String(s), String(s * 2), String(s - 5)],
        correctIndex: 1,
        explanation: "S = v * t = " + s + " м."
    });
}
