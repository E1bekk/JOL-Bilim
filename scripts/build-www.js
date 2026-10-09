// Сборка веб-части для Android-приложения: копирует сайт в папку www.
// Запуск: npm run build:app   (потом: npx cap sync android)
//
// Что делает:
//  1. Очищает www и копирует туда страницы, css, js и data.
//  2. Записывает js/config.js с настройками для приложения (полный адрес сервера).
//  3. Кладёт Firebase и шрифты внутрь приложения — чтобы всё открывалось без интернета.
//  4. Проверяет, что страницы больше ничего не грузят из интернета.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'www');
const API_BASE = 'https://jol-bilim.vercel.app'; // адрес сервера (поменять при переходе на свой домен)

const PAGES = ['index.html', 'cabinet.html', 'dashboard.html', 'test.html', 'parent.html'];
const DIRS = ['css', 'js', 'data'];
const FONTS = [ // пакет @fontsource и нужные начертания
  { pkg: 'manrope', weights: [400, 500, 600, 700, 800] },
  { pkg: 'unbounded', weights: [500, 600, 700] },
  { pkg: 'jetbrains-mono', weights: [500, 700] }
];
const FONT_SUBSETS = ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext']; // кириллица с кыргызскими ң ө ү

function fail(msg) { console.error('\n❌ ' + msg + '\n'); process.exit(1); }
function need(file, hint) { if (!fs.existsSync(file)) fail(`Не найден ${path.relative(ROOT, file)}. ${hint}`); }
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

// 1. Чистая папка www
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const p of PAGES) { need(path.join(ROOT, p), ''); fs.copyFileSync(path.join(ROOT, p), path.join(OUT, p)); }
for (const d of DIRS) { need(path.join(ROOT, d), ''); copyDir(path.join(ROOT, d), path.join(OUT, d)); }

// 2. Настройки для приложения
const cfgPath = path.join(OUT, 'js', 'config.js');
need(cfgPath, 'Файл js/config.js должен быть в проекте.');
const cfg = fs.readFileSync(cfgPath, 'utf8');
const cfgLine = /window\.JB_CONFIG = \{[^}]*\};/;
if (!cfgLine.test(cfg)) fail('В js/config.js не найдена строка window.JB_CONFIG = { ... };');
fs.writeFileSync(cfgPath, cfg.replace(cfgLine, `window.JB_CONFIG = { apiBase: '${API_BASE}', isApp: true };`));

// 3а. Firebase внутрь приложения
const NM = path.join(ROOT, 'node_modules');
const vendor = path.join(OUT, 'js', 'vendor');
fs.mkdirSync(vendor, { recursive: true });
for (const f of ['firebase-app-compat.js', 'firebase-firestore-compat.js']) {
  const src = path.join(NM, 'firebase', f);
  need(src, 'Выполни: npm install');
  fs.copyFileSync(src, path.join(vendor, f));
}

// 3б. Шрифты внутрь приложения
const fontsDir = path.join(OUT, 'fonts');
fs.mkdirSync(fontsDir, { recursive: true });
let fontCss = '/* Шрифты JOL-Bilim внутри приложения (собрано scripts/build-www.js) */\n';
for (const { pkg, weights } of FONTS) {
  const dir = path.join(NM, '@fontsource', pkg);
  need(dir, 'Выполни: npm install');
  for (const w of weights) {
    const css = fs.readFileSync(path.join(dir, `${w}.css`), 'utf8');
    for (const block of css.split('/* ').slice(1)) {
      const name = block.slice(0, block.indexOf(' */'));            // например manrope-cyrillic-400-normal
      const subset = name.replace(`${pkg}-`, '').replace(`-${w}-normal`, '');
      if (!FONT_SUBSETS.includes(subset)) continue;
      const file = `${name}.woff2`;
      fs.copyFileSync(path.join(dir, 'files', file), path.join(fontsDir, file));
      const face = block.slice(block.indexOf('@font-face'))
        .replace(/src:[^;]+;/, `src: url(../fonts/${file}) format('woff2');`);
      fontCss += face.trim() + '\n';
    }
  }
}
fs.writeFileSync(path.join(OUT, 'css', 'fonts.css'), fontCss);

// 3в. Страницы: локальные Firebase и шрифты вместо интернета
for (const p of PAGES) {
  const file = path.join(OUT, p);
  let html = fs.readFileSync(file, 'utf8');
  html = html
    .replace(/https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z-]+\.js)/g, 'js/vendor/$1')
    .replace(/\s*<link rel="preconnect"[^>]*>/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/[^"]*" rel="stylesheet">/g, '<link rel="stylesheet" href="css/fonts.css">');
  fs.writeFileSync(file, html);
}

// 4. Проверка: ничего не должно грузиться из интернета
const problems = [];
for (const p of PAGES) {
  const html = fs.readFileSync(path.join(OUT, p), 'utf8');
  const re = /<(script|link)\b[^>]*(?:src|href)="(https?:[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) problems.push(`${p}: ${m[2]}`);
}
if (problems.length) fail('Эти файлы всё ещё грузятся из интернета:\n  ' + problems.join('\n  '));

const count = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`\n✅ Готово: www собрана (${count(OUT)} файлов). Сервер: ${API_BASE}`);
console.log('   Дальше: npx cap sync android\n');
