# Atölye

Atölye (Turkish for "workshop") is a website for learning Python in 30 days by writing code, not by reading long pages. Each day is a short deck of interactive lesson cards followed by practice exercises that are checked automatically. Python runs inside the browser, so a learner installs nothing. The whole interface and all content are available in Turkish and English (switch with the TR / EN button or `Alt+L`).

It is built on the [30 Days of Python](https://github.com/Asabeneh/30-Days-Of-Python) course by Asabeneh Yetayeh: same 30 topics, rewritten as cards and exercises.

## How a day works

Pick a day on the 30-day map on the home page. Every day has two tabs.

**1. Lesson (Anlatım)** is a deck of 30-45 cards, one idea per card. Move with the arrow keys, the Back / Next buttons or a swipe. Each topic goes through the same steps:

1. A concrete example comes first. Most cards have live code you can edit and run (`Shift+Enter`).
2. Then how it works underneath. "Step by step" runs the code one line at a time and shows the variables changing.
3. A second, realistic example (a shopping cart, grades, log lines).
4. A common mistake, with the exact error Python prints and how to read it.
5. A checkpoint: guess the output, fill the blank, true/false or put the lines in order. Some cards hide the output until you guess.

Double-click a card (or press `F`) and it flips to show the matching part of the original course text. On a wide screen the left column lists the day's sections and outside resources (official docs, articles, videos). The right column shows the glossary terms on the current card and reminders from earlier days.

**2. Practice (Öğren)** turns each concept into a short ladder: predict the output → fill the blanks or order the lines → fix a bug → change working code → write it yourself → a small real task. Press **Check**: hidden tests run your code on new inputs, so only a real solution passes. Hints come in three steps and never give the answer away. After a solution you get a twin exercise to try again.

Around the days there are XP and levels, a daily streak, spaced review of earlier concepts (**Review** in the header), a 60-second speed round, a daily bug hunt and an end-of-part project after each of the five parts.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20.19+ or 22.12+ (it comes with npm) and Git.

```bash
git clone https://github.com/metaxylen/30-days-atolye.git
cd 30-days-atolye/atolye
npm install        # once, installs the dependencies
npm run dev        # starts the site; open the address it prints (http://localhost:5173)
```

The first time you run Python, the browser downloads Pyodide (Python for the browser) and keeps it, so later visits are fast.

To serve the finished build instead of the development server:

```bash
npm run build      # writes the site to atolye/dist/
npm run preview    # serves it at http://127.0.0.1:4173
```

`dist/` is plain static files, so it can also be put on any static host (GitHub Pages, Netlify).

**Where your progress lives:** on your own machine; there is no account and no server database. When you run the site with `npm run dev` or `npm run preview`, progress is saved both in the browser and in `atolye/.ilerleme/progress.json` (git-ignored, so `git pull` never touches it). Clearing browser data, switching browser or opening the other address brings it back from that file; when the two copies differ, the newer one wins. On a static host only the browser copy exists. In Settings, **Download** saves it as a JSON file and **Load from file** brings it back on any browser or address.

## Contribute a change

Changes reach `main` only through a pull request whose checks are green.

1. **Fork** the repository on GitHub (top right "Fork" button), then clone your fork:
   ```bash
   git clone https://github.com/<your-name>/30-days-atolye.git
   cd 30-days-atolye
   git remote add upstream https://github.com/metaxylen/30-days-atolye.git
   ```
2. **Start from the latest code** every time, on a new branch:
   ```bash
   git fetch upstream
   git switch -c my-change upstream/main
   ```
3. **Make your change** and try it: `npm run dev` in `atolye/`, open the screen you changed.
4. **Check it locally:** `npm run build` in `atolye/` must finish without errors. If you changed lesson or exercise content, run that range's validators from the repository root:
   ```bash
   python3 -m venv .venv && .venv/bin/pip install numpy pandas    # once
   .venv/bin/python atolye/content/tools/validate_cards_d01-10.py  # cards: d01-10, d11-20, d21-30
   .venv/bin/python atolye/content/tools/validate_d01-10.py        # exercises: same ranges
   ```
5. **Open a pull request:** `git push -u origin my-change`, then on GitHub click "Compare & pull request" (or run `gh pr create --repo metaxylen/30-days-atolye --base main`). Fill in the template: what you changed and how you checked it.
6. **Wait for the checks.** GitHub runs everything again on its own machines: the content validators, the production build and about 70 browser tests in Chrome, split over four machines (about 7 minutes; content-only changes skip the browser tests). Green means it can be reviewed and merged; red shows what broke.

Using Claude Code, Codex or another coding agent? Just describe the change. [`AGENTS.md`](https://github.com/metaxylen/30-days-atolye/blob/main/AGENTS.md) tells the agent to pull the latest code first, work on a new branch, run the checks and open the pull request for you.

## How it is built

- **App:** Vite, React and TypeScript in [`atolye/`](https://github.com/metaxylen/30-days-atolye/tree/main/atolye). The code editor is CodeMirror 6.
- **Python in the browser:** Pyodide runs in a Web Worker, so a slow or endless program never freezes the page; every check runs in a fresh namespace with a time limit.
- **Content is data:** lesson cards, exercises, projects, glossary and resources are JSON files in [`atolye/content/`](https://github.com/metaxylen/30-days-atolye/tree/main/atolye/content), loaded one day at a time. The writing standard (audience, Turkish terminology, mental models) is in [`atolye/docs/briefs/content-master.md`](https://github.com/metaxylen/30-days-atolye/blob/main/atolye/docs/briefs/content-master.md).
- **Checked content:** the validators in `atolye/content/tools/` run every code sample and compare the output, run every exercise's reference solution against its tests, and make sure starter code and hard-coded answers fail.
- **The original course** stays in the repository root (day folders, `readme.md`); a prepare step copies the lessons into the app when it starts.
