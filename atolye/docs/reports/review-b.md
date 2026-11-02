# Review report: review-b (content-b, Days 6-10)

Branch `review-b`, created from `origin/content-b`. Only the ten day files (cards and exercises for Days 6-10) and this report were changed. Validators were not changed.

## What I did
- Read every card (196) and every exercise (213), both languages, plus the worked examples, hints, misconceptions and tests.
- Ran every card snippet under CPython 3.12, 3.13 and 3.14 and compared it with `expected_output` / the predict `answer`. For fill cards I put each accepted answer into the blank and ran the result. All outputs match on all three versions.
- The app runs Pyodide `314.0.7` (`atolye/src/lib/py.worker.ts`), which is Python 3.14. I triggered every error message quoted in a card or exercise and compared the 3.12, 3.13 and 3.14 wording. Three messages are different in 3.14 (see fixes 1-3).
- Wrote 1-3 alternative correct solutions for every `write` task (all 52) and for 24 of the 26 `modify` tasks, plus hard-coded answers for a sample, and ran them through a harness that works like the app: it runs the learner code, then each test with `__stdout__` and `__source__`.
- Checked the order of concepts against Days 1-5 (`in`, `is`, `//`, `+=`, `%`, f-strings, `join`, `split`, `lower`, `[::-1]`, `startswith`, `end=`, `round`, star unpacking, `sorted(reverse=True)` are all taught before they are used). No `if` appears before Day 9 and no loop before Day 10 in any card or exercise code.

## Counts
| | |
|---|---|
| Cards read | 196 (Days 6-10) |
| Exercises read | 213 (52 write, 26 modify, 26 debug, 26 fill_blank, 24 parsons, 52 predict, 5 explain, 2 type_it) |
| Card snippets run | 170 with code, on 3 Python versions |
| Quoted error messages checked | 32 distinct error cases (every message quoted in a card or exercise) |

| Category | Issues found | Fixed |
|---|---|---|
| Correctness | 5 | 5 |
| Clarity | 3 | 3 |
| Pedagogy | 2 | 2 |
| Exercise (prompt/test) | 7 | 7 |
| Language (Turkish/English) | 1 | 1 |
| Consistency | 0 | 0 |
| **Total** | **18** | **18** |

The writer's work is strong. The explanations are long enough, every section has the hook, example, model, mistake and checkpoint steps, the misconceptions are specific, and the hidden re-run tests (which swap the first line) work well. Most of what I found is small, but several items would have rejected a correct learner answer or taught a false rule.

## The 10 most important fixes (before -> after)

1. **3.14 message: unpacking** (`d06-c19`, `d06-b3-e3` prompt and hint 2). The app's Python prints `ValueError: too many values to unpack (expected 2, got 3)`, not `(expected 2)`. Before: the card and the debug prompt quoted the 3.13 text, so a learner would see a different message from the one the lesson promised. After: the 3.14 text is quoted, with a note that older versions leave out "got 3". The hint now explains "expected 2, got 3".
2. **3.14 message: list in a set** (`d07-c07`, `d07-b5-e3` prompt, `d07-b5` worked-example note). Before: `TypeError: unhashable type: 'list'`. After: `TypeError: cannot use 'list' as a set element (unhashable type: 'list')`, with a note that before 3.14 only the part in brackets is printed.
3. **3.14 message: list as a dict key** (`d08-c06`). Before: `TypeError: unhashable type: 'list'`. After: `TypeError: cannot use 'list' as a dict key (unhashable type: 'list')`.
4. **False rule about set operators** (`d07-c31`). Before: "Like every operator today, the order of the operands does not change the result: `a & b == b & a`." This is false for `-`, which the same day teaches as "direction matters". After: "Like union, intersection does not depend on the order of the operands... (Difference, later today, does.)"
5. **A correct answer was rejected: `+=`** (`d08-b2-e7`). The hidden test required an `ast.BinOp` with `+`, so `dog['age'] += 1` failed with "Increase the age with + 1". After: the test also accepts `ast.AugAssign` with `+`, and the message mentions `+= 1`. Typing `4` still fails.
6. **A correct answer was rejected: `is not None`** (`d09-b5-e8`). The test was `'is None' in __source__`, so `if discount is not None:` failed. After: `is None` or `is not None` both pass; `if not discount` still fails the `0` edge case as intended.
7. **Hidden requirement not in the prompt** (`d07-b1-e7`). A hidden test demands `add()`, `update()` and `discard()`, but the prompt only described the steps, so `cart = cart | {...} - {...}` matched the output and still failed. After: the prompt names one method per step in both languages.
8. **Card text did not match its code** (`d06-c17`, trace card). Before: "The right side `b, a` is evaluated first and packed into a temporary tuple `(2, 1)`. Only then is it unpacked into `a` and `b`", but the code swaps `first` and `second` ('Can', 'Deniz'). After: "The right side `second, first` ... `('Deniz', 'Can')` ... unpacked into `first` and `second`."
9. **Card text did not match its code** (`d06-c27`, trace card). Before: the body said `order[1].append('tea')`, while the traced code does `items = order[1]` and `items.append('tea')`. After: the body explains that `items = order[1]` puts a second tag on the same list and `items.append` changes it. This also uses the name-tag model.
10. **Wrong JavaScript claim** (`d09-c08`). Before: "In JavaScript `if (x = 5)` silently assigns and is always truthy" (that is not true for `x = 0`). After: "silently assigns 5 and then tests it, so the block always runs".

