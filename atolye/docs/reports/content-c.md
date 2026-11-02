# content-c report: Days 11-15

## Plan (written before the content)

Constraints taken from the validators (they are stricter than the master brief in places, so the content sits in the
intersection of both): 30 cards per day (brief 30-45, validator 10-30), 4-5 trace cards (brief 4-7, validator 2-5),
code at most 10 non-empty lines per card, recap with 4-5 points, explain bodies 50-140 words (limit 160, median >= 45),
3-6 exercise blocks with 7-10 exercises each.

- **Day 11 Functions.** Sequences: why functions, def and call (trace), forgetting `()`, local workspace and `NameError`,
  print vs return (trace) and the `None + 1` error, parameters vs arguments (trace), positional order, missing-argument
  `TypeError`, keyword arguments and their rule, early `return` (trace), returning several values, `return` inside a loop,
  default values, the mutable-default trap (trace), `*args`, normal + `*args`, `**` unpacking, `**kwargs`, functions as
  arguments (original `n ** n` bug fixed). Blocks: return / parameters and arguments / defaults / *args-**kwargs /
  functions as values.
- **Day 12 Modules.** Sequences: what a module is (file = namespace), creating a module, `import` and dotted access,
  `from ... import`, renaming with `as`, `import *` and name clashes, `__name__ == '__main__'`, `dir`/`help`, os (honest
  Pyodide note), sys (`argv` simulated), statistics (corrected numbers), math, string, random (`seed` for reproducible
  results, `choice`, `sample`, `shuffle`). Blocks: import forms / math+statistics / random / string+os+sys.
- **Day 13 List comprehension and lambda.** Sequences: loop-append vs comprehension (trace), reading order, filtering
  with `if`, conditional expression vs filter `if`, nested loops and flattening (trace), list of tuples, dict and set
  comprehensions, generator expressions with `sum`/`any`, when not to use a comprehension; lambda syntax, lambda vs def,
  lambda as `key`, lambda returned from a function (closure preview). Blocks: comprehension / filter and transform /
  nested and dict-set / lambda.
- **Day 14 Higher-order functions.** Sequences: functions as values, function as parameter, returning a function, closures
  (trace, `nonlocal`), decorators by hand then with `@` (trace), stacking order (bottom-up), decorators with
  `*args, **kwargs` and `functools.wraps`, `map` (lazy, one-shot), `filter`, `reduce` (with the missing import fixed),
  `sorted(key=...)`, map/filter vs comprehension. Blocks: functions as values / closures / decorators / map-filter /
  reduce and sorted.
- **Day 15 Error types.** Sequences: anatomy of a traceback read bottom-up (multi-frame through functions), SyntaxError
  (and IndentationError), NameError, IndexError, ModuleNotFoundError, AttributeError (including `None` results), KeyError
  (`in` and `.get`), TypeError (operands, wrong argument count, not callable / not subscriptable), ImportError,
  ValueError, ZeroDivisionError, a light preview of `try`/`except` used only as a lab tool to see an error without
  stopping (taught properly on Day 17). Blocks: reading tracebacks / name-attribute-import errors / index-key /
  type-value-zero.

## Result per day

Card numbers: cards, median explain-body words (English / Turkish), checkpoints (predict, fill, truefalse, order),
trace cards. Exercise numbers: blocks, exercises. "Before" is the state on `main` when this session started (Day 11
had been partly reworked by an interrupted earlier attempt).

| Day | Cards before → after | Median words EN / TR before → after | Checkpoints | Trace | Blocks before → after | Exercises before → after |
|---|---|---|---|---|---|---|
| 11 Functions | 37 → 30 | 77 / 61 → 107 / 84.5 | 15 → 11 | 3 → 5 | 4 → 4 | 28 → 29 |
| 12 Modules | 21 → 30 | 22 / 21 → 106 / 91 | 7 → 12 | 2 → 4 | 3 → 4 | 14 → 29 |
| 13 Comprehension, lambda | 18 → 30 | 16 / 14 → 109 / 95 | 8 → 14 | 5 → 4 | 3 → 4 | 14 → 29 |
| 14 Higher-order functions | 22 → 30 | 20 / 15.5 → 105 / 93 | 9 → 12 | 5 → 5 | 4 → 5 | 18 → 36 |
| 15 Error types | 19 → 30 | 18 / 15 → 108 / 94 | 7 → 12 | 3 → 5 | 3 → 4 | 13 → 30 |

