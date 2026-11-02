# review-c report: independent review of content-c (Days 11-15)

Branch `review-c`, created from `origin/content-c` (writer report `atolye/docs/reports/content-c.md`).
Only the five days' card and exercise files and this report were edited. Validators were not changed
(the writer owns them).

## Counts

- Read: 150 cards (30 per day, every English and Turkish field), 153 exercises plus 19 worked examples
  (every prompt, test, hint, solution, misconception, in both languages).
- Every quoted error message and every claim about Python behaviour that the validators do not check
  was re-run under CPython 3.14.8 (the validators already compare every card and exercise output with a
  real run).

| Category | Issues found | Fixed |
|---|---|---|
| Correctness | 10 | 10 |
| Clarity | 4 | 4 |
| Pedagogy | 2 | 2 |
| Exercise (prompts, hints, tests) | 15 | 15 |
| Turkish | 3 | 3 |
| Consistency | 0 | 0 |
| **Total** | **34** | **34** |

Consistency: the name-tag model, the fresh local workspace per call, `None` without `return`, and
"read the traceback bottom up" are used on every day and never contradicted.

## The 10 most important fixes (before → after)

1. **d14-b2-e2 explanation (correctness).** Before: "so the result is 'DEĞİŞTİ'". Python prints
   `DEĞIŞTI` (the expected output was right, the explanation contradicted it). After: "'DEĞIŞTI'. Note the
   dotless I: str.upper() follows the default Unicode rules, which turn i into I, not into the Turkish İ."
   (EN and TR.) This is a real trap for a Turkish learner, so the explanation now teaches it.
