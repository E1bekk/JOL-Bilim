// Нативные функции Android-приложения. На сайте этот файл ничего не делает.
//
// Кнопка «Назад» работает как в обычных приложениях:
//  1) сначала закрывает открытое окно (оплата, подтверждение, меню);
//  2) потом спрашивает страницу, что делать (window.JB_onBack — например, выйти из теста);
//  3) иначе возвращает на предыдущую страницу;
//  4) на главном экране приложение не закрывается от одного нажатия: появляется подсказка
//     «Нажми ещё раз, чтобы выйти», и только второе нажатие за 2 секунды сворачивает приложение.
(function () {
  if (!window.JB_IS_APP) return;

  // ===== Есть ли интернет =====
  // Внутри приложения WebView сам не знает, пропал ли интернет, поэтому спрашиваем Android
  // через плагин @capacitor/network и передаём ответ страницам как обычные события online/offline.
  const Net = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network;
  if (Net) {
    let online = null;
    try { Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online !== false }); } catch (e) {}
    const apply = connected => {
      const was = online;
      online = !!connected;
      if (was !== online && !(was === null && online)) window.dispatchEvent(new Event(online ? 'online' : 'offline'));
    };
    Net.getStatus().then(st => apply(st.connected)).catch(() => {});
    Net.addListener('networkStatusChange', st => apply(st.connected));
  }

  const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (!App) { console.warn('Плагин @capacitor/app не установлен — кнопка «Назад» работает по умолчанию'); return; }

  // Свернуть приложение (как «Домой»), не закрывая его
  window.JB_minimize = function () {
    if (typeof App.minimizeApp === 'function') App.minimizeApp();
  };

  // Двойное нажатие «Назад» для выхода с главного экрана
  let exitArmedUntil = 0;
  let toastEl = null;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.setAttribute('role', 'status');
      toastEl.style.cssText = 'position:fixed;left:50%;bottom:calc(110px + var(--sab, 0px));transform:translateX(-50%) translateY(10px);z-index:200;' +
        'padding:11px 18px;border-radius:14px;background:rgba(21,27,61,.96);border:1px solid rgba(148,163,255,.25);color:#eef0ff;' +
        'font:600 14px Manrope,system-ui,sans-serif;box-shadow:0 14px 40px -12px rgba(0,0,0,.8);opacity:0;transition:opacity .2s,transform .2s;' +
        'pointer-events:none;white-space:nowrap;max-width:calc(100% - 32px);';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    requestAnimationFrame(() => { toastEl.style.opacity = '1'; toastEl.style.transform = 'translateX(-50%) translateY(0)'; });
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => { toastEl.style.opacity = '0'; toastEl.style.transform = 'translateX(-50%) translateY(10px)'; }, 2000);
  }
  window.JB_backToExit = function () {
    if (Date.now() < exitArmedUntil) {
      exitArmedUntil = 0;
      window.JB_minimize();
    } else {
      exitArmedUntil = Date.now() + 2000;
      toast('Нажми «Назад» ещё раз, чтобы выйти');
    }
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
      else window.JB_backToExit();
    } finally {
      busy = false;
    }
  });
})();
