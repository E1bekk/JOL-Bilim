// Нативные функции Android-приложения. На сайте этот файл ничего не делает.
//
// Кнопка «Назад» работает как в обычных приложениях:
//  1) сначала закрывает открытое окно (оплата, подтверждение, меню);
//  2) потом спрашивает страницу, что делать (window.JB_onBack — например, выйти из теста);
//  3) иначе возвращает на предыдущую страницу;
//  4) на главном экране не закрывает приложение, а сворачивает его, как кнопка «Домой».
(function () {
  if (!window.JB_IS_APP) return;
  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!App) { console.warn('Плагин @capacitor/app не установлен — кнопка «Назад» работает по умолчанию'); return; }

  // Свернуть приложение (как «Домой»), не закрывая его
  window.JB_minimize = function () {
    if (typeof App.minimizeApp === 'function') App.minimizeApp();
  };

  // Окно подтверждения в стиле приложения: JB_confirm({ title, text, ok, cancel }) -> Promise<true|false>
  let openConfirm = null;
  window.JB_confirm = function (opts) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'modal open';
      wrap.setAttribute('role', 'dialog');
      wrap.innerHTML =
        '<div class="modal-card" style="text-align:center;">' +
        '<h3></h3><p class="muted" style="font-size:14px; margin:0 0 22px;"></p>' +
        '<button type="button" class="btn btn-primary btn-block" data-a="ok" style="margin-bottom:10px;"></button>' +
        '<button type="button" class="btn btn-ghost btn-block" data-a="cancel"></button></div>';
      wrap.querySelector('h3').textContent = opts.title || 'Подтвердите';
      wrap.querySelector('p').textContent = opts.text || '';
      wrap.querySelector('[data-a="ok"]').textContent = opts.ok || 'Да';
      wrap.querySelector('[data-a="cancel"]').textContent = opts.cancel || 'Отмена';
      const done = result => { wrap.remove(); openConfirm = null; resolve(result); };
      wrap.addEventListener('click', e => {
        const a = e.target.closest('[data-a]');
        if (a) done(a.getAttribute('data-a') === 'ok');
        else if (e.target === wrap) done(false);
      });
      openConfirm = () => done(false);
      document.body.appendChild(wrap);
    });
  };

  // Закрыть то, что открыто поверх страницы. true — если что-то закрыли
  function closeTopLayer() {
    if (openConfirm) { openConfirm(); return true; }
    const modal = document.querySelector('.modal.open');
    if (modal) {
      if (typeof window.closeTariffModal === 'function' && modal.id === 'tariff-modal') window.closeTariffModal();
      else modal.classList.remove('open');
      return true;
    }
    const menu = document.querySelector('#mobile-menu.open');
    if (menu) { const t = document.querySelector('.nav-toggle'); if (t) t.click(); return true; }
    return false;
  }

  let busy = false;
  App.addListener('backButton', async function (ev) {
    if (closeTopLayer()) return; // открытое окно закрываем всегда, даже пока ждём ответа страницы
    if (busy) return;
    busy = true;
    try {
      if (typeof window.JB_onBack === 'function' && await window.JB_onBack()) return;
      if (ev && ev.canGoBack) window.history.back();
      else window.JB_minimize();
    } finally {
      busy = false;
    }
  });
})();
