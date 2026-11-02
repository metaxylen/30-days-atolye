# Report: content-d (Days 16-20)

## Plan (written before the content)

Constraints taken from both the brief and the d11-20 validators, intersected so that every file passes both: exactly 30 cards per day (brief 30-45, validator 10-30), 4-5 trace cards (brief 4-7, validator 2-5), 4-5 recap points (brief 4-6, validator 3-5), at most 10 non-empty code lines per card, 4 exercise blocks of 8 exercises each.

Exercise block ramp (every block): predict -> fill_blank or parsons -> debug -> predict -> modify -> write (small) -> write (realistic twin) -> explain or parsons.

### Day 16 - datetime
Sections -> sequences: module overview and the `import datetime` / `from datetime import datetime` name trap; reading parts of a datetime and the Unix timestamp (with an aware UTC datetime so output is the same everywhere); building a datetime and why f-strings print `1/1/2020, 0:0`; `strftime` codes, `%m` vs `%M`, f-string date format spec; `strptime` and the "does not match format" ValueError; `date`, `today()`, `weekday()`, comparing and sorting dates; `time` objects and why two times cannot be subtracted; differences (`date - date`, `datetime - datetime`, `.days`, `total_seconds()`), the date/datetime mixing TypeError; `timedelta` normalisation and adding a timedelta to a date (due dates).
Blocks: datetime objects and attributes; strftime/strptime; date and time objects (compare, sort, weekday); timedelta arithmetic.

### Day 17 - exceptions, packing/unpacking, enumerate, zip
Sections: try/except (catch only what you expect, `as e`, multiple excepts, else, finally), raising your own (`raise ValueError(...)`), the exception travelling up the call stack; unpacking lists (`a, *rest = ...`, function call with `*`), unpacking dicts (`**`), packing (`*args`, `**kwargs` recalled from Day 11), spreading (`[*a, *b]`, `{**d1, **d2}`), enumerate (with `start=`), zip (stops at the shortest, `dict(zip(...))`).
Blocks: try/except basics; else/finally/raise; packing and unpacking; enumerate and zip.

