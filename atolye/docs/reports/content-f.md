# Report: content-f (Days 26-30)

## Plan (written before the content)

Everything server-side (Flask, MongoDB, HTTP, REST) becomes an honest pure-Python model that runs offline in Pyodide; each card says what the real library call looks like.

**Day 26, Flask.** Sections: Flask (folder structure), Setting up your project directory, Creating routes, Creating templates, Python Script, Navigation, Creating a layout (+ Serving Static File), Deployment.
Sequences: request -> function -> response mental model; decorator registry behind `@app.route` (review Day 14); `if __name__ == '__main__'`; `os.environ.get('PORT', 5000)`; template placeholders and `render_template(name, **context)`; Jinja `{% for %}` vs a Python loop; HTML escaping; layout/`extends`/`block`; `url_for` as reverse lookup; GET vs POST, `request.form`, POST-redirect-GET; text analyzer; requirements.txt, Procfile, why `debug=True` never goes to production, Heroku free plan gone.
Blocks: routes and dispatch; templates and rendering; GET/POST forms and the text analyzer; configuration and deployment files.

**Day 27, MongoDB.** Sections: connection string, connecting, creating db/collection, inserting many, find, find with query, find with modifier, limit, sort, update, delete, drop.
Sequences: SQL vs NoSQL vocabulary; document = dict; URI anatomy (`urllib.parse`) and secrets in environment variables; client -> database -> collection, created lazily; `insert_one` adds `_id` (and mutates your dict); `insert_many`; `find_one` -> dict or None; `find` -> lazy cursor that is used up; projection; query dict = AND of equalities; operators `$gt/$lt/$gte/$in/$ne`; `sort`/`limit` as `sorted(key=)`/slicing; `update_one` with `$set` (why it is required); `delete_one/delete_many({})`; `drop`.
Blocks: documents and insert; find, query and projection; operators, sort and limit; update and delete.

**Day 28, APIs and HTTP.** Section with code: Header Fields; the rest is prose sections (API, HTTP, structure, request line, status line, body, methods).
Sequences: API as a contract; JSON as the exchange format (review Day 19); client/server request-response cycle; message anatomy (start line, headers, blank line, body) parsed with `split`/`partition`; request line and query strings (`urllib.parse`); status codes by class, `http.HTTPStatus`; headers are case-insensitive; `Content-Length` counts bytes (Turkish letters); methods and CRUD, safe vs idempotent; what `requests`/`fetch` look like.
Blocks: request line and URLs; status codes; headers and body; methods, CRUD and JSON.

**Day 29, Building an API.** Sections: Structure of an API, Retrieving data using get, Getting a document by id, Creating data using POST, Updating using PUT, Deleting a document using Delete.
Sequences: endpoint anatomy and versioning; a `(method, path)` route table; JSON responses and `Content-Type`; serialisation errors (`datetime`, ObjectId) and `default=str`; path parameters `<id>`; 404 handling; POST with validation, 201; PUT with `$set`-style update, 404; DELETE, 204; fixing the original's bugs.
Blocks: JSON responses; routing with path parameters; create with validation; update and delete.

**Day 30, Conclusions.** No code sections in the original. A capstone review day that interleaves the whole course through the six mental models (name tags, mutability, function calls, iteration, exceptions, classes) and a small end-to-end project (text -> dicts -> functions -> class -> JSON), plus honest next steps.
Blocks: data and collections; functions and errors; classes; a capstone pipeline.

## Results

All Days 26-30 were rewritten from scratch (cards and exercises). Every code output in the cards and every `expected_output` was produced by running the snippet (the generator scripts execute each one), and both validators then re-ran everything.

