# Review report: review-e (Days 21-25, writer branch content-e)

Reviewer branch `review-e`, created from `origin/content-e` (writer's last commit `ab06f36`). The review followed `atolye/docs/briefs/review-master.md`. No subagents were used. Only the ten day files and this report were edited; the validators are unchanged.

Environment used for every run: Python 3.14.8, NumPy 2.5.4, pandas 3.1.0 (venv at the repo root). Pyodide itself was not run (no browser in this session).

## Counts

| | Day 21 | Day 22 | Day 23 | Day 24 | Day 25 | Total |
|---|---|---|---|---|---|---|
| Cards read | 45 | 33 | 30 | 43 | 40 | 191 |
| Exercises read | 37 | 30 | 29 | 35 | 35 | 166 |

Every card was read in English and in Turkish. Every exercise was read in English (prompt, code, choices, explanation, misconceptions, hints, tests, solution). The Turkish prompt, hints, explanation and worked-example notes of every exercise were read too.

| Category | Issues found | Fixed |
|---|---|---|
| Correctness | 7 | 7 |
| Clarity | 2 | 2 |
| Pedagogy | 1 | 1 |
| Exercise | 2 | 2 |
| Turkish | 12 | 12 |
| Consistency | 1 | 1 |
| **Total** | **25** | **25** |

## The 10 most important fixes (before → after)

1. **d24-b3-e4 (exercise): the prompt promised the wrong answer.** Before: "total should be the sum of price times quantity, 340.0" (TR: "340.0 olmalı"). The fixed data gives 50·5 + 20·3 + 30·3 = 400, and `expected_output` was already 400.0. A learner who fixed the bug correctly would have seen 400.0 and doubted a correct solution. After: 400.0 in both languages.
2. **d22-c08 (correctness): the card's output depended on the Python version.** Before: the card printed the message from `'<li>' in r`. Python 3.12/3.13 say "argument of type 'Response' is not iterable", but Python 3.14 says "... is not a container or iterable", so the card validator failed on 3.14. After: the card shows `r.count('<li>')`. Its message, `AttributeError: 'Response' object has no attribute 'count'`, is the same in every 3.x version. The body teaches reading the type name and the fix `r.text.count(...)`, and says that `'<li>' in r` gives a `TypeError` with the same fix.
3. **d25-c37 (Turkish, meaning reversed).** Before: "Dikkat: "JavaScript" aranırken "Java" da eşleşir". That is backwards: it said that searching for JavaScript matches Java. After: "Dikkat: "java" ararken "JavaScript" de eşleşir;", which is the same claim as the English card.
4. **d24-c41 (correctness): the text and the code disagreed.** Before: "`argmax` gives the position of the largest value, so you can also find the hardest exam (the one with the lowest average)". The code uses `argmin`, and the lowest average needs `argmin`. After: "`argmin` gives the position of the smallest value (and `argmax` that of the largest) ...", in both languages. The English body now also explains the `'G'`/`'K'` letters (geçti/kaldı), which an English reader could not decode.
5. **d21-b5-e3 (exercise): a test that could not fail.** Before: the hidden test checked `'super()' in` the `ElectricCar` source. The starter code already contains `super().__init__`, so a solution that copied the parent's f-string instead of reusing it still passed. After: the test checks `'super().describe()'`. Verified: the reference solution and an f-string variant (`f'{super().describe()}, ...'`) pass, and the copy-the-parent version fails.
6. **d22-b2-e4 hint (correctness).** Before: "Day 2: values of different types are never == equal". That is false (`1 == 1.0`, `True == 1`). After: "an int and a str are never == equal (Day 2)", in both languages.
7. **d23-c10 (correctness).** Before: "With a venv active, that last folder is the venv's own `site-packages`". `sys.path` depends on which interpreter runs, not on activation, and d23-c12 rightly teaches that `venv/bin/python` works without activating, so the two cards contradicted each other. After: "When the venv's Python is the one running (which is what activating arranges), ...".
8. **d23-c24 (correctness).** Before: "`fnmatch` matches the same kind of patterns" as `.gitignore`. In `fnmatch`, `*` crosses `/`; in `.gitignore` it does not. After: the card calls `fnmatch` an approximation and says why `venv/*` also catches files deep in the folder.
9. **Turkish "liste" → `list` over-replacement (5 places).** The writer's final pass turned every "liste" into the Python type `list`, including places that mean an ordinary or HTML list. Before → after: "fiyat list'leri" → "fiyat listeleri" (d22-c01); "`<ul>` bir list açar ... `</ul>` list'i kapatır" → "bir liste açar ... listeyi kapatır" (d22-c03); "list'teki her öğenin" → "listedeki" (d22-c28, HTML `<li>` items); "list sayfasından" → "liste sayfasından" (d22-c31, a web page); "fiyat list'ine" → "fiyat listesine" (d24-c18). The same pass broke code in d24-c34: `rng.choice(list, size=10)` → `rng.choice(items, size=10)`, as in the English twin; `list` there would also have shadowed the built-in.
10. **d21-c30 (Turkish, garbled).** Before: "Altı çift alt çizgili bu metotlara" ("six double-underscored"). After: "Adı çift alt çizgiyle başlayıp biten bu metotlara".

## Other fixes

- **d23-c04 (correctness):** a new venv's `site-packages` is not empty, because `pip` is installed into it. The answer now says "its own `site-packages`, which at first holds little more than `pip`", in both languages.
- **d25-c02 (correctness):** "the values of every column are a NumPy array inside" is not true for text columns in pandas 3. The card now says "a numeric column".
- **d21-c24 (consistency, name-tag model):** "every object is bound to the same list object" → "every object's `skills` ends up bound to that one list object". The objects stay separate; only their attribute tags point at the one list. Both languages were changed.
- **d22-c05 / d22-c06 (Turkish):** "yedek" (backup) for "stand-in" → "taklit" ("yerine geçecek küçük bir taklit", "Taklidimizde").
- **d23-c13 (Turkish grammar):** "Sonra venv'deki programın çalışınca" → "Sonra programını venv içinde çalıştırınca".
- **d25-c21 (Turkish):** the title said "Sütunu yerinde değiştirmek" ("in place"), but the card teaches reassignment. It now says "Sütunu değiştirmek", matching "Changing a column".
- **d25-c39 (Turkish + clarity):** the Turkish text pointed to "30. gün". The task "Explore the data and make sense of it" is in Day 25's own exercises (line 1212 of the original lesson). It now says "alıştırmalarda", like the English. The variable `adults` (a height filter, not an age filter) was renamed to `kept`; the output is unchanged.
- **d24-b3-e6 hint 1 (pedagogy):** it relied on "Day 25's pandas BMI", which has not been taught yet on Day 24. It now states the formula and the centimetre-to-metre step.

## Checked and left as is

- Every predict answer, `expected_output` and quoted error message was compared with a real run on Python 3.14 / NumPy 2.5 / pandas 3.1 (through the validators). All matched except d22-c08, which is fixed above.
- The original-lesson bug claims in the writer's report were checked against the original lessons and hold: the Statistics mean of 29.76, the `[::]` "reverse", the 3×3 `size`, the dot-product comment, `pip install conda`, and the Git Bash activation path.
- d23-b1-e1's explanation mentions `create_env`. That is fine, because the block's worked example defines it.
- d25-b5-e7 has distractors that differ only in dict key order. They test real behaviour (`value_counts` sorts by frequency, `groupby` by key), so they were kept.

## Could not fix, or deliberately not changed

- **Pyodide was not run.** NumPy/pandas versions in Pyodide may print differently. The writer avoided platform-dependent output, and two full validator runs on a newer stack (NumPy 2.5, pandas 3.1, Python 3.14) found only the d22-c08 problem. A run in the real app is still advisable.
- **Anti-loop checks (`'for ' not in __source__`)** in d24-b3-e3, d24-b3-e6, d24-b4-e5, d24-b4-e6 and d25-b3-e3 would also reject a learner's comment that contains the word "for ". Correct loop-free code passes. Weakening these checks would let loop solutions through, so they were left as they are and noted here.
- **Validators:** not changed (this session is not the validator owner, and the card validator already has the 160-word limit and the median ≥ 45 check).

## Alternative-solution tests

71 alternative correct solutions, written differently from the reference, were run against each exercise's full test list (visible and hidden): 1-3 per write task, covering all 46 write tasks, plus one modify task. All 71 pass. Examples of the variations: `statistics.mean`/`median` and a counting dict inside `Statistics`; `type(self).next_number` for the ticket counter; `findall('.//a')` and an `HTMLParser` subclass for `absolute_links`; `Counter` for `count_tags`; `re.match` for `parse_requirement`; `np.count_nonzero`, `np.bincount` and `.size` for the NumPy counters; `nlargest`, `sort_index(axis=1)`, `assign` and `getattr` loops for pandas.

One deliberately wrong alternative was run to check that a test is strict enough: a d21-b5-e3 solution that copies the parent's text instead of calling `super().describe()`. It now fails, as intended.

## Validators' final lines

```
$ .venv/bin/python atolye/content/tools/validate_cards_d21-30.py 21 25
day 21: 45 cards, 20 checkpoints, 6 trace, 3 hide, median 87 words, sections covered 9/9
day 22: 33 cards, 14 checkpoints, 4 trace, 3 hide, median 86 words, sections covered 1/1
day 23: 30 cards, 13 checkpoints, 5 trace, 2 hide, median 92 words, sections covered 1/1
day 24: 43 cards, 15 checkpoints, 4 trace, 3 hide, median 91 words, sections covered 35/35
day 25: 40 cards, 13 checkpoints, 4 trace, 4 hide, median 87 words, sections covered 18/18
ran 169 code snippets
0 failures

$ .venv/bin/python atolye/content/tools/validate_d21-30.py 21 22 23 24 25
NOTE stateful exercises (visible tests already defeat constant answers): 14
SUMMARY files=5 exercises=166 (debug=23, explain=9, fill_blank=17, modify=23, parsons=6, predict=42, write=46) | 0 failures
```

Before the fixes, the card validator on this stack reported `1 failures` (d22-c08).
