# Report: content-e (Days 21-25)

## Plan (written before the content)

### Day 21 — Classes and Objects
Sections → sequences: everything is an object (type of built-ins) → why classes (dict + loose functions vs one package) → `class`, CamelCase, the class statement runs → calling the class makes an instance, two calls = two objects, `b = a` = second name tag (trace) → `__init__` and `self` (trace), what `Person('Ada')` does underneath (create, call `__init__`, hand back) → several attributes, `__dict__` → mistakes: missing `self`, `name = name` → methods, `p.m()` is `Person.m(p)` (trace) → shopping cart → mistakes: method without `self`, attribute without `self.` → defaults in `__init__`, keyword arguments → mutable default trap and the `None` fix → methods that change state (trace) → class vs instance attributes → `__repr__`/`__str__` → `@property` + validating setter → inheritance and method lookup → `super().__init__` (trace) → mistake: child `__init__` without `super()` → overriding and extending with `super().method()` → polymorphism in a payroll loop → recap.
Exercise blocks: constructor & attributes · methods & state (PersonAccount from the original Level 2) · defaults, mutable default, class attributes · `__repr__` & `@property` · inheritance/override (+ the Statistics class from the original Level 1, with the original's wrong expected values fixed).

### Day 22 — Web scraping (offline, honest illustration)
Sequences: what scraping is and when it is (not) allowed → HTML as a tree of tags with attributes; classes/ids as targets → `requests.get` / status codes, shown with a stand-in `fake_get` that returns a small response object (a Day 21 class) → `raise_for_status` style error handling → parsing with the standard library `html.parser.HTMLParser` (subclass + override, interleaving Day 21) → extracting text, links (`urljoin`) and a table into a list of dicts → why regex on HTML is fragile (Day 18 interleave) → cleaning text (`strip`, `split`, numbers with `,`) → saving as JSON (`json.dumps`, Day 19) → `robots.txt` with `urllib.robotparser` and polite scraping → the real version with `requests` + BeautifulSoup in words → recap.
Exercise blocks: HTML structure & selecting · stand-in requests & status handling · HTMLParser extraction · table → records → JSON.

### Day 23 — Virtual environments
Sequences: the problem (two projects need different versions of one package) → what a venv is (a folder with its own interpreter link and `site-packages`) → creating (`python -m venv venv`), activating per OS, the prompt change, deactivating → how activation works (PATH lookup simulated in Python) → how `import` finds packages (`sys.path`, first match wins, simulated) → `pip freeze` format and `requirements.txt` (parsing it in Python) → version specifiers `==`, `>=`, `~=` → mistake: comparing versions as strings, the tuple fix → `.gitignore` for `venv/` → recap.
Exercise blocks: isolation model (dict of environments) · PATH / sys.path lookup · requirements parsing · version comparison and conflict checks.

### Day 24 — Statistics and NumPy
Sequences: `statistics` module (mean, median, mode, stdev vs pstdev) → why NumPy (vectorised maths, one dtype) → creating arrays from lists/tuples, dtype int/float/bool, `tolist` → shape, size, ndim, dtype → element-wise arithmetic (+ - * / % // **) and broadcasting → mistake: list `*` vs array `*` → dtype conversion `astype` (float→int truncates) → 2-D indexing rows/columns, slicing, reversing → views vs copies (aliasing trace) → boolean masks → missing values with `np.nan`, `isnan`, `nanmean` → zeros/ones/reshape/flatten/hstack/vstack → arange/linspace → seeded random (`default_rng`) → statistical functions with `axis` → histogram counts instead of a plot → tile/repeat → dot/matmul/det → recap.
Exercise blocks: statistics module · array creation & attributes · vectorised arithmetic & broadcasting · indexing, slicing, masks · aggregation with axis & missing values.

### Day 25 — Pandas
Sequences: Series (default/custom index, from dict, constant, linspace) → index lookup vs position (`loc`/`iloc`) → DataFrame from list of lists / dict / list of dicts → reading CSV (from a string with `io.StringIO`; the real version reads a path) → exploring (head, tail, shape, columns, describe) → selecting columns → adding and modifying columns, vectorised BMI instead of a loop, `round` → dtypes and `astype` → boolean indexing, `&`/`|` with parentheses (the `and` mistake) → missing values (`isna`, `fillna`, `dropna`) → sorting, `value_counts`, `groupby` → `str.contains` for the hacker-news style exercise → recap.
Exercise blocks: Series · DataFrame creation & exploration · columns (add/modify/astype) · filtering · missing values & groupby.

## Results

| Day | Cards before → after | Median explain words EN / TR (after; before EN) | Checkpoints | Trace cards | Exercise blocks | Exercises before → after |
|---|---|---|---|---|---|---|
| 21 Classes and Objects | 38 → 45 | 87 / 66 (67) | 20 | 6 | 5 → 5 | 39 → 37 |
| 22 Web Scraping | 25 → 33 | 85 / 63 (72) | 14 | 4 | 3 → 4 | 14 → 30 |
| 23 Virtual Environments | 11 → 30 | 91 / 69 (32) | 13 | 5 | 3 → 4 | 14 → 29 |
| 24 Statistics and NumPy | 30 → 43 | 90 / 69 (28) | 15 | 4 | 4 → 5 | 17 → 35 |
| 25 Pandas | 30 → 40 | 87 / 68 (27) | 13 | 4 | 4 → 5 | 17 → 35 |

The Turkish medians are lower than the English ones because Turkish is agglutinative and needs fewer words for the same content. Both languages pass the `>= 45` median check. Every day was rewritten from scratch; nothing from the earlier draft was kept unreviewed. Day 21 has two exercises fewer than the interrupted draft, but every block was rebuilt around the full ramp, and the original Level 1 and Level 2 tasks are now part of it.

Every `expected_output`, predict answer, fill/order output and exercise predict was produced by running the code. The builder scripts refuse to write a predict whose stated answer differs from the real output.

### Validator work (validator owner, d21-30)
- `validate_cards_d21-30.py` already had the 160-word explain limit and the per-day median `>= 45` check (both `body_tr` and `body`) when I started, so those needed no change. I added `first last` day-range arguments: the session brief runs it as `... 21 25`, but it ignored its arguments and always checked days 21-30, including other sessions' days. All other checks are unchanged.
- `validate_d21-30.py` (exercise validator): unchanged. No real bug found.

### Final validator lines
```
$ .venv/bin/python atolye/content/tools/validate_cards_d21-30.py 21 25
day 21: 45 cards, 20 checkpoints, 6 trace, 3 hide, median 87 words, sections covered 9/9
day 22: 33 cards, 14 checkpoints, 4 trace, 3 hide, median 85 words, sections covered 1/1
day 23: 30 cards, 13 checkpoints, 5 trace, 2 hide, median 91 words, sections covered 1/1
day 24: 43 cards, 15 checkpoints, 4 trace, 3 hide, median 90 words, sections covered 35/35
day 25: 40 cards, 13 checkpoints, 4 trace, 4 hide, median 87 words, sections covered 18/18
ran 169 code snippets
0 failures

$ .venv/bin/python atolye/content/tools/validate_d21-30.py 21 22 23 24 25
NOTE stateful exercises (visible tests already defeat constant answers): 14
SUMMARY files=5 exercises=166 (debug=23, explain=9, fill_blank=17, modify=23, parsons=6, predict=42, write=46) | 0 failures
```

## Per day

### Day 21 — Classes and Objects
- **Added beyond the original:** `isinstance`, `is` vs `==` on objects, `b = a` aliasing on objects (trace), what `Person('Ada')` does underneath (calling `Person.__init__(p, ...)` by hand), `__dict__`, `p.m()` == `Person.m(p)`, the mutable-default trap and the `None` fix (trace), class vs instance attributes and shadowing, `__repr__`/`__str__` and how lists use `__repr__`, `@property` (computed) and a validating setter that raises `ValueError`, method lookup order (`__mro__`), extending with `super().method()`, polymorphism in a payroll loop. JavaScript comparisons: `new`, `constructor`, `this`, `get x()`.
- **Original bugs fixed:** `print(Person)` is shown with an object address in the original; it really prints `<class '__main__.Person'>`. The Level 1 Statistics exercise gives the mean as 30; it is 29.76 (the exercise uses the exact value and also tests an even-length median). The Level 2 PersonAccount uses sets for incomes and expenses, which would drop two identical expenses; the exercise uses lists of `(amount, description)` tuples and says why.
- **Exercise blocks:** constructor and attributes · methods and state (PersonAccount, Statistics) · defaults, mutable default, class attributes · `__repr__` and `@property` · inheritance, `super()`, override and polymorphism.
- **Dropped:** printing memory addresses (they change on every run); `type()`/`isinstance` are used instead.

### Day 22 — Web Scraping (offline)
- **Approach:** no `requests`, `bs4` or network. A `Response` class plus a `fake_get` dict lookup stands in for `requests.get`. Parsing uses the standard library: `xml.etree.ElementTree` for well-formed fragments, with `find`/`findall`/`iter`/`get`/`text` playing the part of BeautifulSoup's `find`/`find_all`, and `html.parser.HTMLParser` for messy HTML. Every card says what the real `requests` + BeautifulSoup line looks like.
- **Added:** the fetch → parse → extract → store pipeline, legality and `robots.txt` (`urllib.robotparser`, which runs offline), status codes and a `raise_for_status` model with the exception travelling up (trace), `Response` vs `.text` (a real `TypeError`), `None` from `find` (a real `AttributeError`), `urljoin` for relative links, attribute selectors, tables → rows → `dict(zip(...))` → `json.dumps(ensure_ascii=False)`, cleaning Turkish number formats, why regex breaks on HTML (Day 18 interleave), `ParseError` on unclosed tags, subclassing `HTMLParser` (Day 21 interleave), a flag-based state machine, and a small crawler with a visited set.
- **Original bugs fixed:** none in code. The original's scraping examples depend on live websites and cannot run.
- **Exercise blocks:** HTML tree and selecting · fetching and status handling · HTMLParser extraction · table → records → JSON and cleaning.

### Day 23 — Virtual Environments
- **Approach:** the lesson is shell commands. Those stay as text, and every runnable card models the mechanism in Python: `site-packages` as a dict, PATH lookup (`which`, trace), `sys.path` first-match import, `sys.prefix != sys.base_prefix` (described but not executed, because its output depends on the machine), `pip freeze`/`requirements.txt` parsing, version specifiers (`==`, `>=`, `<`, `~=`), the string-comparison trap (`'1.10.0' > '1.9.0'` is False) and the tuple fix, `.gitignore` with `fnmatch`, and dependency-conflict detection with sets.
- **Original bugs fixed:** the Windows Git Bash activation is written `venv\Scripts\. activate`; the correct form is `source venv/Scripts/activate`. Activation commands are given for PowerShell (`Activate.ps1`) and cmd (`activate.bat`). The card notes that `virtualenv` is optional since `python -m venv` is built in.
- **Exercise blocks:** environment isolation model · PATH / `sys.path` lookup · requirements parsing · version comparison and conflicts.

### Day 24 — Statistics and NumPy
- **Added:** the `statistics` module (mean, median, mode, pstdev vs stdev), list `*`/`+` vs array `*`/`+`, upcasting to one dtype, `astype` truncation, `tolist` before `json.dumps` (a real `TypeError`), broadcasting and its error message, `np.where`, a VAT/discount realistic example, **views vs copies** (trace; list slices copy, array slices do not, masks copy), boolean masks with `&`/`|` (trace), `np.nan`/`isnan`/`nanmean` and the `x == np.nan` trap, a seeded `default_rng`, `np.histogram` instead of matplotlib/seaborn plots (not available offline), `axis` explained as "the dimension that disappears", `@`, and a class grade report (trace).
- **Original bugs fixed:** the comment giving `size` of a 3×3 array as 3 (it is 9); a missing parenthesis in `three_by_four_array`; the missing floor-division output; the undefined `numpy_float_list`; `[::]` presented as "reverse" (it reverses nothing); the median line commented out (`np.median` works); the dot-product comment `3*6` (it is `3*3`, giving 23); `np.matrix` replaced by 2-D arrays (deprecated). The "How to represent missing values" heading never shows a missing value in the original; the card for that heading now teaches `np.nan`.
- **Platform note:** Atölye runs 32-bit Pyodide, where NumPy's default integer is `int32`, while the validator's Python shows `int64`. No card or test prints an integer dtype name: cards print `dtype.kind` (`i`, `f`, `b`, `U`) and explain why. Random values are never printed, only their shape and range and the fact that a seed is reproducible, because generator streams can differ between NumPy versions.
- **Exercise blocks:** statistics module · array creation, dtype, shape, `tolist` · vectorised maths and broadcasting · indexing, slicing, views, masks · aggregation with `axis`, missing values, random sampling.

### Day 25 — Pandas
- **Approach:** CSV files are read from strings with `io.StringIO`; the card says the real call takes a path. The sample data mirrors `weight-height.csv` (heights in inches, weights in pounds).
- **Added:** `loc` vs `iloc` and the trap of whole-number labels, **label alignment and NaN** when adding two Series, `add(fill_value=0)`, `describe()` and pandas `std` (n-1) vs NumPy `std` (n), the column-length `ValueError`, the vectorised BMI next to the original loop (trace), "a computed column is not a live formula", `astype('int64')` and `pd.to_numeric(errors='coerce')`, string `max` (`'7' > '10'`), `&`/`|`/`~` and the real "truth value of a Series is ambiguous" error, `where`/`loc` to actually apply the outlier fix, `isna`/`fillna`/`dropna` (they return new tables), `sort_values`, `value_counts`, `groupby` (split, apply, combine), `.str.contains(case=False)` and the `\bjava\b` word boundary for the hacker-news task, and a small analysis pipeline.
- **Original bugs fixed:** `pip install conda` (wrong; conda comes with Anaconda); the typos `Helsink`/`Helsiki`; "the csv file has three rows" (it has three columns and 10,000 rows); `int32` shown as the dtype (platform-dependent, so the lesson converts with an explicit `'int64'`); the age outlier fix described but never applied.
- **Version notes:** pandas 2 and 3 print text columns differently (`object` vs `str`) and word the ambiguous-truth error differently. Cards print `.tolist()`/`.to_dict()`, `dtype.kind`, only the first sentence of that error, and only `type(e).__name__` for the text-arithmetic `TypeError`.
- **Exercise blocks:** Series · DataFrame creation and exploring · columns (add, modify, `astype`) · filtering rows · missing values and `groupby`.

## Terminology
Turkish follows the glossary: sınıf, örnek (instance), metot, nitelik (attribute), isim etiketi / nesneye bağlanır, istisna, hata izi. In the final pass, "liste" in Turkish text was changed to the course term `list` with apostrophe suffixes (`list'i`, `list'e`, `list'te`), except for "parametre listesi", which is not the data type. NumPy's array is introduced once as "dizi (array)" and is "array" after that.

## Unsure about
- Pyodide's exact NumPy and pandas versions. Outputs that differ between versions or platforms were avoided as described above, but I could not run the cards in Pyodide itself (no browser allowed).
- Day 23 has 30 cards for a short original lesson. I went wider (PATH, `sys.path`, version specifiers, conflicts) instead of padding.
- The explain-card median is 85-91 English words, within the brief's 50-140 range. A few Day 24 cards reach 124 English words after the platform note was added; all are under 160.
