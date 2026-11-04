#!/usr/bin/env node
// Sanity-checks the question bank: required fields, valid answers, duplicate choices,
// and how questions are spread across skills, difficulties, and answer letters.
// Usage: node tools/check-questions.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.join(__dirname, '..', 'js', 'questions.js');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
const skills = sandbox.window.SAT_SKILLS;
const questions = sandbox.window.SAT_QUESTIONS;
const skillIds = new Set(skills.map((s) => s.id));

const errors = [];
const ids = new Set();
for (const q of questions) {
  const where = q.id;
  if (ids.has(q.id)) errors.push(`${where}: duplicate id`);
  ids.add(q.id);
  if (!skillIds.has(q.skill)) errors.push(`${where}: unknown skill "${q.skill}"`);
  if (![1, 2, 3].includes(q.difficulty)) errors.push(`${where}: difficulty must be 1, 2 or 3`);
  if (!q.passage || !q.passage.trim()) errors.push(`${where}: empty passage`);
  if (!q.question) errors.push(`${where}: missing question stem`);
  if (!Array.isArray(q.choices) || q.choices.length !== 4) errors.push(`${where}: needs exactly 4 choices`);
  else if (new Set(q.choices).size !== 4) errors.push(`${where}: duplicate choices`);
  if (!(q.answer >= 0 && q.answer <= 3)) errors.push(`${where}: answer must be A-D`);
  if (!q.explanation || q.explanation.length < 40) errors.push(`${where}: explanation missing or too short`);
  if (q.table && !(q.table.title && q.table.headers && q.table.rows)) errors.push(`${where}: table needs title, headers, rows`);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`${questions.length} questions\n`);
console.log(pad('skill', 30) + pad('total', 7) + pad('easy', 6) + pad('med', 6) + 'hard');
for (const s of skills) {
  const qs = questions.filter((q) => q.skill === s.id);
  const by = (d) => qs.filter((q) => q.difficulty === d).length;
  console.log(pad(s.name, 30) + pad(qs.length, 7) + pad(by(1), 6) + pad(by(2), 6) + by(3));
}
const letters = [0, 1, 2, 3].map((i) => questions.filter((q) => q.answer === i).length);
console.log(`\nanswer letters  A:${letters[0]}  B:${letters[1]}  C:${letters[2]}  D:${letters[3]}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('\nOK');
