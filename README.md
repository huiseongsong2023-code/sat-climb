# SAT Climb

A free practice site for the digital SAT **Reading and Writing** section, built to feel like a game:
daily goals, streaks, XP and levels, badges, and a study planner that targets your weakest skills.

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
| Dashboard | Streak, daily goal ring, level/XP, today's plan checklist, 4-week activity grid, skill mastery bars |
| Practice | Pick a skill, difficulty, and set size; instant feedback and explanations; cross out choices; keyboard shortcuts |
| Practice Test | Timed 27-question module (32 min), or a full 2-module adaptive section with a rough score estimate |
| Study Plan | Test date, target score, daily goal; builds a Mon–Sun schedule around your 3 weakest skills |
| Achievements | Level progress and 13 badges |

## Files

```
./
  index.html              page shell and navigation
  css/styles.css          all styling (light and dark mode, mobile layout)
  js/questions.js         the question bank and skill list
  js/app.js               everything else: state, gamification, views
  tools/check-questions.js  validates the question bank
```

## Adding questions

1. Open `js/questions.js` and **add new entries at the end of the right skill section**. The format is
   documented at the top of the file. Don't reorder or delete existing questions: IDs come from their
   position, and saved progress is keyed by ID.
2. Run the checker:

   ```bash
   node tools/check-questions.js
   ```

   It catches missing fields, bad answer letters, and duplicate choices, and prints counts by skill,
   difficulty, and answer letter.

**Copyright:** only add questions you wrote yourself or that you have the right to publish. Official
College Board/Bluebook questions, Khan Academy questions, and commercial prep-book questions are
copyrighted. Use them as models for new questions, not as content.

## Status

- 100 original draft questions: 10 per skill, 3 easy / 4 medium / 3 hard. **They haven't been
  reviewed yet.** Read through them and fix anything unclear or wrong.
- Reading and Writing only. Math is a possible later addition.
- Score estimates are rough and are not official scores.

## Ideas for later

- Accounts and cloud sync, so progress follows students across devices
- Many more questions, plus a "report a problem" button on each question
- Vocabulary flashcards with spaced repetition
- Leaderboards or study groups with friends
- Math section with a built-in graphing calculator

