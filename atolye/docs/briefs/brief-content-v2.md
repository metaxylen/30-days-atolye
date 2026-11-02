# Content round 2: deeper, wider lessons and practice

Repo `/Users/alparslankiilinc/Desktop/7th term/30-days-of-python`. App at `atolye/` (Vite+React, runs Python in the browser with Pyodide). Other agents work in parallel: one redesigns `atolye/src/` (never touch it), and five others own other day ranges / file kinds. Edit ONLY the files your task names. Use a scratch folder unique to you under `/private/tmp/claude-501/-Users-alparslankiilinc-Desktop-7th-term-30-days-of-python/23d38a6c-50ce-4c29-9d96-c8c38ee462a9/scratchpad/<your-tag>/`. Never commit. Run Python with the repo's `.venv/bin/python`.

Mandatory first: `DISABLE_TELEMETRY=1 npx -y skills find "python course content"`; note results, install nothing.

## Why
The learner is Turkish, a working junior developer new to Python. His verdict: "I want a better, broader explanation; strengthen the explanations, examples, lessons and practice." Measured today: 646 lesson cards, explain-card bodies have a MEDIAN OF 19 WORDS (two short sentences) — far too thin to understand *why* things work. 462 exercises over 103 concept blocks (~4.5 per block), mostly one example per idea.

Read first: `atolye/docs/pedagogy-research.md` (worked examples, faded examples, retrieval, interleaving, misconceptions); the original lessons for your days (`readme.md` = Day 1, `NN_Day_*/NN_*.md` = Days 2-30) in full; your current JSON files; your validator(s) in `atolye/content/tools/`. Keep the existing JSON schema exactly (the app renders only the fields that exist today); every learner-visible text keeps its Turkish (`*_tr`) and English twin.

## Quality bar for everything you write
- Explain the *why* and the *how it works underneath* (e.g. references vs copies, mutability, how `for` uses iteration, why `0.1+0.2 != 0.3`, short-circuiting, scope), not just the *what*.
- Each idea gets: a plain explanation, 2+ varied examples (one realistic: a shopping cart, grades, log lines, a todo list, Turkish names/cities fine), the common mistake and how to spot it, and a quick check.
- Go wider than the original where a working developer needs it (e.g. f-string formatting specs, `enumerate`/`zip`, `in` on dict, `sorted(key=)`, `with open`, truthiness, `is` vs `==`, `dict.get`, comprehension with condition, `*args/**kwargs`, `pathlib` illustration, `__repr__`, list vs generator) — only concepts that fit that day's topic and that a learner of that day can follow. Note each addition in your report.
- Natural Turkish, friendly and precise; technical terms may stay English with a short Turkish gloss the first time. No emoji. Code runs offline in Pyodide (no input(), network, pip; numpy/pandas only Days 24-25; server/network topics as pure-Python illustrations).