## Other fixes
- `d07-c25` promised an order-keeping dedupe "on Day 10", and Day 10 never showed it. `d10-c16` (building a new list) now adds one sentence: append an item only `if item not in unique`.
- `d09-c09` (fill): removed `balance > price` from the accepted answers. The card says "at least the price", and `>` is wrong when the balance equals the price. Now a learner who types `>` is shown `balance >= price`.
- `d06-c37`: "a tuple can be a key" is now "a tuple of numbers or strings can be a key" (a tuple that holds a list cannot, as `d06-c27` shows).
- `d08-b3-e3`: "Fix the bug without deleting the wrong key" was unclear. It is now "Find the misspelled key and correct its spelling" (both possible fixes pass the test).
- `d09-b2-e2`: "M from 40 up to 70, L from 70" was unclear at 70. It now reads "M from 40 up to but not including 70, L from 70 up" (Turkish: "40 ve üstü ama 70'in altı M, 70 ve üstü L").
- `d09-b5-e6`: the original course's "That fruit already exist in the list" is now "...already exists..." in the prompts, the solution and the test.

## Not fixed, and why
- Several cards mention "the original course" (for example `d07-c20`, `d07-c38`, `d08-c02`, `d10-c30`). They explain why the section headings or a well-known example differ from the source, so I kept them.
- `d06-b1-e7` expects `b: 1 times, first at index 0` in its one-item edge case. "1 times" is clumsy English, but the format is fixed in the prompt and fixing it would need an `if` (Day 9).
- A few prompts say "use break and else" (`d10-b4-e7`) or "using zip and enumerate" (`d10-b6-e8`) without a test that enforces it. I left them lenient on purpose: a correct program with a flag variable still passes, and that is better than rejecting it.
- I could not run Pyodide itself (no browser in this session). I checked the messages with CPython 3.14.6, which matches the Python version Pyodide 314.x ships.

## Validators (final runs on review-b)
- `.venv/bin/python atolye/content/tools/validate_cards_d01-10.py 6 10` -> `VALIDATOR RESULT: 0 failures` (the committed validator already uses the 160-word limit)
- Median and maximum explain-body check (run from the scratchpad, not committed): all days pass. Median EN/TR: Day 6 84/67, Day 7 81/67, Day 8 76/61, Day 9 85.5/69.5, Day 10 80/62. Maximum 114 words.
- `.venv/bin/python atolye/content/tools/validate_d01-10.py 6 10` -> `SUMMARY: files=5 exercises=213 failures=0`

## Alternative-solution tests
I ran 109 alternative programs against the full tests (visible and hidden), covering all 52 write tasks and 24 modify tasks.
- **All correct alternatives pass after the fixes.** Examples: `print(*range(3, limit + 1, 3))`, `set().union(*playlists)`, `course.issubset(done)` with a list argument, `len((a - b) | (b - a))`, a `while True` with `break`, a flag variable instead of `for-else`, `>=` instead of `>` where ties are not tested, string concatenation instead of f-strings, and `dict(base)` instead of `base.copy()`.
- **Before the fixes, 3 correct alternatives failed:** `dog['age'] += 1` (d08-b2-e7), `if discount is not None` (d09-b5-e8), and the set-operator version of d07-b1-e7, whose hidden method requirement was not stated in the prompt.
- **These fail, as intended:** hard-coded answers (`print('b: 3 times, first at index 0')` in d06-b1-e7 and `summary = (5, 3, 2)` in d06-b1-e8), `split(' ')` on an empty string in d07-b1-e8 (it gives `{''}` instead of an empty set), and d07-b1-e7 without the three methods the prompt now asks for.
