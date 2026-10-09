// Напоминания о занятиях — как будильники в «Часах»: несколько штук, точное время,
// повтор по дням недели (ежедневно / будни / выходные / свои дни / один раз), подпись,
// у каждого свой переключатель. Работает только в Android-приложении
// (плагин @capacitor/local-notifications); на сайте модуль ничего не делает.
//
// Как планируем: на 14 дней вперёд ставятся обычные одноразовые уведомления.
// Чтобы они приходили минута в минуту, нужно разрешение Android «Будильники и напоминания»
// (точные будильники). Без него Android вправе задержать уведомление до часа —
// поэтому в карточке есть кнопка «Включить точное время».
// План пересчитывается при каждом открытии/возврате в приложение и после каждого теста.
// «Умный режим»: если сегодня тест уже пройден, сегодняшние напоминания не приходят.
(function () {
  const LN = window.JB_IS_APP && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
  const AppP = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  const KEY = 'jolBilimReminders';
  const HORIZON = 14;                 // на сколько дней вперёд планируем
  const MAX_ALARMS = 6;
  const ID_MIN = 1000, ID_MAX = 2999; // диапазон id наших уведомлений
  const TEST_ID = 2999;
  const CHANNEL = 'jb_reminders';
  const ALL = [1, 2, 3, 4, 5, 6, 0];  // порядок дней для показа: Пн … Вс (числа как в Date.getDay)
  const SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const EVERY = ['по воскресеньям', 'по понедельникам', 'по вторникам', 'по средам', 'по четвергам', 'по пятницам', 'по субботам'];
  const ON_DAY = ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'];
  const MONTHS = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'нояб.', 'дек.'];

  const pad = v => String(v).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = n => (window.icon ? window.icon(n) : '');
  function plural(n, a, b, c) { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; }
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const newId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  // ---------- настройки ----------
  // { v:2, asked, smart, alarms: [{ id, hour, minute, days:[0..6], on, label, onceAt }] }
  function settings() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
    const s = { v: 2, asked: !!raw.asked, smart: raw.smart !== false, exactAsked: !!raw.exactAsked, alarms: [] };
    if (Array.isArray(raw.alarms)) {
      s.alarms = raw.alarms.filter(a => a && a.id).map(a => ({
        id: a.id, hour: +a.hour || 0, minute: +a.minute || 0,
        days: Array.isArray(a.days) ? a.days.filter(d => d >= 0 && d <= 6) : ALL.slice(),
        on: a.on !== false, label: a.label || '', onceAt: a.onceAt || null
      }));
    } else if (raw.enabled) {
      // старый формат (одно время на каждый день) → один будильник «Ежедневно»
      s.alarms = [{ id: newId(), hour: raw.hour != null ? raw.hour : 19, minute: raw.minute || 0, days: ALL.slice(), on: true, label: '', onceAt: null }];
    }
    return s;
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  // ближайший момент hh:mm (сегодня, если ещё не прошло, иначе завтра) — для «Один раз»
  function nextOnce(hour, minute, now) {
    now = now || new Date();
    const at = new Date(now); at.setHours(hour, minute, 0, 0);
    if (at <= now) at.setDate(at.getDate() + 1);
    return at.getTime();
  }

  function repeatText(days) {
    const d = (days || []).slice().sort();
    if (!d.length) return 'Один раз';
    if (d.length === 7) return 'Ежедневно';
    if (d.join() === '1,2,3,4,5') return 'По будням';
    if (d.join() === '0,6') return 'По выходным';
    if (d.length === 1) return EVERY[d[0]][0].toUpperCase() + EVERY[d[0]].slice(1);
    return ALL.filter(x => d.includes(x)).map(x => SHORT[x]).join(', ');
  }

  function whenText(at, now) {
    now = now || new Date();
    const t = pad(at.getHours()) + ':' + pad(at.getMinutes());
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    if (sameDay(at, now)) return 'сегодня в ' + t;
    if (sameDay(at, tomorrow)) return 'завтра в ' + t;
    if (at - now < 6.5 * 864e5) return ON_DAY[at.getDay()] + ' в ' + t;
    return at.getDate() + ' ' + MONTHS[at.getMonth()] + ' в ' + t;
  }

  // ---------- данные ученика ----------
  function progress() {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('jolBilimUser') || 'null'); } catch (e) {}
    const n = window.JB ? JB.normalize(user || {}) : { days: {} };
    const sum = window.JB ? JB.summary(n) : { streak: 0 };
    return { streak: sum.streak || 0, doneToday: !!(window.JB && n.days[JB.dayKey()]) };
  }

  // ---------- план уведомлений ----------
  function plan(s, now, p) {
    now = now || new Date();
    p = p || progress();
    const out = [];
    s.alarms.forEach((a, ai) => {
      if (!a.on) return;
      if (!a.days.length) {                       // «Один раз»
        if (!a.onceAt || a.onceAt <= now.getTime()) return;
        const at = new Date(a.onceAt);
        if (s.smart && p.doneToday && sameDay(at, now)) return;
        out.push({ alarm: a, ai, at, offset: sameDay(at, now) ? 0 : 1 });
        return;
      }
      for (let d = 0; d < HORIZON; d++) {
        const at = new Date(now); at.setDate(now.getDate() + d); at.setHours(a.hour, a.minute, 0, 0);
        if (!a.days.includes(at.getDay()) || at <= now) continue;
        if (d === 0 && s.smart && p.doneToday) continue; // сегодня уже занимался
        out.push({ alarm: a, ai, at, offset: d });
      }
    });
    return out.sort((x, y) => x.at - y.at);
  }

  const POOL = [
    { title: '💪 Не теряй темп', body: 'Пройди один тест сегодня — JOL-Bilim покажет, где ты теряешь баллы.' },
    { title: '🎯 15 минут на ОРТ', body: 'Короткая тренировка сегодня — плюс к баллу на экзамене.' },
    { title: '📈 Прогноз ждёт обновления', body: 'Реши 10 заданий, и прогноз балла станет точнее.' },
    { title: '🧠 Разомни мозг', body: 'Одна тема из «Над чем поработать» — и ты на шаг ближе к цели.' },
    { title: '👋 Возвращайся к подготовке', body: 'ОРТ ближе, чем кажется. Начни с короткого теста на 10 заданий.' }
  ];
  function message(item, k, p) {
    let m;
    const streakAlive = item.offset === 0 || (item.offset === 1 && p.doneToday);
    if (k === 0 && p.streak > 0 && streakAlive) {
      m = { title: `🔥 Серия ${p.streak} ${plural(p.streak, 'день', 'дня', 'дней')} подряд`, body: 'Не прерывай её: 10 заданий займут 15 минут.' };
    } else if (k === 0) {
      m = { title: '📚 Время для ОРТ', body: '10 заданий за 15 минут — и прогноз балла станет точнее.' };
    } else {
      m = POOL[(k - 1 + item.at.getDate()) % POOL.length];
    }
    return item.alarm.label ? { title: '⏰ ' + item.alarm.label, body: m.body } : m;
  }

  async function cancelAll() {
    try {
      const res = await LN.getPending();
      const ids = ((res && res.notifications) || []).map(n => +n.id).filter(id => id >= ID_MIN && id <= ID_MAX && id !== TEST_ID);
      if (ids.length) await LN.cancel({ notifications: ids.map(id => ({ id })) });
    } catch (e) {
      // запасной путь: отменяем весь наш диапазон
      const ids = [1001, 1002, 1003];
      for (let i = 0; i < MAX_ALARMS; i++) for (let d = 0; d < HORIZON; d++) ids.push(2000 + i * 20 + d);
      try { await LN.cancel({ notifications: ids.map(id => ({ id })) }); } catch (e2) {}
    }
  }

  async function permission() {
    if (!LN) return 'unavailable';
    try { return (await LN.checkPermissions()).display; } catch (e) { return 'unavailable'; }
  }
  // разрешение на точные будильники (Android 12+). 'granted' | 'denied'
  async function exactPermission() {
    if (!LN || typeof LN.checkExactNotificationSetting !== 'function') return 'granted';
    try { return (await LN.checkExactNotificationSetting()).exact_alarm || 'denied'; } catch (e) { return 'granted'; }
  }
  // открывает системный экран «Будильники и напоминания»
  async function requestExact() {
    if (!LN || typeof LN.changeExactNotificationSetting !== 'function') return true;
    let st = 'denied';
    try { st = (await LN.changeExactNotificationSetting()).exact_alarm; } catch (e) {}
    await refresh();
    return st === 'granted';
  }
  // свой канал с высокой важностью: уведомление всплывает сверху, со звуком и вибрацией
  let channelReady = null;
  function ensureChannel() {
    if (!channelReady) channelReady = Promise.resolve(LN.createChannel && LN.createChannel({
      id: CHANNEL, name: 'Напоминания о занятиях', description: 'Напоминания, которые ты настроил в профиле',
      importance: 4, visibility: 1, vibration: true
    })).catch(() => {});
    return channelReady;
  }

  async function ensurePermission() {
    if (!LN) return false;
    let p = await permission();
    if (p !== 'granted') { try { p = (await LN.requestPermissions()).display; } catch (e) {} }
    return p === 'granted';
  }

  const changed = () => document.dispatchEvent(new CustomEvent('jb:reminders'));

  let running = Promise.resolve();
  function refresh() { running = running.then(doRefresh, doRefresh); return running; }
  async function doRefresh() {
    if (!LN) return;
    const s = settings();
    const now = new Date();
    // «Один раз», время которого прошло, — выключаем, как будильник на iPhone
    let dirty = false;
    s.alarms.forEach(a => { if (a.on && !a.days.length && (!a.onceAt || a.onceAt <= now.getTime())) { a.on = false; dirty = true; } });
    if (dirty) save(s);
    await cancelAll();
    try {
      if ((await permission()) === 'granted') {
        await ensureChannel();
        // точный будильник просим только если он уже разрешён — иначе плагин сам
        // открывал бы экран настроек при каждом открытии приложения
        const exact = (await exactPermission()) === 'granted';
        const p = progress();
        const items = plan(s, now, p);
        const notifications = items.map((it, k) => {
          const m = message(it, k, p);
          return {
            id: 2000 + it.ai * 20 + it.offset, title: m.title, body: m.body,
            schedule: { at: it.at, allowWhileIdle: true },
            isExactNotification: exact,
            channelId: CHANNEL,
            smallIcon: 'ic_stat_jb', iconColor: '#6366F1',
            extra: { alarmId: it.alarm.id }
          };
        });
        if (notifications.length) await LN.schedule({ notifications });
      }
    } catch (e) { console.error('Не удалось запланировать напоминания:', e); }
    changed();
  }

  // ---------- изменения ----------
  async function upsert(alarm) {
    const s = settings();
    alarm.days = alarm.days.slice().sort();
    alarm.onceAt = alarm.days.length ? null : nextOnce(alarm.hour, alarm.minute);
    const i = s.alarms.findIndex(a => a.id === alarm.id);
    if (i >= 0) s.alarms[i] = alarm; else s.alarms.push(alarm);
    s.alarms.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
    s.asked = true;
    save(s);
    const allowed = await ensurePermission();
    if (allowed && (await exactPermission()) !== 'granted' && !settings().exactAsked) {
      const s2 = settings(); s2.exactAsked = true; save(s2);
      const ok = window.JB_confirm ? await JB_confirm({
        title: 'Точное время',
        text: 'Чтобы напоминание приходило минута в минуту, разреши JOL-Bilim «Будильники и напоминания». Сейчас откроются настройки — включи переключатель и вернись назад.',
        ok: 'Открыть настройки', cancel: 'Позже'
      }) : false;
      if (ok) return void (await requestExact());
    }
    await refresh();
  }
  async function remove(id) { const s = settings(); s.alarms = s.alarms.filter(a => a.id !== id); save(s); await refresh(); }
  async function toggle(id, on) {
    const s = settings(); const a = s.alarms.find(x => x.id === id); if (!a) return;
    a.on = !!on;
    if (on && !a.days.length) a.onceAt = nextOnce(a.hour, a.minute);
    save(s);
    if (on) await ensurePermission();
    await refresh();
  }
  async function setSmart(on) { const s = settings(); s.smart = !!on; save(s); await refresh(); }
  function dismissAsk() { const s = settings(); s.asked = true; save(s); changed(); }

  // пробное уведомление через 5 секунд
  async function test() {
    if (!(await ensurePermission())) return false;
    await ensureChannel();
    await LN.schedule({ notifications: [{
      id: TEST_ID, title: '🔔 Проверка напоминаний', body: 'Так будут выглядеть напоминания JOL-Bilim.',
      schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
      isExactNotification: false, channelId: CHANNEL, smallIcon: 'ic_stat_jb', iconColor: '#6366F1'
    }] });
    return true;
  }

  // сводка для карточки
  function info() {
    const s = settings(), now = new Date(), p = progress();
    const items = plan(s, now, p);
    const active = s.alarms.filter(a => a.on);
    // есть ли сегодня напоминания, пропущенные умным режимом
    const skippedToday = s.smart && p.doneToday && active.some(a => {
      const at = new Date(now); at.setHours(a.hour, a.minute, 0, 0);
      return at > now && (a.days.length ? a.days.includes(now.getDay()) : (a.onceAt && sameDay(new Date(a.onceAt), now)));
    });
    return { next: items[0] ? { at: items[0].at, text: whenText(items[0].at, now), alarm: items[0].alarm } : null, active: active.length, skippedToday };
  }

  // =====================================================================
  // Редактор будильника: нижняя шторка с барабаном времени (как в «Часах»)
  // =====================================================================
  const ITEM_H = 44, COPIES = 5;
  function Wheel(count, value, label) {
    const col = document.createElement('div');
    col.className = 'wheel-col';
    col.tabIndex = 0;
    col.setAttribute('role', 'spinbutton');
    col.setAttribute('aria-label', label);
    col.setAttribute('aria-valuemin', '0');
    col.setAttribute('aria-valuemax', String(count - 1));
    let html = '<div class="wheel-pad"></div>';
    for (let c = 0; c < COPIES; c++) for (let i = 0; i < count; i++) html += `<div class="wheel-item" data-i="${c * count + i}">${pad(i)}</div>`;
    col.innerHTML = html + '<div class="wheel-pad"></div>';
    const items = col.querySelectorAll('.wheel-item');
    const mid = Math.floor(COPIES / 2) * count;
    let val = value, timer = 0, onChange = () => {}, selEl = null;

    const idx = () => Math.round(col.scrollTop / ITEM_H);
    function mark() {
      const i = Math.max(0, Math.min(items.length - 1, idx()));
      if (selEl !== items[i]) { if (selEl) selEl.classList.remove('sel'); selEl = items[i]; selEl.classList.add('sel'); }
      const v = i % count;
      if (v !== val) { val = v; col.setAttribute('aria-valuenow', String(v)); col.setAttribute('aria-valuetext', pad(v)); onChange(v); }
    }
    function jump(v) { col.scrollTop = (mid + v) * ITEM_H; mark(); }
    // после остановки прокрутки возвращаемся в среднюю копию — барабан «бесконечный»
    function settle() {
      const i = idx();
      if (i < count || i >= items.length - count) jump(i % count);
    }
    col.addEventListener('scroll', () => {
      requestAnimationFrame(mark);
      clearTimeout(timer); timer = setTimeout(settle, 160);
    }, { passive: true });
    col.addEventListener('click', e => {
      const it = e.target.closest('.wheel-item');
      if (it) col.scrollTo({ top: +it.dataset.i * ITEM_H, behavior: 'smooth' });
    });
    col.addEventListener('keydown', e => {
      const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      col.scrollTo({ top: (idx() + step) * ITEM_H, behavior: 'smooth' });
    });
    return {
      el: col,
      get value() { return val; },
      set(v) { val = -1; jump(v); },
      onChange(fn) { onChange = fn; }
    };
  }

  let sheet = null, draft = null, editingId = null, hWheel = null, mWheel = null;

  function buildSheet() {
    sheet = document.createElement('div');
    sheet.className = 'modal sheet';
    sheet.id = 'rem-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'rem-sheet-title');
    sheet.innerHTML = `
      <div class="modal-card rem-sheet">
        <div class="sheet-grip"></div>
        <div class="sheet-head">
          <button type="button" class="sheet-link" data-sh="cancel">Отмена</button>
          <h3 id="rem-sheet-title">Напоминание</h3>
          <button type="button" class="sheet-link strong" data-sh="save">Готово</button>
        </div>
        <div class="wheel">
          <div class="wheel-band"></div>
          <div class="wheel-cols"><span class="wheel-slot" data-w="h"></span><span class="wheel-sep">:</span><span class="wheel-slot" data-w="m"></span></div>
        </div>
        <div class="sheet-sec">
          <div class="sheet-label">Повтор</div>
          <div class="rep-presets">
            <button type="button" class="chip" data-preset="all">Ежедневно</button>
            <button type="button" class="chip" data-preset="work">Будни</button>
            <button type="button" class="chip" data-preset="weekend">Выходные</button>
            <button type="button" class="chip" data-preset="once">Один раз</button>
          </div>
          <div class="rep-days">${ALL.map(d => `<button type="button" class="day-dot" data-day="${d}" aria-pressed="false">${SHORT[d]}</button>`).join('')}</div>
          <div class="rep-summary" aria-live="polite"></div>
        </div>
        <div class="sheet-sec">
          <label class="sheet-label" for="rem-label">Подпись</label>
          <input id="rem-label" class="input" maxlength="30" placeholder="Например: Математика" autocomplete="off">
        </div>
        <button type="button" class="btn btn-primary btn-block" data-sh="save" style="margin-top:18px;">Сохранить</button>
        <button type="button" class="btn btn-block sheet-delete" data-sh="delete">Удалить напоминание</button>
      </div>`;
    document.body.appendChild(sheet);

    hWheel = Wheel(24, 19, 'Часы');
    mWheel = Wheel(60, 0, 'Минуты');
    sheet.querySelector('[data-w="h"]').appendChild(hWheel.el);
    sheet.querySelector('[data-w="m"]').appendChild(mWheel.el);
    hWheel.onChange(v => { draft.hour = v; paintRepeat(); });
    mWheel.onChange(v => { draft.minute = v; paintRepeat(); });

    sheet.addEventListener('click', async e => {
      if (e.target === sheet) return close();
      const presetBtn = e.target.closest('[data-preset]');
      if (presetBtn) {
        const p = presetBtn.dataset.preset;
        draft.days = p === 'all' ? ALL.slice() : p === 'work' ? [1, 2, 3, 4, 5] : p === 'weekend' ? [6, 0] : [];
        return paintRepeat();
      }
      const dayBtn = e.target.closest('[data-day]');
      if (dayBtn) {
        const d = +dayBtn.dataset.day;
        draft.days = draft.days.includes(d) ? draft.days.filter(x => x !== d) : draft.days.concat(d);
        return paintRepeat();
      }
      const a = e.target.closest('[data-sh]');
      if (!a) return;
      const act = a.dataset.sh;
      if (act === 'cancel') close();
      else if (act === 'save') {
        draft.label = sheet.querySelector('#rem-label').value.trim().slice(0, 30);
        const alarm = Object.assign({}, draft, { on: true });
        close();
        await upsert(alarm);
      } else if (act === 'delete') {
        const ok = window.JB_confirm ? await JB_confirm({ title: 'Удалить напоминание?', text: `${pad(draft.hour)}:${pad(draft.minute)} · ${repeatText(draft.days)}`, ok: 'Удалить', cancel: 'Отмена' }) : true;
        if (!ok) return;
        close();
        await remove(editingId);
      }
    });
    sheet.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    // закрытие кнопкой «Назад» (native.js снимает класс open) — возвращаем прокрутку страницы
    new MutationObserver(() => { if (!sheet.classList.contains('open')) document.documentElement.classList.remove('sheet-lock'); })
      .observe(sheet, { attributes: true, attributeFilter: ['class'] });
  }

  function paintRepeat() {
    const days = draft.days;
    sheet.querySelectorAll('[data-day]').forEach(b => {
      const on = days.includes(+b.dataset.day);
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    const key = days.slice().sort().join();
    const preset = !days.length ? 'once' : days.length === 7 ? 'all' : key === '1,2,3,4,5' ? 'work' : key === '0,6' ? 'weekend' : '';
    sheet.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('active', b.dataset.preset === preset));
    const t = pad(draft.hour) + ':' + pad(draft.minute);
    sheet.querySelector('.rep-summary').textContent = days.length
      ? `${repeatText(days)} в ${t}`
      : `Один раз — ${whenText(new Date(nextOnce(draft.hour, draft.minute)))}, потом выключится`;
  }

  function open(id) {
    if (!sheet) buildSheet();
    const s = settings();
    const found = id ? s.alarms.find(a => a.id === id) : null;
    editingId = found ? found.id : null;
    draft = found ? Object.assign({}, found, { days: found.days.slice() })
      : { id: newId(), hour: 19, minute: 0, days: ALL.slice(), on: true, label: '', onceAt: null };
    sheet.querySelector('#rem-sheet-title').textContent = found ? 'Изменить' : 'Новое напоминание';
    sheet.querySelector('#rem-label').value = draft.label || '';
    sheet.querySelector('.sheet-delete').style.display = found ? '' : 'none';
    sheet.classList.add('open');
    document.documentElement.classList.add('sheet-lock');
    paintRepeat();
    // барабаны можно прокрутить только когда шторка видна
    requestAnimationFrame(() => { hWheel.set(draft.hour); mWheel.set(draft.minute); hWheel.el.focus({ preventScroll: true }); });
  }
  function close() { if (sheet) sheet.classList.remove('open'); document.documentElement.classList.remove('sheet-lock'); }

  // =====================================================================
  window.JB_reminders = {
    available: !!LN, max: MAX_ALARMS,
    settings, info, repeatText, permission, ensurePermission, exactPermission, requestExact,
    refresh, toggle, setSmart, remove, dismissAsk, test,
    openEditor: id => { if (LN) open(id); }
  };

  if (LN) {
    // нажали на уведомление — открываем тренировку
    LN.addListener('localNotificationActionPerformed', () => {
      if (/dashboard\.html/.test(location.pathname)) location.hash = 'train';
      else if (!/test\.html/.test(location.pathname)) location.href = 'dashboard.html#train';
    });
    document.addEventListener('jb:attempt', () => refresh()); // прошёл тест — пересчитываем
    if (AppP) AppP.addListener('resume', () => refresh());    // вернулись в приложение
    setTimeout(refresh, 1200);
  }
})();
