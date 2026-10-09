// Статистика ученика: разделы, темы, серия дней, прогноз балла ОРТ.
// Используется в тесте (запись результата), в кабинете ученика и у родителя.
(function () {
  const SECTIONS = {
    math:      { name: 'Математика', short: 'Математика', icon: 'calc', group: 'main', color: '#818cf8' },
    verbal:    { name: 'Аналогии и дополнение предложений', short: 'Аналогии и предложения', icon: 'link', group: 'main', color: '#a78bfa' },
    reading:   { name: 'Чтение и понимание', short: 'Чтение', icon: 'file', group: 'main', color: '#22d3ee' },
    grammar:   { name: 'Практическая грамматика', short: 'Грамматика', icon: 'pen', group: 'main', color: '#f472b6' },
    physics:   { name: 'Физика', short: 'Физика', icon: 'atom', group: 'subject', color: '#60a5fa' },
    chemistry: { name: 'Химия', short: 'Химия', icon: 'flask', group: 'subject', color: '#34d399' },
    biology:   { name: 'Биология', short: 'Биология', icon: 'leaf', group: 'subject', color: '#4ade80' },
    history:   { name: 'История', short: 'История', icon: 'landmark', group: 'subject', color: '#fbbf24' },
    english:   { name: 'Английский язык', short: 'Английский', icon: 'globe', group: 'subject', color: '#38bdf8' },
    kyrgyz:    { name: 'Кыргыз тили жана адабияты', short: 'Кыргыз тили', icon: 'chat', group: 'subject', color: '#fb7185' },
    russian:   { name: 'Русский язык и литература', short: 'Русский язык', icon: 'bookmark', group: 'subject', color: '#c084fc' },
    full:      { name: 'Пробный ОРТ', short: 'Пробный ОРТ', icon: 'cap', group: 'full', color: '#a5b4fc' }
  };
  const MAIN = ['math', 'verbal', 'reading', 'grammar'];
  const SUBJECTS = ['physics', 'chemistry', 'biology', 'history', 'english', 'kyrgyz', 'russian'];
  const WEIGHTS = { math: 0.4, verbal: 0.2, reading: 0.2, grammar: 0.2 };
  // старые названия из истории первых версий сайта
  const LEGACY = { 'Аналогии': 'verbal', 'Грамотность чтения': 'reading', 'Геометрия': 'math', 'Тест': null };

  function keyFromName(name) {
    if (!name) return null;
    if (SECTIONS[name]) return name;
    for (const k in SECTIONS) if (SECTIONS[k].name === name) return k;
    return LEGACY[name] !== undefined ? LEGACY[name] : null;
  }

  const pad = n => String(n).padStart(2, '0');
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // Приводим данные из базы к одному виду; для старых аккаунтов считаем статистику по истории
  function normalize(d) {
    d = d || {};
    const history = Array.isArray(d.history) ? d.history.slice() : [];
    let stats = d.stats && typeof d.stats === 'object' ? JSON.parse(JSON.stringify(d.stats)) : null;
    if (!stats) {
      stats = {};
      history.forEach(h => {
        const k = h && (h.key || keyFromName(h.subject));
        if (!k || k === 'full') return;
        const total = h.total || 10;
        const correct = h.correct != null ? h.correct : Math.max(0, Math.min(total, Math.round((h.score || 0) / 20)));
        stats[k] = stats[k] || { c: 0, t: 0 };
        stats[k].c += correct; stats[k].t += total;
      });
    }
    return {
      history,
      stats,
      topicStats: d.topicStats && typeof d.topicStats === 'object' ? JSON.parse(JSON.stringify(d.topicStats)) : {},
      days: d.days && typeof d.days === 'object' ? Object.assign({}, d.days) : {},
      testsCompleted: d.testsCompleted || history.length || 0,
      fullTrialUsed: !!d.fullTrialUsed
    };
  }

  function smoothAcc(s) { return (s.c + 2.5) / (s.t + 5); } // мягкая оценка, чтобы 1 ответ не давал 0% или 100%

  // Прогноз балла основного теста ОРТ (шкала до 245)
  function predict(stats) {
    const done = MAIN.filter(k => stats[k] && stats[k].t > 0);
    if (!done.length) return null;
    const avg = done.reduce((s, k) => s + smoothAcc(stats[k]), 0) / done.length;
    let w = 0;
    MAIN.forEach(k => { w += WEIGHTS[k] * (stats[k] && stats[k].t > 0 ? smoothAcc(stats[k]) : avg); });
    return Math.max(55, Math.min(245, Math.round(55 + 190 * w)));
  }
  const scaled = acc => Math.round(55 + 190 * acc);

  function streak(days) {
    let n = 0;
    const d = new Date();
    if (!days[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function summary(n) {
    let c = 0, t = 0;
    Object.values(n.stats).forEach(s => { c += s.c || 0; t += s.t || 0; });
    return {
      solved: t, correct: c,
      accuracy: t ? Math.round(c / t * 100) : null,
      streak: streak(n.days),
      predicted: predict(n.stats),
      tests: n.history.length || n.testsCompleted
    };
  }

  // Слабые темы: точность ниже 70%, минимум 2 ответа
  function weakTopics(topicStats, limit) {
    return Object.keys(topicStats).map(id => {
      const s = topicStats[id];
      const [key, topic] = id.split('::');
      return { id, key, topic, c: s.c, t: s.t, acc: Math.round(s.c / s.t * 100) };
    }).filter(x => x.t >= 2 && x.acc < 70 && SECTIONS[x.key])
      .sort((a, b) => a.acc - b.acc || b.t - a.t)
      .slice(0, limit || 5);
  }

  function activity(days, count) {
    const out = [];
    const d = new Date();
    d.setDate(d.getDate() - (count - 1));
    for (let i = 0; i < count; i++) {
      out.push({ key: dayKey(d), day: d.getDate(), wd: d.getDay(), n: days[dayKey(d)] || 0 });
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function hasPaidPlan(d) {
    return !!d && (d.plan === 'full' || d.plan === 'max') && d.planExpiresAt && d.planExpiresAt > Date.now();
  }
  function isSectionUsed(history, key) {
    const name = SECTIONS[key] && SECTIONS[key].name;
    return (history || []).some(h => h && (h.key === key || (!h.key && (h.subject === name || h.subject === key))));
  }

  function applyAttempt(d, att, item) {
    const n = normalize(d);
    att.answers.forEach(a => {
      const s = n.stats[a.section] = n.stats[a.section] || { c: 0, t: 0 };
      s.t++; if (a.correct) s.c++;
      if (a.topic) {
        const id = a.section + '::' + a.topic;
        const ts = n.topicStats[id] = n.topicStats[id] || { c: 0, t: 0 };
        ts.t++; if (a.correct) ts.c++;
      }
    });
    const today = dayKey();
    n.days[today] = (n.days[today] || 0) + att.answers.length;
    Object.keys(n.days).sort().slice(0, -90).forEach(k => delete n.days[k]);
    n.history = [item].concat(n.history).slice(0, 150);
    return {
      history: n.history, stats: n.stats, topicStats: n.topicStats, days: n.days,
      testsCompleted: (n.testsCompleted || 0) + 1,
      score: predict(n.stats) || item.score,
      fullTrialUsed: n.fullTrialUsed || att.key === 'full'
    };
  }

  // ===== Очередь отправки результатов =====
  // Результат теста сразу сохраняется в телефоне и попадает в очередь.
  // Очередь отправляется в базу, когда есть интернет; если связи нет — при следующем запуске
  // или когда интернет появится. Так результат не теряется, даже если тест пройден без сети.
  const QUEUE_KEY = 'jolBilimSyncQueue';
  function loadQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; } }
  function saveQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {} }
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  // Данные из базы + ещё не отправленные результаты (чтобы кабинет показывал всё сразу)
  function withPending(d, familyCode) {
    let out = d || {};
    const done = Array.isArray(out.syncedIds) ? out.syncedIds : [];
    loadQueue().forEach(job => {
      if (job.familyCode === familyCode && !done.includes(job.id)) out = Object.assign({}, out, applyAttempt(out, job.att, job.item));
    });
    return out;
  }
  function pendingCount() { return loadQueue().length; }

  let flushing = null;
  // Одна отправка за раз; повторный вызов во время отправки ждёт её окончания
  function flushQueue() {
    if (flushing) return flushing;
    flushing = doFlush().finally(() => { flushing = null; });
    return flushing;
  }
  async function doFlush() {
      let sent = 0, lastPatch = null, lastCode = null;
      try {
        if (typeof db === 'undefined' || navigator.onLine === false) return 0;
        let q = loadQueue();
        while (q.length) {
          const job = q[0];
          if (job.familyCode) {
            const ref = db.collection('families').doc(job.familyCode);
            const snap = await withTimeout(ref.get({ source: 'server' }), 12000);
            const data = snap.exists ? snap.data() : {};
            const synced = Array.isArray(data.syncedIds) ? data.syncedIds : [];
            if (!synced.includes(job.id)) { // защита от двойной отправки
              const patch = applyAttempt(data, job.att, job.item);
              patch.syncedIds = synced.concat(job.id).slice(-50);
              await withTimeout(ref.set(patch, { merge: true }), 12000);
              lastPatch = patch; lastCode = job.familyCode;
            }
          }
          q = loadQueue().filter(j => j.id !== job.id);
          saveQueue(q);
          sent++;
        }
        // всё отправлено — обновляем данные в телефоне тем, что теперь в базе
        if (lastPatch) {
          const user = JSON.parse(localStorage.getItem('jolBilimUser') || 'null');
          if (user && user.familyCode === lastCode) localStorage.setItem('jolBilimUser', JSON.stringify(Object.assign(user, lastPatch)));
        }
      } catch (e) {
        console.warn('Отправка результатов отложена до появления интернета:', e && e.message);
      }
      if (sent) document.dispatchEvent(new CustomEvent('jb:synced', { detail: { sent } }));
      return sent;
  }

  // Сохраняем результат теста: в телефон сразу, в базу — через очередь
  // att = { key, mode: 'section'|'topic'|'full', topicLabel, answers: [{ section, topic, correct }], extra }
  async function recordAttempt(att) {
    let user = null;
    try { user = JSON.parse(localStorage.getItem('jolBilimUser') || 'null'); } catch (e) {}
    if (!user) return null;
    const correct = att.answers.filter(a => a.correct).length;
    const total = att.answers.length;
    const now = new Date();
    const item = Object.assign({
      date: pad(now.getDate()) + '.' + pad(now.getMonth() + 1),
      ts: Date.now(),
      key: att.key,
      subject: SECTIONS[att.key] ? SECTIONS[att.key].name : att.key,
      mode: att.mode || 'section',
      correct, total,
      score: scaled(total ? correct / total : 0)
    }, att.topicLabel ? { topic: att.topicLabel } : {}, att.extra || {});

    const localPatch = applyAttempt(user, att, item);
    Object.assign(user, localPatch);
    localStorage.setItem('jolBilimUser', JSON.stringify(user));

    const q = loadQueue();
    q.push({
      id: item.ts.toString(36) + Math.random().toString(36).slice(2, 7),
      familyCode: user.familyCode || null,
      att: { key: att.key, mode: att.mode, answers: att.answers },
      item
    });
    saveQueue(q);
    flushQueue();
    document.dispatchEvent(new CustomEvent('jb:attempt', { detail: item })); // например, для напоминаний
    return item;
  }

  // Пробуем отправить очередь при запуске и как только появится интернет
  window.addEventListener('online', () => flushQueue());
  setTimeout(() => flushQueue(), 1500);

  window.JB = { SECTIONS, MAIN, SUBJECTS, keyFromName, dayKey, normalize, predict, summary, weakTopics, activity, hasPaidPlan, isSectionUsed, recordAttempt, scaled, flushQueue, withPending, pendingCount };
})();
