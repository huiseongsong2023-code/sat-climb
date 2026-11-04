#!/usr/bin/env node
// Sanity-checks the question bank: required fields, valid answers, duplicate choices,
// and how questions are spread across skills, difficulties, and answer letters.
// Usage: node tools/check-questions.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = { window: {} };
for (const name of ['questions.js', 'questions-math.js']) {
  const file = path.join(__dirname, '..', 'js', name);
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
}
const skills = sandbox.window.SAT_SKILLS;
const questions = sandbox.window.SAT_QUESTIONS;
const skillIds = new Set(skills.map((s) => s.id));
const SPR_RE = /^-?(\d+\/\d+|\d+\.?\d*|\.\d+)$/;

const errors = [];
const ids = new Set();
for (const q of questions) {
  const where = q.id;
  const skill = skills.find((s) => s.id === q.skill);
  if (ids.has(q.id)) errors.push(`${where}: duplicate id`);
  ids.add(q.id);
  if (!skill) { errors.push(`${where}: unknown skill "${q.skill}"`); continue; }
  if (!['rw', 'math'].includes(skill.section)) errors.push(`${where}: skill has no section`);
  if (![1, 2, 3].includes(q.difficulty)) errors.push(`${where}: difficulty must be 1, 2 or 3`);
  if (!q.passage || !q.passage.trim()) errors.push(`${where}: empty passage`);
  if (skill.section === 'rw' && !q.question) errors.push(`${where}: missing question stem`);
  if (q.type === 'spr') {
    if (!q.answers || !q.answers.length) errors.push(`${where}: student-produced response needs accepted answers`);
    else q.answers.filter((a) => !SPR_RE.test(a)).forEach((a) => errors.push(`${where}: accepted answer "${a}" is not a number or fraction`));
  } else {
    if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(`${where}: needs exactly 4 choices`);
    else if (new Set(q.choices).size !== 4) errors.push(`${where}: duplicate choices`);
    if (!(q.answer >= 0 && q.answer <= 3)) errors.push(`${where}: answer must be A-D`);
  }
  if (!q.explanation || q.explanation.length < 30) errors.push(`${where}: explanation missing or too short`);
  if (q.table && !(q.table.title && q.table.headers && q.table.rows)) errors.push(`${where}: table needs title, headers, rows`);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`${questions.length} questions\n`);
for (const sec of ['rw', 'math']) {
  console.log(`${sec === 'rw' ? 'READING AND WRITING' : 'MATH'}\n` + pad('skill', 36) + pad('total', 7) + pad('easy', 6) + pad('med', 6) + pad('hard', 6) + 'typed');
  for (const s of skills.filter((x) => x.section === sec)) {
    const qs = questions.filter((q) => q.skill === s.id);
    const by = (d) => qs.filter((q) => q.difficulty === d).length;
    console.log(pad(s.name, 36) + pad(qs.length, 7) + pad(by(1), 6) + pad(by(2), 6) + pad(by(3), 6) + qs.filter((q) => q.type === 'spr').length);
  }
  console.log('');
}
const letters = [0, 1, 2, 3].map((i) => questions.filter((q) => q.type !== 'spr' && q.answer === i).length);
console.log(`\nanswer letters  A:${letters[0]}  B:${letters[1]}  C:${letters[2]}  D:${letters[3]}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('\nOK');
