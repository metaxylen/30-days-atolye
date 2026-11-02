# Atölye content: the final textbook (master brief for every content session)

You are one of six writers producing the final Turkish/English course content of **Atölye**, an interactive "30 Days of Python" learning app (Vite + React; learner code runs in the browser with Pyodide). Each writer owns five days and writes BOTH the lesson (cards) and the practice (exercises) for those days, so the practice drills exactly what the lesson taught. This content is final: the owner will not come back to edit it. Be thorough; take the time you need.

## Who learns here
A Turkish university student who is also a junior developer (knows some JavaScript), new to Python. He wants to *understand*, not memorise: "the best, clearest, most precise, most instructive explanation." He disliked the current lessons because each explanation was two thin sentences (median 19 words) and the practice was too shallow. He reads in Turkish by default and can switch to English.

## Read before writing (all of it)
1. `atolye/docs/pedagogy-research.md` — worked examples, faded examples, retrieval practice, interleaving, misconceptions, cognitive load.
2. The original lessons of your days: `readme.md` is Day 1; `NN_Day_*/NN_*.md` are Days 2-30. Read every line.
3. Your current files: `atolye/content/cards/dayNN.json` and `atolye/content/exercises/dayNN.json` (some days were partly reworked by an interrupted earlier attempt; treat ALL current content as a draft you may rewrite).
4. The validators in `atolye/content/tools/` for your day range — they define the schema exactly.
5. The cards and exercises of the five days BEFORE yours (read-only) so you don't use a concept before it is taught and you can interleave earlier material.
6. This brief's glossary and models below.

## Hard rules
- Keep the JSON schema exactly (the app renders only fields that exist today). Every learner-visible text has a Turkish `*_tr` and an English twin.
- Edit ONLY your own day files (and, if you are the session marked "validator owner", the two validators of your 10-day range). Never touch `atolye/src/`, other days, or other files.
- Do NOT spawn subagents or forks; do the work yourself.
- No emoji. Code runs offline in Pyodide: no `input()`, network, pip at runtime; numpy/pandas only Days 24-25; servers, MongoDB, HTTP and scraping become honest pure-Python illustrations (dicts, JSON strings, functions that stand in for requests) and the card says what the real version looks like.
- Fix the original course's known bugs instead of copying them (Day 12 mean, Day 13 positive_even output, Day 14 missing `from functools import reduce`, Day 18 `re.sub` flags) and any other bug you find.
- Setup for validators: `python3 -m venv .venv && .venv/bin/pip install -q numpy pandas` at the repo root, then run e.g. `.venv/bin/python atolye/content/tools/validate_cards_d01-10.py 1 5` (validators accept `first last` day arguments).

## The lesson (cards) — what "best" means
Target per day: 30-45 cards, never padded. Card types: `explain`, `predict`, `fill`, `truefalse`, `order`, `recap` (see the validator for fields).

Every original `##`/`###` section with substance becomes a short teaching sequence:
1. **Hook / problem** (explain): a concrete situation where the idea is needed.
2. **Concrete example first** (explain with code; `hide_output: true` when a guess teaches): show, then name the rule.
3. **How it works underneath** (explain, often `trace: true`): the mental model — what Python actually does, step by step.
4. **Second, different example** — realistic (shopping cart, grades, log lines, a to-do list, Turkish names and cities are welcome).
5. **Common mistake** (explain): the wrong code, the real error/output Python prints (run it and paste it exactly), how to read that message, and the fix.
6. **Checkpoint** (predict / fill / truefalse / order) that needs the model to answer, not pattern matching; `why_tr`/`why` explains the reasoning in one or two sentences.
Then a `recap` card per day: 4-6 points, each a full sentence a learner could use as a note.

Explain bodies: 50-140 words (hard limit 160). One idea per card. Short paragraphs, `code` in backticks, **bold** only for the single key term. Each card must make sense to "a developer who knows another language but has never seen Python" on first read. Compare with JavaScript when it genuinely helps (e.g. `True` vs `true`, `None` vs `null`, `//` vs `Math.floor`, list vs array, dict vs object), never as filler.

Go wider than the original where a working developer needs it and the day's topic allows (examples: f-string format specs, `enumerate`, `zip`, `in` on dicts, `dict.get`, `sorted(key=...)`, `is` vs `==`, truthiness, `with open`, `*args/**kwargs`, `__repr__`, `@property`, `super()`, generator vs list, `pathlib` as an illustration, pandas `groupby`/filter/missing values). List every addition in your report.

