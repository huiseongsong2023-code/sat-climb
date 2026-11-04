/*
 * SAT Climb: a no-build, single-page practice app.
 * Views are rendered from the hash route (#/dashboard, #/practice, ...). All progress is
 * kept in localStorage under STORE_KEY, so nothing leaves the student's browser.
 */
(function () {
  'use strict';

  const SKILLS = window.SAT_SKILLS;
  const QUESTIONS = window.SAT_QUESTIONS;
  const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
  const qById = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  const LETTERS = ['A', 'B', 'C', 'D'];
  const DIFF = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
  const STORE_KEY = 'satclimb.v1';
  const GOAL_BONUS = 25;
  const TEST_BONUS = 50;
  const PERFECT_BONUS = 30;
  const LEVEL_TITLES = ['Rookie', 'Reader', 'Scholar', 'Analyst', 'Wordsmith', 'Strategist', 'Expert', 'Master', 'Legend'];
  // Module length, timing, and questions per domain follow the digital SAT's published structure.
  const SECTIONS = {
    rw: { id: 'rw', name: 'Reading and Writing', short: 'R&W', icon: '📖', seconds: 32 * 60,
      plan: { 'Craft and Structure': 7, 'Information and Ideas': 7, 'Standard English Conventions': 7, 'Expression of Ideas': 6 } },
    math: { id: 'math', name: 'Math', short: 'Math', icon: '📐', seconds: 35 * 60,
      plan: { 'Algebra': 8, 'Advanced Math': 8, 'Problem-Solving and Data Analysis': 3, 'Geometry and Trigonometry': 3 } },
  };
  const SECTION_IDS = ['rw', 'math'];
  const DOMAIN_COLORS = {
    'Craft and Structure': '#7c5cff', 'Information and Ideas': '#1f8fff', 'Standard English Conventions': '#ff7a1a', 'Expression of Ideas': '#e2468f',
    'Algebra': '#0fae84', 'Advanced Math': '#7c5cff', 'Problem-Solving and Data Analysis': '#1f8fff', 'Geometry and Trigonometry': '#ff7a1a',
  };
  const TEST_KINDS = {
    'rw-module': { label: 'R&W module', seq: [['rw', 1]] },
    'math-module': { label: 'Math module', seq: [['math', 1]] },
    'rw-full': { label: 'Full R&W section', seq: [['rw', 1], ['rw', 2]] },
    'math-full': { label: 'Full Math section', seq: [['math', 1], ['math', 2]] },
    'sat-full': { label: 'Full SAT', seq: [['rw', 1], ['rw', 2], ['math', 1], ['math', 2]] },
    // Results saved before Math existed.
    single: { label: 'R&W module', seq: [['rw', 1]] },
    full: { label: 'Full R&W section', seq: [['rw', 1], ['rw', 2]] },
  };
  const W_MIXED = { 1: 1, 2: 1, 3: 1 };
  const W_HARDER = { 1: 0.15, 2: 1, 3: 2 };
  const W_EASIER = { 1: 2, 2: 1, 3: 0.15 };
  const SPR_RE = /^-?(\d+\/\d+|\d+\.?\d*|\.\d+)$/;

  const sectionOf = (q) => skillById[q.skill].section;
  const domainsOf = (sec) => [...new Set(SKILLS.filter((s) => s.section === sec).map((s) => s.domain))];
  const view = document.getElementById('view');

  // ------------------------------------------------------------------ state
  function defaultState() {
    return {
      xp: 0,
      dailyGoal: 15,
      attempts: {}, // qid -> {seen, right, last, lastChoice, at}
      days: {}, // YYYY-MM-DD -> day record
      badges: {}, // badge id -> date earned
      bestStreak: 0,
      plan: { testDate: '', target: 1200, minutes: 30 },
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
        const st = Object.assign(base, s, {
          plan: Object.assign(base.plan, s.plan || {}),
          stats: Object.assign(base.stats, s.stats || {}),
        });
        // Targets saved before Math existed were R&W section scores (200-800).
        if (st.plan.target <= 800) st.plan.target = Math.min(1600, st.plan.target * 2);
        return st;
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
  function renderMath(el) {
    if (!window.renderMathInElement) return;
    try {
      window.renderMathInElement(el, {
        delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }],
        throwOnError: false,
      });
    } catch (e) { /* leave the raw LaTeX visible */ }
  }
  function setView(html) { view.innerHTML = html; renderMath(view); }

  // ------------------------------------------------------------------ answers
  function toNumber(s) {
    s = String(s).replace(/\s+/g, '');
    if (!SPR_RE.test(s)) return null;
    if (s.includes('/')) { const [a, b] = s.split('/'); return Number(b) ? Number(a) / Number(b) : null; }
    return Number(s);
  }
  // Student-produced responses: any equivalent number counts, and (as on the SAT) a decimal
  // that fills the answer box may be truncated or rounded, so 2/3 accepts .666 and .667.
  function isCorrect(q, r) {
    if (r === null || r === undefined || r === '') return false;
    if (q.type !== 'spr') return r === q.answer;
    const u = toNumber(r);
    if (u === null) return false;
    const decimals = (String(r).split('.')[1] || '').length;
    return q.answers.some((a) => {
      const v = toNumber(a);
      return Math.abs(u - v) < 1e-9 || (decimals >= 3 && Math.abs(u - v) < 0.001);
    });
  }
  function hasResponse(q, r) { return q.type === 'spr' ? SPR_RE.test(String(r || '').replace(/\s+/g, '')) : r !== null && r !== undefined; }
  function responseText(q, r) { return r === null || r === undefined || r === '' ? 'skipped' : q.type === 'spr' ? String(r) : LETTERS[r]; }
  function answerText(q) { return q.type === 'spr' ? q.answers.join(' or ') : LETTERS[q.answer]; }

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
  function totalRight(sec) {
    return Object.entries(state.attempts).reduce((n, [id, a]) => n + (!sec || (qById[id] && sectionOf(qById[id]) === sec) ? a.right : 0), 0);
  }
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
  function weakestSkills(n, sec) {
    return SKILLS.filter((s) => !sec || s.section === sec).map((s, i) => {
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
  function recordAnswer(q, response) {
    const correct = isCorrect(q, response);
    const a = state.attempts[q.id] || (state.attempts[q.id] = { seen: 0, right: 0, last: null, lastChoice: null, at: 0 });
    a.seen++; if (correct) a.right++;
    a.last = correct; a.lastChoice = response; a.at = Date.now();
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
      if (e.type === 'goal') { toast(`🎯 Daily goal complete! +${GOAL_BONUS} XP · 🔥 ${e.streak}-day streak`, 'flame'); confetti(); }
      if (e.type === 'level') { toast(`⬆️ Level up! You're now level ${e.level}: ${levelInfo(state.xp).title}`, 'gold'); confetti(); }
      if (e.type === 'party') confetti();
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
    { id: 'math25', icon: '📐', name: 'Number Sense', desc: 'Answer 25 Math questions correctly.', test: () => totalRight('math') >= 25 },
    { id: 'rounded', icon: '⚖️', name: 'Well-Rounded', desc: 'Practice both Reading and Writing and Math on the same day.',
      test: () => Object.values(state.days).some((d) => SECTION_IDS.every((sec) => Object.keys(d.skills).some((id) => skillById[id] && skillById[id].section === sec))) },
    { id: 'q50', icon: '📚', name: 'Bookworm', desc: 'Answer 50 questions.', test: () => totalAnswered() >= 50 },
    { id: 'q250', icon: '🏆', name: 'Marathoner', desc: 'Answer 250 questions.', test: () => totalAnswered() >= 250 },
    { id: 'explorer', icon: '🧭', name: 'Explorer', desc: 'Try every skill at least once.', test: () => SKILLS.every((s) => skillStats(s.id).tried > 0) },
    { id: 'master', icon: '⭐', name: 'Skill Master', desc: 'Reach 80% mastery in any skill.', test: () => SKILLS.some((s) => skillStats(s.id).mastery >= 0.8) },
    { id: 'test1', icon: '⏱️', name: 'Test Day Ready', desc: 'Finish a timed practice module.', test: () => state.tests.length >= 1 },
    { id: 'fullsat', icon: '🎓', name: 'Full Send', desc: 'Finish a full-length practice SAT.', test: () => state.tests.some((t) => t.kind === 'sat-full') },
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
  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    c.width = window.innerWidth; c.height = window.innerHeight;
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const colors = ['#7c5cff', '#ff7a1a', '#0fae84', '#f2b705', '#e2468f', '#1f8fff'];
    const parts = Array.from({ length: 140 }, () => ({
      x: c.width / 2 + (Math.random() - 0.5) * c.width * 0.3, y: c.height * 0.35,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * 6 + 4, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3, color: pick(colors),
    }));
    const start = performance.now();
    (function frame(now) {
      const t = now - start;
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach((p) => {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.globalAlpha = Math.max(0, 1 - t / 2200);
        ctx.fillStyle = p.color; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      });
      if (t < 2200) requestAnimationFrame(frame); else c.remove();
    })(start);
  }

  // ------------------------------------------------------------------ tools (calculator, reference)
  function openCalculator() {
    const w = window.open('https://www.desmos.com/calculator', 'satclimb-desmos', 'width=520,height=720');
    if (!w) toast('Allow pop-ups to open the Desmos calculator, or go to desmos.com/calculator.');
  }
  function openReference() {
    const el = document.createElement('div');
    el.className = 'modal';
    el.innerHTML = `<div class="modal-card card" role="dialog" aria-label="Math reference sheet">
      <div class="modal-head"><h2>📏 Reference</h2><button class="icon-btn" data-close aria-label="Close">✕</button></div>
      <div class="ref-grid">
        <div><b>Circle</b><p>\\(A = \\pi r^2\\)<br>\\(C = 2\\pi r\\)</p></div>
        <div><b>Rectangle</b><p>\\(A = \\ell w\\)</p></div>
        <div><b>Triangle</b><p>\\(A = \\frac{1}{2}bh\\)</p></div>
        <div><b>Pythagorean theorem</b><p>\\(c^2 = a^2 + b^2\\)</p></div>
        <div><b>Special right triangles</b><p>\\(x,\\ x\\sqrt{3},\\ 2x\\) (30°-60°-90°)<br>\\(s,\\ s,\\ s\\sqrt{2}\\) (45°-45°-90°)</p></div>
        <div><b>Rectangular prism</b><p>\\(V = \\ell wh\\)</p></div>
        <div><b>Cylinder</b><p>\\(V = \\pi r^2 h\\)</p></div>
        <div><b>Sphere</b><p>\\(V = \\frac{4}{3}\\pi r^3\\)</p></div>
        <div><b>Cone</b><p>\\(V = \\frac{1}{3}\\pi r^2 h\\)</p></div>
        <div><b>Pyramid</b><p>\\(V = \\frac{1}{3}\\ell wh\\)</p></div>
      </div>
      <p class="muted small">A circle has 360° (\\(2\\pi\\) radians). The angles of a triangle add up to 180°.</p>
    </div>`;
    el.onclick = (e) => { if (e.target === el || e.target.closest('[data-close]')) el.remove(); };
    document.body.appendChild(el);
    renderMath(el);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]');
    if (!b) return;
    if (b.dataset.tool === 'calc') openCalculator();
    if (b.dataset.tool === 'ref') openReference();
  });

  // ------------------------------------------------------------------ plan
  function weeklyPlan() {
    const r = weakestSkills(2, 'rw'), m = weakestSkills(2, 'math');
    const left = daysUntil(state.plan.testDate);
    const crunch = left !== null && left >= 0 && left <= 14;
    const drill = (id) => ({ key: 'drill_' + id, label: `${SECTIONS[skillById[id].section].icon} ${skillById[id].name}`, href: `#/practice?skill=${id}&start=1` });
    return [
      drill(r[0]),
      drill(m[0]),
      crunch ? { key: 'test', label: '🎓 Full practice SAT', href: '#/test' } : { key: 'mixed', label: '🔀 Mixed practice (both sections)', href: '#/practice?section=all&start=1' },
      drill(r[1]),
      drill(m[1]),
      { key: 'test', label: '⏱️ Timed module', href: '#/test' },
      { key: 'review', label: '🔁 Review missed questions', href: '#/practice?section=all&filter=missed&start=1' },
    ]; // Monday first
  }
  function todaysTasks() {
    const day = dayRec(dateKey());
    const planItem = weeklyPlan()[(new Date().getDay() + 6) % 7];
    return [
      { label: `✏️ Answer ${state.dailyGoal} questions (${Math.min(day.answered, state.dailyGoal)}/${state.dailyGoal})`, done: day.answered >= state.dailyGoal, href: '#/practice?section=all&start=1' },
      { label: planItem.label, done: !!day.done[planItem.key], href: planItem.href },
    ];
  }
  function latestScore(sec) {
    for (const t of state.tests) {
      if (t.sections && t.sections[sec]) return t.sections[sec];
      if (!t.sections && sec === 'rw') return t.score; // results saved before Math existed
    }
    return null;
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
  function skillTag(id) {
    const s = skillById[id];
    return `<span class="tag" style="--tag:${DOMAIN_COLORS[s.domain]}">${esc(s.name)}</span>`;
  }
  function choicesHtml(q, opts, elim) {
    return q.choices.map((c, i) => {
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
  }
  function sprHtml(q, opts) {
    if (opts.reveal) {
      const ok = isCorrect(q, opts.selected);
      return `<div class="spr-result ${ok ? 'ok' : 'bad'}">Your answer: <b>${esc(responseText(q, opts.selected))}</b> · Correct answer: <b>${esc(answerText(q))}</b></div>`;
    }
    return `<div class="spr"><label for="spr-in">Your answer</label>
      <input id="spr-in" class="spr-input" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="7" value="${esc(opts.selected || '')}" placeholder="e.g. 3/4">
      <p class="muted small">Type a number, decimal, or fraction (like 3/4 or 0.75). No mixed numbers. Negative answers start with -.</p></div>`;
  }
  // opts: selected, reveal (bool), eliminated (Set), meta (bool)
  function questionHtml(q, opts) {
    opts = opts || {};
    const elim = opts.eliminated || new Set();
    const meta = opts.meta === false ? '' : `${skillTag(q.skill)}${diffHtml(q.difficulty)}`;
    const answer = q.type === 'spr' ? sprHtml(q, opts) : `<div class="choices">${choicesHtml(q, opts, elim)}</div>`;
    if (sectionOf(q) === 'math') {
      return `<div class="qwrap single"><section class="question-pane">
        <div class="qmeta">${meta}<span class="tools"><button class="tool-btn" data-tool="calc">🧮 Calculator</button><button class="tool-btn" data-tool="ref">📏 Reference</button></span></div>
        <div class="math-stem">${q.table ? tableHtml(q.table) : ''}${formatPassage(q.passage)}</div>${answer}
      </section></div>`;
    }
    return `<div class="qwrap">
      <section class="passage-pane">${q.table ? tableHtml(q.table) : ''}${formatPassage(q.passage)}</section>
      <section class="question-pane"><div class="qmeta">${meta}</div><p class="stem">${esc(q.question)}</p>${answer}</section>
    </div>`;
  }
  function ringSvg(frac, label) {
    const r = 26, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 64 64" role="img" aria-label="${esc(label)}"><circle class="track" cx="32" cy="32" r="${r}"/>` +
      `<circle class="prog" cx="32" cy="32" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, frac))}"/>` +
      `<text x="32" y="33">${Math.round(Math.min(1, frac) * 100)}%</text></svg>`;
  }
  // The level-progress climber: a marker that walks up the trail as XP fills the level.
  function mountainSvg(frac) {
    const x = 34 + 118 * frac, y = 132 - 104 * frac;
    return `<svg class="mountain" viewBox="0 0 240 150" aria-hidden="true">
      <polygon points="0,150 70,70 105,100 160,22 240,150" fill="rgba(255,255,255,.18)"/>
      <polygon points="160,22 178,52 168,47 158,56 150,45 142,50" fill="#fff" opacity=".9"/>
      <path d="M34 132 Q 80 120 92 100 T 152 28" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>
      <line x1="160" y1="22" x2="160" y2="4" stroke="#fff" stroke-width="2"/><polygon points="160,4 176,9 160,14" fill="#ffd23f"/>
      <circle cx="${x}" cy="${y}" r="9" fill="#ffd23f" stroke="#fff" stroke-width="3"/>
    </svg>`;
  }

  function renderSidebar() {
    const streak = currentStreak();
    const lv = levelInfo(state.xp);
    document.getElementById('sidebar-stats').innerHTML =
      `<div class="mini-stat ${streak ? 'lit' : ''}" title="Day streak"><span class="flame">🔥</span> ${streak} day${streak === 1 ? '' : 's'}</div>` +
      `<div class="mini-stat" title="Level">⭐ Lv ${lv.level} · ${state.xp} XP</div>`;
  }

  // ------------------------------------------------------------------ dashboard
  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }
  function masteryCard(sec) {
    const S = SECTIONS[sec];
    const body = domainsOf(sec).map((dom) => `<div class="domain"><h3><span class="dot" style="background:${DOMAIN_COLORS[dom]}"></span>${esc(dom)}</h3>` +
      SKILLS.filter((s) => s.section === sec && s.domain === dom).map((s) => {
        const pct = Math.round(skillStats(s.id).mastery * 100);
        return `<a class="skill-row" href="#/practice?skill=${s.id}&start=1" title="Practice ${esc(s.name)}"><span class="skill-name">${esc(s.name)}</span>` +
          `<div class="bar"><div class="bar-fill" style="width:${pct}%;background:${pct >= 80 ? 'var(--gold)' : DOMAIN_COLORS[dom]}"></div></div>` +
          `<span class="skill-pct">${pct}%</span></a>`;
      }).join('') + '</div>').join('');
    return `<section class="card"><h2>${S.icon} ${S.name}</h2><p class="muted small">Mastery = share of questions right on your latest try. Click a skill to practice it.</p>${body}</section>`;
  }
  function renderDashboard() {
    const day = dayRec(dateKey());
    const goal = state.dailyGoal;
    const streak = currentStreak();
    const lv = levelInfo(state.xp);
    const total = totalAnswered();
    const acc = total ? Math.round((totalRight() / total) * 100) : 0;
    const left = daysUntil(state.plan.testDate);
    const need = Math.max(0, goal - day.answered);

    let streakMsg;
    if (day.goalMet) streakMsg = `🔥 Goal done for today. Your ${streak}-day streak is safe!`;
    else if (streak > 0) streakMsg = `🔥 ${need} more question${need === 1 ? '' : 's'} to keep your ${streak}-day streak alive`;
    else streakMsg = `🌱 ${need} question${need === 1 ? '' : 's'} today starts your streak`;

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

    const rw = latestScore('rw'), math = latestScore('math');
    const scoreLine = rw || math
      ? `<div class="hero-scores"><span>📖 ${rw || '—'}</span><span>📐 ${math || '—'}</span>${rw && math ? `<span class="total">≈ ${rw + math}</span>` : ''}</div>`
      : '';

    setView(`<div class="page">
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">${greeting()} 👋</p>
          <h1>Keep climbing.</h1>
          <p class="hero-sub">${streakMsg}</p>
          <div class="btn-row">
            <a class="btn hero-btn" href="#/practice?section=all&start=1">▶ Practice now</a>
            ${left !== null && left >= 0 ? `<span class="hero-chip">🗓️ ${left} day${left === 1 ? '' : 's'} to test day</span>` : `<a class="hero-chip" href="#/planner">🗓️ Set your test date</a>`}
          </div>
          ${scoreLine}
        </div>
        <div class="hero-art">${mountainSvg(lv.into / lv.span)}<div class="hero-level">Level ${lv.level} · ${lv.title}</div></div>
      </section>
      <div class="stat-grid">
        <div class="card stat streak-card ${streak > 0 ? 'lit' : ''}"><div class="stat-icon flame">🔥</div><div><div class="stat-num">${streak}</div><div class="stat-label">day streak</div><div class="muted small">Best: ${state.bestStreak}</div></div></div>
        <div class="card stat">${ringSvg(day.answered / goal, "Today's goal progress")}<div><div class="stat-num">${day.answered}/${goal}</div><div class="stat-label">today's goal</div></div></div>
        <div class="card stat"><div class="stat-icon">⭐</div><div style="flex:1"><div class="stat-num">${state.xp} XP</div><div class="stat-label">Level ${lv.level}</div>
          <div class="bar thin" style="margin:6px 0 4px"><div class="bar-fill gold" style="width:${(lv.into / lv.span) * 100}%"></div></div><div class="muted small">${lv.span - lv.into} XP to level ${lv.level + 1}</div></div></div>
        <div class="card stat"><div class="stat-icon">✅</div><div><div class="stat-num">${total}</div><div class="stat-label">answered</div><div class="muted small">${acc}% accuracy</div></div></div>
      </div>
      <div class="grid-2">
        <section class="card"><h2>Today's plan</h2><ul class="tasks">${tasks}</ul>
          <div class="btn-row">
            <a class="btn primary" href="#/practice?skill=${weakestSkills(1, 'rw')[0]}&start=1">📖 R&W focus</a>
            <a class="btn primary alt" href="#/practice?skill=${weakestSkills(1, 'math')[0]}&start=1">📐 Math focus</a>
            <a class="btn" href="#/test">⏱️ Timed test</a>
          </div>
        </section>
        <section class="card"><h2>Last 4 weeks</h2><div class="heat">${heat}</div>
          <p class="muted small">Brighter squares mean more practice. A full square means you hit your goal that day.</p>
          <h2 style="margin-top:18px">Badges</h2>${badges}
        </section>
      </div>
      <div class="grid-2 even">${masteryCard('rw')}${masteryCard('math')}</div>
    </div>`);
  }

  // ------------------------------------------------------------------ practice
  let session = null;
  let practiceCfg = { section: 'all', scope: 'all', difficulty: 'all', filter: 'smart', count: 10 };

  function buildPool(cfg) {
    let qs = QUESTIONS.filter((q) => {
      if (cfg.scope.startsWith('domain:')) { if (skillById[q.skill].domain !== cfg.scope.slice(7)) return false; }
      else if (cfg.scope !== 'all') { if (q.skill !== cfg.scope) return false; }
      else if (cfg.section !== 'all' && sectionOf(q) !== cfg.section) return false;
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
    if (params.skill && skillById[params.skill]) { practiceCfg.scope = params.skill; practiceCfg.section = skillById[params.skill].section; }
    else if (params.section || params.start) { practiceCfg.scope = 'all'; practiceCfg.section = params.section || 'all'; }
    if (params.filter) practiceCfg.filter = params.filter;
    if (params.start) { startSession(Object.assign({}, practiceCfg)); return; }

    const seg = (name, items, cur) => `<div class="seg" data-seg="${name}">` +
      items.map(([v, l]) => `<button type="button" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('') + '</div>';
    const scopeOptions = () => {
      const secs = practiceCfg.section === 'all' ? SECTION_IDS : [practiceCfg.section];
      return `<option value="all">All skills</option>` + secs.map((sec) => domainsOf(sec).map((dom) =>
        `<optgroup label="${esc(SECTIONS[sec].short + ' · ' + dom)}"><option value="domain:${esc(dom)}">All of ${esc(dom)}</option>` +
        SKILLS.filter((s) => s.domain === dom && s.section === sec).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('') + '</optgroup>').join('')).join('');
    };

    setView(`<div class="page">
      <header class="page-head"><div><h1>Practice ✏️</h1><p class="muted">Pick a section and skill, get instant feedback, and earn XP for every question.</p></div></header>
      <section class="card">
        <div class="field" style="margin-bottom:16px"><label>Section</label>${seg('section', [['rw', '📖 Reading and Writing'], ['math', '📐 Math'], ['all', '🔀 Both']], practiceCfg.section)}</div>
        <div class="form-grid">
          <div class="field"><label for="scope">Skill</label><select id="scope"></select></div>
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
        <li>Math questions have a 🧮 Desmos calculator and a 📏 formula reference, like the real test.</li>
        <li>Keyboard: <kbd>A</kbd>–<kbd>D</kbd> to choose, <kbd>Enter</kbd> to check and continue.</li></ul>
      </section>
    </div>`);
    const scopeEl = document.getElementById('scope');
    const fillScope = () => {
      scopeEl.innerHTML = scopeOptions();
      scopeEl.value = practiceCfg.scope;
      if (scopeEl.value !== practiceCfg.scope) { practiceCfg.scope = 'all'; scopeEl.value = 'all'; }
    };
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
        if (key === 'section') fillScope();
        note();
      };
    });
    document.getElementById('start').onclick = () => startSession(Object.assign({}, practiceCfg));
    fillScope();
    note();
  }

  function startSession(cfg) {
    const qs = buildPool(cfg).slice(0, cfg.count);
    if (!qs.length) {
      setView(`<div class="page"><div class="card empty"><h2>Nothing to practice here yet</h2>` +
        `<p>${cfg.filter === 'missed' ? "You haven't missed any questions in this area. Nice!" : 'No questions match these settings.'}</p>` +
        `<a class="btn primary" href="#/practice">Choose another set</a></div></div>`);
      return;
    }
    session = { cfg, qs, i: 0, selected: null, checked: false, results: [], eliminated: new Set(), xp: 0, combo: 0 };
    renderSession();
  }

  function renderSession() {
    const s = session, q = s.qs[s.i], n = s.qs.length;
    const res = s.checked ? s.results[s.i] : null;
    const last = s.i === n - 1;
    const praise = pick(['Correct!', 'Nice work!', 'Nailed it!', 'Exactly right!', 'You got it!']);
    const combo = res && res.correct && s.combo >= 3 ? ` <span class="combo">🔥 ${s.combo} in a row!</span>` : '';
    const feedback = res ? `<div class="feedback ${res.correct ? 'ok' : 'bad'}"><span class="gain">+${res.gained} XP</span>` +
      `<strong>${res.correct ? praise : `Not quite. The answer is ${esc(answerText(q))}.`}</strong>${combo}<div class="expl">${formatPassage(q.explanation)}</div></div>` : '';
    setView(`<div class="session">
      <div class="session-bar">
        <button class="icon-btn" data-act="quit" aria-label="End session" title="End session">✕</button>
        <div class="bar"><div class="bar-fill" style="width:${((s.i + (s.checked ? 1 : 0)) / n) * 100}%"></div></div>
        <span class="muted">${s.i + 1}/${n}</span>
        <span class="xp-pill ${res && res.correct ? 'bump' : ''}">⭐ +${s.xp} XP</span>
      </div>
      ${questionHtml(q, { selected: s.selected, reveal: s.checked, eliminated: s.eliminated })}
      ${feedback}
      <div class="session-actions">
        <span class="kbd-hint muted small">${q.type === 'spr' ? '' : '<kbd>A</kbd>–<kbd>D</kbd> choose · '}<kbd>Enter</kbd> ${s.checked ? 'continue' : 'check'}</span>
        ${s.checked ? `<button class="btn primary big" data-act="next">${last ? 'See results' : 'Next'} →</button>`
          : `<button class="btn primary big" data-act="check" ${hasResponse(q, s.selected) ? '' : 'disabled'}>Check answer</button>`}
      </div>
    </div>`);
    const input = document.getElementById('spr-in');
    if (input) {
      input.oninput = () => {
        s.selected = input.value.trim();
        view.querySelector('[data-act="check"]').disabled = !hasResponse(q, s.selected);
      };
      input.onkeydown = (e) => { if (e.key === 'Enter' && hasResponse(q, s.selected)) { e.preventDefault(); checkAnswer(); } };
      input.focus();
    }
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
      if (!s.checked && q.type !== 'spr' && LETTERS.includes(k)) selectChoice(LETTERS.indexOf(k));
      else if (e.key === 'Enter') { if (s.checked) nextQuestion(); else if (hasResponse(q, s.selected)) checkAnswer(); }
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
    s.combo = r.correct ? s.combo + 1 : 0;
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
  function reviewItemHtml(q, choice, correct, label) {
    const skipped = choice === null || choice === undefined || choice === '';
    const mark = skipped ? '<span class="mark skip">–</span>' : `<span class="mark ${correct ? 'ok' : 'bad'}">${correct ? '✓' : '✗'}</span>`;
    return `<details class="review"><summary>${mark}${label} · ${esc(skillById[q.skill].name)}` +
      ` <span class="muted small">· ${skipped ? 'skipped' : 'you: ' + esc(responseText(q, choice))}, answer ${esc(answerText(q))}</span></summary>` +
      `<div class="review-body">${questionHtml(q, { selected: choice, reveal: true })}<div class="feedback ${correct ? 'ok' : 'bad'}"><div class="expl">${formatPassage(q.explanation)}</div></div></div></details>`;
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
        events.push(...grantXP(bonus), { type: 'party' });
      }
    }
    save();
    const pct = Math.round((right / results.length) * 100);
    const headline = pct === 100 ? 'Perfect set! 💯' : pct >= 80 ? 'Great job! 🎉' : pct >= 50 ? 'Solid work 💪' : 'Keep climbing ⛰️';
    const review = results.map((r, idx) => reviewItemHtml(qById[r.id], r.choice, r.correct, `Q${idx + 1}`)).join('');
    setView(`<div class="summary">
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
    </div>`);
    document.getElementById('again').onclick = () => startSession(s.cfg);
    celebrate(events);
  }

  // ------------------------------------------------------------------ timed test
  let activeTest = null;
  let timerId = null;
  let lastTestResult = null;

  // Weighted sample without replacement (Efraimidis–Spirakis), per domain, ordered like the
  // real test: by domain, then easier to harder within each domain.
  function buildModule(sec, exclude, weights) {
    const out = [];
    domainsOf(sec).forEach((dom) => {
      const pool = QUESTIONS.filter((q) => skillById[q.skill].domain === dom && sectionOf(q) === sec && !exclude.has(q.id));
      const picked = pool.map((q) => ({ q, k: Math.pow(Math.random(), 1 / weights[q.difficulty]) }))
        .sort((a, b) => b.k - a.k).slice(0, SECTIONS[sec].plan[dom]).map((x) => x.q);
      picked.sort((a, b) => a.difficulty - b.difficulty);
      out.push(...picked);
    });
    // The real Math section mixes domains, ordered roughly easy to hard.
    if (sec === 'math') out.sort((a, b) => a.difficulty - b.difficulty || Math.random() - 0.5);
    return out;
  }
  function stageInfo(t) { const [sec, m] = t.seq[t.stage]; return { sec, m, S: SECTIONS[sec] }; }
  function setupStage(t) {
    const { sec, m, S } = stageInfo(t);
    let qs;
    if (m === 1) qs = buildModule(sec, new Set(), W_MIXED);
    else {
      const first = t.results.find((r) => r.sec === sec && r.m === 1);
      t.paths[sec] = first.correct / first.total >= 0.6 ? 'harder' : 'easier';
      qs = buildModule(sec, new Set(first.items.map((it) => it.id)), t.paths[sec] === 'harder' ? W_HARDER : W_EASIER);
    }
    t.qs = qs;
    t.answers = qs.map(() => null);
    t.elim = qs.map(() => new Set());
    t.flagged = new Set();
    t.i = 0;
    t.reviewing = false;
    t.navOpen = false;
    t.warned = false;
    t.endsAt = Date.now() + S.seconds * 1000;
  }

  function renderTestSetup() {
    if (activeTest) { activeTest.between ? renderBetween() : renderTest(); return; }
    const hist = state.tests.length
      ? `<div class="table-scroll"><table class="history"><thead><tr><th>Date</th><th>Test</th><th>Correct</th><th>Est. score</th></tr></thead><tbody>` +
        state.tests.slice(0, 10).map((t) => {
          const parts = t.sections && Object.keys(t.sections).length > 1 ? ` <span class="muted small">(📖 ${t.sections.rw} · 📐 ${t.sections.math})</span>` : '';
          return `<tr><td>${new Date(t.at).toLocaleDateString()}</td><td>${esc((TEST_KINDS[t.kind] || {}).label || t.kind)}</td><td>${t.correct}/${t.total}</td><td><b>${t.score}</b>${parts}</td></tr>`;
        }).join('') + '</tbody></table></div>'
      : '<p class="muted">No practice tests yet. Your results will show up here.</p>';
    setView(`<div class="page">
      <header class="page-head"><div><h1>Practice Test ⏱️</h1><p class="muted">Timed and test-day style: cross out choices, mark questions for review, jump between questions, and use the calculator on Math.</p></div></header>
      <div class="test-options">
        <section class="card test-card"><div class="test-emoji">⏱️</div><h2>Single module</h2>
          <p class="muted">One timed module with mixed difficulty. Good for a weekday session.</p>
          <div class="btn-row"><button class="btn primary" data-kind="rw-module">📖 R&W · 27 q · 32 min</button><button class="btn primary alt" data-kind="math-module">📐 Math · 22 q · 35 min</button></div></section>
        <section class="card test-card"><div class="test-emoji">🏁</div><h2>Full section</h2>
          <p class="muted">Two adaptive modules: how you do on Module 1 sets Module 2's difficulty, like the real test.</p>
          <div class="btn-row"><button class="btn primary" data-kind="rw-full">📖 R&W · 54 q · 64 min</button><button class="btn primary alt" data-kind="math-full">📐 Math · 44 q · 70 min</button></div></section>
        <section class="card test-card featured"><div class="test-emoji">🎓</div><h2>Full-length SAT</h2>
          <p class="muted">All four modules in test-day order: 98 questions, 2 hours 14 minutes, scored 400–1600.</p>
          <button class="btn primary big" data-kind="sat-full">Start full SAT</button></section>
      </div>
      <section class="card"><h2>Your results</h2>${hist}
        <p class="muted small" style="margin-top:12px">Scores are rough estimates, not official College Board scores.</p></section>
      <section class="card"><h2>🏛️ Official practice (free)</h2>
        <p class="muted">For real past-style SAT questions, use College Board's own free materials alongside SAT Climb:</p>
        <ul class="link-list">
          <li><a href="https://bluebook.collegeboard.org/" target="_blank" rel="noopener">Bluebook</a>: the official testing app, with full-length adaptive practice tests</li>
          <li><a href="https://satsuitequestionbank.collegeboard.org/" target="_blank" rel="noopener">SAT Suite Question Bank</a>: thousands of official questions you can filter by skill and difficulty</li>
          <li><a href="https://satsuite.collegeboard.org/sat/practice-preparation" target="_blank" rel="noopener">College Board practice and preparation</a>: practice tests, guides, and links to Khan Academy</li>
        </ul></section>
    </div>`);
    view.querySelectorAll('[data-kind]').forEach((b) => { b.onclick = () => startTest(b.dataset.kind); });
  }

  function startTest(kind) {
    activeTest = { kind, seq: TEST_KINDS[kind].seq, stage: 0, results: [], paths: {}, hideTimer: false, between: false, events: [] };
    setupStage(activeTest);
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
    const { sec, m, S } = stageInfo(t);
    const left = (t.endsAt - Date.now()) / 1000;
    const mods = t.seq.filter(([s2]) => s2 === sec).length;
    const title = `${S.icon} ${S.name} · Module ${m}${mods > 1 ? ' of 2' : ''}`;
    const answered = (i) => hasResponse(t.qs[i], t.answers[i]);
    const grid = `<div class="navgrid">${t.qs.map((_, i) => `<button data-jump="${i}" class="${answered(i) ? 'answered' : ''} ${t.flagged.has(i) ? 'flagged' : ''} ${i === t.i && !t.reviewing ? 'current' : ''}">${i + 1}</button>`).join('')}</div>`;
    const legend = `<div class="legend"><span>▢ Unanswered</span><span style="color:var(--primary)">■ Answered</span><span style="color:var(--bad)">⚑ Marked for review</span></div>`;
    const answeredCount = t.qs.filter((_, i) => answered(i)).length;
    const body = t.reviewing
      ? `<div class="card"><h2>Check your work</h2><p class="muted">You've answered ${answeredCount} of ${n}. Select a number to go back to it, or submit when you're ready.</p>${legend}${grid}
          <button class="btn primary big" data-act="submit">Submit module</button></div>`
      : `<div class="test-qhead"><span class="qnum">${t.i + 1}</span><button class="flag ${t.flagged.has(t.i) ? 'on' : ''}" data-act="flag">${t.flagged.has(t.i) ? '⚑ Marked for review' : '⚐ Mark for review'}</button></div>
         ${questionHtml(q, { selected: t.answers[t.i], eliminated: t.elim[t.i], meta: false })}`;
    setView(`<div class="test">
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
    </div>`);
    const input = document.getElementById('spr-in');
    if (input) {
      input.oninput = () => { t.answers[t.i] = input.value.trim() || null; };
      input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); if (t.i < n - 1) t.i++; else t.reviewing = true; renderTest(); } };
    }
    view.onclick = (e) => {
      const b = e.target.closest('button'); if (!b || b.dataset.tool) return;
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
      if (q.type !== 'spr' && LETTERS.includes(k)) { t.answers[t.i] = LETTERS.indexOf(k); t.elim[t.i].delete(t.answers[t.i]); renderTest(); }
      else if (e.key === 'ArrowRight') { if (t.i < n - 1) t.i++; else t.reviewing = true; renderTest(); }
      else if (e.key === 'ArrowLeft' && t.i > 0) { t.i--; renderTest(); }
    };
  }

  function submitModule() {
    const t = activeTest;
    const { sec, m } = stageInfo(t);
    stopTimer();
    let correct = 0;
    const items = t.qs.map((q, i) => {
      const ch = hasResponse(q, t.answers[i]) ? t.answers[i] : null;
      const ok = isCorrect(q, ch);
      if (ch !== null) { const r = recordAnswer(q, ch); t.events.push(...r.events); }
      if (ok) correct++;
      return { id: q.id, choice: ch, correct: ok };
    });
    t.results.push({ sec, m, correct, total: t.qs.length, items });
    if (t.stage < t.seq.length - 1) {
      t.stage++;
      setupStage(t);
      t.between = true;
      renderBetween();
      return;
    }
    finishTest();
  }
  function renderBetween() {
    keyHandler = null;
    view.onclick = null;
    const t = activeTest;
    const { sec, m, S } = stageInfo(t);
    const prev = t.results[t.results.length - 1];
    const sectionBreak = prev.sec !== sec;
    setView(`<div class="summary"><div class="card" style="padding:40px">
      <div style="font-size:3rem">${sectionBreak ? '🧃' : '☕'}</div>
      <h1>${sectionBreak ? `${SECTIONS[prev.sec].name} complete!` : `Module ${prev.m} complete`}</h1>
      <p class="muted">${sectionBreak ? 'On test day you get a 10-minute break here. Stretch, grab water, and come back ready.' : 'Take a breath.'}</p>
      <p>Next: <b>${S.icon} ${S.name} · Module ${m}</b> · ${t.qs.length} questions · ${S.seconds / 60} minutes. The clock starts when you press start.</p>
      <button class="btn primary big" id="next-stage">Start →</button></div></div>`);
    document.getElementById('next-stage').onclick = () => {
      t.between = false;
      t.endsAt = Date.now() + S.seconds * 1000;
      renderTest();
      startTimer();
    };
  }
  function sectionScore(mods, path) {
    const correct = mods.reduce((n, r) => n + r.correct, 0);
    const total = mods.reduce((n, r) => n + r.total, 0);
    const p = correct / total;
    let score;
    if (mods.length === 1) score = 200 + 600 * p;
    // The easier Module 2 caps how high a real section score can go; the harder one does not.
    else if (path === 'harder') score = 200 + 600 * (0.2 + 0.8 * p);
    else score = Math.min(650, 200 + 500 * p);
    return { score: Math.min(800, Math.max(200, round10(score))), correct, total };
  }
  function estimate(t) {
    const sections = {};
    SECTION_IDS.forEach((sec) => {
      const mods = t.results.filter((r) => r.sec === sec);
      if (mods.length) sections[sec] = sectionScore(mods, t.paths[sec]);
    });
    const keys = Object.keys(sections);
    const score = keys.reduce((n, k) => n + sections[k].score, 0);
    const correct = keys.reduce((n, k) => n + sections[k].correct, 0);
    const total = keys.reduce((n, k) => n + sections[k].total, 0);
    return { sections, score, correct, total };
  }
  function finishTest() {
    const t = activeTest;
    const est = estimate(t);
    state.tests.unshift({
      at: Date.now(), kind: t.kind, score: est.score, correct: est.correct, total: est.total,
      sections: Object.fromEntries(Object.entries(est.sections).map(([k, v]) => [k, v.score])), paths: t.paths,
    });
    today().done.test = true;
    t.events.push(...grantXP(TEST_BONUS), { type: 'party' });
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
    const all = t.results.flatMap((r) => r.items);
    const secs = Object.keys(est.sections);
    const twoSections = secs.length > 1;
    const domainRows = secs.map((sec) => domainsOf(sec).map((dom) => {
      const its = all.filter((it) => skillById[qById[it.id].skill].domain === dom && sectionOf(qById[it.id]) === sec);
      const c = its.filter((it) => it.correct).length;
      return `<div class="skill-row static"><span class="skill-name">${esc(dom)}</span><div class="bar"><div class="bar-fill" style="width:${its.length ? (c / its.length) * 100 : 0}%;background:${DOMAIN_COLORS[dom]}"></div></div><span class="skill-pct">${c}/${its.length}</span></div>`;
    }).join('')).join('');
    const mods = t.results.map((r) => `<div class="card"><div class="stat-num">${r.correct}/${r.total}</div><div class="stat-label">${SECTIONS[r.sec].icon} Module ${r.m}${r.m === 2 ? ` (${t.paths[r.sec]})` : ''}</div></div>`).join('');
    const sectionCards = twoSections ? `<div class="summary-stats" style="grid-template-columns:1fr 1fr">${secs.map((sec) =>
      `<div class="card"><div class="stat-num">${est.sections[sec].score}</div><div class="stat-label">${SECTIONS[sec].icon} ${SECTIONS[sec].name}</div></div>`).join('')}</div>` : '';
    const review = t.results.map((r) => r.items.map((it, idx) =>
      reviewItemHtml(qById[it.id], it.choice, it.correct, `${t.results.length > 1 ? `${SECTIONS[r.sec].short} M${r.m} ` : ''}Q${idx + 1}`)).join('')).join('');
    setView(`<div class="summary">
      <h1>${t.kind === 'sat-full' ? 'Full SAT complete 🎓' : t.results.length > 1 ? 'Section complete 🏁' : 'Module complete ⏱️'}</h1>
      <p class="muted">Estimated ${twoSections ? 'total' : SECTIONS[secs[0]].name} score</p>
      <div class="big-score">${est.score}</div>
      <p class="muted small">${est.correct}/${est.total} correct · rough estimate, not an official score · +${TEST_BONUS} XP</p>
      ${sectionCards}
      <div class="summary-stats" style="grid-template-columns:repeat(${Math.min(t.results.length, 4)}, 1fr)">${mods}</div>
      <div class="card" style="text-align:left"><h2>By content area</h2>${domainRows}</div>
      <div class="btn-row" style="justify-content:center;margin-top:20px"><a class="btn primary" href="#/test">Back to tests</a><a class="btn" href="#/dashboard">Dashboard</a></div>
      <div class="review-list"><h2>Review every question</h2>${review}</div>
    </div>`);
  }

  // ------------------------------------------------------------------ planner
  function renderPlanner() {
    const p = state.plan;
    const left = daysUntil(p.testDate);
    const rw = latestScore('rw'), math = latestScore('math');
    const plan = weeklyPlan();
    const todayIdx = (new Date().getDay() + 6) % 7;
    const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const week = plan.map((it, i) => `<div class="week-day ${i === todayIdx ? 'today' : ''}"><span class="dname">${names[i]}${i === todayIdx ? ' · today' : ''}</span>` +
      `<span class="dtask">${esc(it.label)}</span><a class="btn small" href="${it.href}">Go</a></div>`).join('');
    const focus = weakestSkills(2, 'rw').concat(weakestSkills(2, 'math')).map((id) => skillTag(id)).join('');
    let outlook = '<p class="muted">Set your test date to see a countdown.</p>';
    if (left !== null) {
      if (left < 0) outlook = '<p>Your test date has passed. Set a new one to keep planning.</p>';
      else outlook = `<p><b>${left}</b> day${left === 1 ? '' : 's'} to go${left >= 7 ? ` (about ${Math.floor(left / 7)} week${left >= 14 ? 's' : ''})` : ''}. ` +
        `At ${state.dailyGoal} questions a day, that's about <b>${left * state.dailyGoal}</b> more practice questions.</p>` +
        (left <= 14 ? '<p>⚡ Test day is close: your plan now includes a full practice SAT mid-week.</p>' : '');
    }
    const est = rw && math
      ? `<p>Latest estimate: <b>${rw + math}</b> (📖 ${rw} + 📐 ${math}) · target <b>${p.target}</b> · ${p.target - rw - math > 0 ? `${p.target - rw - math} points to go` : 'on target! 🎉'}</p>`
      : `<p class="muted">Latest estimates: 📖 ${rw || 'none yet'} · 📐 ${math || 'none yet'}. Take a <a href="#/test">timed test</a> in each section to track progress toward your target of <b>${p.target}</b>.</p>`;
    setView(`<div class="page">
      <header class="page-head"><div><h1>Study Plan 🗓️</h1><p class="muted">Tell us your test date and goal. Your week updates itself to target your weakest skills in both sections.</p></div></header>
      <section class="card">
        <div class="form-grid">
          <div class="field"><label for="date">Test date</label><input type="date" id="date" value="${esc(p.testDate)}"></div>
          <div class="field"><label for="target">Target total score (400–1600)</label><input type="number" id="target" min="400" max="1600" step="10" value="${p.target}"></div>
          <div class="field"><label for="goal">Daily goal (questions)</label><input type="number" id="goal" min="5" max="100" value="${state.dailyGoal}"></div>
          <div class="field"><label>Daily study time</label><div class="seg" id="mins">${[15, 30, 45, 60].map((m) => `<button type="button" data-m="${m}" class="${p.minutes === m ? 'on' : ''}">${m} min</button>`).join('')}</div></div>
        </div>
        <p class="muted small" style="margin-top:12px">Picking a study time suggests a goal of about one question every 2 minutes, counting review time.</p>
        <button class="btn primary" id="save-plan" style="margin-top:8px">Save plan</button>
      </section>
      <section class="card"><h2>Outlook</h2>${outlook}${est}<h2 style="margin-top:16px">Focus skills</h2><p class="muted small">Your two weakest or least-practiced skills in each section right now.</p><div class="focus-list">${focus}</div></section>
      <section class="card"><h2>This week</h2><div class="week">${week}</div></section>
      <section class="card"><h2>Reset</h2><p class="muted small">Progress lives only in this browser. Resetting erases XP, streaks, badges, and history.</p><button class="btn danger" id="reset">Reset all progress</button></section>
    </div>`);
    const minsEl = document.getElementById('mins');
    minsEl.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      minsEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      document.getElementById('goal').value = Math.round(Number(b.dataset.m) / 2);
    };
    document.getElementById('save-plan').onclick = () => {
      const on = minsEl.querySelector('.on');
      p.testDate = document.getElementById('date').value;
      p.target = Math.min(1600, Math.max(400, round10(Number(document.getElementById('target').value) || 1200)));
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
    setView(`<div class="page">
      <header class="page-head"><div><h1>Achievements 🏅</h1><p class="muted">${earned} of ${BADGES.length} badges earned</p></div></header>
      <section class="hero slim"><div class="level-num">${lv.level}</div><div style="flex:1">
        <h2>${lv.title}</h2><div class="bar hero-bar"><div class="bar-fill gold" style="width:${(lv.into / lv.span) * 100}%"></div></div>
        <p class="small">${state.xp} XP total · ${lv.span - lv.into} XP to level ${lv.level + 1}</p>
        <p class="small hero-sub">Earn XP: easy +10 · medium +15 · hard +20 · wrong answers +2 for trying · daily goal +${GOAL_BONUS} · timed test +${TEST_BONUS} · perfect set +${PERFECT_BONUS}</p></div></section>
      <div class="badge-grid" style="margin-top:20px">${BADGES.map((b) => `<div class="card badge-card ${state.badges[b.id] ? 'earned' : 'locked'}">
        <div class="bicon">${b.icon}</div><h3>${esc(b.name)}</h3><p class="muted small">${esc(b.desc)}</p>
        ${state.badges[b.id] ? `<span class="tag">Earned ${esc(state.badges[b.id])}</span>` : '<span class="muted small">🔒 Locked</span>'}</div>`).join('')}</div>
    </div>`);
  }

  // ------------------------------------------------------------------ router
  let keyHandler = null;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { const m = document.querySelector('.modal'); if (m) { m.remove(); return; } }
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
    document.querySelectorAll('.modal').forEach((m) => m.remove());
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === r));
    routes[r](parseQuery(query));
    renderSidebar();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
