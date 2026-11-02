# Review report: review-d (Days 16-20)

Reviewed branch: `claude/content-d-0fe0nd` (writer report `atolye/docs/reports/content-d.md`). Fixes are on `review-d`, one commit per day.

Runtime used for every check: CPython 3.14 (`python3 --version` = 3.14.8). The app pins Pyodide `314.0.7` in `atolye/src/lib/py.worker.ts`, which is Python 3.14, so 3.14 is the target runtime. The writer worked on 3.13, and that version difference caused most of the correctness fixes below.

## Counts

- Read: 150 cards (30 per day), 160 exercises (32 per day), 20 worked examples, in English and Turkish.
- Issues found and fixed, by category:

| Category | Found | Fixed |
|---|---|---|
| Correctness | 6 | 6 |
| Clarity | 4 | 4 |
| Pedagogy | 1 | 1 |
| Exercise | 4 | 4 |
| Turkish | 9 | 9 |
| Consistency | 1 | 1 |
| **Total** | **25** | **25** |

The writer's content was strong. Every snippet output, every predict answer and every hard-coded-cheat test already passed. Most findings are about version-specific error text, Turkish wording, and prompts that left a requirement unstated.

## The 10 most important fixes (before -> after)

1. **d17-c17 failed the card validator on Python 3.14** (correctness). Body, Turkish body and `expected_output` all said `ValueError: too many values to unpack (expected 2)`. Python 3.14 prints `(expected 2, got 3)`. Changed to the 3.14 text in all three places. The body's "read `expected`, then `got`" explanation now fits both messages.
2. **d16-c15 impossible-date error** (correctness). Before: `30 February` gives `ValueError: day is out of range for month`. After: `datetime.strptime('30/02/2024', '%d/%m/%Y')` gives `ValueError: day 30 must be in range 1..29 for month 2 in year 2024`, which is the real 3.14 message. Fixed in English and Turkish.
3. **d16-c20 `time(24, 0)` error** (correctness). Before: `ValueError: hour must be in 0..23`. After: `... 0..23, not 24`, the real 3.14 text.
4. **d17-b3-e3 and d20-b2-e3 prompts quoted the 3.13 unpack message** (correctness). The learner sees the real traceback, so the prompt has to match it. Changed `(expected 2)` to `(expected 2, got 3)` in both prompts, English and Turkish.
5. **d17-c13 recommended `dict.get` right after a typo example** (pedagogy). Before: "Sometimes checking first is clearer than catching: `dict.get('price', 0)`". With the card's misspelled key (`'pirce'`), `.get` would hide the bug just as silently as `except: pass`. After: use `item.get('price', 0)` only when a missing key is a normal case rather than a bug; the last line shows the corrected total.
6. **d17-b1-e5 had a hidden test the prompt never mentioned** (exercise). A test requires `'ValueError' in __source__`, but the prompt did not say so, so a correct solution with `except Exception` would fail. Added "Catch `ValueError` by name, not with a bare `except`" to both prompts.
7. **d20-b4-e5 needed one exact source line without saying so** (exercise). A test checks for the literal `from .greet import greet_person`, while the prompt only said "with a relative import". The prompt now names that exact line, in English and Turkish.
8. **d19-c15 Turkish sentence was garbled** (Turkish). Before: "sondaki virgüle izin yoksa yorum satırı yoktur" ("if trailing commas are not allowed, there are no comments"), which is a wrong statement. After: "sondaki virgüle izin verilmez ve yorum satırı yazılamaz".
9. **d16-c14 mnemonic** (clarity). The Turkish version bolded the wrong letter (`strf**t**ime **f**ormat eder`), and the English one bolded single letters inside a word. Both now say plainly: the f in strftime is for 'format', the p in strptime for 'parse' (ayrıştırma).
10. **d16-b4-e7 prompt** (exercise). Before: start and end times are "`'HH:MM'` strings of the same night shift". The first example (09:15-17:45) is a day shift, so this was confusing. After: "`'HH:MM'` strings, without a date". In Turkish, `'SS:DD'` became `'HH:MM'` (saat:dakika).

Other fixes:
- d16-c08 linked `:02d` to the `:.2f` format spec taught on Day 4 and explained what it means. Day 4 only teaches `:.2f`, so the card had pointed to something the learner had not seen.
- d16-c11 fixed a Turkish suffix after a parenthesis.
- d16-b3-e3 hint said "class method", a term not taught until Day 21; it now says "a method you met on the cards".
- d16-b2-e7 Turkish format string `'[YYYY-AA-GG SS:DD:ss]'` (`SS` reads as hour, `ss` as seconds, which clashes) now uses the same literal as the English prompt, with a gloss.
- d18-c02 said "three handy methods" and then listed four; it now says "a few".
- d18-c30 Turkish recap said `{m,n}` gives a "tam sayı" (which means integer); it now says "kesin bir tekrar aralığı" (an exact repeat range).
- d19-c13 removed a filler JavaScript comparison and changed the Turkish proverb to "önce izin isteme, gerekirse özür dile".
- d20-c05 Turkish grammar fix ("dün çalışan kod bugün bozulabilir").
- d20-c21 said strings are "dilimlenir" (sliced) by numbers, where the English says indexed; changed to "indekslenebilir".
- d20-c09 and the d20-b2-e3 solution note: "ilk iki noktada" is ambiguous in Turkish (first two dots, or the first colon?); now "ilk iki nokta üst üste işaretinden".
- d20-b2 worked-example Turkish note reworded.
- d20-c28 used `'demo.calc'`, while the card it refers to (c27) uses `'demo_d20.calc'`; made consistent.