`trace: true` on 4-7 cards per day where watching variables change line by line is the clearest teacher (loops, mutation, aliasing, function calls, recursion, exceptions). Code ≤ 12 lines per card.

## The practice (exercises) — what "best" means
Schema: `blocks` → each with `concept`, `concept_tr`, `worked_example` (`code`, `notes`, `notes_tr`) and `exercises`. Exercise types in use: `predict`, `fill_blank`, `parsons`, `debug`, `modify`, `write`, `explain`, `type_it`. Tests are Python `assert`s run after the learner's code in the same namespace, with `__stdout__` (captured output) and `__source__` (the learner's code); hidden tests carry `failure_message` + `failure_message_tr`; visible tests carry `label` + `label_tr`.

- One block per concept the day's lesson taught (plus blocks for the wider topics you added). Worked example notes: 2-4 full sentences explaining *why*.
- 7-10 exercises per block, a clear ramp: predict → fill_blank or parsons → debug (a realistic beginner bug) → modify → write (small) → write (realistic mini task). At least 1-2 interleaving exercises per day reusing earlier days' concepts.
- Every prompt states exactly what to produce: variable/function names, inputs, exact output format, an example call and its result. A correct solution must never fail because of ambiguity.
- Predict exercises: `explanation` explains the correct answer; `misconceptions` explains, for EACH wrong choice, which wrong belief leads to it.
- Hints: three rungs that teach the next step of thinking; the last rung is never the full solution.
- Tests: check behaviour on new inputs (anti-hard-code), the exact output format, and for write tasks at least one edge case; `failure_message_tr` tells the learner what to check, not the answer.

## Turkish language standard
Write like a native Turkish teacher writing a good textbook, not like a translation: natural word order, short sentences, "sen" form, correct suffixes on code terms with an apostrophe (`list`'e, `dict`'in, `print()`'i, `True`'yu). Use EXACTLY these terms across all days (first use on a day may add the gloss in parentheses):

| English | Turkish in this course |
|---|---|
| variable | değişken |
| value / object | değer / nesne |
| name binds to object | isim nesneye bağlanır |
| list / tuple / set / dict | list (liste) / tuple (demet) / set (küme) / dict (sözlük) — after first gloss use the English word |
| key / value (dict) | anahtar / değer |
| index / slice | indeks / dilim |
| mutable / immutable | değiştirilebilir / değiştirilemez |
| function / parameter / argument / return | fonksiyon / parametre / argüman / döndürmek (return) |
| loop / iteration | döngü / tur |
| condition / boolean | koşul / boolean (doğru-yanlış değeri) |
| exception / error | istisna (exception) / hata |
| traceback | hata izi (traceback) |
| module / package | modül / paket |
| class / instance / method / attribute | sınıf / örnek (instance) / metot / nitelik (attribute) |
| comprehension | comprehension (kısa liste kurma yazımı) |
| string | string (metin) |
| output / print | çıktı / yazdırmak |

## Mental models to use consistently (every day, every writer)
- A variable is a **name tag attached to an object**, not a box. Assignment moves the tag; `b = a` puts a second tag on the same object.
- Mutable objects can be changed in place, so every tag on them sees the change; immutable ones are replaced instead.
- A function call creates a fresh local workspace; `return` hands one value back; without `return` the result is `None`.
- A `for` loop asks the object for its items one at a time (iteration); `range` produces numbers on demand.
- An exception travels up until something catches it; the traceback is read from the bottom up.
- A class is a blueprint; `self` is the specific object being worked on.

## Process
1. Read everything above. Write a short plan for each day into your report file first (sections → teaching sequences → exercise blocks).
2. Write one day completely (cards + exercises), validate, then re-read it as the learner and improve it. Then the next day.
3. After all five days: a final self-review pass over all of them (clarity, order, terminology table, no concept before it is taught, Turkish quality, every code output pasted from a real run), then run both validators for your days to 0 failures.
4. Commit to your own branch and push it (`git push -u origin <your-branch>`). Never push to `main`. Commit at least after each finished day so work is never lost.

## Report (write to `atolye/docs/reports/<your-tag>.md`, commit it, push)
Per day: cards before→after, median explain-body words, checkpoints, trace cards, exercise blocks and exercises before→after; topics added beyond the original; original bugs fixed; anything you deliberately dropped and why; the validators' final lines pasted; anything you were unsure about.
