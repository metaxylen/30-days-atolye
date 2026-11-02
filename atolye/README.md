# Atölye

Atölye (Turkish for "workshop") is an interactive, in-browser Python course: 30 days of lessons you learn by predicting, running and writing code instead of reading long pages. Everything runs in the browser, Python included, so there is nothing to install to learn with it.

The interface and all lesson content are available in Turkish and English, switchable at any time.

## What it does

- **Lesson cards (Anlatım / Lesson).** Each day is a deck of 30-45 short cards with one idea per card: an explanation, live code you can edit and run, "guess the output first" cards, fill-in-the-blank, true/false, put-the-lines-in-order, and a recap. Every section follows the same arc: a concrete example, how it works underneath, a second realistic example, a common mistake with the real error Python prints, and a checkpoint.
- **Step-by-step visualizer.** "Adım adım" runs the card's code line by line under `sys.settrace` and shows the current line, the variables changing and the output so far, with a scrubber and autoplay.
- **Flip a card for the source text.** Double-click a card (or press `F`, or "See the original") and it turns over to show the matching part of the original course text, cut to that card's section and never repeated across cards.
- **Side columns that teach.** On wide screens, the left column lists the day's sections and curated outside resources (official docs, articles, videos, interactive tools; every link checked). The right column shows the glossary terms used on the current card, reminders from earlier days, a hint on question cards, and the keyboard shortcuts. On phones the same boxes open from a "Notes" button.
- **Practice (Öğren / Practice).** Each concept block ramps from predict → fill the blank / order the lines → debug → modify → write, then a realistic mini task. Code is checked by hidden tests that run your program on new inputs, so hard-coded answers do not pass. Hints come in three rungs and never give away the solution; the full solution is shown in stages, followed by a twin exercise.
- **Remembering it.** XP, levels, badges and a daily streak; spaced review with Leitner boxes (1, 3, 7, 14, 30 days); a 60-second speed round; a daily bug hunt; and an end-of-part project ("boss") after each of the five parts.
- **Progress stays with you.** All progress is saved in the browser (`localStorage`) and can be exported and imported as JSON. No account, no server.

Content size: 1,069 lesson cards, 1,045 exercises, 5 end-of-part projects (20 stages), 219 glossary terms and 225 outside resources across the 30 days.

## Quick start

Requirements: Node.js 20.19+ or 22.12+ (what Vite 8 needs) and npm. The app expects to sit inside a copy of the course repository (see "How it is built").

```bash
cd atolye
npm install
npm run dev        # development server with hot reload
```

Open the URL Vite prints (usually http://localhost:5173). The first time you run Python in a browser, Pyodide is downloaded from the jsDelivr CDN and kept in the browser's Cache Storage, so later visits load it without the network.

Production build:

```bash
npm run build      # prepare step + type check + vite build -> dist/
npm run preview    # serves dist/ on http://127.0.0.1:4173
```

`dist/` is plain static files with relative URLs, so it can be served from any static host or sub-path (GitHub Pages, Netlify, an S3 bucket, `python3 -m http.server`).

## Using it

1. Open the home page and try the Python console on the right, or pick a day on the 30-day map.
2. Each day opens on **Lesson**: move through the cards with the arrow keys, the buttons, or a swipe. Answer the checkpoints; they pay a little XP on the first try.
3. Switch to **Practice** for the day's exercises. Write your code in the editor, press **Check**; failed tests tell you what to look at, not the answer.
4. Come back daily: the **Review** counter in the header shows the concepts due for spaced repetition.

Keyboard shortcuts: `←` / `→` previous / next card, `Shift+Enter` run code, `F` flip the card, `Esc` back to the front, `Alt+L` switch language, `⌘K` / `Ctrl+K` command palette.

## How it is built

- **Stack:** Vite + React + TypeScript, plain CSS with design tokens, CodeMirror 6 for the editor, markdown-it for the original lesson text. GSAP, Lenis and OGL power the home page scroll scenes and are loaded only there, only when motion is allowed.
- **Python in the browser:** Pyodide runs in a Web Worker (`src/lib/py.worker.ts`), so a long-running program never freezes the page; each check runs in a fresh namespace with a time limit, and the worker is restarted on timeout.
- **Content is data:** lessons, exercises, projects, glossary and resources live as JSON under `content/` and are loaded one day at a time.
- **Prepare step:** `scripts/prepare.mjs` runs before `dev` and `build`. It reads the original course one folder up (read-only), and writes the lesson Markdown, the home page previews and copies of the content into `public/`. These generated files are git-ignored.
- **Updates reach open tabs:** each build writes `version.json`; an open tab checks it and reloads itself on the next page change (or offers a "Reload now" bar while you are typing).

```
atolye/
  content/
    cards/dayNN.json        lesson cards per day
    exercises/dayNN.json    practice blocks and exercises per day
    bosses/partN.json       end-of-part projects
    glossary.json           glossary terms (TR/EN, with examples)
    resources.json          curated outside resources per day and section
    tools/                  content validators (Python)
  docs/
    pedagogy-research.md    the learning research the design follows
    briefs/                 writing standard and term list used for the content
  scripts/
    prepare.mjs             course + content -> public/
    e2e.mjs                 end-to-end tests in a real Chrome
  src/
    components/             screens: home, lesson cards, practice, review, games
    lib/                    Python worker, exercise runner, progress store, i18n, review scheduling
    styles/                 tokens and screen styles
```

## Checks

**Content validators** run every code sample, compare it with the stated output, run every exercise's reference solution against its tests, and make sure starter code and hard-coded answers fail. They need Python 3.12+ with `numpy` and `pandas`:

```bash
# from the repository root
python3 -m venv .venv && .venv/bin/pip install numpy pandas
.venv/bin/python atolye/content/tools/validate_cards_d01-10.py   # also d11-20, d21-30
.venv/bin/python atolye/content/tools/validate_d01-10.py         # exercises; also d11-20, d21-30
.venv/bin/python atolye/content/tools/validate_bosses.py
```

**End-to-end tests** drive the built site in a real Chrome through `playwright-core` (not listed in `package.json`; install it with `npm i -D playwright-core`) and need Google Chrome installed:

```bash
npm run build
node scripts/e2e.mjs                 # all tests
node scripts/e2e.mjs --only name     # selected tests, comma-separated
```

## Credits

The course outline and the original lesson text are based on [30 Days of Python](https://github.com/Asabeneh/30-Days-Of-Python) by Asabeneh Yetayeh.
