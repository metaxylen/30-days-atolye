# Content report: session content-a (Days 1-5)

## Plan (written before the content)

Every day is built as: original `##`/`###` section -> teaching sequence (hook, concrete example, how it works underneath,
second realistic example, common mistake with the real error text, checkpoint) -> recap. Exercises: one block per taught
concept, ramp predict -> fill_blank/parsons -> debug -> predict -> modify -> write + twin write (+ explain/type_it).

- **Day 1 (Introduction)**: Introduction / Why Python / Installing Python / Python Shell (REPL, arithmetic, errors,
  debugging, `print` with `sep`/`end`) / VS Code + Python File (scripts run top to bottom) / Syntax / Indentation /
  Comments / Data types (number, string, boolean, list, dict, tuple, set) / type().
  Blocks: print and output; arithmetic operators; reading errors (SyntaxError, NameError, TypeError, IndentationError);
  data types and type(); comments and program order.
- **Day 2 (Variables, built-in functions)**: built-ins (len, min, max, sum, round, abs, help, dir, keywords); variables as
  name tags (rebinding, `b = a`), naming rules and snake_case, keywords, shadowing built-ins; multiple assignment and swap;
  input() (shown as an offline illustration); type() and casting (int/float/str/bool/list); numbers.
  Blocks: variables and rebinding; naming rules; built-in functions; multiple assignment and swap; casting.
- **Day 3 (Operators)**: booleans and truthiness; assignment and augmented assignment; arithmetic (/, //, %, ** and
  precedence, negative floor division, float precision, round); comparison (chaining, comparing strings/lengths),
  `is` vs `==`, `in`/`not in`; logical operators (and/or/not, short-circuit, return value of and/or).
  Blocks: arithmetic and precedence; floor division/modulo; augmented assignment; comparison/identity/membership;
  logical operators and truthiness.
- **Day 4 (Strings)**: creating strings, multiline; concatenation and repetition; escape sequences (and raw strings);
  formatting (%, str.format, f-strings with format specs); strings as sequences (unpacking, index, negative index,
  slicing, step, reverse, immutability); methods (case, find/index/count, startswith/endswith, strip, replace, split,
  join, is* checks).
  Blocks: concatenation and escapes; f-strings and format specs; indexing and slicing; immutability and
  search methods; split/join/strip/replace cleaning.
- **Day 5 (Lists)**: the four collections; creating lists; positive/negative index (IndexError); unpacking with `*`;
  slicing (new list); modifying; `in`; append/insert/extend (append vs extend, append returns None); remove/pop/del/clear;
  aliasing vs copy (`b = a`, `.copy()`, `[:]`); joining with `+`; count/index; reverse/sort/sorted (sort returns None,
  `key=`); list built-ins min/max/sum.
  Blocks: indexing and slicing; unpacking; adding/removing; aliasing and copying; sorting and counting.

## Results

All learner-visible text has a Turkish and an English twin. Every code output in cards and exercises (expected outputs,
predict answers, the error messages quoted in "common mistake" cards) was produced by running the code with CPython 3.13
and pasting the result automatically, not typed by hand. Exercise blocks follow the ramp predict -> fill_blank/parsons ->
debug -> predict -> modify -> write + twin write (+ explain/type_it). Every write/modify exercise has a hidden
anti-hard-code test: it re-runs the learner's source with other input values (by replacing the `name = ...` line or a
literal) and checks that the result changes accordingly, and most write tasks have an edge-case test (0, an empty list,
a single item, equal lengths).

| Day | Cards before -> after | Median explain words (tr / en) before -> after | Checkpoints | Trace cards | Blocks before -> after | Exercises before -> after |
|---|---|---|---|---|---|---|
| 1 | 40 -> 45 | 61 / 79 -> 81.5 / 106 | 18 | 4 | 3 -> 5 | 14 -> 39 |
| 2 | 38 -> 40 | 55 / 71 -> 76.5 / 103 | 15 | 6 | 3 -> 5 | 14 -> 40 |
| 3 | 21 -> 40 | 22 / 25 -> 79 / 97.5 | 15 | 6 | 3 -> 5 | 14 -> 37 |
| 4 | 29 -> 42 | 23 / 28 -> 73 / 97 | 14 | 5 | 4 -> 5 | 17 -> 38 |
| 5 | 30 -> 43 | 16 / 21 -> 73.5 / 97.5 | 14 | 7 | 4 -> 5 | 17 -> 39 |

