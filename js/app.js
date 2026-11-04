/*
 * SAT Climb: a no-build, single-page practice app.
 * Views are rendered from the hash route (#/dashboard, #/practice, ...). All progress is
 * kept in localStorage under STORE_KEY, so nothing leaves the student's browser.
 */
(function () {
  'use strict';

  const SKILLS = window.SAT_SKILLS;
  const QUESTIONS = window.SAT_QUESTIONS;
  const DOMAINS = [...new Set(SKILLS.map((s) => s.domain))];
  const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
  const qById = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  const LETTERS = ['A', 'B', 'C', 'D'];
  const DIFF = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
  const STORE_KEY = 'satclimb.v1';
  const GOAL_BONUS = 25;
  const TEST_BONUS = 50;
  const PERFECT_BONUS = 30;
  const LEVEL_TITLES = ['Rookie', 'Reader', 'Scholar', 'Analyst', 'Wordsmith', 'Strategist', 'Expert', 'Master', 'Legend'];
  // Questions per module on the digital SAT Reading and Writing section, split by domain.
  const MODULE_PLAN = { 'Craft and Structure': 7, 'Information and Ideas': 7, 'Standard English Conventions': 7, 'Expression of Ideas': 6 };
  const MODULE_SECONDS = 32 * 60;
  const W_MIXED = { 1: 1, 2: 1, 3: 1 };
  const W_HARDER = { 1: 0.15, 2: 1, 3: 2 };
  const W_EASIER = { 1: 2, 2: 1, 3: 0.15 };

  const view = document.getElementById('view');

  // ------------------------------------------------------------------ state
  function defaultState() {
    return {
      xp: 0,
      dailyGoal: 15,
      attempts: {}, // qid -> {seen, right, last, lastChoice, at}
      days: {}, // YYYY-MM-DD -> day record
      badges: {}, // badge id -> ISO date earned
      bestStreak: 0,
      plan: { testDate: '', target: 650, minutes: 30 },
      tests: [], // newest first
      stats: { perfectSets: 0, hardCorrect: 0, sessions: 0 },
    };
  }
  function load() {
    const base = defaultState();
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        return Object.assign(base, s, {
          plan: Object.assign(base.plan, s.plan || {}),
          stats: Object.assign(base.stats, s.stats || {}),
        });
      }
    } catch (e) { /* storage unavailable: start fresh */ }
    return base;
  }
  let state = load();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  // ------------------------------------------------------------------ helpers
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function inline(s) { return esc(s).replace(/_{4,}/g, '<span class="blank" aria-label="blank"></span>'); }
  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
    return b;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function dateKey(d) {
    d = d || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function emptyDay() { return { answered: 0, correct: 0, xp: 0, goalMet: false, skills: {}, done: {} }; }
  function dayRec(k) { return state.days[k] || emptyDay(); }
  function today() {
    const k = dateKey();
    if (!state.days[k]) state.days[k] = emptyDay();
    return state.days[k];
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function parseQuery(s) {
    const out = {};
    (s || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); out[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return out;
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  }
  function round10(n) { return Math.round(n / 10) * 10; }
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
  }

  // ------------------------------------------------------------------ progress
  function levelInfo(xp) {
    let L = 1;
    while (xp >= 50 * (L + 1) * L) L++;
    const base = 50 * L * (L - 1), next = 50 * (L + 1) * L;
    return { level: L, into: xp - base, span: next - base, title: LEVEL_TITLES[Math.min(L - 1, LEVEL_TITLES.length - 1)] };
  }
  function currentStreak() {
    let d = new Date(), n = 0;
    if (!dayRec(dateKey(d)).goalMet) d = addDays(d, -1);
    while (dayRec(dateKey(d)).goalMet) { n++; d = addDays(d, -1); }
    return n;
  }
  function totalAnswered() { return Object.values(state.attempts).reduce((n, a) => n + a.seen, 0); }
  function totalRight() { return Object.values(state.attempts).reduce((n, a) => n + a.right, 0); }
  function skillStats(id) {
    const qs = QUESTIONS.filter((q) => q.skill === id);
    let tried = 0, mastered = 0, seen = 0, right = 0;
    qs.forEach((q) => {
      const a = state.attempts[q.id];
      if (!a) return;
      tried++; seen += a.seen; right += a.right;
      if (a.last) mastered++;
    });
    return { total: qs.length, tried, mastered, mastery: mastered / qs.length, accuracy: seen ? right / seen : null };
  }
  // Least-practised and least-accurate skills first; untried skills keep their natural order.
  function weakestSkills(n) {
    return SKILLS.map((s, i) => {
      const st = skillStats(s.id);
      const score = st.tried === 0 ? -1 + i * 0.001 : 0.5 * st.mastery + 0.5 * st.accuracy;
      return { id: s.id, score };
    }).sort((a, b) => a.score - b.score).slice(0, n).map((x) => x.id);
  }

  // Returns any celebration events (level-up) so callers can show them together.
  function grantXP(n) {
    const before = levelInfo(state.xp).level;
    state.xp += n;
    today().xp += n;
    const after = levelInfo(state.xp).level;
    return after > before ? [{ type: 'level', level: after }] : [];
  }
  function recordAnswer(q, choice) {
    const correct = choice === q.answer;
    const a = state.attempts[q.id] || (state.attempts[q.id] = { seen: 0, right: 0, last: null, lastChoice: null, at: 0 });
    a.seen++; if (correct) a.right++;
    a.last = correct; a.lastChoice = choice; a.at = Date.now();
    const day = today();
    day.answered++; if (correct) day.correct++;
    day.skills[q.skill] = (day.skills[q.skill] || 0) + 1;
    if (correct && q.difficulty === 3) state.stats.hardCorrect++;
    let gained = correct ? 10 + 5 * (q.difficulty - 1) : 2;
    const events = [];
    if (!day.goalMet && day.answered >= state.dailyGoal) {
      day.goalMet = true;
      gained += GOAL_BONUS;
      const s = currentStreak();
      state.bestStreak = Math.max(state.bestStreak, s);
      events.push({ type: 'goal', streak: s });
    }
    events.push(...grantXP(gained));
    save();
    return { correct, gained, events };
  }
  function celebrate(events) {
    events.forEach((e) => {
      if (e.type === 'goal') toast(`🎯 Daily goal complete! +${GOAL_BONUS} XP · 🔥 ${e.streak}-day streak`, 'flame');
      if (e.type === 'level') toast(`⬆️ Level up! You're now level ${e.level}: ${levelInfo(state.xp).title}`, 'gold');
    });
    checkBadges();
    renderSidebar();
  }

  const BADGES = [
    { id: 'first', icon: '🌱', name: 'First Step', desc: 'Answer your first question.', test: () => totalAnswered() >= 1 },
    { id: 'goal1', icon: '🎯', name: 'Goal Getter', desc: 'Hit your daily goal for the first time.', test: () => Object.values(state.days).some((d) => d.goalMet) },
    { id: 'streak3', icon: '🔥', name: 'On Fire', desc: 'Reach a 3-day streak.', test: () => state.bestStreak >= 3 },
    { id: 'streak7', icon: '📅', name: 'Week Warrior', desc: 'Reach a 7-day streak.', test: () => state.bestStreak >= 7 },
    { id: 'streak30', icon: '🏔️', name: 'Summit', desc: 'Reach a 30-day streak.', test: () => state.bestStreak >= 30 },
    { id: 'perfect', icon: '💯', name: 'Flawless', desc: 'Finish a practice set of 10+ questions with no misses.', test: () => state.stats.perfectSets >= 1 },
    { id: 'hard10', icon: '🧠', name: 'Big Brain', desc: 'Answer 10 hard questions correctly.', test: () => state.stats.hardCorrect >= 10 },
    { id: 'q50', icon: '📚', name: 'Bookworm', desc: 'Answer 50 questions.', test: () => totalAnswered() >= 50 },
    { id: 'q250', icon: '🏆', name: 'Marathoner', desc: 'Answer 250 questions.', test: () => totalAnswered() >= 250 },
    { id: 'explorer', icon: '🧭', name: 'Explorer', desc: 'Try every skill at least once.', test: () => SKILLS.every((s) => skillStats(s.id).tried > 0) },
    { id: 'master', icon: '⭐', name: 'Skill Master', desc: 'Reach 80% mastery in any skill.', test: () => SKILLS.some((s) => skillStats(s.id).mastery >= 0.8) },
    { id: 'test1', icon: '⏱️', name: 'Test Day Ready', desc: 'Finish a timed practice module.', test: () => state.tests.length >= 1 },
    { id: 'planner', icon: '🗺️', name: 'Planner', desc: 'Set your test date in the study plan.', test: () => !!state.plan.testDate },
  ];
  function checkBadges() {
    BADGES.forEach((b) => {
      if (!state.badges[b.id] && b.test()) {
        state.badges[b.id] = dateKey();
        toast(`${b.icon} Badge unlocked: ${b.name}`, 'gold');
      }
    });
    save();
  }

  function toast(msg, kind) {
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    const box = document.getElementById('toasts');
    box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => el.remove(), 4000);
  }

  // ------------------------------------------------------------------ plan
  function weeklyPlan() {
    const f = weakestSkills(3);
    const left = daysUntil(state.plan.testDate);
    const crunch = left !== null && left >= 0 && left <= 14;
    const drill = (id) => ({ key: 'drill_' + id, label: `Drill: ${skillById[id].name}`, href: `#/practice?skill=${id}&start=1` });
    return [
      drill(f[0]),
      drill(f[1]),
      crunch ? { key: 'test', label: 'Full timed section', href: '#/test' } : { key: 'mixed', label: 'Mixed practice (all skills)', href: '#/practice?start=1' },
      drill(f[2]),
      drill(f[0]),
      { key: 'test', label: 'Timed module (32 min)', href: '#/test' },
      { key: 'review', label: 'Review missed questions', href: '#/practice?filter=missed&start=1' },
    ]; // Monday first
  }
  function todaysTasks() {
    const day = dayRec(dateKey());
    const planItem = weeklyPlan()[(new Date().getDay() + 6) % 7];
    return [
      { label: `Answer ${state.dailyGoal} questions (${Math.min(day.answered, state.dailyGoal)}/${state.dailyGoal})`, done: day.answered >= state.dailyGoal, href: '#/practice?start=1' },
      { label: planItem.label, done: !!day.done[planItem.key], href: planItem.href },
    ];
  }

  // ------------------------------------------------------------------ rendering bits
  function formatPassage(text) {
    return text.trim().split(/\n\s*\n/).map((block) => {
      const t = block.trim();
      const lines = t.split('\n');
      if (lines.every((l) => l.trim().startsWith('•'))) {
        return '<ul class="notes">' + lines.map((l) => `<li>${inline(l.replace(/^\s*•\s*/, ''))}</li>`).join('') + '</ul>';
      }
      if (/^Text [12]$/.test(t)) return `<p class="text-label">${esc(t)}</p>`;
      return `<p>${inline(t)}</p>`;
    }).join('');
  }
  function tableHtml(t) {
    return `<table class="data"><caption>${esc(t.title)}</caption><thead><tr>${t.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>` +
      `<tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function diffHtml(d) {
    return `<span class="diff d${d}"><span class="dots">${'●'.repeat(d)}${'○'.repeat(3 - d)}</span> ${DIFF[d]}</span>`;
  }
  // opts: selected (index|null), reveal (bool), eliminated (Set), meta (bool)
  function questionHtml(q, opts) {
    opts = opts || {};
    const elim = opts.eliminated || new Set();
    const choices = q.choices.map((c, i) => {
      let cls = 'choice';
      if (opts.selected === i) cls += ' selected';
      if (opts.reveal) {
        if (i === q.answer) cls += ' correct';
        else if (opts.selected === i) cls += ' wrong';
      } else if (elim.has(i)) cls += ' struck';
      const strike = opts.reveal ? '' :
        `<button class="strike" data-strike="${i}" title="${elim.has(i) ? 'Undo' : 'Cross out'} choice ${LETTERS[i]}" aria-label="${elim.has(i) ? 'Undo cross out' : 'Cross out'} choice ${LETTERS[i]}">${elim.has(i) ? '↺' : '⊘'}</button>`;
      return `<div class="choice-row"><button class="${cls}" data-choice="${i}" ${opts.reveal ? 'disabled' : ''} aria-pressed="${opts.selected === i}">` +
        `<span class="letter">${LETTERS[i]}</span><span class="ctext">${inline(c)}</span></button>${strike}</div>`;
    }).join('');
    const meta = opts.meta === false ? '' :
      `<div class="qmeta"><span class="tag">${esc(skillById[q.skill].name)}</span>${diffHtml(q.difficulty)}</div>`;
    return `<div class="qwrap">
      <section class="passage-pane">${q.table ? tableHtml(q.table) : ''}${formatPassage(q.passage)}</section>
      <section class="question-pane">${meta}<p class="stem">${esc(q.question)}</p><div class="choices">${choices}</div></section>
    </div>`;
  }
  function ringSvg(frac, label) {
    const r = 26, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 64 64" role="img" aria-label="${esc(label)}"><circle class="track" cx="32" cy="32" r="${r}"/>` +
      `<circle class="prog" cx="32" cy="32" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, frac))}"/>` +
      `<text x="32" y="33">${Math.round(Math.min(1, frac) * 100)}%</text></svg>`;
  }

  function renderSidebar() {
    const streak = currentStreak();
    const lv = levelInfo(state.xp);
    document.getElementById('sidebar-stats').innerHTML =
      `<div class="mini-stat" title="Day streak">🔥 ${streak} day${streak === 1 ? '' : 's'}</div>` +
      `<div class="mini-stat" title="Level">⭐ Lv ${lv.level} · ${state.xp} XP</div>`;
  }

  // ------------------------------------------------------------------ dashboard
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }
  function renderDashboard() {
    const day = dayRec(dateKey());
    const goal = state.dailyGoal;
    const streak = currentStreak();
    const lv = levelInfo(state.xp);
    const total = totalAnswered();
    const acc = total ? Math.round((totalRight() / total) * 100) : 0;
    const left = daysUntil(state.plan.testDate);
    const focus = weakestSkills(1)[0];

    let streakMsg;
    if (day.goalMet) streakMsg = `🔥 Goal done for today. Your ${streak}-day streak is safe!`;
    else if (streak > 0) streakMsg = `🔥 Answer ${goal - day.answered} more question${goal - day.answered === 1 ? '' : 's'} today to keep your ${streak}-day streak alive.`;
    else streakMsg = `🌱 Answer ${goal - day.answered} more question${goal - day.answered === 1 ? '' : 's'} today to start a streak.`;

    const countdown = left !== null && left >= 0
      ? `<div class="card countdown"><div class="stat-num">${left}</div><div class="stat-label">day${left === 1 ? '' : 's'} until test day</div></div>`
      : `<a class="btn" href="#/planner">🗓️ Set your test date</a>`;

    const tasks = todaysTasks().map((t) => `<li class="task ${t.done ? 'done' : ''}"><span class="check">${t.done ? '✓' : ''}</span>` +
      `<span class="task-label">${esc(t.label)}</span>${t.done ? '' : `<a class="btn small" href="${t.href}">Start</a>`}</li>`).join('');

    let heat = '';
    for (let i = 27; i >= 0; i--) {
      const d = addDays(new Date(), -i);
      const rec = dayRec(dateKey(d));
      const lvl = rec.answered === 0 ? 0 : rec.goalMet ? 3 : rec.answered >= goal / 2 ? 2 : 1;
      heat += `<span class="h${lvl} ${i === 0 ? 'today' : ''}" title="${d.toLocaleDateString()}: ${rec.answered} answered"></span>`;
    }

    const earned = BADGES.filter((b) => state.badges[b.id]);
    const badges = earned.length
      ? `<div class="badge-row">${earned.slice(-6).map((b) => `<span class="badge-chip">${b.icon} ${esc(b.name)}</span>`).join('')}</div>`
      : `<p class="muted small">No badges yet. Answer your first question to earn one.</p>`;

    const mastery = DOMAINS.map((dom) => `<div class="domain"><h3>${esc(dom)}</h3>` +
      SKILLS.filter((s) => s.domain === dom).map((s) => {
        const st = skillStats(s.id);
        const pct = Math.round(st.mastery * 100);
        return `<div class="skill-row"><span class="skill-name">${esc(s.name)}</span>` +
          `<div class="bar"><div class="bar-fill ${pct >= 80 ? 'gold' : ''}" style="width:${pct}%"></div></div>` +
          `<span class="skill-pct">${pct}%</span><a class="btn small" href="#/practice?skill=${s.id}&start=1">Practice</a></div>`;
      }).join('') + '</div>').join('');

    view.innerHTML = `<div class="page">
      <header class="page-head">
        <div><h1>${greeting()} 👋</h1><p class="muted">Digital SAT Reading and Writing · ${QUESTIONS.length} practice questions</p></div>
        ${countdown}
      </header>
      <div class="stat-grid">
        <div class="card stat streak-card ${streak > 0 ? 'lit' : ''}"><div class="stat-icon">🔥</div><div><div class="stat-num">${streak}</div><div class="stat-label">day streak</div><div class="muted small">Best: ${state.bestStreak}</div></div></div>
        <div class="card stat">${ringSvg(day.answered / goal, "Today's goal progress")}<div><div class="stat-num">${day.answered}/${goal}</div><div class="stat-label">today's goal</div></div></div>
        <div class="card stat"><div class="stat-icon">⭐</div><div style="flex:1"><div class="stat-num">Level ${lv.level}</div><div class="stat-label">${lv.title}</div>
          <div class="bar thin" style="margin:6px 0 4px"><div class="bar-fill gold" style="width:${(lv.into / lv.span) * 100}%"></div></div><div class="muted small">${lv.span - lv.into} XP to level ${lv.level + 1}</div></div></div>
        <div class="card stat"><div class="stat-icon">✅</div><div><div class="stat-num">${total}</div><div class="stat-label">answered</div><div class="muted small">${acc}% accuracy</div></div></div>
      </div>
      <p class="streak-msg">${streakMsg}</p>
      <div class="grid-2">
        <section class="card"><h2>Today's plan</h2><ul class="tasks">${tasks}</ul>
          <div class="btn-row">
            <a class="btn primary" href="#/practice?skill=${focus}&start=1">Focus: ${esc(skillById[focus].name)}</a>
            <a class="btn" href="#/practice?start=1">Quick 10 mixed</a>
            <a class="btn" href="#/test">Timed module</a>
          </div>
        </section>
        <section class="card"><h2>Last 4 weeks</h2><div class="heat">${heat}</div>
          <p class="muted small">Darker squares mean more practice. A full square means you hit your goal that day.</p>
          <h2 style="margin-top:18px">Badges</h2>${badges}
        </section>
      </div>
      <section class="card"><h2>Skill mastery</h2><p class="muted small">Mastery is the share of a skill's questions you got right on your most recent try.</p>${mastery}</section>
    </div>`;
  }

  // ------------------------------------------------------------------ practice
  let session = null;
  let practiceCfg = { scope: 'all', difficulty: 'all', filter: 'smart', count: 10 };

  function buildPool(cfg) {
    let qs = QUESTIONS.filter((q) => {
      if (cfg.scope.startsWith('domain:')) { if (skillById[q.skill].domain !== cfg.scope.slice(7)) return false; }
      else if (cfg.scope !== 'all' && q.skill !== cfg.scope) return false;
      if (cfg.difficulty !== 'all' && q.difficulty !== Number(cfg.difficulty)) return false;
      const a = state.attempts[q.id];
      if (cfg.filter === 'new' && a) return false;
      if (cfg.filter === 'missed' && !(a && a.last === false)) return false;
      return true;
    });
    if (cfg.filter === 'smart') {
      // Unseen first, then ones you missed last time, then ones you already got right.
      const rank = (q) => { const a = state.attempts[q.id]; return !a ? 0 : a.last === false ? 1 : 2; };
      qs = shuffle(qs).sort((x, y) => rank(x) - rank(y));
    } else qs = shuffle(qs);
    return qs;
  }

  function renderPracticeSetup(params) {
    if (params.skill) practiceCfg.scope = params.skill;
    else if (params.start) practiceCfg.scope = 'all';
    if (params.filter) practiceCfg.filter = params.filter;
    if (params.start) { startSession(Object.assign({}, practiceCfg)); return; }

    const opts = [`<option value="all">All skills</option>`].concat(DOMAINS.map((dom) =>
      `<optgroup label="${esc(dom)}"><option value="domain:${esc(dom)}">All of ${esc(dom)}</option>` +
      SKILLS.filter((s) => s.domain === dom).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('') + '</optgroup>')).join('');
    const seg = (name, items, cur) => `<div class="seg" data-seg="${name}">` +
      items.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('') + '</div>';

    view.innerHTML = `<div class="page">
      <header class="page-head"><div><h1>Practice</h1><p class="muted">Pick a skill, get instant feedback, and earn XP for every question.</p></div></header>
      <section class="card">
        <div class="form-grid">
          <div class="field"><label for="scope">Skill</label><select id="scope">${opts}</select></div>
          <div class="field"><label>Difficulty</label>${seg('difficulty', [['all', 'All'], [1, 'Easy'], [2, 'Medium'], [3, 'Hard']], practiceCfg.difficulty)}</div>
          <div class="field"><label>Questions</label>${seg('filter', [['smart', 'Smart mix'], ['new', 'New only'], ['missed', 'Missed only'], ['all', 'Any']], practiceCfg.filter)}</div>
          <div class="field"><label>Set size</label>${seg('count', [[5, '5'], [10, '10'], [15, '15'], [20, '20']], practiceCfg.count)}</div>
        </div>
        <p class="muted" id="pool-note" style="margin:18px 0"></p>
        <button class="btn primary big" id="start">Start practice →</button>
      </section>
      <section class="card"><h2>Tips</h2>
        <ul class="muted"><li><b>Smart mix</b> shows questions you haven't seen first, then ones you missed.</li>
        <li>Use <b>⊘</b> to cross out choices you've ruled out, just like on test day.</li>
        <li>Keyboard: <kbd>A</kbd>–<kbd>D</kbd> to choose, <kbd>Enter</kbd> to check and continue.</li></ul>
      </section>
    </div>`;
    const scopeEl = document.getElementById('scope');
    scopeEl.value = practiceCfg.scope;
    const note = () => {
      const n = buildPool(practiceCfg).length;
      document.getElementById('pool-note').textContent = n
        ? `${n} question${n === 1 ? '' : 's'} match. You'll get ${Math.min(n, practiceCfg.count)}.`
        : 'No questions match these settings. Try "Any" or a different skill.';
      document.getElementById('start').disabled = n === 0;
    };
    scopeEl.onchange = () => { practiceCfg.scope = scopeEl.value; note(); };
    view.querySelectorAll('[data-seg]').forEach((g) => {
      g.onclick = (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const key = g.dataset.seg;
        practiceCfg[key] = key === 'count' ? Number(b.dataset.v) : b.dataset.v;
        g.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
        note();
      };
    });
    document.getElementById('start').onclick = () => startSession(Object.assign({}, practiceCfg));
    note();
  }

  function startSession(cfg) {
    const qs = buildPool(cfg).slice(0, cfg.count);
    if (!qs.length) {
      view.innerHTML = `<div class="page"><div class="card empty"><h2>Nothing to practice here yet</h2>` +
        `<p>${cfg.filter === 'missed' ? "You haven't missed any questions in this area. Nice!" : 'No questions match these settings.'}</p>` +
        `<a class="btn primary" href="#/practice">Choose another set</a></div></div>`;
      return;
    }
    session = { cfg, qs, i: 0, selected: null, checked: false, results: [], eliminated: new Set(), xp: 0 };
    renderSession();
  }

  function renderSession() {
    const s = session, q = s.qs[s.i], n = s.qs.length;
    const res = s.checked ? s.results[s.i] : null;
    const last = s.i === n - 1;
    const praise = pick(['Correct!', 'Nice work!', 'Nailed it!', 'Exactly right!']);
    const feedback = res ? `<div class="feedback ${res.correct ? 'ok' : 'bad'}"><span class="gain">+${res.gained} XP</span>` +
      `<strong>${res.correct ? praise : `Not quite. The answer is ${LETTERS[q.answer]}.`}</strong><p>${esc(q.explanation)}</p></div>` : '';
    view.innerHTML = `<div class="session">
      <div class="session-bar">
        <button class="icon-btn" data-act="quit" aria-label="End session" title="End session">✕</button>
        <div class="bar"><div class="bar-fill" style="width:${((s.i + (s.checked ? 1 : 0)) / n) * 100}%"></div></div>
        <span class="muted">${s.i + 1}/${n}</span>
        <span class="xp-pill">⭐ +${s.xp} XP</span>
      </div>
      ${questionHtml(q, { selected: s.selected, reveal: s.checked, eliminated: s.eliminated })}
      ${feedback}
      <div class="session-actions">
        <span class="kbd-hint muted small"><kbd>A</kbd>–<kbd>D</kbd> choose · <kbd>Enter</kbd> ${s.checked ? 'continue' : 'check'}</span>
        ${s.checked ? `<button class="btn primary big" data-act="next">${last ? 'See results' : 'Next'} →</button>`
          : `<button class="btn primary big" data-act="check" ${s.selected === null ? 'disabled' : ''}>Check answer</button>`}
      </div>
    </div>`;
    view.onclick = (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.strike !== undefined) {
        const i = Number(t.dataset.strike);
        if (s.eliminated.has(i)) s.eliminated.delete(i); else { s.eliminated.add(i); if (s.selected === i) s.selected = null; }
        renderSession();
      } else if (t.dataset.choice !== undefined) selectChoice(Number(t.dataset.choice));
      else if (t.dataset.act === 'check') checkAnswer();
      else if (t.dataset.act === 'next') nextQuestion();
      else if (t.dataset.act === 'quit') { if (!s.results.length || confirm('End this practice set? Answers so far are saved.')) finishSession(); }
    };
    keyHandler = (e) => {
      const k = e.key.toUpperCase();
      if (!s.checked && LETTERS.includes(k)) selectChoice(LETTERS.indexOf(k));
      else if (e.key === 'Enter') { if (s.checked) nextQuestion(); else if (s.selected !== null) checkAnswer(); }
    };
  }
  function selectChoice(i) {
    if (session.checked) return;
    session.selected = i;
    session.eliminated.delete(i);
    renderSession();
  }
  function checkAnswer() {
    const s = session, q = s.qs[s.i];
    const r = recordAnswer(q, s.selected);
    s.results[s.i] = { id: q.id, choice: s.selected, correct: r.correct, gained: r.gained };
    s.xp += r.gained;
    s.checked = true;
    renderSession();
    celebrate(r.events);
  }
  function nextQuestion() {
    const s = session;
    if (s.i === s.qs.length - 1) { finishSession(); return; }
    s.i++; s.selected = null; s.checked = false; s.eliminated = new Set();
    renderSession();
    window.scrollTo(0, 0);
  }
  function finishSession() {
    const s = session;
    session = null; keyHandler = null; view.onclick = null;
    const results = s.results.filter(Boolean);
    if (!results.length) { go('#/practice'); return; }
    const right = results.filter((r) => r.correct).length;
    const events = [];
    let bonus = 0;
    const day = today();
    if (results.length === s.qs.length) {
      state.stats.sessions++;
      if (s.cfg.filter === 'missed') day.done.review = true;
      else if (s.cfg.scope === 'all') day.done.mixed = true;
      else if (skillById[s.cfg.scope]) day.done['drill_' + s.cfg.scope] = true;
      if (right === results.length && results.length >= 10) {
        state.stats.perfectSets++;
        bonus = PERFECT_BONUS;
        events.push(...grantXP(bonus));
      }
    }
    save();
    const pct = Math.round((right / results.length) * 100);
    const headline = pct === 100 ? 'Perfect set! 💯' : pct >= 80 ? 'Great job! 🎉' : pct >= 50 ? 'Solid work 💪' : 'Keep climbing ⛰️';
    const review = results.map((r, idx) => {
      const q = qById[r.id];
      return `<details class="review"><summary><span class="mark ${r.correct ? 'ok' : 'bad'}">${r.correct ? '✓' : '✗'}</span>` +
        `Q${idx + 1} · ${esc(skillById[q.skill].name)} <span class="muted small">· you chose ${LETTERS[r.choice]}, answer ${LETTERS[q.answer]}</span></summary>` +
        `<div class="review-body">${questionHtml(q, { selected: r.choice, reveal: true })}<div class="feedback ${r.correct ? 'ok' : 'bad'}"><p>${esc(q.explanation)}</p></div></div></details>`;
    }).join('');
    view.innerHTML = `<div class="summary">
      <h1>${headline}</h1>
      <div class="big-score">${right}/${results.length}</div>
      <p class="muted">${pct}% correct</p>
      <div class="summary-stats">
        <div class="card"><div class="stat-num">+${s.xp + bonus}</div><div class="stat-label">XP earned${bonus ? ` (incl. ${bonus} perfect bonus)` : ''}</div></div>
        <div class="card"><div class="stat-num">${dayRec(dateKey()).answered}/${state.dailyGoal}</div><div class="stat-label">today's goal</div></div>
        <div class="card"><div class="stat-num">🔥 ${currentStreak()}</div><div class="stat-label">day streak</div></div>
      </div>
      <div class="btn-row" style="justify-content:center">
        <button class="btn primary big" id="again">Practice again</button>
        <a class="btn big" href="#/dashboard">Dashboard</a>
      </div>
      <div class="review-list"><h2>Review</h2>${review}</div>
    </div>`;
    document.getElementById('again').onclick = () => startSession(s.cfg);
    celebrate(events);
  }

  // ------------------------------------------------------------------ timed test
  let activeTest = null;
  let timerId = null;
  let lastTestResult = null;

  // Weighted sample without replacement (Efraimidis–Spirakis), per domain, ordered like the
  // real test: by domain, then easier to harder within each domain.
  function buildModule(exclude, weights) {
    const out = [];
    DOMAINS.forEach((dom) => {
      const pool = QUESTIONS.filter((q) => skillById[q.skill].domain === dom && !exclude.has(q.id));
      const picked = pool.map((q) => ({ q, k: Math.pow(Math.random(), 1 / weights[q.difficulty]) }))
        .sort((a, b) => b.k - a.k).slice(0, MODULE_PLAN[dom]).map((x) => x.q);
      picked.sort((a, b) => a.difficulty - b.difficulty);
      out.push(...picked);
    });
    return out;
  }
  function newModuleState(t, qs) {
    t.qs = qs;
    t.answers = qs.map(() => null);
    t.elim = qs.map(() => new Set());
    t.flagged = new Set();
    t.i = 0;
    t.reviewing = false;
    t.navOpen = false;
    t.endsAt = Date.now() + MODULE_SECONDS * 1000;
  }

  function renderTestSetup() {
    if (activeTest) { activeTest.between ? renderBetween() : renderTest(); return; }
    const hist = state.tests.length
      ? `<table class="history"><thead><tr><th>Date</th><th>Type</th><th>Correct</th><th>Est. score</th></tr></thead><tbody>` +
        state.tests.slice(0, 10).map((t) => `<tr><td>${new Date(t.at).toLocaleDateString()}</td><td>${t.kind === 'full' ? 'Full section' : 'Single module'}</td>` +
          `<td>${t.correct}/${t.total}</td><td><b>${t.score}</b></td></tr>`).join('') + '</tbody></table>'
      : '<p class="muted">No practice tests yet. Your results will show up here.</p>';
    view.innerHTML = `<div class="page">
      <header class="page-head"><div><h1>Practice Test</h1><p class="muted">Timed, test-day style: cross out choices, mark questions for review, and jump between questions.</p></div></header>
      <div class="test-options">
        <section class="card"><h2>⏱️ Single module</h2>
          <ul><li>27 questions · 32 minutes</li><li>Mixed difficulty, all four content areas</li><li>Good for a weekday session</li></ul>
          <button class="btn primary" data-kind="single">Start module</button></section>
        <section class="card"><h2>🏁 Full Reading and Writing section</h2>
          <ul><li>2 modules · 54 questions · 64 minutes</li><li>Adaptive like the real test: how you do on Module 1 sets Module 2's difficulty</li><li>Gives an estimated section score</li></ul>
          <button class="btn primary" data-kind="full">Start full section</button></section>
      </div>
      <section class="card"><h2>Your results</h2>${hist}
        <p class="muted small" style="margin-top:12px">Scores are rough estimates on the 200–800 section scale, not official College Board scores.</p></section>
    </div>`;
    view.querySelectorAll('[data-kind]').forEach((b) => { b.onclick = () => startTest(b.dataset.kind); });
  }

  function startTest(kind) {
    activeTest = { kind, module: 1, modules: [], path: null, hideTimer: false, between: false, events: [] };
    newModuleState(activeTest, buildModule(new Set(), W_MIXED));
    document.body.classList.add('focus');
    renderTest();
    startTimer();
  }
  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      if (!activeTest) { stopTimer(); return; }
      const left = (activeTest.endsAt - Date.now()) / 1000;
      const el = document.getElementById('timer');
      if (el) {
        el.textContent = fmtTime(left);
        el.parentElement.classList.toggle('low', left <= 300);
      }
      if (left <= 300 && !activeTest.warned) { activeTest.warned = true; toast('⏰ 5 minutes left in this module'); }
      if (left <= 0) { toast("⏰ Time's up. Module submitted."); submitModule(); }
    }, 1000);
  }
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function renderTest() {
    const t = activeTest, n = t.qs.length, q = t.qs[t.i];
    const left = (t.endsAt - Date.now()) / 1000;
    const title = t.kind === 'full' ? `Reading and Writing · Module ${t.module} of 2` : 'Reading and Writing · Practice Module';
    const grid = `<div class="navgrid">${t.qs.map((_, i) => `<button data-jump="${i}" class="${t.answers[i] !== null ? 'answered' : ''} ${t.flagged.has(i) ? 'flagged' : ''} ${i === t.i && !t.reviewing ? 'current' : ''}">${i + 1}</button>`).join('')}</div>`;
    const legend = `<div class="legend"><span>▢ Unanswered</span><span style="color:var(--primary)">■ Answered</span><span style="color:var(--bad)">⚑ Marked for review</span></div>`;
    const answeredCount = t.answers.filter((a) => a !== null).length;
    const body = t.reviewing
      ? `<div class="card"><h2>Check your work</h2><p class="muted">You've answered ${answeredCount} of ${n}. Select a number to go back to it, or submit when you're ready.</p>${legend}${grid}
          <button class="btn primary big" data-act="submit">Submit module</button></div>`
      : `<div class="test-qhead"><span class="qnum">${t.i + 1}</span><button class="flag ${t.flagged.has(t.i) ? 'on' : ''}" data-act="flag">${t.flagged.has(t.i) ? '⚑ Marked for review' : '⚐ Mark for review'}</button></div>
         ${questionHtml(q, { selected: t.answers[t.i], eliminated: t.elim[t.i], meta: false })}`;
    view.innerHTML = `<div class="test">
      <header class="test-bar">
        <div><strong>${title}</strong><div class="muted small">${answeredCount}/${n} answered</div></div>
        <div class="timer ${t.hideTimer ? 'hidden-timer' : ''} ${left <= 300 ? 'low' : ''}"><span id="timer">${fmtTime(left)}</span><button class="link-btn small" data-act="timer">${t.hideTimer ? 'Show' : 'Hide'}</button></div>
        <button class="btn ghost small" data-act="exit">Exit</button>
      </header>
      <div class="test-body">${body}</div>
      <footer class="test-foot">
        <button class="btn ghost" data-act="navtoggle">${t.reviewing ? 'Review' : `Question ${t.i + 1} of ${n}`} ▴</button>
        <div class="btn-row">
          <button class="btn" data-act="back" ${!t.reviewing && t.i === 0 ? 'disabled' : ''}>Back</button>
          ${t.reviewing ? '' : `<button class="btn primary" data-act="next">Next</button>`}
        </div>
      </footer>
      ${t.navOpen ? `<div class="card nav-pop"><strong>${title}</strong>${legend}${grid}<button class="btn small" data-act="toreview">Go to review page</button></div>` : ''}
    </div>`;
    view.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.strike !== undefined) {
        const i = Number(b.dataset.strike), el = t.elim[t.i];
        if (el.has(i)) el.delete(i); else { el.add(i); if (t.answers[t.i] === i) t.answers[t.i] = null; }
      } else if (b.dataset.choice !== undefined) {
        const i = Number(b.dataset.choice);
        t.answers[t.i] = t.answers[t.i] === i ? null : i;
        t.elim[t.i].delete(i);
      } else if (b.dataset.jump !== undefined) { t.i = Number(b.dataset.jump); t.reviewing = false; t.navOpen = false; }
      else {
        switch (b.dataset.act) {
          case 'flag': t.flagged.has(t.i) ? t.flagged.delete(t.i) : t.flagged.add(t.i); break;
          case 'timer': t.hideTimer = !t.hideTimer; break;
          case 'navtoggle': t.navOpen = !t.navOpen; break;
          case 'toreview': t.reviewing = true; t.navOpen = false; break;
          case 'next': if (t.i < n - 1) t.i++; else t.reviewing = true; t.navOpen = false; window.scrollTo(0, 0); break;
          case 'back': if (t.reviewing) t.reviewing = false; else if (t.i > 0) t.i--; t.navOpen = false; break;
          case 'submit': submitModule(); return;
          case 'exit': if (confirm('Exit this practice test? Your answers on it will not be saved.')) abandonTest(); return;
          default: return;
        }
      }
      renderTest();
    };
    keyHandler = (e) => {
      if (t.reviewing) return;
      const k = e.key.toUpperCase();
      if (LETTERS.includes(k)) { t.answers[t.i] = LETTERS.indexOf(k); t.elim[t.i].delete(t.answers[t.i]); renderTest(); }
      else if (e.key === 'ArrowRight') { if (t.i < n - 1) t.i++; else t.reviewing = true; renderTest(); }
      else if (e.key === 'ArrowLeft' && t.i > 0) { t.i--; renderTest(); }
    };
  }

  function submitModule() {
    const t = activeTest;
    stopTimer();
    let correct = 0;
    const items = t.qs.map((q, i) => {
      const ch = t.answers[i];
      if (ch !== null) { const r = recordAnswer(q, ch); t.events.push(...r.events); if (r.correct) correct++; }
      return { id: q.id, choice: ch, correct: ch === q.answer };
    });
    t.modules.push({ correct, total: t.qs.length, items });
    if (t.kind === 'full' && t.module === 1) {
      t.path = correct / t.qs.length >= 0.6 ? 'harder' : 'easier';
      t.module = 2;
      newModuleState(t, buildModule(new Set(t.qs.map((q) => q.id)), t.path === 'harder' ? W_HARDER : W_EASIER));
      t.between = true;
      renderBetween();
      return;
    }
    finishTest();
  }
  function renderBetween() {
    keyHandler = null;
    view.onclick = null;
    view.innerHTML = `<div class="summary"><div class="card" style="padding:40px">
      <div style="font-size:3rem">☕</div><h1>Module 1 complete</h1>
      <p class="muted">Take a breath. Module 2 has 27 questions and 32 minutes. The clock starts when you press start.</p>
      <button class="btn primary big" id="m2">Start Module 2 →</button></div></div>`;
    document.getElementById('m2').onclick = () => {
      activeTest.between = false;
      activeTest.endsAt = Date.now() + MODULE_SECONDS * 1000;
      activeTest.warned = false;
      renderTest();
      startTimer();
    };
  }
  function estimateScore(t) {
    const correct = t.modules.reduce((n, m) => n + m.correct, 0);
    const total = t.modules.reduce((n, m) => n + m.total, 0);
    const p = correct / total;
    let score;
    if (t.kind === 'single') score = 200 + 600 * p;
    // The easier Module 2 caps how high a real section score can go; the harder one does not.
    else if (t.path === 'harder') score = 200 + 600 * (0.2 + 0.8 * p);
    else score = Math.min(650, 200 + 500 * p);
    return { score: Math.min(800, Math.max(200, round10(score))), correct, total };
  }
  function finishTest() {
    const t = activeTest;
    const est = estimateScore(t);
    state.tests.unshift({ at: Date.now(), kind: t.kind, score: est.score, correct: est.correct, total: est.total, path: t.path });
    today().done.test = true;
    t.events.push(...grantXP(TEST_BONUS));
    save();
    activeTest = null;
    lastTestResult = { t, est };
    document.body.classList.remove('focus');
    renderTestResults();
    celebrate(t.events);
  }
  function abandonTest() {
    stopTimer();
    activeTest = null;
    keyHandler = null;
    document.body.classList.remove('focus');
    go('#/test');
  }
  function renderTestResults() {
    keyHandler = null; view.onclick = null;
    const { t, est } = lastTestResult;
    const all = t.modules.flatMap((m) => m.items);
    const byDomain = DOMAINS.map((dom) => {
      const its = all.filter((it) => skillById[qById[it.id].skill].domain === dom);
      const c = its.filter((it) => it.correct).length;
      return `<div class="skill-row"><span class="skill-name">${esc(dom)}</span><div class="bar"><div class="bar-fill" style="width:${its.length ? (c / its.length) * 100 : 0}%"></div></div><span class="skill-pct">${c}/${its.length}</span><span></span></div>`;
    }).join('');
    const mods = t.modules.map((m, i) => `<div class="card"><div class="stat-num">${m.correct}/${m.total}</div><div class="stat-label">Module ${i + 1}${i === 1 ? ` (${t.path})` : ''}</div></div>`).join('');
    const review = t.modules.map((m, mi) => m.items.map((it, idx) => {
      const q = qById[it.id];
      const mark = it.choice === null ? '<span class="mark skip">–</span>' : `<span class="mark ${it.correct ? 'ok' : 'bad'}">${it.correct ? '✓' : '✗'}</span>`;
      return `<details class="review"><summary>${mark}${t.modules.length > 1 ? `M${mi + 1} ` : ''}Q${idx + 1} · ${esc(skillById[q.skill].name)}` +
        `<span class="muted small">· ${it.choice === null ? 'skipped' : 'you chose ' + LETTERS[it.choice]}, answer ${LETTERS[q.answer]}</span></summary>` +
        `<div class="review-body">${questionHtml(q, { selected: it.choice, reveal: true })}<div class="feedback ${it.correct ? 'ok' : 'bad'}"><p>${esc(q.explanation)}</p></div></div></details>`;
    }).join('')).join('');
    view.innerHTML = `<div class="summary">
      <h1>${t.kind === 'full' ? 'Section complete 🏁' : 'Module complete ⏱️'}</h1>
      <p class="muted">Estimated Reading and Writing score</p>
      <div class="big-score">${est.score}</div>
      <p class="muted small">${est.correct}/${est.total} correct · rough estimate, not an official score · +${TEST_BONUS} XP</p>
      <div class="summary-stats" style="grid-template-columns:repeat(${t.modules.length}, 1fr)">${mods}</div>
      <div class="card" style="text-align:left"><h2>By content area</h2>${byDomain}</div>
      <div class="btn-row" style="justify-content:center;margin-top:20px"><a class="btn primary" href="#/test">Back to tests</a><a class="btn" href="#/dashboard">Dashboard</a></div>
      <div class="review-list"><h2>Review every question</h2>${review}</div>
    </div>`;
  }

  // ------------------------------------------------------------------ planner
  function renderPlanner() {
    const p = state.plan;
    const left = daysUntil(p.testDate);
    const latest = state.tests[0];
    const plan = weeklyPlan();
    const todayIdx = (new Date().getDay() + 6) % 7;
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const week = plan.map((it, i) => `<div class="week-day ${i === todayIdx ? 'today' : ''}"><span class="dname">${names[i]}${i === todayIdx ? ' · today' : ''}</span>` +
      `<span class="dtask">${esc(it.label)}</span><a class="btn small" href="${it.href}">Go</a></div>`).join('');
    const focus = weakestSkills(3).map((id) => `<span class="tag">${esc(skillById[id].name)}</span>`).join('');
    let outlook = '<p class="muted">Set your test date to see a countdown.</p>';
    if (left !== null) {
      if (left < 0) outlook = '<p>Your test date has passed. Set a new one to keep planning.</p>';
      else {
        const gap = latest ? p.target - latest.score : null;
        outlook = `<p><b>${left}</b> day${left === 1 ? '' : 's'} to go${left >= 7 ? ` (about ${Math.floor(left / 7)} week${left >= 14 ? 's' : ''})` : ''}. ` +
          `At ${state.dailyGoal} questions a day, that's about <b>${left * state.dailyGoal}</b> more practice questions.</p>` +
          (latest ? `<p>Latest estimate: <b>${latest.score}</b> · target: <b>${p.target}</b> · ${gap > 0 ? `${gap} points to go` : 'on target! 🎉'}</p>`
            : `<p class="muted">Take a <a href="#/test">timed module</a> to get a starting score estimate.</p>`) +
          (left <= 14 ? '<p>⚡ Test is close: your plan now includes a full timed section mid-week.</p>' : '');
      }
    }
    view.innerHTML = `<div class="page">
      <header class="page-head"><div><h1>Study Plan</h1><p class="muted">Tell us your test date and goal. Your week updates to target your weakest skills.</p></div></header>
      <section class="card">
        <div class="form-grid">
          <div class="field"><label for="date">Test date</label><input type="date" id="date" value="${esc(p.testDate)}"></div>
          <div class="field"><label for="target">Target Reading and Writing score (200–800)</label><input type="number" id="target" min="200" max="800" step="10" value="${p.target}"></div>
          <div class="field"><label for="goal">Daily goal (questions)</label><input type="number" id="goal" min="5" max="100" value="${state.dailyGoal}"></div>
          <div class="field"><label>Daily study time</label><div class="seg" id="mins">${[15, 30, 45, 60].map((m) => `<button type="button" data-m="${m}" class="${p.minutes === m ? 'on' : ''}">${m} min</button>`).join('')}</div></div>
        </div>
        <p class="muted small" style="margin-top:12px">Picking a study time suggests a goal of about one question every 2 minutes, counting review time.</p>
        <button class="btn primary" id="save-plan" style="margin-top:8px">Save plan</button>
      </section>
      <section class="card"><h2>Outlook</h2>${outlook}<h2 style="margin-top:16px">Focus skills</h2><p class="muted small">Your three weakest or least-practiced skills right now.</p><div class="focus-list">${focus}</div></section>
      <section class="card"><h2>This week</h2><div class="week">${week}</div></section>
      <section class="card"><h2>Reset</h2><p class="muted small">Progress lives only in this browser. Resetting erases XP, streaks, badges, and history.</p><button class="btn danger" id="reset">Reset all progress</button></section>
    </div>`;
    const minsEl = document.getElementById('mins');
    minsEl.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      minsEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      document.getElementById('goal').value = Math.round(Number(b.dataset.m) / 2);
    };
    document.getElementById('save-plan').onclick = () => {
      const on = minsEl.querySelector('.on');
      p.testDate = document.getElementById('date').value;
      p.target = Math.min(800, Math.max(200, round10(Number(document.getElementById('target').value) || 650)));
      p.minutes = on ? Number(on.dataset.m) : p.minutes;
      const goal = Math.min(100, Math.max(5, Math.round(Number(document.getElementById('goal').value) || 15)));
      state.dailyGoal = goal;
      // Raising the goal mid-day shouldn't un-meet a goal already met; lowering it can meet it now.
      const day = today();
      if (!day.goalMet && day.answered >= goal) { day.goalMet = true; state.bestStreak = Math.max(state.bestStreak, currentStreak()); }
      save();
      toast('✅ Study plan saved');
      checkBadges();
      renderSidebar();
      renderPlanner();
    };
    document.getElementById('reset').onclick = () => {
      if (confirm('Erase all progress in this browser? This cannot be undone.')) {
        state = defaultState(); save(); renderSidebar(); toast('Progress reset'); go('#/dashboard');
      }
    };
  }

  // ------------------------------------------------------------------ achievements
  function renderBadges() {
    const lv = levelInfo(state.xp);
    const earned = BADGES.filter((b) => state.badges[b.id]).length;
    view.innerHTML = `<div class="page">
      <header class="page-head"><div><h1>Achievements</h1><p class="muted">${earned} of ${BADGES.length} badges earned</p></div></header>
      <section class="card level-hero"><div class="level-num">${lv.level}</div><div style="flex:1">
        <h2>${lv.title}</h2><div class="bar"><div class="bar-fill gold" style="width:${(lv.into / lv.span) * 100}%"></div></div>
        <p class="muted small">${state.xp} XP total · ${lv.span - lv.into} XP to level ${lv.level + 1}</p>
        <p class="muted small">Earn XP: easy +10 · medium +15 · hard +20 · wrong answers +2 for trying · daily goal +${GOAL_BONUS} · timed test +${TEST_BONUS} · perfect set +${PERFECT_BONUS}</p></div></section>
      <div class="badge-grid" style="margin-top:20px">${BADGES.map((b) => `<div class="card badge-card ${state.badges[b.id] ? '' : 'locked'}">
        <div class="bicon">${b.icon}</div><h3>${esc(b.name)}</h3><p class="muted small">${esc(b.desc)}</p>
        ${state.badges[b.id] ? `<span class="tag">Earned ${esc(state.badges[b.id])}</span>` : '<span class="muted small">🔒 Locked</span>'}</div>`).join('')}</div>
    </div>`;
  }

  // ------------------------------------------------------------------ router
  let keyHandler = null;
  document.addEventListener('keydown', (e) => {
    if (!keyHandler || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement && document.activeElement.tagName)) return;
    // Let Enter activate a focused button normally instead of double-firing.
    if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName === 'BUTTON') return;
    keyHandler(e);
  });
  window.addEventListener('beforeunload', (e) => { if (activeTest) { e.preventDefault(); e.returnValue = ''; } });

  const routes = { dashboard: renderDashboard, practice: renderPracticeSetup, test: renderTestSetup, planner: renderPlanner, badges: renderBadges };
  function route() {
    const [name, query] = location.hash.replace(/^#\/?/, '').split('?');
    const r = routes[name] ? name : 'dashboard';
    if (activeTest && r !== 'test') {
      if (!confirm('Leave this practice test? Your answers on it will not be saved.')) { location.hash = '#/test'; return; }
      stopTimer(); activeTest = null; document.body.classList.remove('focus');
    }
    session = null; keyHandler = null; view.onclick = null;
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === r));
    routes[r](parseQuery(query));
    renderSidebar();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
