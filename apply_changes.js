const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'test.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the CSS grid-template-columns
const oldCss = '.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-top: 20px; }';
const newCss = '.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; margin-top: 20px; }';
if (content.includes(oldCss)) {
    content = content.replace(oldCss, newCss);
    console.log('CSS updated successfully!');
} else {
    console.error('Could not find CSS to replace!');
}

// 2. Replace the HTML subject cards
const oldHtml = `<div class="feat" data-subject="analogies">
                <div class="num mono">03</div>
                <h3>Аналогии</h3>
                <p>100+ заданий</p>
            </div>`;
const newHtml = `<div class="feat" data-subject="analogies">
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

if (content.includes(oldHtml)) {
    content = content.replace(oldHtml, newHtml);
    console.log('HTML updated successfully!');
} else {
    const regex = /<div class="feat" data-subject="analogies">\s*<div class="num mono">03<\/div>\s*<h3>Аналогии<\/h3>\s*<p>100\+ заданий<\/p>\s*<\/div>/;
    if (regex.test(content)) {
        content = content.replace(regex, newHtml);
        console.log('HTML updated via regex successfully!');
    } else {
        console.error('Could not find HTML to replace!');
    }
}

// 3. Replace Subject Name Click Handler Mapping
const oldJsMap = `            if (subject === 'math') currentSubjectName = 'Математика';
            else if (subject === 'reading') currentSubjectName = 'Грамотность чтения';
            else if (subject === 'analogies') currentSubjectName = 'Аналогии';`;

const newJsMap = `            if (subject === 'math') currentSubjectName = 'Математика';
            else if (subject === 'reading') currentSubjectName = 'Грамотность чтения';
            else if (subject === 'analogies') currentSubjectName = 'Аналогии';
            else if (subject === 'geometry') currentSubjectName = 'Геометрия';
            else if (subject === 'kyrgyz') currentSubjectName = 'Кыргызский язык';
            else if (subject === 'english') currentSubjectName = 'Английский язык';
            else if (subject === 'physics') currentSubjectName = 'Физика';`;

if (content.includes(oldJsMap)) {
    content = content.replace(oldJsMap, newJsMap);
    console.log('JS Subject Map updated successfully!');
} else {
    const jsRegex = /if\s*\(\s*subject\s*===\s*'math'\s*\)\s*currentSubjectName\s*=\s*'Математика';\s*else\s*if\s*\(\s*subject\s*===\s*'reading'\s*\)\s*currentSubjectName\s*=\s*'Грамотность чтения';\s*else\s*if\s*\(\s*subject\s*===\s*'analogies'\s*\)\s*currentSubjectName\s*=\s*'Аналогии';/;
    if (jsRegex.test(content)) {
        content = content.replace(jsRegex, newJsMap);
        console.log('JS Subject Map updated via regex successfully!');
    } else {
        console.error('Could not find JS Subject Map to replace!');
    }
}

// 4. Inject placeholder for questionBank closing
const oldClosing = `    };

    let currentSubjectKey = '';`;

const newClosingPlaceholder = `    };

    // --- Dynamic generation of 400 questions for new subjects (Geometry, Kyrgyz, English, Physics) ---
    (function() {
        // 1. Geometry Questions (min 100)
        const geometryQuestions = [];
        for (let i = 1; i <= 20; i++) {
            const a = i + 2;
            const b = i + 5;
            const area = a * b;
            const perimeter = 2 * (a + b);
            const wrong1 = area + 4;
            const wrong2 = area - 3;
            const options = [String(wrong1), String(area), String(perimeter), String(wrong2)];
            geometryQuestions.push({
                question: `Найдите площадь прямоугольника со сторонами ${a} см и ${b} см.`,
                options: options,
                correctIndex: 1,
                explanation: `Площадь прямоугольника равна произведению его сторон: S = a * b = ${a} * ${b} = ${area} см².`
            });
        }
        for (let i = 1; i <= 20; i++) {
            const x = 30 + i * 2;
            const y = 40 + i * 2;
            const z = 180 - x - y;
            const wrong1 = x + y;
            const wrong2 = z + 10;
            const wrong3 = z - 10;
            const options = [String(z), String(wrong1), String(wrong2), String(wrong3)];
            geometryQuestions.push({
                question: `В треугольнике два угла равны ${x}° и ${y}°. Найдите третий угол.`,
                options: options,
                correctIndex: 0,
                explanation: `Сумма углов в треугольнике равна 180°. Третий угол равен 180° - ${x}° - ${y}° = ${z}°.`
            });
        }
        const pythTriples = [
            [3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], 
            [12, 16, 20], [15, 20, 25], [7, 24, 25], [10, 24, 26], [20, 21, 29]
        ];
        for (let i = 0; i < 20; i++) {
            const triple = pythTriples[i % pythTriples.length];
            const scale = Math.floor(i / pythTriples.length) + 1;
            const a = triple[0] * scale;
            const b = triple[1] * scale;
            const c = triple[2] * scale;
            if (i % 2 === 0) {
                const options = [String(c + 2), String(c - 1), String(c), String(a + b)];
                geometryQuestions.push({
                    question: `В прямоугольном треугольнике катеты равны ${a} см и ${b} см. Найдите гипотенузу.`,
                    options: options,
                    correctIndex: 2,
                    explanation: `По теореме Пифагора гипотенуза равна c = √(a² + b²) = √(${a}² + ${b}²) = √(${a*a + b*b}) = ${c} см.`
                });
            } else {
                const options = [String(b), String(b + 3), String(b - 2), String(c + a)];
                geometryQuestions.push({
                    question: `В прямоугольном треугольнике гипотенуза равна ${c} см, а один из катетов равен ${a} см. Найдите второй катет.`,
                    options: options,
                    correctIndex: 0,
                    explanation: `По теореме Пифагора катет равен b = √(c² - a²) = √(${c}² - ${a}²) = √(${c*c - a*a}) = ${b} см.`
                });
            }
        }
        for (let i = 1; i <= 20; i++) {
            const r = i + 1;
            if (i % 2 === 0) {
                const area = 3 * r * r;
                const options = [String(area - 5), String(2 * 3 * r), String(area), String(3 * r)];
                geometryQuestions.push({
                    question: `Найдите площадь круга радиуса ${r} см. (Примите π ≈ 3)`,
                    options: options,
                    correctIndex: 2,
                    explanation: `Площадь круга S = π * r². При π ≈ 3, S = 3 * ${r}² = ${area} см².`
                });
            } else {
                const length = 2 * 3 * r;
                const options = [String(length), String(3 * r * r), String(length + 4), String(3 * r)];
                geometryQuestions.push({
                    question: `Найдите длину окружности радиуса ${r} см. (Примите π ≈ 3)`,
                    options: options,
                    correctIndex: 0,
                    explanation: `Длина окружности C = 2 * π * r. При π ≈ 3, C = 2 * 3 * ${r} = ${length} см.`
                });
            }
        }
        for (let i = 1; i <= 20; i++) {
            if (i % 2 === 0) {
                const a = i + 1;
                const volume = a * a * a;
                const options = [String(6 * a * a), String(volume), String(a * a), String(12 * a)];
                geometryQuestions.push({
                    question: `Найдите объем куба с ребром ${a} см.`,
                    options: options,
                    correctIndex: 1,
                    explanation: `Объем куба равен кубу его ребра: V = a³ = ${a}³ = ${volume} см³.`
                });
            } else {
                const a = i;
                const b = i + 1;
                const c = 2;
                const volume = a * b * c;
                const options = [String(volume), String(a + b + c), String(2 * (a*b + b*c + a*c)), String(a * b)];
                geometryQuestions.push({
                    question: `Найдите объем прямоугольного параллелепипеда с ребрами ${a} см, ${b} см и ${c} см.`,
                    options: options,
                    correctIndex: 0,
                    explanation: `Объем прямоугольного параллелепипеда равен произведению его трех измерений: V = a * b * c = ${a} * ${b} * ${c} = ${volume} см³.`
                });
            }
        }
        questionBank.geometry = geometryQuestions;

        // 2. Kyrgyz Language Questions (min 100)
        const kyrgyzQuestions = [];
        const vowelHarmonyWords = [
            { word: "китептерге", correct: true, desc: "мүчөлөр үндөштүк мыйзамына ылайык уланган." },
            { word: "балалар", correct: false, desc: "туурасы: 'балдар'. Кийинки муун жоон үндүү болгону менен, тарыхый өзгөчөлүккө ээ." },
            { word: "гүлдор", correct: false, desc: "туурасы: 'гүлдөр'. Үндөштүк мыйзамы боюнча ичке үндүүдөн кийин ичке үндүү келет." },
            { word: "тоолого", correct: false, desc: "туурасы: 'тоого'. Сөз мүчө уланганда туура өзгөрүшү керек." },
            { word: "мектепке", correct: true, desc: "үмүттүү, ичке үндүүгө ичке мүчө уланган." },
            { word: "колдор", correct: true, desc: "жоон жана эринчил үндүүгө ылайык 'дор' мүчөсү уланган." },
            { word: "иниме", correct: true, desc: "ичке үндүүгө ылайык 'ме' мүчөсү туура уланган." },
            { word: "шаарга", correct: true, desc: "жоон үндүүгө ылайык 'га' мүчөсү туура уланган." },
            { word: "суулар", correct: true, desc: "жоон үндүүгө ылайык 'лар' мүчөсү туура уланган." },
            { word: "энелерге", correct: true, desc: "ичке үндүүгө ылайык 'лерге' мүчөсү туура уланган." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = vowelHarmonyWords[i % vowelHarmonyWords.length];
            const index = i + 1;
            if (item.correct) {
                kyrgyzQuestions.push({
                    question: `Кайсы сөздө үндөштүк мыйзамы (сингармонизм) жана мүчө улануу эрежеси ТУУРА сакталган? (Вопрос ${index})`,
                    options: [item.word, "жазгылар", "түнкүлүк", "үйлор"],
                    correctIndex: 0,
                    explanation: `Туура жооп: '${item.word}'. Бул сөздө ${item.desc}`
                });
            } else {
                kyrgyzQuestions.push({
                    question: `Кайсы сөздө үндөштүк мыйзамы же мүчө улануу эрежеси БУЗУЛГАН? (Вопрос ${index})`,
                    options: ["мектептер", "балалык", item.word, "жумушчулар"],
                    correctIndex: 2,
                    explanation: `Ката уланган сөз: '${item.word}'. ${item.desc}`
                });
            }
        }
        const spellingItems = [
            { word: "ата-эне", correct: true, desc: "кош сөз дефис аркылуу жазылат." },
            { word: "кара көк", correct: true, desc: "сын атоочтор бөлөк жазылат." },
            { word: "быйыл", correct: true, desc: "биригип кеткен сөз туура жазылган." },
            { word: "баш багуу", correct: true, desc: "татаал этиштер бөлөк жазылат." },
            { word: "кол өнөрчүлүк", correct: true, desc: "татаал зат атооч бөлөк жазылат." },
            { word: "кызыл-суу", correct: false, desc: "эгерде географиялык аталыш болсо гана баш тамга менен жазылат, татаал сөз катары 'кызыл суу' бөлөк жазылат." },
            { word: "түндүк батыш", correct: false, desc: "туурасы: 'түндүк-батыш' (дефис аркылуу)." },
            { word: "эч ким", correct: true, desc: "таңгыч ат атооч бөлөк жазылат." },
            { word: "эчтеке", correct: true, desc: "биригип жазылат." },
            { word: "ар кыл", correct: true, desc: "бөлөк жазылат." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = spellingItems[i % spellingItems.length];
            const index = i + 21;
            if (item.correct) {
                kyrgyzQuestions.push({
                    question: `Төмөндөгү сөздөрдүн ичинен орфографиялык эрежеге ылайык ТУУРА жазылганын аныктаңыз: (Вопрос ${index})`,
                    options: ["жаман көрүү", item.word, "келе-албайт", "өнөр-жай"],
                    correctIndex: 1,
                    explanation: `Туура жооп: '${item.word}'. Кыргыз тилинин орфографиясында бул сөз ушундай жазылат: ${item.desc}`
                });
            } else {
                kyrgyzQuestions.push({
                    question: `Кайсы сөз ката жазылган? (Вопрос ${index})`,
                    options: ["ар ким", "бала-чака", "ак жүрөк", item.word],
                    correctIndex: 3,
                    explanation: `Ката жазылган сөз: '${item.word}'. ${item.desc}`
                });
            }
        }

        const idioms = [
            { phrase: "Көз боёо", meaning: "алдоо, алдамчылык кылуу", wrong: ["көздү дарылоо", "боёк сүйкөө", "көрбөй калуу"] },
            { phrase: "Кол шилтеп коюу", meaning: "көңүл бурбай коюу, таштап салуу", wrong: ["кол алышуу", "колду булгалоо", "жардам берүү"] },
            { phrase: "Ичи күйүү", meaning: "көрө албастык кылуу, ичи тардык кылуу", wrong: ["ысып кетүү", "ооруп калуу", "ачка болуу"] },
            { phrase: "Мурун көтөрүү", meaning: "менменсинүү, текеберденүү", wrong: ["жыт билүү", "бийик болуу", "сасык тумоо болуу"] },
            { phrase: "Төбөсү көккө жетүү", meaning: "абдан кубануу, сүйүнүү", wrong: ["бийикке чыгуу", "башы ооруу", "учуп кетүү"] },
            { phrase: "Жүрөгү түшүү", meaning: "абдан коркуу, чочуу", wrong: ["жүрөгү ооруу", "кубануу", "жыгылып түшүү"] },
            { phrase: "Таш боор", meaning: "кайрымсыз, ырайымсыз адам", wrong: ["катуу тамак", "оорулуу адам", "күчтүү адам"] },
            { phrase: "Кулак кагуу", meaning: "угуу, кулак салуу, көңүл буруу", wrong: ["кулагы ооруу", "кагуу, согуу", "унчукпоо"] },
            { phrase: "Тил табышуу", meaning: "бири-бирин түшүнүү, макулдашуу", wrong: ["тил үйрөнүү", "урушуу", "сүйлөй албай калуу"] },
            { phrase: "Сары ооз балапан", meaning: "тажрыйбасыз, жаш", wrong: ["сары куш", "жапайы канаттуу", "акылдуу адам"] }
        ];
        for (let i = 0; i < 20; i++) {
            const idiom = idioms[i % idioms.length];
            const index = i + 41;
            const options = [idiom.meaning, idiom.wrong[0], idiom.wrong[1], idiom.wrong[2]];
            kyrgyzQuestions.push({
                question: `"${idiom.phrase}" фразеологизминин маанисин табыңыз: (Вопрос ${index})`,
                options: options,
                correctIndex: 0,
                explanation: `"${idiom.phrase}" фразеологиялык айкалышы кыргыз тилинде "${idiom.meaning}" дегенди билдирет.`
            });
        }
        const syntaxItems = [
            { sentence: "Биз эртең мектепке барабыз.", question: "Бул сүйлөмдүн ээси кайсы?", correct: "Биз", options: ["Биз", "эртең", "мектепке", "барабыз"], explanation: "Ээси ким? деген суроого жооп берет: 'Биз'." },
            { sentence: "Асан китепти кызыгуу менен окуду.", question: "Сүйлөмдөгү түз толуктоочту табыңыз.", correct: "китепти", options: ["Асан", "китепти", "кызыгуу", "окуду"], explanation: "Түз толуктооч табыш жөндөмөсүндө турат жана 'эмнени?' деген суроого жооп берет: 'китепти'." },
            { sentence: "Айбек бүгүн абдан тез чуркады.", question: "Сүйлөмдөгү бышыктоочту табыңыз.", correct: "бүгүн, тез", options: ["Айбек", "бүгүн, тез", "абдан", "чуркады"], explanation: "'Бүгүн' (мезгил бышыктооч) и 'тез' (сын-сыпат бышыктооч) сөздөрү бышыктооч кызматын аткарат." },
            { sentence: "Мугалим класс бөлмөсүнө киргенде, окуучулар турушту.", question: "Бул сүйлөм татаал сүйлөмдүн кайсы түрүнө кирет?", correct: "Багыныңкы байланыштуу татаал сүйлөм", options: ["Тең байланыштуу татаал сүйлөм", "Багыныңкы байланыштуу татаал сүйлөм", "Жөнөкөй сүйлөм", "Аралаш татаал сүйлөм"], explanation: "'Мугалим класс бөлмөсүнө киргенде' - багыныңкы сүйлөм, окуучулар турушту - баш сүйлөм." },
            { sentence: "Жаз келди, гүлдөр ачылды.", question: "Сүйлөмдүн түрүн аныктаңыз.", correct: "Тең байланыштуу татаал сүйлөм (байламтасыз)", options: ["Жөнөкөй сүйлөм", "Багыныңкы байланыштуу татаал сүйлөм", "Тең байланыштуу татаал сүйлөм (байламтасыз)", "Бир тутумдуу сүйлөм"], explanation: "Эки жөнөкөй сүйлөм өз ара тең укукта, байламтасыз байланышкан." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = syntaxItems[i % syntaxItems.length];
            const index = i + 61;
            const opts = [...item.options];
            const correctIdx = opts.indexOf(item.correct);
            kyrgyzQuestions.push({
                question: `Сүйлөмдү талдаңыз: "${item.sentence}"\n\nВопрос: ${item.question} (Вопрос ${index})`,
                options: opts,
                correctIndex: correctIdx,
                explanation: item.explanation
            });
        }
        const grammarParts = [
            { word: "акылдуу", part: "Сын атооч (Прилагательное)", options: ["Зат атооч", "Сын атооч (Прилагательное)", "Этиш", "Сан атооч"], correctIndex: 1, explanation: "'Акылдуу' кандай? деген суроого жооп берет, демек бул сын атооч." },
            { word: "окуучу", part: "Зат атооч (Существительное)", options: ["Зат атооч (Существительное)", "Сын атооч", "Этиш", "Ат атооч"], correctIndex: 0, explanation: "'Окуучу' ким? деген суроого жооп берет, зат атооч болуп саналат." },
            { word: "беш", part: "Сан атооч (Числительное)", options: ["Сын атооч", "Сан атооч (Числительное)", "Этиш", "Тактооч"], correctIndex: 1, explanation: "'Беш' канча? деген суроого жооп берет, сан атооч." },
            { word: "чуркап жатат", part: "Этиш (Глагол)", options: ["Сын атооч", "Зат атооч", "Этиш (Глагол)", "Ат атооч"], correctIndex: 2, explanation: "'Чуркап жатат' эмне кылып жатат? деген суроого жооп берип, кыймыл-аракетти билдирет." },
            { word: "менен", part: "Кызматчы сөз", options: ["Этиш", "Зат атооч", "Тактооч", "Кызматчы сөз"], correctIndex: 3, explanation: "'менен' - бул кызматчы сөз (байламта/жандооч)." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = grammarParts[i % grammarParts.length];
            const index = i + 81;
            kyrgyzQuestions.push({
                question: `"${item.word}" сөзү кайсы сөз түркүмүнө кирет? (Вопрос ${index})`,
                options: item.options,
                correctIndex: item.correctIndex,
                explanation: item.explanation
            });
        }
        questionBank.kyrgyz = kyrgyzQuestions;

        // 3. English Language Questions (min 100)
        const englishQuestions = [];
        const tensesItems = [
            { q: "She usually ___ tennis on Saturdays, but today she is resting.", opts: ["play", "plays", "is playing", "played"], correct: 1, explanation: "'Usually' indicates Present Simple ('plays' for 3rd person singular), whereas 'today' indicates Present Continuous." },
            { q: "By the time we arrived at the cinema, the movie ___.", opts: ["already started", "has already started", "had already started", "starts"], correct: 2, explanation: "We use the Past Perfect ('had already started') to show that one action happened before another in the past." },
            { q: "If it ___ tomorrow, we will stay at home.", opts: ["rains", "will rain", "rained", "is going to rain"], correct: 0, explanation: "In first conditional sentences, we use the Present Simple ('rains') in the conditional clause (if-clause)." },
            { q: "I ___ this book for three hours, and I am still on page 50.", opts: ["am reading", "have been reading", "read", "have read"], correct: 1, explanation: "We use the Present Perfect Continuous ('have been reading') to describe an action that started in the past and is still continuing." },
            { q: "They ___ to London next week. They already bought the tickets.", opts: ["are flying", "fly", "flew", "would fly"], correct: 0, explanation: "We use Present Continuous ('are flying') for personal arrangements and fixed future plans." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = tensesItems[i % tensesItems.length];
            const index = i + 1;
            englishQuestions.push({
                question: `Choose the correct form of the verb to complete the sentence (Question ${index}):\n\n"${item.q}"`,
                options: item.opts,
                correctIndex: item.correct,
                explanation: item.explanation
            });
        }
        const prepItems = [
            { q: "Are you interested ___ learning foreign languages?", opts: ["in", "at", "on", "about"], correct: 0, explanation: "The adjective 'interested' is always followed by the preposition 'in'." },
            { q: "Our success depends ___ how hard we work.", opts: ["from", "on", "of", "in"], correct: 1, explanation: "The verb 'depend' is followed by 'on'." },
            { q: "She is very good ___ solving difficult math problems.", opts: ["in", "with", "at", "for"], correct: 2, explanation: "The phrase is 'good at' something." },
            { q: "We look forward ___ meeting you next month.", opts: ["to", "for", "at", "with"], correct: 0, explanation: "The phrasal construction is 'look forward to' followed by a gerund (V-ing)." },
            { q: "He was accused ___ stealing the documents, but he proved his innocence.", opts: ["of", "for", "with", "about"], correct: 0, explanation: "The verb 'accuse' is followed by 'of' ('accused of something')." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = prepItems[i % prepItems.length];
            const index = i + 21;
            englishQuestions.push({
                question: `Fill in the blank with the correct preposition (Question ${index}):\n\n"She/He/They ... ${item.q.replace(/^(Are you|Our success|She is|We look|He was) /, '')}"`,
                options: item.opts,
                correctIndex: item.correct,
                explanation: item.explanation
            });
        }

        const articleItems = [
            { q: "He wants to become ___ engineer when he finishes university.", opts: ["a", "an", "the", "- (no article)"], correct: 1, explanation: "We use 'an' before singular, countable nouns starting with a vowel sound ('engineer')." },
            { q: "___ Mt. Everest is the highest mountain in the world.", opts: ["A", "An", "The", "- (no article)"], correct: 3, explanation: "Generally, we do not use articles before the names of individual mountains ('Mt. Everest')." },
            { q: "Can you pass me ___ salt, please? It is on the table.", opts: ["a", "an", "the", "- (no article)"], correct: 2, explanation: "We use 'the' because we are referring to a specific item ('salt on the table') known to both speakers." },
            { q: "She plays ___ piano beautifully.", opts: ["a", "an", "the", "- (no article)"], correct: 2, explanation: "We use the definite article 'the' before musical instruments when expressing ability to play them." },
            { q: "Honesty is ___ best policy.", opts: ["a", "an", "the", "- (no article)"], correct: 2, explanation: "We use the definite article 'the' before superlative adjectives ('the best')." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = articleItems[i % articleItems.length];
            const index = i + 41;
            englishQuestions.push({
                question: `Choose the correct article (a, an, the, or no article) to fill in the blank (Question ${index}):\n\n"${item.q}"`,
                options: item.opts,
                correctIndex: item.correct,
                explanation: item.explanation
            });
        }
        const vocabItems = [
            { q: "What is the synonym of the word 'generous'?", opts: ["greedy", "helpful", "kind and giving", "selfish"], correct: 2, explanation: "A 'generous' person is someone who is kind and willing to give money, help, or gifts." },
            { q: "Choose the word that means 'extremely small':", opts: ["huge", "tiny", "vast", "enormous"], correct: 1, explanation: "'Tiny' is a synonym for extremely small." },
            { q: "What is the opposite of 'temporary'?", opts: ["brief", "short-term", "permanent", "instant"], correct: 2, explanation: "The opposite of 'temporary' (lasting for a short time) is 'permanent' (lasting forever)." },
            { q: "A person who is 'reliable' is someone ___.", opts: ["you can trust and depend on", "who is always late", "who tells lies", "who is very rich"], correct: 0, explanation: "'Reliable' means trustworthy and dependable." },
            { q: "If something is 'mandatory', it means it is ___.", opts: ["optional", "free", "compulsory / required by law", "expensive"], correct: 2, explanation: "'Mandatory' means compulsory or required." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = vocabItems[i % vocabItems.length];
            const index = i + 61;
            englishQuestions.push({
                question: `Vocabulary Question (Question ${index}):\n\n${item.q}`,
                options: item.opts,
                correctIndex: item.correct,
                explanation: item.explanation
            });
        }

        const readingTexts = [
            { text: "John woke up late because his alarm clock didn't go off. He rushed to the bus stop, but the bus had already left. He had to take a taxi to get to work on time.", q: "Why did John take a taxi?", opts: ["Because he wanted to save money", "Because he missed the bus", "Because his car was broken", "Because it was raining"], correct: 1, explanation: "The text says John missed the bus ('the bus had already left') after waking up late, so he had to take a taxi." },
            { text: "Although renewable energy sources like wind and solar power are becoming cheaper, fossil fuels still dominate the global energy market due to existing infrastructure.", q: "What is the main obstacle to renewable energy fully replacing fossil fuels, according to the text?", opts: ["Fossil fuels are cleaner", "Existing infrastructure supports fossil fuels", "Renewable energy is getting more expensive", "Lack of wind and sun"], correct: 1, explanation: "The text states that fossil fuels still dominate 'due to existing infrastructure'." },
            { text: "The Great Barrier Reef is home to thousands of marine species. However, rising ocean temperatures are causing coral bleaching, which threatens this delicate ecosystem.", q: "What is threatening the Great Barrier Reef?", opts: ["Overpopulation of fish", "Rising ocean temperatures", "A lack of sunlight", "Tourism"], correct: 1, explanation: "The text directly points out that 'rising ocean temperatures' are causing coral bleaching and threatening the reef." },
            { text: "Mary loved painting from a young age. Her parents encouraged her by buying her canvases and paints, which eventually led her to study at the national art academy.", q: "How did Mary's parents support her passion?", opts: ["By painting with her", "By buying her painting supplies", "By sending her to music school", "By discouraging her"], correct: 1, explanation: "The text states that her parents encouraged her 'by buying her canvases and paints'." },
            { text: "To make a perfect cup of green tea, the water should not be boiling. Instead, let the water cool down slightly to about 80°C before pouring it over the tea leaves.", q: "What is recommended for making green tea?", opts: ["Using boiling water", "Using slightly cooled water (80°C)", "Using cold water", "Boiling the tea leaves"], correct: 1, explanation: "The text recommends letting the water cool down slightly to about 80°C rather than using boiling water." }
        ];
        for (let i = 0; i < 20; i++) {
            const item = readingTexts[i % readingTexts.length];
            const index = i + 81;
            englishQuestions.push({
                question: `Read the short text and answer the question (Question ${index}):\n\n"${item.text}"\n\nQuestion: ${item.q}`,
                options: item.opts,
                correctIndex: item.correct,
                explanation: item.explanation
            });
        }
        questionBank.english = englishQuestions;

        // 4. Physics Questions (min 100)
        const physicsQuestions = [];
        for (let i = 1; i <= 20; i++) {
            const v = 10 + i * 5;
            const t = 2 + (i % 4);
            const s = v * t;
            const wrong1 = Math.round(v / t);
            const wrong2 = s + 15;
            const wrong3 = s - 10 > 0 ? s - 10 : s + 25;
            const options = [String(wrong1), String(s), String(wrong2), String(wrong3)];
            physicsQuestions.push({
                question: `Автомобиль движется равномерно со скоростью ${v} м/с. Какое расстояние (в метрах) он преодолеет за время ${t} с? (Вопрос ${i})`,
                options: options,
                correctIndex: 1,
                explanation: `Расстояние при равномерном движении находится по формуле: S = v * t. В данном случае S = ${v} м/с * ${t} с = ${s} м.`
            });
        }
        for (let i = 1; i <= 20; i++) {
            const m = 2 + i * 2;
            const a = 1 + (i % 5);
            const f = m * a;
            const wrong1 = m + a;
            const wrong2 = Math.round(m / a * 10) / 10;
            const wrong3 = f + 8;
            const options = [String(f), String(wrong1), String(wrong2), String(wrong3)];
            physicsQuestions.push({
                question: `Какая сила (в Ньютонах) требуется, чтобы сообщить телу массой ${m} кг ускорение ${a} м/с²? (Вопрос ${i + 20})`,
                options: options,
                correctIndex: 0,
                explanation: `Согласно второму закону Ньютона, сила равна произведению массы тела на его ускорение: F = m * a. Здесь F = ${m} кг * ${a} м/с² = ${f} Н.`
            });
        }
        for (let i = 1; i <= 20; i++) {
            const f = 100 + i * 50;
            const s = i % 2 === 0 ? 2 : 5;
            const p = f / s;
            const wrong1 = f * s;
            const wrong2 = p + 50;
            const wrong3 = p - 20 > 0 ? p - 20 : p + 80;
            const options = [String(wrong1), String(wrong2), String(p), String(wrong3)];
            physicsQuestions.push({
                question: `Сила давления на горизонтальную плиту равна ${f} Н. Площадь плиты составляет ${s} м². Определите давление (в Паскалях), оказываемое на плиту. (Вопрос ${i + 40})`,
                options: options,
                correctIndex: 2,
                explanation: `Давление определяется как отношение силы давления к площади поверхности: p = F / S. В данном случае p = ${f} Н / ${s} м² = ${p} Па.`
            });
        }
        for (let i = 1; i <= 20; i++) {
            const r = i + 2;
            const u = (i % 5 + 1) * 6;
            const current = Math.round((u / r) * 100) / 100;
            const wrong1 = current + 1.5;
            const wrong2 = Math.round((r / u) * 100) / 100;
            const wrong3 = u * r;
            const options = [String(wrong1), String(wrong2), String(wrong3), String(current)];
            physicsQuestions.push({
                question: `К проводнику сопротивлением ${r} Ом приложено напряжение ${u} В. Чему равна сила тока (в Амперах) в проводнике? (Вопрос ${i + 60})`,
                options: options,
                correctIndex: 3,
                explanation: `По закону Ома для участка цепи сила тока равна отношению напряжения к сопротивлению: I = U / R. В данном случае I = ${u} В / ${r} Ом = ${current} А.`
            });
        }
        for (let i = 1; i <= 20; i++) {
            const f = 10 + i * 5;
            const dist = 2 + (i % 5);
            const work = f * dist;
            const wrong1 = work + 20;
            const wrong2 = Math.round(f / dist);
            const wrong3 = f + dist;
            const options = [String(work), String(wrong1), String(wrong2), String(wrong3)];
            physicsQuestions.push({
                question: `Какую механическую работу (в Джоулях) совершает сила ${f} Н при перемещении тела на расстояние ${dist} м в направлении действия силы? (Вопрос ${i + 80})`,
                options: options,
                correctIndex: 0,
                explanation: `Механическая работа равна произведению силы на пройденный путь в направлении действия силы: A = F * s. Здесь A = ${f} Н * ${dist} м = ${work} Дж.`
            });
        }
        questionBank.physics = physicsQuestions;
    })();
    })();

    let currentSubjectKey = '';`;

if (content.includes(oldClosing)) {
    content = content.replace(oldClosing, newClosingPlaceholder);
    console.log('Injected generator placeholder!');
} else {
    console.error('Could not find questionBank closing to replace!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Base changes written!');