2. **d12-c02 (correctness).** Before: never name a file `random.py` or `math.py`, "Python would find your
   file first". Checked: a local `math.py` does not hide `math`, which is compiled into Python. After:
   `random.py` or `statistics.py`, the reason (the script's folder is searched first), and a short note
   that built-in modules such as `math` are an exception you should not rely on.
3. **d15-c05 (correctness).** Before: "an unclosed bracket on line 3 can be reported on line 4". Since
   Python 3.10 an unclosed bracket is reported where it was opened (`'(' was never closed`); verified for
   `(`, `[` and multi-line cases. After: the caret marks where Python noticed the problem; unclosed
   brackets are reported at the opening line, some other mistakes are noticed later, so check the line
   above if the marked one looks fine.
4. **d14-c16 (correctness).** Before: `TypeError: decorator.<locals>.wrapper() takes 0 positional
   arguments but 1 was given`, a name no code produces. After: the real
   `uppercase_decorator.<locals>.wrapper() ...` plus one sentence explaining what `<locals>` means.
5. **d12-b3-e4 (correctness).** Before: "It prints None." The program actually crashes with
   `TypeError: object of type 'NoneType' has no len()`, and the first hint already talked about an
   error. After: the prompt quotes the real error and says the program should print 5, the card count.
6. **d12-b2-e4 (exercise).** Before: the prompt was about `class_report`, but the code defines
   `class_average`. After: the prompt uses the real name (EN and TR).
7. **d14-b5-e6 (exercise).** Before: the prompt did not say what to do with two countries, but a hidden
   test required `'A, and B are ...'`; the natural `'A and B'` would fail. After: the prompt states the
   rule and gives that exact example.
8. **Hint ladders that ended with the answer (exercise, 8 fill-blank tasks).** d12-b3-e3
   ("random.seed and random.randint."), d12-b4-e3, d13-b1-e3, d13-b4-e3 ("w[-1]"), d14-b1-e3, d14-b4-e3
   ("filter, then map."), d15-b2-e3 ("pow and sqrt."), d15-b4-e3 ("not nums"). After: the last rung
   gives the final thought (for example "Negative indexes count from the end: w[-2] would be the
   second-to-last letter, so which index is the very last one?") without the answer, in both languages.
9. **Hard-coded answers that passed (exercise, 5 tasks).** The validator generates cheat programs only
   for write and modify tasks. I generated the same kind of cheat (final values as literals plus the
   printed output) for all 21 debug tasks: d13-b4-e4, d14-b4-e4 and d15-b3-e4 accepted it. Added one
   hidden test each (with EN/TR failure messages); d15-b3-e4 now calls `print_all` on new data. Also
   d11-b1-e6 accepted `return n in (10, 0, 1234)`; its hidden test now checks every n in -50..50.
   d13-b2-e4 also accepted the typed list and got a hidden test.
10. **d12-c17 (correctness).** Before: "`sys.maxsize` is the largest index a list can have". After: it is
    the upper limit for the length of a list or string (9223372036854775807 on 64-bit), not the largest
    integer; `sys.maxsize + 1` works.

Other fixes, briefly:

- d13-c08 (EN): "those numbers are not even in the list" was false (4, 6, 8, 10 are in it); now "most of
  those numbers", matching the Turkish.
- d13-c27: "That remembered value is called a closure" → a closure is the function that carries the
  remembered values (consistent with Day 14).
- d15-c01: the "real" traceback omitted the `~~~^~~~` markers Python 3.11+ prints; one sentence now says
  they exist and were left out.
- d15-c19: the not-callable bullet quoted `'int' object is not callable` but its example (`list = [1, 2]`
  then `list('abc')`) gives `'list' object is not callable`; now quotes the real message.
- d15-c21: "which is why both appear when imports go wrong" did not follow; now says that catching
  `ImportError` (Day 17) also catches a missing module.
- d14-c26: "The initial value also fixes the type problem" referred to nothing on the card; now explains
  why `add_two_nums` on the previous card had to convert `x` too.
- d12-c26: "JavaScript's `Math.random()` tricks" → the concrete `Math.floor(Math.random() * 6) + 1`.
- d12-b1-e5: "Change only the import line ... and fix the lines" contradicted itself; reworded.
- Pedagogy: d13-c06 now shows Python's real hint `SyntaxError: did you forget parentheses around the
  comprehension target?`; d13-c13 now quotes the real `NameError: name 'row' is not defined` for the
  reversed `for` clauses (the brief asks for the real error on common-mistake cards).
- Turkish: d12-c01 "11. günden kalan fonksiyonların birikmeye başlıyor" (ungrammatical) → "11. günde
  yazdığın fonksiyonlar birikmeye başlıyor"; d13-c04 "Üç gerçek comprehension'ları öngörülebilir kılar"
  (translated "fact") → "Comprehension'ların nasıl davranacağını üç kural belirler"; d14-c13 why_tr
  "sonucu 42'yi" → "sonucunu, yani 42'yi".

## Not fixed, and why

- **Validator gap.** `validate_d11-20.py` builds hard-coded cheat programs only for write and modify
  tasks, not for debug tasks. I fixed the three debug tasks it missed, but did not change the validator,
  because the brief allows validator changes only for the validator owner. Recommendation for the owner:
  run `check_hardcode` on debug tasks too.
- **d14-b5-e6 English.** "A, and B are ..." for two names is unusual English. I kept the rule (changing it
  would change the task and its reduce solution) and made it explicit in the prompt instead.
- **Strong last hints in a few write tasks** (for example d15-b4-e6, d14-b5-e7) give the key line but not
  the whole solution; the validator's give-away check passes and the brief's rule is met, so I left them.
- **Not tested in the browser.** All runs used CPython 3.14.8, not Pyodide. Messages such as
  `Did you mean: 'count'?` appear in the printed traceback, not in `str(e)`; whether the app shows them
  depends on how it renders tracebacks, which I did not check.
- `pip install numpy pandas` hung (network), so the validators ran with the system Python 3.14.8.
  Days 11-15 use neither package, and the validators passed.

## Validators (final lines)

```
$ python3 atolye/content/tools/validate_cards_d11-20.py 11 15
day11: 30 cards, 11 checkpoints, 12/12 code sections mapped
day12: 30 cards, 12 checkpoints, 10/10 code sections mapped
day13: 30 cards, 14 checkpoints, 3/3 code sections mapped
day14: 30 cards, 12 checkpoints, 9/9 code sections mapped
day15: 30 cards, 12 checkpoints, 10/10 code sections mapped
section mapping: 44/44
RESULT: 3004 checks, 0 failures

$ python3 atolye/content/tools/validate_d11-20.py 11 15
files: 5
exercises per type: debug=21, explain=6, fill_blank=14, modify=21, parsons=7, predict=42, write=42
hard-coded cheat programs generated and caught by a hidden test: 63
SUMMARY: 5 files, 153 exercises, 0 failures
```

## Alternative-solution tests

Each program was run with the same harness as the validator (learner code, then every test in the same
namespace, `__stdout__` and `__source__` set).

- **62 differently written correct solutions, all pass.** At least one per write task and several
  debug/modify tasks: for example `max(words, key=len)` for `longest`, `f'{year % 100:02d}'` for
  `make_username`, `random.choices(..., k=6)` for `random_user_id`, `dict(sorted(counts.items()))` for
  `count_by_first_letter`, two stable sorts for `ranking`, `hasattr` for `method_exists`, `enumerate` for
  `print_all`, `sum(s < 50 for s in scores)` for `count_failed`.
- **4 wrong or hard-coded programs (5 runs), all rejected:** `is_even` returning `n in (10, 0, 1234)`,
  `normal_salary` with `int()` instead of `round()`, the typed list `[72, 0, 90, 0]`, and a formatter that
  prints `12.5 TL` instead of `12.50 TL`.
- **Hard-coded debug cheats:** 21 of 21 caught after the fixes (18 of 21 before).