## Checked and found correct (no change)

- Every other quoted error message in Days 16-20, re-run on 3.14 with exact text compared: 22 messages, for example `strptime ... does not match format`, `'<' not supported between instances of 'datetime.date' and 'str'`, `string indices must be integers, not 'str'`, `Object of type set is not JSON serializable`, `[Errno 2] No such file or directory`.
- Turkish-letter regex claims (d18-c16, c18; d18-b2-e6): `\w` matches Turkish letters, and `re.I` matches `İ`/`ı` against `i`/`I` (tested with `İzmir`, `IŞIK`, `ÖĞRENCİ`).
- Concepts used before they are taught, checked against Days 1-15: Day 4 `:.2f`, Day 8 dict/`get`/aliasing, Day 10 loops, Day 11 `*args`, Day 12 modules/`os`, Day 13 comprehensions/lambda, Day 15 error types, Day 23 virtual environments (named as a forward reference).
- The mental models (exceptions travel up and the traceback is read bottom-up, `b = a` aliasing) are used consistently and never contradicted. Glossary terms are used as listed.

## Could not fix, or left as is (and why)

- **Tests depend on the import line in the starter code.** In Day 16 write tasks (and similar ones), tests call `datetime(...)` and `date(...)` in the learner's namespace. A learner who deletes the starter line `from datetime import datetime` gets `NameError` inside the tests, shown under an unrelated label such as "May is in quarter 2". I did not add imports to the tests: a test that runs `from datetime import datetime` would rebind the learner's name `datetime` and break a correct solution written with `import datetime`. The starter code shows the import, so this only affects learners who remove it.
- **Pyodide persistence** (already in the writer's report): Day 19 and Day 20 write files and packages. If the app reuses one interpreter and file system across runs, re-running d20-c26 (`once_d20`) prints only `done`, and an `'a'`-mode answer to d19-b2-e3 grows the file on every run. Not run in a browser; this session had no browser.
- **d18-b4-e3** (`re.sub(..., re.I)` passed by position) prints a `DeprecationWarning` on 3.13 and later, by design of the exercise.
- Card validator on this branch still has the 90-word limit. As the brief says, I ran a `/tmp` copy with limit 160, a median explain-body >= 45 words check for `body` and `body_tr`, and `first last` day arguments. No validator change is committed.

## Validators (final lines, Python 3.14)

Card validator (`/tmp` copy: 160-word limit, median >= 45 check, days 16-20):

```
day16: 30 cards, 10 checkpoints, 8/8 code sections mapped
day17: 30 cards, 11 checkpoints, 8/8 code sections mapped
day18: 30 cards, 10 checkpoints, 15/15 code sections mapped
day19: 30 cards, 9 checkpoints, 11/11 code sections mapped
day20: 30 cards, 10 checkpoints, 4/4 code sections mapped
section mapping: 46/46
RESULT: 3068 checks, 0 failures
```

Before the fixes, the same run gave `RESULT: 3068 checks, 1 failures` (d17-c17, see fix 1).

Exercise validator, unchanged (`ONLY_DAYS=16,17,18,19,20 python3 atolye/content/tools/validate_d11-20.py`):

```
files: 5
exercises per type: debug=20, explain=14, fill_blank=16, modify=20, parsons=10, predict=40, write=40
hard-coded cheat programs generated and caught by a hidden test: 60
SUMMARY: 5 files, 160 exercises, 0 failures
```

## Alternative-solution test results

For every write, modify and debug exercise I wrote 1-2 correct solutions that differ from the reference solution: loops instead of comprehensions, `split(':', 1)` instead of `partition`, `math.ceil` instead of `//`, `min(key=...)`, `re.finditer`, `pathlib`, `print(..., file=f)`, inline `(?i)`, and so on. Each one ran with the exercise's real tests in a fresh temporary folder, using the same `__stdout__`/`__source__` harness as the validator.

| Day | Alternative solutions run | Passed |
|---|---|---|
| 16 | 26 | 26 (5 of them first failed only because I had deleted the starter import line; see "Could not fix") |
| 17 | 18 | 18 |
| 18 | 20 | 20 |
| 19 | 21 | 21 |
| 20 | 17 | 17 |
| **Total** | **102** | **102** |

No test rejected a correct but differently written solution, apart from the starter-import case above. The two hidden requirements that could have done so (fixes 6 and 7) are now stated in the prompts.
