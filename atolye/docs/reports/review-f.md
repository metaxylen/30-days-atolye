# Review report: review-f (Days 26-30, writer branch content-f)

Independent review of the content-f writer's Days 26-30 (Flask, MongoDB, APIs and HTTP, Building an API, Conclusions), following `atolye/docs/briefs/review-master.md`. Branch `review-f` was created from `origin/content-f`; only the ten day files and this report were changed.

## Counts

- Read: 172 cards (37 + 38 + 33 + 32 + 32) in both languages, 160 exercises (20 blocks, worked examples, every prompt, hint, test and failure message, EN and TR), the writer's report, the original lessons where a card makes a claim about them, and the earlier days' cards for concept order (Days 1-25 checked on the other writers' branches `content-a`, `content-b`, `content-c`, `claude/content-d-0fe0nd`, `content-e`, because Days 1-25 on this branch are still the old drafts).
- Every card snippet was re-run under CPython 3.12.15 (the Pyodide line) and compared with `expected_output` / the predict answer: 148 snippets, all equal apart from trailing spaces on two lines, which the app strips.
- Flask 3 and PyMongo 4.19 were installed into the local `.venv` (not committed) to check the library claims against the real libraries; see "How the library claims were checked".

| Category | Issues found | Fixed |
|---|---|---|
| Correctness | 5 | 5 |
| Clarity | 4 | 4 |
| Pedagogy | 1 | 1 |
| Exercise | 6 | 6 |
| Turkish | 9 | 9 |
| Consistency | 1 | 1 |
| **Total** | **26** | **26** |

The writer's work is strong: no wrong output, no wrong error text in the cards, every write task already had hidden anti-hard-code tests, and the Turkish is natural textbook Turkish. The fixes below are mostly about places where a correct learner answer could be marked wrong, and about a few claims on the real libraries.

## The 10 most important fixes (before -> after)

1. **d30-b2-e3 (exercise): a correct answer failed a hidden test.** The prompt said "ignore values that are not int or float"; a hidden test requires `average([True, 10]) == 10`. Because `bool` is a subclass of `int`, the natural solution `isinstance(v, (int, float))` gives 5.5 and fails. -> The prompt (EN/TR) now says booleans count as non-numbers and must be skipped.
2. **d29-b1-e6 (exercise): a correct import style crashed the tests.** The prompt said "Import `datetime` yourself"; the tests called `datetime(...)` as a class, so a learner who wrote `import datetime` and `isinstance(v, datetime.datetime)` got `TypeError: 'module' object is not callable` from the test. -> The tests import the class under their own alias (`from datetime import datetime as _dt`), and the prompt says both import styles work. Verified with both styles.
3. **d26-b3-e5 (exercise, parsons): the distractor produced the same output.** The distractor `return ('page', 'result.html')` and the real line `return ('page', 'post.html')` both give the expected output, and the prompt never said what a GET returns, so a learner could pick the distractor with no way to tell. -> The prompt now states that any other request gets the form page `('page', 'post.html')`.
4. **d27-c11 (correctness): the insert_one model contradicted the explanation.** The card says real pymongo keeps the `_id` it added and the second insert fails with DuplicateKeyError, but the toy overwrote `_id` (output showed `_id: 2` twice). -> The toy uses `doc.setdefault('_id', ...)` like pymongo, so both entries now show `_id: 1`, which is exactly the duplicate the database refuses; the body says so. The matching predict exercise d27-b1-e1 keeps its toy but its explanation now says what real pymongo does.
5. **d27-b2-e6 (exercise/consistency): a stricter rule than the lesson, unannounced.** The cards and d27-b2-e1 teach `doc.get(k) == v`, where `{'x': None}` also matches a document without `x` (which is also what real MongoDB does); this write task's hidden test requires the opposite. -> Prompt (EN/TR) now says real MongoDB lets `{'x': None}` match missing fields but here a missing key never matches. Tests unchanged.
6. **d29-c15 (correctness): outdated Flask error text.** Before: `TypeError: The view function did not return a valid response`. -> After: the exact current text, `The view function for 'create_student' did not return a valid response. The function either returned None or ended without a return statement.` (checked with Flask 3).
7. **d29-b2-e7 (exercise): the day's hardest write task had no example call.** -> Added an example with a route table and the 200 and 405 results (EN/TR).
8. **d28-c12 (correctness): wrong JavaScript equivalent.** "`urlencode` is the counterpart of `encodeURIComponent`", but `encodeURIComponent` writes a space as `%20` and the card shows `+`. -> "In JavaScript, `new URLSearchParams({q: term}).toString()` gives the same result."
9. **d28-c09 (pedagogy): `partition` used before it is explained.** The tracer card uses `target.partition('?')` and `_`; the explanation only comes ten cards later (d28-c19). -> One sentence added: it cuts at the first `?`, returns before / separator / after, and `_` is the usual name for an unused part.
10. **d27-c04 (correctness): dnspython install advice.** Before: "pymongo also needs dnspython: `pip install pymongo dnspython`." -> dnspython is required, and `pip install pymongo` installs it automatically since PyMongo 4.3 (checked: `pip show pymongo` lists `Requires: dnspython`).

## Other fixes

- **d29-c13 (consistency):** "Move it into Flask tomorrow" -> "When you move it into Flask": Day 30 has no Flask.
- **d27-c10 (clarity):** "The real method returns a result object too" -> "instead" (the toy returns the id, not a result object).
- **d28-c08 (clarity):** the `why` said a wrong Content-Length "only misleads a client", which read as contradicting d28-c25 ("the client cuts off the end"). It now says our `split` ignores the header, but a real client trusting it reads only 5 bytes.
- **d26-c25 (clarity):** the toy layout used `{% block content %}` alone while the body teaches `{% block content %}{% endblock %}`; the toy now uses the taught syntax (same output).
- **d30-b4-e1 (clarity):** "he gets no key" -> "Can gets no key" (neutral, and clearer).
- **d30-b4-e7 (exercise):** "sorted A to Z" -> "sorted with `sorted()`", because the hidden test expects code-point order (`Şule` after `Zeynep`), which a learner reading "A to Z" in Turkish alphabet order would not produce.
- **Turkish:** `Can'in` -> `Can'ın` (vowel harmony) in d27-b2-e1, d30-c21, d30-b4-e1; "inanılmaz yaş" (amazing age) -> "gerçek olamayacak / gerçekçi olmayan yaş" (implausible) in d27-c30 and d27-b3-e1; d29-c20 "Gün 29'un başındaki" -> "bugünün başındaki" (it is today); d29-c28 "bu karttaki `match`" -> "daha önceki `match` fonksiyonuyla" (the function is not on that card); explain keyword stems `kaydeder` -> `kayd` (d26-b1-e8, so "kaydediyor" counts) and `metod` -> `meto` (d29-b2-e8, so the glossary spelling "metot" counts).

## Not changed, and why

- **Days 23-25 card-validator failures.** The repository card validator still reports 7 failures, all in `day23.json`-`day25.json` (old drafts owned by another session). They are outside this review's scope; Days 26-30 pass.
- **Error wording on Python 3.14.** Two debug prompts quote `ValueError: too many values to unpack (expected 2)` / `(expected 3)`. That is the 3.12 text Pyodide prints; CPython 3.14 appends `, got N`. Left as is.
- **Pyodide itself was not run.** This session has no browser by instruction; snippets were run under CPython 3.12 and 3.14. All standard-library modules used (`html`, `http`, `urllib.parse`, `json`, `datetime`, `copy`) ship with Pyodide.
- **Explain-keyword matching is substring based** (`'get'` also matches "forget"). That only affects the "clean" bonus, not correctness, so the English keyword lists were left alone.
- No issue was found in the writer's treatment of the original lessons' bugs; the `$gt: 30` / `$lt: 30` output claim (d27-c22) was checked against `27_Day_Python_with_mongodb/27_python_with_mongodb.md` and is right.

## How the library claims were checked

With Flask 3 and PyMongo 4.19 in the local `.venv` (Flask's test client, no server; `MongoClient(connect=False)`, no network):

```
TypeError: The view function for 'create_student' did not return a valid response. The function either returned None or ended without a return statement.
FORM KEY MISSING -> 400
wrong method on an existing path -> 405
AssertionError: View function mapping is overwriting an existing endpoint function: update_student
PYMONGO: update only works with $ operators
JSON: Object of type ObjectId is not JSON serializable
pymongo 4.19.0 Requires: dnspython
```

## Validators (final lines)

`.venv/bin/python atolye/content/tools/validate_d21-30.py 26 27 28 29 30` (unchanged validator):
```
NOTE stateful exercises (visible tests already defeat constant answers): 14
SUMMARY files=5 exercises=160 (debug=20, explain=20, fill_blank=15, modify=20, parsons=6, predict=39, write=40) | 0 failures
```

Card validator: the branch's `validate_cards_d21-30.py` already has the 160-word limit and the median >= 45 check, but it always checks Days 21-30. A /tmp copy with only `DAYS = range(26, 31)` and an absolute repo path changed (not committed):
```
day 26: 37 cards, 12 checkpoints, 6 trace, 2 hide, median 81 words, sections covered 8/8
day 27: 38 cards, 13 checkpoints, 7 trace, 1 hide, median 86 words, sections covered 12/12
day 28: 33 cards, 12 checkpoints, 5 trace, 2 hide, median 89 words, sections covered 1/1
day 29: 32 cards, 11 checkpoints, 5 trace, 2 hide, median 90 words, sections covered 6/6
day 30: 32 cards, 11 checkpoints, 6 trace, 1 hide, median 97 words, sections covered 0/0
ran 154 code snippets
0 failures
```

## Alternative-solution test

For every one of the 40 write tasks I wrote one or two differently shaped correct solutions (63 in total, 6 of them for modify tasks with an obvious second approach), for example `Counter.most_common` for `top_words`, two `list.sort` passes instead of a tuple key for `leaderboard`, sets instead of a dict for `Library`, `try/except KeyError` instead of `.get` for `dispatch`, `docs.remove` instead of `del docs[i]` for `delete_one`, a `_MISSING` sentinel for `matches`, `import datetime` instead of `from datetime import datetime`. Each ran against the exercise's real visible and hidden tests with the validator's runner logic, under CPython 3.12.15.

- Before the fixes: 62 of 63 passed; the failure was the `import datetime` solution of d29-b1-e6 (fix 2). The d30-b2-e3 boolean problem (fix 1) was found by reading the hidden tests: the plain `isinstance(v, (int, float))` answer gives 5.5 instead of 10.
- After the fixes: **63 of 63 passed**, 0 write tasks without an alternative.
