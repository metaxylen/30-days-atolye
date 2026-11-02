# Review report: review-a (content-a, Days 1-5)

Branch `review-a`, created from `origin/content-a`. Only the five days' card and exercise files and this report were
changed; the validators were not touched.

## Method

- I read every card (body, why, statement, prompt, choices, recap) in both languages, and every exercise (prompt, code,
  choices, misconceptions, hints, solution, tests) in English, plus all of Day 1's and a sample of Day 5's Turkish
  exercise text. I checked concept order against earlier days and compared the content with the master brief's glossary
  and mental models.
- Every error message quoted in a card or prompt was re-run on CPython 3.13 (30 snippets: SyntaxError variants,
  NameError, TypeError, ValueError, IndexError, AttributeError). All but one matched exactly; that one is fix 1 below.
  The validators re-run every card snippet and its expected output.
- I wrote 81 alternative or hard-coded programs for the write and modify tasks (at least one differently written
  correct solution for every write task, plus hard-coded and incomplete versions that should fail) and ran them against
  the tests with a copy of the validator's runner.

## Counts

| | |
|---|---|
| Cards read | 210 (45 / 40 / 40 / 42 / 43) |
| Exercises read | 193 (39 / 40 / 37 / 38 / 39) |
| Issues found | 25 |
| Issues fixed | 25 |

| Category | Found | Fixed |
|---|---|---|
| Correctness | 11 | 11 |
| Clarity | 1 | 1 |
| Pedagogy | 1 | 1 |
| Exercise | 4 | 4 |
| Turkish | 8 | 8 |
| Consistency | 0 | 0 |

Overall the writer's content is strong: the outputs are real, the name-tag model is used everywhere and never
contradicted, the hint ladders teach, and the anti-hard-code tests work. Most fixes are precise statements that were a
little too broad.

## The 10 most important fixes (before -> after)

1. **d05-c22 (correctness)**: the quoted error after `del fruits; print(fruits)` was
   `NameError: name 'f' is not defined` -> `NameError: name 'fruits' is not defined` (real CPython output), in both languages.
2. **d03-b3-e5 (exercise)**: the hidden test needed the exact text `0 <= grade <= 100`, so the correct chain
   `100 >= grade >= 0` failed -> the test now re-runs the program with grade 50, 0, 100, -1 and 101 and checks `is_valid`
   (the visible "no `and`" test stays).
3. **d05-b3-e6 (exercise)**: the test needed `clear()` even though the prompt only says "empty in place", so
   `del playlist[:]` failed -> the test now checks `shared is playlist and playlist == []` and that no new list was
   assigned. A hard-coded `playlist = []; shared = []` still fails.
4. **d04-b3-e6 (exercise)**: the prompt asked for "indexes (name[0], and the letters at the start of the second and
   third words)", which invites fixed positions such as `name[7]`, but a hidden test uses another name -> the prompt now says
   the code must work for any three-word name (and names the hidden test's input), and tells the learner to use
   `name.split()` and `[0]`.
5. **d05-c33 (correctness)**: the text said "`ages.index(24)` gives 3" while the card's own list and output give 2 ->
   "for the `ages` list below, `ages.index(24)` gives 2".
6. **d04-c25 (correctness)**: "The length of a slice is always `stop - start`", and the same card then shows
   `'Python'[4:100]` with length 2 -> "As long as both positions are inside the string, the length of a slice is
   `stop - start`."
7. **d03-c22, d03-c29, d05-c36, d03-b3-e4 misconception (correctness)**: "all capital letters come before all lowercase
   letters" is false for Turkish capitals (`'Ç' > 'a'`, `'İ' > 'z'`), and these same cards discuss Turkish letters ->
   "the capital letters A-Z all come before the lowercase letters a-z" (TR: "A-Z büyük harflerinin hepsi a-z küçük
   harflerinden önce gelir").
8. **d01-c03 why (correctness/clarity)**: "(The exception is a spelling error in the syntax, which stops the program
   from starting at all.)" -> "(Syntax errors are different: Python checks the grammar of the whole file first, so an
   unclosed quote on line 3 stops the program before line 1 runs.)" The Turkish no longer uses "istisna" (the glossary
   word for exception) in its everyday sense.