| Day | Cards before -> after | Median explain body (EN/TR words) before -> after | Checkpoints | Trace cards | Blocks | Exercises before -> after |
|---|---|---|---|---|---|---|
| 26 Flask | 20 -> 37 | 37/31 -> 81/65 | 7 -> 12 | 2 -> 6 | 4 -> 4 | 19 -> 32 |
| 27 MongoDB | 25 -> 38 | 28/22 -> 86/69 | 9 -> 13 | 3 -> 7 | 4 -> 4 | 18 -> 32 |
| 28 APIs and HTTP | 18 -> 33 | 34/31 -> 86/66 | 8 -> 12 | 2 -> 5 | 3 -> 4 | 14 -> 32 |
| 29 Building an API | 17 -> 32 | 27/19 -> 90/72 | 7 -> 11 | 2 -> 5 | 3 -> 4 | 14 -> 32 |
| 30 Conclusions | 10 -> 32 | 44/37 -> 97/74 | 7 -> 11 | 0 -> 6 | 3 -> 4 | 14 -> 32 |

Every block follows predict -> fill_blank/parsons -> modify -> debug -> predict -> write (small) -> write (realistic, twin of the small one) -> explain. Each day has 4 debug and 4 explain exercises, hidden tests with `failure_message`/`failure_message_tr` on every write/modify, and a review pool of 6 mixing predict and write.

### Day 26: Flask
- Blocks: routes-and-dispatch, templates-and-rendering, forms-and-text-analyzer, config-and-deployment.
- Added beyond the original: request -> function -> response mental model; the decorator registry behind `@app.route` (Day 14 review); `if __name__ == '__main__'`; `os.environ` and why env values are strings; `render_template(name, **context)` modelled with `**kwargs`; HTML escaping and XSS (`html.escape`, Jinja2 autoescape); `url_for` as a reverse lookup; 405 for wrong methods; Post/Redirect/Get; `sorted` stability; `gunicorn` in the Procfile; debug mode never in production; Heroku's free plan ending (Nov 2022).
- Interleaving: `*paths` (Day 11), try/except ValueError (Day 17), dict counting and `sorted(key=)` (Days 8, 14), `dict.items()` unpacking.
- Original issues handled: the lesson's form posts to a dead Heroku URL; the deployment steps reference a free plan that no longer exists (both explained honestly).

### Day 27: MongoDB
- Blocks: documents-and-insert, find-query-projection, operators-sort-limit, update-and-delete.
- Added: URI anatomy with `urllib.parse`; secrets in environment variables instead of in code; lazy creation of databases/collections; `insert_one` mutating the caller's dict (DuplicateKeyError) tied to the name-tag model; cursor as a generator that is used up (`yield`, `next`); `all()` of an empty query (why `delete_many({})` deletes everything); `$in`, `$ne`, `$gte`, `$lte`, `$inc`, `$or` mention; `skip`/`limit` pagination; sort-before-limit order; `update` vs `replace_one`; deleting while iterating.
- Original bugs fixed: missing `import pymongo` (NameError) in most snippets; `db` undefined in the insert-loop snippet; first `find_one` output shows `'country': 'Helsinki'`; the second `$gt: 30` output shows John (28) and Sami (25), which is really `$lt: 30`; the `limit` example never stores or prints its result; `upate_many` typo; password pasted into source code.

### Day 28: APIs and HTTP
- Blocks: request-line-and-urls, status-codes, headers-and-body, methods-crud-json.
- Added: API as a contract (function analogy); JSON <-> dict with JS comparisons (`JSON.parse`, `false`/`null`); REST nouns vs verbs and versioning; HTTP statelessness; parsing a raw message (`split('\r\n\r\n', 1)`, `partition`); query strings with `urlsplit`/`parse_qs`/`urlencode` and the `&` bug; status classes with `//`; `http.HTTPStatus` and 201/204/301/302/400/401/403/405; checking the status before `json.loads` (JSONDecodeError); case-insensitive header names; `Accept-Language` q-values; Content-Type and form encoding; Content-Length counts UTF-8 bytes (Turkish letters); building a full response; PATCH; safe vs idempotent; what `requests`/`fetch` look like.
- Original: the only code section (Header Fields) is covered; dead links (restcountries.eu v2, Heroku) are not used.

