# Atölye

An interactive learning platform for the *30 Days of Python* course (by Asabeneh Yetayeh, https://github.com/Asabeneh/30-Days-Of-Python).
A static single-page app: Python runs in the browser (Pyodide in a Web Worker), progress is saved in `localStorage`.
The interface is Turkish, the lesson text stays the original English.

Each day opens in **Öğren** (learn): the day's concept blocks run one step at a time (predict, worked example, fill the blanks,
order the lines, modify, write against tests, debug, explain, retype from memory) with a hint ladder, a gated and staged solution,
twin exercises, XP, levels, badges, a streak and spaced review (Leitner boxes 1, 3, 7, 14, 30 days). **Ders metni** keeps the
original lesson text with runnable (collapsed) cells as a reference. The design follows `docs/pedagogy-research.md`.

## Commands

```bash
npm install
npm run dev        # dev server (runs the prepare step first)
npm run build      # prepare + tsc --noEmit + vite build -> dist/
npm run preview    # serves dist/ on 127.0.0.1:4173
```

`scripts/prepare.mjs` runs before `dev` and `build`. It reads the course one folder up (read-only) and writes
`public/lessons/NN.md` (the lessons, fetched one at a time), `src/data/previews.generated.json` (home page previews),
copies `../images` to `public/course-images` and `content/exercises/*.json` to `public/exercises/`. All of these outputs are
git-ignored. The course repository itself is never modified.

`dist/` is plain static files with relative URLs; it works from any static host or sub-path.
Pyodide (v314.0.7) is loaded from the jsDelivr CDN the first time Python runs, so it needs a network connection once per browser.

## Exercises

`content/exercises/dayNN.json` (schema: `docs/pedagogy-research.md` section 6.2, validators in `content/tools/`). The loader fetches
one day at a time; a missing file shows "bu günün alıştırmaları hazırlanıyor". Tests are `assert` snippets executed after the
learner's code in the same fresh namespace (learner stdout is `__stdout__`), with an 8 second limit (the worker restarts on timeout).

## Layout

```
scripts/prepare.mjs          course + exercises -> public/, previews JSON
src/data/days.ts             the 30 days, the 5 parts, Turkish teasers
src/lib/store.ts             all progress: XP, badges, exercises, review boxes, streak, settings; export/import JSON
src/lib/exercises.ts         exercise types, per-day loader, step order, output diff
src/lib/game.ts              levels (print ... generator), XP rules, badges, streak bonuses
src/lib/review.ts            Leitner scheduling, review session and end-of-day quiz builders
src/lib/runner.ts            worker client: run, check (tests + timeout), stop
src/lib/py.worker.ts         Pyodide worker
src/lib/expect.ts            "beklenen çıktıyla aynı": compares printed lines with trailing # comments (heuristic)
src/lib/errors.ts            Turkish one-line hints for common Python errors
src/lib/lesson.ts            Markdown -> HTML (loaded only for the text tab)
src/components/learn/        the learn flow: Learn, StepView, Predict, FillBlank, Parsons, EditStep, TypeExplain, Session, ReviewPage
src/components/Reader.tsx    lesson screen: tabs, day list, reading bar, mini table of contents
src/components/Home.tsx      landing page; HomeScenes.tsx holds the hero, map, parts, how-it-works
src/home/snake.ts            the hero snake (OGL, one instanced draw call); scenes.ts is GSAP ScrollTrigger + Lenis
src/components/{Hud,Palette,Toasts,Celebrate,Modal}.tsx   game HUD, ⌘K, XP/badge/level feedback, day-done burst
src/styles/*.css             tokens, base, home, scenes, band, reader, learn, pyview
```

## Notes

- GSAP, Lenis and OGL live in one lazy chunk (`scenes`) that only the home page loads, and only when motion is allowed and the
  screen is wider than 1100px. Reduced motion, phones and tablets get the complete static page (SVG snake, stacked parts).
- CodeMirror loads only when an editable editor opens; read-only code uses a small built-in highlighter (`PyView`).
- Days 22 and 26-29 need a server, network or local files; they show a note to run the examples in the repo's `.venv`.
- Keyboard: Shift+Enter runs, Ctrl/Cmd+Enter checks, Enter submits (predict, fill), Esc leaves the editor (Tab indents inside it),
  `j` / `k` go to the next / previous day, Ctrl/Cmd+K opens the command palette.