### Day 18 - regular expressions
Sections: `re` module, `match` (start only) vs `search` (anywhere), match object `span()/group()`, `findall`, flags (`re.I`), `sub` (with the original's flags bug fixed: `flags=` must be a keyword), `split`, raw strings, character classes `[]`, `\d \w \s`, escaping, `+ * ? {m,n}`, `.`, `^` (anchor vs negation inside `[]`), `$`, groups with `()`; greedy vs lazy as a common mistake.
Blocks: match/search/findall; character classes and escaping; quantifiers and anchors; sub, split and groups.

### Day 19 - file handling
Sections: `open` modes, `read/readline/readlines`, `with open` (context manager), writing `w` vs appending `a`, deleting with `os.remove` and `os.path.exists`, txt, JSON (`loads/dumps/load/dump`, `indent`, `ensure_ascii=False` for Turkish text), CSV (`csv.reader`, `csv.DictReader`, `csv.writer`, `newline=''`), xlsx (honest description: needs openpyxl, not available offline), XML (`xml.etree.ElementTree` from a string). `pathlib` as an illustration.
Blocks: reading and writing text; with/append/delete; JSON; CSV (and XML).

### Day 20 - pip and packages
Sections: what pip is and the commands (`pip install/uninstall/list/show/freeze`) shown as text since pip cannot run offline; requirements.txt parsed as a string; "Reading from URL" made an honest pure-Python illustration (a fake `fake_get()` returning a dict with a status code and a JSON text body, then `json.loads`), with the real `requests` version described; creating a package: a folder with `__init__.py` written to the in-memory file system, imported, relative imports, `__name__ == '__main__'`; version strings and comparing versions correctly.
Blocks: pip commands and requirements; parsing package metadata (show/freeze); data from a "URL" (JSON); creating and importing a package.

## Results per day

All numbers measured from the files (`before` = `main` at 602c867, `after` = this branch). Median explain words are for `body` (EN) / `body_tr` (TR); Turkish is agglutinative, so the same text has fewer words.

| Day | Cards | Median explain words EN / TR | Checkpoints | Trace cards | Exercise blocks | Exercises |
|---|---|---|---|---|---|---|
| 16 datetime | 18 -> 30 | 19 / 16 -> 87 / 70 | 8 -> 10 | 3 -> 5 | 3 -> 4 | 14 -> 32 |
| 17 exceptions, packing, enumerate, zip | 23 -> 30 | 18.5 / 14 -> 93.5 / 72.5 | 10 -> 11 | 5 -> 5 | 4 -> 4 | 18 -> 32 |
| 18 regular expressions | 26 -> 30 | 17.5 / 18.5 -> 89 / 72 | 9 -> 10 | 3 -> 5 | 4 -> 4 | 18 -> 32 |
| 19 file handling | 23 -> 30 | 23 / 18 -> 87 / 68 | 9 -> 9 | 5 -> 5 | 4 -> 4 | 18 -> 32 |
| 20 pip and packages | 19 -> 30 | 31 / 25 -> 89 / 74 | 7 -> 10 | 3 -> 5 | 3 -> 4 | 14 -> 32 |

Every block follows predict -> fill_blank/parsons -> debug -> predict -> modify -> write (small) -> write (realistic twin) -> explain/parsons. Every write has 3-6 tests with at least 2 hidden ones that test new inputs and an edge case; the validator built a hard-coded cheat for all 60 write/modify exercises and a hidden test caught each. Every predict has a misconception text for each wrong choice. Each day has a review pool of 6 (predict + write items). Every card output and expected output was produced by running the code (the builder fills `expected_output` from a real run and refuses a predict whose answer differs from the real output).

Interleaving with earlier days (examples): comprehensions (Day 13) to parse/sort dates, filter API data; dict building and `dict.get` (Day 8) in log counters, scores, regions; default parameters (Day 11) in `due_date`; aliasing (Day 8) in the `merge` modify task; try/except (Day 17) reused on Days 18-20 (`load_json`, `delete_if_exists`, `update_score`, `get_json`); enumerate/zip (Day 17) in `grep` and `receipt`; regex (Day 18) parsing in Day 20 is done with string methods instead, on purpose.

## Topics added beyond the original

- Day 16: why dates are objects (string comparison trap), the `import datetime` vs `from datetime import datetime` AttributeError, aware UTC datetimes for a reproducible timestamp and `fromtimestamp`, `%m` vs `%M` and `%y`, `%A %B %a %b`, f-string date format spec (`f'{d:%d.%m.%Y}'`), Turkish month/day names via a list, `date.fromisoformat`, `isoformat`, `weekday`, `.date()`, comparing/sorting/min/max dates, `datetime.combine`, why two `time` objects cannot be subtracted, `.days` vs `.seconds` vs `total_seconds()`, `date + timedelta` across month/year ends, the date + int TypeError.
- Day 17: how a try block runs line by line, bare except hiding a NameError, multiple excepts and tuples of exceptions, `as e` and `type(e).__name__`, `else`/`finally` with `return`, exceptions travelling up the call stack and reading a traceback bottom-up, `raise`, swallowing errors with `except Exception: pass`, unpacking count errors, swap with `a, b = b, a`, starred names in assignments, `**` unpacking errors, dict merge with `{**a, **b}` (last wins), `enumerate(start=1)`, `zip` stopping at the shortest and `strict=True`, `dict(zip(...))`.
- Day 18: raw strings and `\b`, `None` handling for match/search, `re.I` vs alternation, `count=` in `re.sub`, `\s` and `re.split` on several separators, `\w \W \S \D`, escaping `.` and `$`, greedy vs lazy (`.*?`), `\b` with `{n}`, `^`/`$`/`re.fullmatch` for validation, groups `()` with `group(n)`, `groups()` and `findall` returning tuples, Turkish letters in character classes.
- Day 19: the file cursor, iterating a file object, `with` closing on exceptions (`f.closed`), relative paths and the working directory, `write` returning a count and adding no newline, `print(..., file=f)`, `'w'` inside a loop bug, `'x'` mode and `FileExistsError`, EAFP vs LBYL for deleting, JSON vs Python literal differences, `JSONDecodeError`, `ensure_ascii=False` for Turkish, JSON round-trip losing int keys and tuples, `csv.DictReader`, `csv.writer`/`DictWriter`, quoting of commas, `newline=''`, CSV values are strings, `xml.etree.ElementTree` from a string with `find`/`findall`/`attrib`/`text`, `pathlib.Path` as an illustration.
- Day 20: `python -m pip` and why, pip typed into Python is a SyntaxError, `ModuleNotFoundError` and install name vs import name, version pinning and semantic versioning, `sys.stdlib_module_names`, parsing `pip list`/`pip show`/requirements text (`partition`), comparing versions as int tuples (string comparison trap), HTTP request/response, status code classes, `response.json()` equals `json.loads(response.text)`, nested JSON with `key=`, string-indices TypeError, timeouts and connection errors (described), packages built in the in-memory file system, import forms, `sys.modules` caching and `importlib.reload`, `__init__.py` re-exports with relative imports, `if __name__ == '__main__':`, how to choose a package.

## Original bugs fixed

- Day 16: none in code, but the original shows outputs that depend on the current time; all examples now use fixed moments (except where `now()` is explicitly checked by type/range).
- Day 17: `print(range(*args))` prints `range(2, 7)`, not a list (fixed and explained); the "He is 250 year old" f-string; examples with `input()` replaced by data in lists; the original exercise (`*nordic_countries, es, ru = names`) is solved in a parsons exercise.
- Day 18: `re.sub(pattern, repl, txt, re.I)` passes `re.I` (= 2) as `count` and never enables case-insensitivity; explained on a card, practised in a debug exercise, `flags=re.I` used everywhere. Original output comments fixed: `[^A-Za-z ]+` gives `'8,'`, not `'8'`. The level 1 (most frequent words) and level 3 (clean_text) exercises are write exercises whose tests reproduce the original expected outputs; level 2 (`is_valid_variable`) is on a card and in a modify exercise.
- Day 19: the original's single-quoted "JSON" string is not valid JSON (explained, with the real `JSONDecodeError`); the CSV example printed "Number of lines" at the wrong place and said "teachers"; the XML output said `'male'` while the data says `female`; `xlrd` no longer reads `.xlsx` (since 2.0), `openpyxl`/`pandas.read_excel` named instead.
- Day 20: `pip install pip` does not upgrade pip (`python -m pip install --upgrade pip`); the module is created as `arithmetic.py` but imported as `arithmetics` (made a debug exercise); `restcountries.eu` is dead (now `restcountries.com/v3.1`).

## Deliberately dropped or changed

- No real network, pip or `webbrowser` calls (offline Pyodide): `requests.get` is replaced by an honest `fake_get` returning a dict with the same fields, and every such card says what the real code looks like. `webbrowser.open_new_tab` is not shown.
- numpy/pandas examples from Day 20's original are not run (allowed only on Days 24-25); the cards describe them in words.
- `.xlsx` has an explain card without code, because no Excel library is available offline.
- `input()`-based examples on Day 17 are replaced with lists of strings.
- Exactly 30 cards per day: the brief asks for 30-45, the shared d11-20 card validator allows at most 30, so 30 satisfies both. Similarly 5 trace cards (brief 4-7, validator 2-5), 5 recap points (brief 4-6, validator 3-5) and at most 10 non-empty code lines per card (validator) were chosen to satisfy both.

## Validator results (final lines)

Card validator: a copy of `validate_cards_d11-20.py` with the word limit raised from 90 to 160, a per-day median explain-body >= 45 words check (for `body` and `body_tr`), the repo path fixed and day arguments added, run as `.venv/bin/python <copy> 16 20`:

```
day16: 30 cards, 10 checkpoints, 8/8 code sections mapped
day17: 30 cards, 11 checkpoints, 8/8 code sections mapped
day18: 30 cards, 10 checkpoints, 15/15 code sections mapped
day19: 30 cards, 9 checkpoints, 11/11 code sections mapped
day20: 30 cards, 10 checkpoints, 4/4 code sections mapped
section mapping: 46/46
RESULT: 3068 checks, 0 failures
```

Exercise validator, unchanged, restricted to my days with its own `ONLY_DAYS` variable (`ONLY_DAYS=16,17,18,19,20 .venv/bin/python atolye/content/tools/validate_d11-20.py`):

```
files: 5
exercises per type: debug=20, explain=14, fill_blank=16, modify=20, parsons=10, predict=40, write=40
hard-coded cheat programs generated and caught by a hidden test: 60
SUMMARY: 5 files, 160 exercises, 0 failures
```

Run exactly as the session brief says (`validate_d11-20.py 16 20`), the script ignores its arguments and checks Days 11-20; it reports 46 failures, all in Days 11-15 (other sessions' files on `main`), and 0 for Days 16-20.

## Unsure / worth checking in the app

- Branch: the session brief names `content-d`; this cloud session was assigned `claude/content-d-0fe0nd`, and the work is pushed there (not to `main`).
- Nothing was run in Pyodide or a browser (not allowed in this session). Outputs come from CPython 3.13. Possible differences in the browser: `dir(datetime)` lists `UTC` only on Python 3.11+; `sys.stdlib_module_names` needs 3.10+; the exact wording of a few error messages can differ slightly between versions.
- Day 20 package cards and exercises create folders in the in-memory file system and call `sys.path.insert(0, os.getcwd())` and `importlib.invalidate_caches()`, because the validator runs Python with `-I` (no current directory on `sys.path`) and Pyodide may keep modules in `sys.modules` between runs. Card codes use a unique package name per card; the predict that depends on "first import prints" removes its modules from `sys.modules` first. If the app reuses one interpreter across cards, a learner re-running Day 20 card 25 (`once_d20`) will see only `done`, since the package was already imported.
- Day 18 debug exercise `censor` passes `re.I` positionally on purpose; Python 3.13 prints a `DeprecationWarning` to stderr for it. If the app shows stderr, the learner sees the warning, which actually points at the bug.
- `%A`/`%B` give English names (C locale); the cards say so and use a Turkish list where Turkish names are needed.