Turkish bodies are shorter in word count than the English ones because Turkish attaches suffixes to words; the content of
the two languages is the same.

### Exercise blocks

- Day 1: print-output (sep, end), arithmetic-operators, reading-errors, data-types, script-file-comments.
- Day 2: variables-assignment, naming-rules, builtin-functions, multiple-assignment, type-casting.
- Day 3: arithmetic-precedence, augmented-assignment, comparison, membership-identity, logical-operators.
- Day 4: concatenation-escapes, string-formatting, indexing-slicing, search-check-methods, split-join-strip-replace.
- Day 5: list-access, add-remove, alias-copy, sort-reverse, count-index-stats.

Interleaving: Day 2 writes reuse Day 1 operators (num_one/num_two, circle, triangle); Day 3 uses len(), int() and type()
from Day 2; Day 4 uses comparisons, `//` and len(); Day 5 uses f-strings with `:.1f` / `:.1%`, `//` for middle indexes,
min/max/sum/len and string methods. Day 1 has no earlier day to interleave with.

## Topics added beyond the original

- Day 1: how the interpreter runs code top to bottom (trace), shell vs file (a bare expression prints nothing in a file),
  reading a traceback from the last line, the common error types (SyntaxError, NameError, TypeError,
  ZeroDivisionError, IndentationError) with real messages, `print` `sep=`/`end=`, operator precedence and `-2 ** 2`,
  real `//`/`%` uses (minutes to hours, bill sharing), triple-quoted strings vs comments (docstrings), JS comparisons.
- Day 2: function call/return model and nested calls, `round()` banker's rounding, `abs()`, `help()`/`dir()`, the
  name-tag model (`x = x + 1`, `b = a`), keywords and shadowing built-ins (`sum = 10`), NameError from order,
  swapping with `a, b = b, a`, unpacking count errors, `input()` as an offline illustration, dynamic typing,
  `int()` truncation vs `round()`, `bool()` truthiness (including `bool('False')`), float precision (`0.1 + 0.2`),
  `1_000_000`, `1e3`.
- Day 3: bool as a subtype of int (counting with sum), augmented assignment and the missing `x++`, result types of
  arithmetic, negative floor division and modulo (vs JavaScript), wrap-around with `%`, right-to-left `**`, float
  comparison with `round`/`abs(a - b) < 1e-9`, `==` without type coercion, string ordering by character code
  (capitals and Turkish letters), chained comparisons, `is` vs `==` with the name-tag model and `is None`, `=` vs `==`,
  precedence of not/and/or, short-circuit and the returned operand (`name = entered or 'Misafir'`), the `x == 1 or 2` bug.
- Day 4: string repetition, raw strings and Windows paths, f-string format specs (`.2f`, `,`, `%`, `03d`, alignment,
  `{x=}`), an aligned receipt, forgetting the `f`, immutability and building a new string, palindrome check, Turkish
  case-conversion caveat (`'istanbul'.upper()`, `'İ'.lower()`), find vs index, startswith/endswith with `lower()`,
  `strip(chars)` as a character set, `replace` with a count, split/join pattern, method chaining for cleaning input,
  "result not assigned" and "method without parentheses" mistakes.
- Day 5: nested lists and double indexes, star unpacking (`*rest` always a list), slice assignment, `in` on a list vs
  on a string, `append` returns None (`lst = lst.append(x)`), `insert` with out-of-range and negative indexes,
  `pop` as stack/queue, `clear()` vs `lst = []` with aliases, aliasing, `copy()`/`[:]`/`list()`, shallow copies of
  nested lists (with a pointer to `deepcopy`), append vs extend (and `extend('ab')`), `+=` on lists, `list + int`
  error, `sorted()` vs `sort()` returning None, `key=len`/`key=str.lower`, stable sorting, mixed-type sort error,
  median of an even-length list.

