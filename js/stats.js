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

  // Сохраняем результат теста: в браузер сразу, в базу — в фоне
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

    if (user.familyCode && typeof db !== 'undefined') {
      try {
        const ref = db.collection('families').doc(user.familyCode);
        const snap = await ref.get();
        const patch = applyAttempt(snap.exists ? snap.data() : {}, att, item);
        await ref.set(patch, { merge: true });
        Object.assign(user, patch);
        localStorage.setItem('jolBilimUser', JSON.stringify(user));
      } catch (e) { console.error('Не удалось сохранить результат в базу:', e); }
    }
    return item;
  }

  window.JB = { SECTIONS, MAIN, SUBJECTS, keyFromName, dayKey, normalize, predict, summary, weakTopics, activity, hasPaidPlan, isSectionUsed, recordAttempt, scaled };
})();
