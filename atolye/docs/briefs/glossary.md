# Session glossary: the course glossary (terim sözlüğü)

Read `atolye/docs/briefs/content-master.md` (audience, Turkish standard, the glossary table and mental models) and the original lessons (`readme.md` = Day 1, `NN_Day_*/NN_*.md` = Days 2-30), every line.

Write ONE new file `atolye/content/glossary.json` (and nothing else except your report `atolye/docs/reports/glossary.md`). The app will show, next to each lesson card, the glossary entries whose aliases appear in that card's text or code.

Schema:
```json
{ "version": 1, "terms": [
  { "id": "mutable", "day": 5,
    "term": "mutable", "term_tr": "değiştirilebilir",
    "def": "...", "def_tr": "...",
    "example": "nums = [1, 2]\nnums.append(3)",
    "aliases": ["mutable", "değiştirilebilir", "değiştirilemez", "immutable"],
    "see": ["immutable", "list"] } ] }
```
- 150-220 terms covering every concept, keyword, built-in function, method family and error type the 30 days teach (e.g. variable, object, name binding, int, float, str, bool, None, list, tuple, set, dict, key, index, slice, mutable/immutable, f-string, method, function, parameter, argument, return, scope, lambda, comprehension, generator, iterable, iterator, module, package, pip, venv, class, instance, self, attribute, method, inheritance, super, exception, traceback, try/except/finally, raise, file modes, `with`, JSON, regex terms, datetime, statistics terms, pandas Series/DataFrame, API, HTTP methods, status code, MongoDB document/collection…, plus built-ins like len, range, enumerate, zip, sorted, map, filter).
- `day` = the first day the course teaches it. `def`/`def_tr`: 1-2 precise sentences (≤ 35 words) a JavaScript developer understands, consistent with the master brief's mental models and Turkish terms. `example`: ≤ 3 lines of runnable Python (offline; numpy/pandas only for Days 24-25 terms) — run every example with python3 and keep only ones that run. `aliases`: lowercase strings as they would appear in card text in both languages (include Turkish inflection stems where useful, e.g. "sözlü" for sözlük/sözlüğün is too broad — prefer whole words; code tokens like ".append(" or "len(" are fine). Avoid aliases that are common everyday words and would match everywhere.
- Validate with a small script you write in /tmp (not committed): JSON loads, ids unique, every `see` id exists, every example runs, no alias shared by two terms, no emoji, TR/EN both present. Paste its final line in the report.

Branch `glossary`; commit and push with `git push -u origin glossary`; never push to main. Do not spawn subagents. Report: term count per day, validator line, any term you were unsure about.
