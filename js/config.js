// Настройки JOL-Bilim: где работает код — на сайте или внутри Android-приложения.
// На сайте всё остаётся как было: запросы к серверу идут на тот же адрес (/api/...).
// При сборке приложения (npm run build:app) строка JB_CONFIG ниже заменяется:
// apiBase становится полным адресом сервера, isApp — true.
window.JB_CONFIG = { apiBase: '', isApp: false };

(function () {
  const c = window.JB_CONFIG;
  // Запасная проверка: если файл почему-то не заменился, но мы внутри приложения
  if (!c.isApp && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
    c.isApp = true;
    if (!c.apiBase) c.apiBase = 'https://jol-bilim.vercel.app';
  }
  window.JB_IS_APP = !!c.isApp;
  // Полный адрес запроса к серверу: JB_API('/api/ai-explain')
  window.JB_API = function (path) { return (c.apiBase || '') + path; };
  if (c.isApp) document.documentElement.classList.add('is-app');
})();
