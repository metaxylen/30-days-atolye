# Report: content-b (Days 6-10)

## Summary

All five days were rewritten from scratch, both the lesson (cards) and the practice (exercises). Every code output in the cards, every predict answer and every expected output was produced by actually running the code. Each day was built by a small generator script that runs each snippet and fills in the output, so nothing was typed by hand. The scripts lived in the session scratchpad and are not committed, because this session may only change its own day files. Every error message quoted in a "common mistake" card was copied from a real run under Python 3.13.

| Day | Cards before -> after | Median explain words (EN) before -> after | Median TR | Checkpoints | Trace cards | Exercise blocks | Exercises |
|---|---|---|---|---|---|---|---|
| 6 Tuples | 18 -> 39 | 18 -> 84 | 66 | 7 -> 15 | 1 -> 6 | 3 -> 5 | 14 -> 41 |
| 7 Sets | 24 -> 40 | 19.5 -> 81 | 67 | 7 -> 16 | 0 -> 5 | 3 -> 5 | 14 -> 41 |
| 8 Dictionaries | 22 -> 39 | 18.5 -> 76 | 61 | 7 -> 15 | 2 -> 5 | 3 -> 5 | 13 -> 41 |
| 9 Conditionals | 17 -> 36 | 25 -> 84.5 | 69.5 | 9 -> 13 | 1 -> 5 | 3 -> 5 | 13 -> 41 |
| 10 Loops | 25 -> 42 | 26.5 -> 79 | 62 | 10 -> 16 | 4 -> 6 | 4 -> 6 | 16 -> 49 |

Total: 196 cards and 213 exercises (52 predict, 26 fill_blank, 24 parsons, 26 debug, 26 modify, 52 write in 26 twin pairs, 5 explain, 2 type_it).

### How the practice checks behaviour before functions exist
Functions arrive on Day 11, so on Days 6-10 no task asks for a `def`. Every write/modify task says "Start your program with exactly this line: ...". The hidden anti-hard-code tests find that line in `__source__`, replace it with new data, run the program again and check the new result and output. The convention is documented in each file's `test_conventions`. The validator's hard-coded-solution check fails for every one of these tests, as it should. Every write task also has an edge case (empty collection, one item, boundary value).

## Per day

### Day 6 - Tuples
- Sections: all 8 headings with code are covered (8/8). Each has a hook or example, the mental model (trace), a realistic second example, a common mistake with the real message, and a checkpoint.
- Added beyond the original: the comma (not the brackets) makes a tuple, and the silent `('Bursa')` bug; `tuple()` from strings and lists; `count`/`index` and the `ValueError` from `index`; unpacking, `a, b = b, a` swap (traced), `*rest`, and the unpacking `ValueError`s; slicing with a step and reversal; rebinding versus mutating (name-tag model, traced); a list inside a tuple can still change (traced); `*` repetition; comparing tuples item by item, `sorted`/`min`/`max`/`sum`; `del` removes a name, not items; when to choose a tuple over a list.
- Exercise blocks: creating/len/count/index; indexing and slicing; unpacking and swap; immutability and the list round trip (with an explain item); membership and joining (interleaves Day 4 `join` and f-strings, and Day 5 lists and `sorted`).
- Original issues fixed: the claim that the comma-less forms and `tuple()` are the main way to create tuples is replaced by the comma rule; the `del` section now explains that only the name goes.

### Day 7 - Sets
- Sections: 13/13 headings with code covered, including the second "Joining Sets" heading, which is really about `isdisjoint`. The card says so.
- Added: why printed set order is not fixed (and why string sets are printed with `sorted()`); `{}` is a dict (real `AttributeError`); only hashable items (`TypeError: unhashable type: 'list'`), tuples as set items; no indexing (`not subscriptable`); fast membership by hash; `update('kiwi')` adds letters; `remove` versus `discard` (`KeyError`); `pop` on an empty set; `clear` versus `del` with aliasing; deduplication plus counting distinct words (interleaves Day 4); union versus in-place `update` (traced); `+` on sets `TypeError`; operator forms `| & - ^ <= >=`; realistic uses (attendance, skills, tickets, meeting slots).
- Exercise blocks: mutation methods; dedupe and membership; union/intersection; difference/symmetric difference; subset/disjoint/hashability (with an explain item).
- Original bugs fixed: "`pop()` removes a random item from a list" (it is a set, and the item is arbitrary); the difference comment that mixes up `st1 - st2` and `st2 - st1`; `update()` "takes a list" (any iterable); the disjoint section filed under "Joining Sets"; printed set outputs shown as if ordered.