### Day 29: Building an API
- Blocks: json-responses, routing-path-params, create-and-validate, update-and-delete.
- Added: endpoint anatomy; `(method, path)` route table; 404 vs 405; serialisation (`default=str`, `isoformat`, ObjectId/datetime not serialisable); path parameters and `<int:...>`; string ids vs int keys; JSON error bodies; validation with a list of errors and 400; robust skills parsing; UTC timestamps; allow-list for updates (PUT vs PATCH); redefined functions; 204 for DELETE; testing with asserts and Flask's `test_client`; a pre-deployment checklist.
- Original bugs fixed: `request` never imported; `students()` dumps an undefined `student`; views end with `return ;`/bare `return` (Flask needs a response); a body-less `def update_student (id):` (IndentationError); `update_student` defined twice (Flask endpoint clash); `update_one(query, student)` without `$set` (pymongo ValueError); `created_at` overwritten on every update; single-student lookup uses `find` instead of `find_one`; `split(', ')` for skills; DELETE never checks `deleted_count`; parameter named `id` shadows the built-in.

### Day 30: Conclusions
- The original has no code. Rebuilt as a capstone review day: the six mental models (name tags and copies, mutability and the mutable-default trap, function calls and print-vs-return, iteration and generators, exceptions and tracebacks, classes with `self`/`__repr__`/`@property`), then a four-step project (parse raw text -> compute and rank -> `GradeBook` class -> JSON report), testing with `assert`, next steps, and a note that the original testimonial/feedback link is dead.
- Blocks: names-and-collections, functions-and-errors, classes-review, capstone-pipeline; every exercise interleaves earlier days.
- Added: `copy.deepcopy`, shallow copies, `[[...]] * 3` aliasing, class attributes shared between instances, `list.sort()` returning None, tuple sort keys.

### Deliberately dropped or changed
- Screenshots (MongoDB Atlas sign-up, Postman, browser dev tools) are not reproducible offline; the cards describe what they show instead.
- Real Flask, pymongo, Jinja2 and network calls cannot run in Pyodide; every such call is modelled in plain Python and the card names the real call.
- The order card in Day 29 omits storing the record to stay within the 6-line limit.

### Validator runs (final)
`validate_d21-30.py` unchanged, run as `.venv/bin/python atolye/content/tools/validate_d21-30.py 26 27 28 29 30`:
```
NOTE stateful exercises (visible tests already defeat constant answers): 14
SUMMARY files=5 exercises=160 (debug=20, explain=20, fill_blank=15, modify=20, parsons=6, predict=39, write=40) | 0 failures
```
Card validator copy (scratchpad, not committed), run for days 26-30:
```
day 26: 37 cards, 12 checkpoints, 6 trace, 2 hide, median 81 words, sections covered 8/8
day 27: 38 cards, 13 checkpoints, 7 trace, 1 hide, median 86 words, sections covered 12/12
day 28: 33 cards, 12 checkpoints, 5 trace, 2 hide, median 86 words, sections covered 1/1
day 29: 32 cards, 11 checkpoints, 5 trace, 2 hide, median 90 words, sections covered 6/6
day 30: 32 cards, 11 checkpoints, 6 trace, 1 hide, median 97 words, sections covered 0/0
ran 154 code snippets
0 failures
```

### Notes and things I was unsure about
- Validator copy: `validate_cards_d21-30.py` already had the 160-word limit and the median >= 45 check, so the only changes in my copy were a fixed `REPO` path and accepting `first last` day arguments (the original ignores arguments and always checks 21-30). Running the unmodified card validator on all of 21-30 also passes 26-30; its only failures are Days 23-25 (another session's files).
- `validate_d21-30.py 26 30` validates only days 26 and 30 (it treats the arguments as a list, not a range), so I passed all five days explicitly.
- The brief asks for 4-6 recap points; the validator allows 3-5, so every recap has 5.
- Cards use `http.HTTPStatus`, `urllib.parse`, `html`, `copy` and `datetime` from the standard library; I believe all are present in Pyodide, but I could not test in Pyodide itself (no browser in this session).
- Error messages quoted in the cards come from CPython 3.13; Pyodide's 3.12 wording is the same for the messages used.
- The session file names the branch `content-f`; the work is pushed there.