Every day ends with a recap of 5 full-sentence points. Every block follows predict → predict → fill_blank/parsons →
debug → modify → write → write (twins), and each day has at least one explain exercise. Every explain card with code,
every predict, fill and order card, and every exercise program was produced by running the code; nothing was typed by
hand. Error messages quoted in card text were captured from real runs under Python 3.14 (the Pyodide version the app
loads, 314.0.7), and every card output and predict answer was re-checked under both 3.13 (validators) and 3.14.

Exercise blocks:

- Day 11: function-return, parameters-and-arguments, args-and-kwargs, functions-as-values.
- Day 12: import-forms, math-and-statistics, random-module, string-os-sys.
- Day 13: list-comprehension, filter-and-choose, nested-dict-set-generator, lambda.
- Day 14: higher-order-functions, closures, decorators, map-and-filter, reduce-and-sorted.
- Day 15: reading-tracebacks, name-attribute-import, index-and-key-errors, type-value-zero-errors.

Interleaving (earlier days reused on purpose): Day 11 make_username (string slicing), apply_to_values (dicts);
Day 12 count_extensions (dict counting), total_from_args (int conversion of strings); Day 13 word_lengths and
flatten_names (dicts, strings, Day 11 functions); Day 14 count_by_first_letter (dicts), compose/apply_n_times (lambda
from Day 13); Day 15 order_total (dicts), parse_error_line and deepest_line (string methods, comprehension).

## Topics added beyond the original

- Day 11: local workspace and `NameError` outside a function; `None` returned without `return` and the resulting
  `NoneType` error; positional matching pitfalls; the exact `TypeError`/`SyntaxError` messages for wrong argument
  counts, keyword-before-positional and default-before-required; early `return`; returning several values as a tuple
  and unpacking; `return` wrongly indented inside a loop; the mutable-default trap and the `None` fix; `*` and `**` in
  calls versus definitions; the cost of `**kwargs`.
- Day 12: what `import` really does (find, run once, bind a name); module caching; shadowing standard modules with
  your own file names; `import *` silently replacing the built-in `pow`; `if __name__ == '__main__':`; `dir` and
  `help`; `os.path.join`, `os.path.split`, `os.path.splitext`; honest note that the browser has an in-memory file
  system; `sys.argv` simulated and the "arguments are strings" trap; `sys.maxsize` explained correctly; statistics on
  an empty list (`StatisticsError`); `math.floor` versus `int()` for negatives and `//`; `random.seed`, `choice`,
  `sample`, `shuffle` returning `None`; `string` sets being ASCII-only (Turkish letters).
- Day 13: the loop variable not leaking out of a comprehension; conditional expression versus filter `if`; when not
  to use a comprehension (side effects); nested `for` clause order; dict and set comprehensions (`{}` is a dict);
  generator expressions with `sum`, `any`, `all`, `max`; `all([])`; realistic data clean-up; lambda versus `def`
  (PEP 8), `sorted`/`max` with `key=`, stable sorting, `list.sort` returning `None`, lambda with a default parameter.
- Day 14: a dict of functions instead of `if/elif`; `return f` versus `return f()`; closures as factories; `nonlocal`
  and `UnboundLocalError`; decorator body runs once at definition time; `*args, **kwargs` wrappers; `functools.wraps`;
  wrapper must return the result; map/filter objects are lazy, one-shot and not subscriptable; `filter(None, ...)`;
  `reduce` initial value and its empty-input `TypeError`; tuple keys for multi-level sorting; choosing between
  map/filter and comprehensions.
- Day 15: reading a multi-frame traceback bottom-up; SyntaxError family versus runtime exceptions; IndentationError
  variants; the caret sometimes pointing one line late; `Did you mean` hints; `'NoneType' object has no attribute` from
  in-place methods; `in` and `.get(key, default)`; not-callable from shadowing built-ins; not-subscriptable `None`;
  ImportError versus ModuleNotFoundError (and the `(unknown location)` suffix); unpacking `ValueError`; checking input
  with `isdigit` before converting; a calm debugging routine. A minimal `try`/`except` "lab tool" is used so checkpoints
  can show an error's type without stopping; the card says plainly that Day 17 teaches it properly.

## Original bugs fixed

- Day 11: `square_number` was `n ** n` (printed 27 for 3); now `n ** 2` with a note. The original indentation error in
  `generate_full_name` (two parameters) is gone.
