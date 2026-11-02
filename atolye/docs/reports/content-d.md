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
Sections: what pip is and the commands (`pip install/uninstall/list/show/freeze`) shown as text since pip cannot run offline; requirements.txt parsed as a string; "Reading from URL" made an honest pure-Python illustration (a fake `fetch()` returning a JSON string, then `json.loads`), with the real `requests` version described; creating a package: a folder with `__init__.py` written to the in-memory file system, imported, relative imports, `__name__ == '__main__'`; version strings and comparing versions correctly.
Blocks: pip commands and requirements; parsing package metadata (show/freeze); data from a "URL" (JSON); creating and importing a package.