### Day 8 - Dictionaries
- Sections: 13/13 headings with code covered.
- Added: dict versus JavaScript object; insertion order; `dict()` with keyword arguments and from pairs; duplicate keys (last wins); hashable keys and tuple keys; nested access (traced); `KeyError` and `d[0]`; `get` with a default (does not insert); the counting pattern `counts.get(k, 0) + 1` (traced, written by hand, then used in a loop on Day 10); add versus modify and the typo-key bug; `update()`; `in` checks keys, not values; `pop` with a default; `popitem` removes the last inserted pair; views are live and not subscriptable; `sum`/`max`/average over `values()`; `clear()` returns `None` and the `d = d.clear()` bug; alias versus `copy()` (traced); shallow copy with a shared list (traced); choosing between list, tuple, set and dict.
- Exercise blocks: access/get/nested; add/modify/counting; membership and removal; views; aliasing and copy (with an explain item).
- Original bugs fixed: "unordered" (dicts keep insertion order); `is_marred` versus `del person['is_married']`, which raises `KeyError: 'is_married'` (turned into a debug exercise); `keys()`/`values()` "as a list" (they are views); `print(dct.clear())` showing `None` is now explained.

### Day 9 - Conditionals
- Sections: 7/7 headings with code covered.
- Added: indentation as syntax versus JavaScript braces; `if locked:` instead of `== True`; the real `SyntaxError: expected ':'`, `IndentationError` and `=`-versus-`==` messages; `str` versus `int` comparison `TypeError`; branch order in elif ladders and the silent wrong-order bug; season by membership in tuples (interleaves Day 6); the conditional expression as a value (JavaScript `?:`); guarding a dict lookup with nesting; chained comparisons `0 <= x <= 100`; short-circuit `and` as a guard against `ZeroDivisionError` (traced); the `x == 'a' or 'b'` bug; `not` and precedence with brackets; truthiness, `is None`, and a combined shipping calculator.
- `input()` exercises from the original are rewritten with a given variable, and the card shows what the real `int(input(...))` line looks like.
- Exercise blocks: if/else; elif ladders; short hand; nesting and `and`; `or`/`not`/`in`/truthiness (with an explain item).
- Original issues fixed: the if/else example that would call 0 a positive number (now explained, and fixed with elif); `print(...) if ... else print(...)` replaced by choosing a value and printing once.

### Day 10 - Loops
- Sections: 8/8 headings with code covered.
- Added: why `count < 5` is checked six times (traced); the infinite-loop mistake; `while` for an unknown number of rounds (savings); the `continue`-skips-the-increment trap (traced); `break` outside a loop; the `for` iteration model (traced) versus JavaScript `for...of`; the accumulator pattern (traced) and its reset bug; building a filtered list; manual maximum; dict loops with `items()`; set loops with `sorted`; `'int' object is not iterable`; removing items from the list you loop over (traced, real wrong output `[1, 2, 3]`) and the dict `RuntimeError`; `enumerate(start=1)`; `zip` and `dict(zip(...))`; `range` with a float `TypeError`; nested loops (traced) and patterns; choosing `for` versus `while`.
- Exercise blocks: while; for with accumulators and filters; range; break/continue/for-else (with an explain item); nested loops; dict loops, enumerate and zip.
- Original bugs fixed: "range returns a list" (it is a lazy range object); for-else described as "a message when the loop ends" (it runs only when no `break` happened); while-else likewise; `pass` "after semicolon" (after the colon).

## Deliberately left out
- `input()`: the app runs offline without a prompt. The original input exercises became given variables.
- Functions in practice tasks on Days 6-10: they are taught on Day 11. The script-style re-run tests replace them.
- Comprehensions on Day 10: they are Day 13. The loop-based filter card points ahead to them.
- `copy.deepcopy` is only mentioned on Day 8, because modules are Day 12.
- D is left out of the Day 9 grade-ladder card so the code stays within 10 lines; the full A-F ladder is in the Day 9 exercises.

## Validators (final runs)
- `validate_cards_d01-10.py 6 10`, unchanged: `VALIDATOR RESULT: 0 failures`
- Patched copy in /tmp: REPO path fixed, median explain body >= 45 words checked per day for both `body` and `body_tr`, word limit 160. Final line: `VALIDATOR RESULT: 0 failures`.
- `validate_d01-10.py 6 10`, unchanged: `SUMMARY: files=5 exercises=213 failures=0`

## Things I was unsure about
- The session brief says to raise the card validator's word limit from 90 to 160. The committed validator already uses 160, so my copy only changes the REPO path and adds the median check.
- The branch: the brief names `content-b`, and the work is pushed there. The cloud session's default branch name was `claude/content-b-brief-9mw019`; nothing was pushed to `main`.
- Error messages were captured with CPython 3.13. Pyodide's Python version may word one or two messages slightly differently (for example newer versions add "got 3" to "too many values to unpack").
- The re-run tests find the input line by its variable name (spaces ignored). A learner who renames the given variable fails those hidden tests. Every prompt says "Start your program with exactly this line", and the failure messages say what to keep.
- One Day 8 debug exercise keeps the original author's example name (Asabeneh), because it reproduces the original course's `is_marred` bug.

