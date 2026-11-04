# SAT Climb

A free practice site for the digital SAT, covering **Reading and Writing** and **Math**, built to feel
like a game: daily goals, streaks, XP and levels, badges, confetti, and a study planner that targets
your weakest skills.

No build step, no server, no accounts. It is plain HTML, CSS, and JavaScript.

## Run it

Live site: <https://huiseongsong2023-code.github.io/sat-climb/>

To run it locally, open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit <http://localhost:8000>.

Progress (XP, streaks, answers, badges, plan) is saved in the browser's `localStorage`. It stays on
that device and in that browser.

## What's in it

| Page | What it does |
|---|---|
| Dashboard | Hero banner with a level-progress mountain, streak, daily goal ring, XP, today's plan, 4-week activity grid, skill mastery for both sections |
| Practice | Pick a section, skill, difficulty, and set size; instant feedback and explanations; cross out choices; combo streaks; keyboard shortcuts |
| Practice Test | Single timed modules, full adaptive sections, or a full-length SAT (4 modules, 98 questions, scored 400–1600) |
| Study Plan | Test date, target score, daily goal; builds a Mon–Sun schedule around your weakest skills in each section |
| Achievements | Level progress and 16 badges |

Math questions render with KaTeX, support typed-in answers (student-produced responses) as well as
multiple choice, and include a Desmos calculator button and a formula reference sheet, like the real
test.

## Files

```
./
  index.html                page shell and navigation
  css/styles.css            all styling (light and dark mode, mobile layout)
  js/questions.js           Reading and Writing question bank and skills
  js/questions-math.js      Math question bank and skills
  js/app.js                 everything else: state, gamification, views, tests
  vendor/katex/             KaTeX 0.16.11 for math rendering (MIT license)
  tools/check-questions.js  validates both question banks
```

## Adding questions

1. **Reading and Writing:** add entries at the end of the right skill section in `js/questions.js`.
   **Math:** add `###` blocks to `js/questions-math.js`. Each file explains its format at the top.
   Don't reorder or delete existing questions: IDs come from their position, and saved progress is
   keyed by ID.
2. Run the checker:

   ```bash
   node tools/check-questions.js
   ```

   It catches missing fields, bad answers, and duplicate choices, and prints counts by skill,
   difficulty, and answer type.

**Copyright:** only add questions you wrote yourself or that you have the right to publish. Official
College Board/Bluebook questions, Khan Academy questions, and commercial prep-book questions are
copyrighted. Use them as models for new questions, not as content. The Practice Test page links to
College Board's free official practice instead.

## Status

- 200 original draft questions: 100 Reading and Writing (10 per skill) and 100 Math across 18 skills,
  28 of them typed-in answers. **They haven't been human-reviewed yet.** The Math answers were
  double-checked with a computer algebra system.
- Score estimates are rough and are not official scores.

## Ideas for later

- Accounts and cloud sync, so progress follows students across devices
- Many more questions, plus a "report a problem" button on each question
- Geometry figures and graphs for Math questions
- Vocabulary flashcards with spaced repetition
- Leaderboards or study groups with friends