## Original bugs fixed

- Day 1: dictionary described as "unordered" (insertion order is kept since 3.7); multi-line "comment" is really a string.
- Day 2: `int('10.6')` in the casting example raises ValueError (now float first, then int); typo `'Helsink'` not copied.
- Day 3: comment on `b = 2` said 3; the line labelled `'B not in Asabeneh'` used `in`; `or` comment said "both
  statements are true"; `1 is 1` / `4 is 2 ** 2` rely on int caching and give a SyntaxWarning (taught `==` for values,
  `is` for None); density prints `1000.0`. Day 3 exercise 20 (`int('9.8')`) would crash, so it was not used as is.
- Day 4: str.format example's comment had the sentence order wrong and claimed `314` (prints `314.0`); the isdecimal
  example called `isdigit()`; tab width "8 spaces" is not guaranteed.
- Day 5: `fruits[::2]` was named `orange_and_lemon` but gives banana and mango; `print(fruits)` after `del fruits` raises
  NameError (shown as text, not run); set described as "unmodifiable"; dict as "unordered".

## Deliberately dropped or changed

- Installation screenshots, VS Code UI walkthrough and telegram/YouTube links: summarised in one card each; nothing to run.
- `input()` exercises from the original are rewritten as "simulate input()" tasks with a fixed string (no keyboard in Pyodide).
- `expandtabs()` and `rindex()` are only mentioned implicitly (rfind is taught); `help('keywords')` is described, not run,
  because its long output is not useful in a card.
- No `if` statement is used in Day 1-5 exercises (taught on Day 9). One card on Day 1 shows the *shape* of an `if`
  block, because the original's indentation section needs a block; the card says so explicitly.

## Validator changes

- `validate_cards_d01-10.py`: the explain-body word limit was already 160 in this file (it was raised by the earlier
  interrupted attempt), so it stays at 160; I added the per-day check that the median explain-body word count of
  `body_tr` and of `body` is >= 45 (uses `statistics.median`) and documented both rules in the docstring. Every other
  check is unchanged.
- `validate_d01-10.py`: not changed; I found no real bug in it.

## Final validator output

```
day  cards  checkpoints  sections+code  trace  types
1    45     18           5/5            4      {'explain': 26, 'fill': 3, 'order': 2, 'predict': 8, 'recap': 1, 'truefalse': 5}
2    40     15           3/3            6      {'explain': 24, 'fill': 2, 'order': 1, 'predict': 8, 'recap': 1, 'truefalse': 4}
3    40     15           4/4            6      {'explain': 24, 'fill': 2, 'order': 1, 'predict': 9, 'recap': 1, 'truefalse': 3}
4    42     14           6/6            5      {'explain': 27, 'fill': 2, 'predict': 10, 'recap': 1, 'truefalse': 2}
5    43     14           19/19           7      {'explain': 28, 'fill': 1, 'order': 1, 'predict': 11, 'recap': 1, 'truefalse': 1}
total cards: 210
VALIDATOR RESULT: 0 failures

files: 5
exercises: 193 by type: {'debug': 31, 'explain': 8, 'fill_blank': 19, 'modify': 23, 'parsons': 6, 'predict': 51, 'type_it': 5, 'write': 50}
SUMMARY: files=5 exercises=193 failures=0
```

## Unsure about

- Outputs were produced with CPython 3.13 while the app runs Pyodide (Python 3.14). Printed values are identical, but a
  few error messages changed slightly in 3.14 (for example "too many values to unpack (expected 2, got 3)"); the card
  on unpacking quotes the 3.13 text and says that newer versions append the count.
- Hidden anti-hard-code tests re-run the learner's source with a replaced `name = ...` line or literal. The prompts
  therefore ask for those assignments on their own line; a learner who writes a correct but differently shaped program
  (e.g. the value only inside an expression) gets a failure message that says which line is expected.
- Turkish case conversion: the Day 4 card states Python's language-independent behaviour (`'istanbul'.upper()` gives
  `ISTANBUL`); a Turkish-aware conversion needs extra code that is out of scope for Day 4.