## Plan (written before the content)

Rule I follow on all five days: no concept before it is taught. Days 6-8 use no `if` and no loops; Day 9 uses `if` but no loops; loops arrive on Day 10. Functions arrive on Day 11, so every practice task on Days 6-10 is script-style: the prompt gives the first line (the input data), and hidden tests re-run the learner's program with a different first line. That checks behaviour on new inputs without asking for a `def`.

### Day 6 - Tuples
Sections and teaching sequences: Tuples (hook: a record that must not change; tuple vs list vs JavaScript array) -> Creating a Tuple (the comma makes the tuple; `('Ankara')` mistake; `tuple()` from other values) -> Tuple length (`len`, `count`, `index`, `ValueError` from `index`) -> Accessing Tuple Items (indexes, `IndexError`, unpacking, swap with `a, b = b, a`, `*rest`) -> Slicing tuples (new tuple, step, reverse) -> Changing Tuples to Lists (immutability errors; list round trip; rebinding moves the name tag; a list inside a tuple can still change) -> Checking an Item in a Tuple (`in`, `not in`) -> Joining Tuples (`+`, `*`, concatenation `TypeError`, comparison and `sorted`) -> Deleting Tuples (`del` removes the name, not items) -> when to choose a tuple.
Exercise blocks: create/len/count/index; index and slice; unpacking and swap; immutability and list round trip; membership and joining (interleaves strings and lists).

### Day 7 - Sets
Sections: Sets (hook: duplicates; unordered, unique; why printed order is not fixed) -> Creating a Set (`{}` is a dict, `set()`) -> Getting Set's Length -> Accessing Items in a Set (no indexes, `TypeError`; `sorted()` for a stable view) -> Checking an Item (fast membership) -> Adding Items (`add`, `update` with any iterable, `update('abc')` mistake) -> Removing Items (`remove` vs `discard`, `KeyError`, `pop` arbitrary) -> Clearing / Deleting -> Converting List to Set (deduplicate; order lost; `len(set(x))`) -> Joining Sets (`union`/`|` new set vs `update` in place) -> Intersection (`&`) -> Subset/Superset (`<=`, `>=`) -> Difference (`-`, direction matters) -> Symmetric Difference (`^`) -> isdisjoint. Only hashable items (list in a set -> `TypeError`).
Exercise blocks: create/add/remove; dedupe and membership; union/intersection; difference/symmetric difference; subset/disjoint.

### Day 8 - Dictionaries
Sections: Dictionaries (hook: look up by name, not by position; dict vs JavaScript object) -> Creating (literal, `dict()`, nested values) -> Length -> Accessing (`[]`, `KeyError`, `get` with default, nested access) -> Adding / Modifying (same syntax; the key decides) -> Checking Keys (`in` checks keys, not values) -> Removing (`pop` with default, `popitem` removes the last inserted pair, `del`) -> items/keys/values (views, not lists; `list(...)`) -> Clearing (`clear()` returns `None`) / Deleting -> Copy (alias vs `copy()`, shallow copy and a nested list) -> counting with `get(key, 0) + 1`, insertion order, keys must be hashable (tuple keys).
Exercise blocks: create/access/get; add/modify/update; membership and removal; views and conversion; aliasing and copy; counting pattern.

### Day 9 - Conditionals
Sections: Conditionals (hook: programs that decide; indentation is the block) -> If Condition (colon and indentation; `IndentationError`; `=` vs `==` `SyntaxError`) -> If Else -> If Elif Else (order of branches; first true wins; grade ranges) -> Short Hand (conditional expression returns a value) -> Nested Conditions -> If Condition and Logical Operators (`and`, chained comparison `0 <= x <= 100`) -> If and Or Logical Operators (`or`; `x == 'a' or 'b'` mistake; `in` on a tuple) -> truthiness (empty values are false; `if items:`), `is None`.
Exercise blocks: if/else; elif ladders; short hand; nested and `and`; `or`, `in` and truthiness.

### Day 10 - Loops
Sections: Loops (hook: repeat without copy-paste) -> While Loop (condition checked before each round; infinite-loop mistake; while-else) -> Break and Continue Part 1 -> For Loop (iteration over list, string, tuple, dict keys, `items()`, set) -> Break and Continue Part 2 -> The Range Function (range is lazy, not a list; stop excluded; negative step) -> Nested For Loop -> For Else (else runs only when no `break`) -> Pass. Wider: accumulator and counter patterns, `enumerate`, `zip`, building a new list, never change a list while looping over it.
Exercise blocks: while; for over sequences and accumulators; range; break/continue/for-else; nested loops; enumerate/zip and dict loops.