9. **d05-c39 (correctness)**: "the method changes in place and returns `None`; the function returns a new value" was
   stated as a general rule. It is false for `pop()` and for every string method, which the learner met the day before ->
   limited to these list tools: "the method (`sort`, `reverse`) ... the function or slice (`sorted`, `[::-1]`) returns a
   new list".
10. **d01-c30 (correctness/Turkish)**: the "useless comment" example was `# 18 ile çarp` in Turkish and
    `# multiply by 20` in English, while the code multiplies by `1.2` -> `# 1.2 ile çarp` / `# multiply by 1.2`.

## Other fixes

- d02-c23: the swap card explained the tuple as `('second', 'first')` while the code uses Ayşe/Mehmet ->
  `('Mehmet', 'Ayşe')` (both languages).
- d03-b4-e3: the prompt said "the comparison uses the wrong operator", but the starter code has no comparison
  (`print(result = None)`) -> the prompt now says it uses `=` where a question is needed and quotes the real TypeError.
- d05-c26 (clarity): "`copy is a` is False" (no such name) -> "`a.copy() is a` is False".
- d02-b4-e4 misconception (pedagogy): "after one swap line" -> "after the first update line" (the lines are updates,
  not swaps).
- Turkish:
  - d01-c27 and d01-c29: the code strings `'5, 3ten büyük'` / `'10, 1den büyük'` had no apostrophe. They now use
    double quotes, which Day 1 teaches for exactly this case: `"5, 3'ten büyük"`, `"10, 1'den büyük"`. Expected outputs
    and prompts were updated to match.
  - d02-c05: "`dir()` kullanılabilir isimleri sayar" -> "listeler".
  - d02-c19: the Turkish JavaScript comparison meant something different from the English. It is now "`let` ile
    tanımlanan bir değişkeni tanımlandığı satırdan önce kullanmak hata verir".
  - d04-c19: "ikiler" -> "onu iki kez yaz".
  - d04-c33: removed a redundant "karakterdir".
  - d04-c38: the terse "Pratik: `int()` öncesi `isdigit()`" is now a full sentence (English twin too).
  - d05-c12: the English section name "Copying a List" in the Turkish body -> "liste kopyalama kartlarında".

## Not fixed and why

- Two hidden tests replace digits across the whole source (d01-b5-e6/e7, for example `'7' -> '4'`, `'11' -> '7'`). A
  learner's comment that contains those digits is rewritten too, but that is harmless, and every correct form I tried
  passed (inline numbers, named coordinates, swapped subtraction order). I left these tests as they are.
- The NameError suggestion `Did you mean: 'round'?` in d03-c08 depends on which names exist; it matches CPython 3.13 for
  the snippet as shown. It may differ in Pyodide 3.14, so I left it as an illustration.
- Error-message wording for Python 3.14 (unpacking counts) is already handled by the writer's note in d02-c25.

## Alternative-solution tests

81 cases: 75 correct alternatives that must pass and 6 hard-coded or incomplete versions that must fail (for example
`print('2/11/2026')`, `print('Sepet: 3 ürün, toplam 135 TL')`, `playlist = []; shared = []`, a minutes/hours solution
without `%`).

- Before the fixes: 79/81 behaved as expected. Failures: `100 >= grade >= 0` (d03-b3-e5) and `del playlist[:]`
  (d05-b3-e6).
- After the fixes: **81/81 as expected**. Examples of alternatives that pass: unpacked `username, domain =
  email.split('@')`, `find(' ')`/`rfind(' ')` for the acronym, `queue.extend([...])`, inserting `SQL` then `Python` at
  the same index, `sep='\n'` instead of two prints, `seconds = years * 365 * 86400`, an f-string instead of comma
  arguments, `not 'java' in sentence`.

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