- Day 12: statistics example printed wrong values (claimed mean ~22.9, median 23, stdev ~2.3); real values 21.09, 22,
  20, 6.11 with an explanation of the outlier. `math.log10` used after only `from math import ...` (would be a
  `NameError`); `math.log10(100)` is `2.0`, not `2`. `sys.maxsize` was described as the largest integer.
- Day 13: `positive_even_numbers` comment showed `[2, 4, ..., 20]`; the real result is `[4, 6, 8, 10]`. The list of
  tuples comment was truncated; explained.
- Day 14: `reduce` used without `from functools import reduce`; the import is added and the `NameError` explained.
  Redundant `if ...: return True / return False` predicates simplified. The `absolute` helper is the built-in `abs`.
- Day 15: the ImportError section was titled "Example 1: TypeError"; messages updated to what Python 3.14 prints
  (for example `Did you mean print(...)?`, `Did you mean: 'pi'?`).

## Deliberately dropped or changed

- Importing a real `mymodule.py`: the exercise runner uses isolated mode and the cards show single files, so local
  imports cannot run here. The module file is shown, and the runnable examples use standard modules with identical
  mechanics; the card says so.
- The original "Function with Default Parameters" `str(mass * gravity) + ' N'` pattern was replaced by returning a
  number and formatting at the caller (better habit); `weight_of_object` keeps its name.
- Day 14 Level 3 tasks on `countries_data.py` (sorting a large external data file) were not reproduced; the same skills
  are practised with small inline data (sort by key, count by first letter, join countries).

## Validators (I am validator owner for d11-20)

- `validate_cards_d11-20.py`: explain-body word limit raised from 90 to 160 (both languages); new per-day check that
  the median explain-body word count is >= 45 for `body_tr` and for `body`; it now accepts `first last` day arguments
  (it ignored them and always ran 11-20). Every other check is unchanged.
- `validate_d11-20.py` (exercise validator): not loosened. Only change: it now accepts `first last` day arguments
  (before, `11 15` was silently ignored and all ten days were validated, which made a five-day run impossible without
  the `ONLY_DAYS` environment variable). I count this as a bug fix of the command-line interface, not of a check.

Final lines:

```
$ .venv/bin/python atolye/content/tools/validate_cards_d11-20.py 11 15
day11: 30 cards, 11 checkpoints, 12/12 code sections mapped
day12: 30 cards, 12 checkpoints, 10/10 code sections mapped
day13: 30 cards, 14 checkpoints, 3/3 code sections mapped
day14: 30 cards, 12 checkpoints, 9/9 code sections mapped
day15: 30 cards, 12 checkpoints, 10/10 code sections mapped
section mapping: 44/44
RESULT: 3004 checks, 0 failures

$ .venv/bin/python atolye/content/tools/validate_d11-20.py 11 15
files: 5
exercises per type: debug=21, explain=6, fill_blank=14, modify=21, parsons=7, predict=42, write=42
hard-coded cheat programs generated and caught by a hidden test: 63
SUMMARY: 5 files, 153 exercises, 0 failures
```

## Things I was unsure about

- Brief versus validator: the brief asks for 30-45 cards, 4-7 trace cards, code up to 12 lines and 4-6 recap points;
  the validator (which I was told to keep except for the two changes) allows at most 30 cards, 2-5 trace cards, 10
  code lines and 3-5 recap points. I used the intersection: exactly 30 cards, 4-5 trace cards, at most 10 lines,
  5 recap points. Explain bodies run 87-129 words, inside the brief's 50-140.
- Branch: the session brief names the branch `content-c`; the cloud session was also created with a
  `claude/content-c-muryvs` branch. I pushed to `content-c` as the brief and the owner's message say, and did not
  touch `main`.
- Turkish technical terms follow the course table; a few extra terms got a gloss on first use (e.g. "yüklem
  (predicate)", "sözde rastgele (pseudo-random)", "tembel (lazy)"). A native-speaker read-through would still be
  worthwhile.
- The Day 15 checkpoints rely on the `try`/`except` lab tool two days before Day 17. I judged an honest preview better
  than checkpoints that cannot run; the card states that Day 17 covers it.
- Random-based tests check properties (length, allowed characters, variety over many calls) rather than exact values;
  the variety thresholds are far from any realistic chance of failing, but they are statistical by nature.
