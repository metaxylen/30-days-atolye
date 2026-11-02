# Report: course glossary (`atolye/content/glossary.json`)

Brief: `atolye/docs/briefs/glossary.md`. Sources: `content-master.md` (Turkish term table, mental models), the original lessons (`readme.md` and `NN_Day_*/NN_*.md`) and, to check alias behaviour, the current card files `atolye/content/cards/day01-30.json` (read-only).

## Result
- **219 terms** (within the 150-220 range), 1104 aliases, version 1, the schema exactly as given in the brief.
- Every `def`/`def_tr` is 35 words or fewer. Every example is 3 lines or fewer and runs offline with python3. numpy and pandas appear only in Day 24-25 terms.
- Turkish follows the master table: değişken, nesne, isim nesneye bağlanır, değiştirilebilir/değiştirilemez, indeks/dilim, anahtar/değer, istisna (exception), hata izi (traceback), örnek (instance), nitelik (attribute), metot, döngü/tur, comprehension (kısa liste kurma yazımı). It also uses the suffix-with-apostrophe style (`list`'e, `dict`'in).
- The definitions use the mental models: name tag rather than box, in-place change vs. replacement, a fresh workspace per call, `return` and `None`, iteration asking for items one at a time, the traceback read bottom-up, and class as blueprint with `self` as the specific object. Where it helps, a definition gives the JavaScript equivalent (`===`, `null`, `Math.floor`, `for...of`, `throw`, `extends`, `JSON.parse`, `npm`, `package.json`).

## Validator (scratch script `validate.py`, not committed)
It checks:
- the JSON loads and has version 1
- the term count is 150-220
- ids are unique and every `see` id exists (no self-references)
- every term has all keys, with term/term_tr/def/def_tr/example non-empty, so TR and EN are both present
- each definition has 35 words or fewer
- each example has 3 lines or fewer
- numpy/pandas are used only on Days 24-25
- aliases are lowercase and no alias is shared by two terms
- there is no emoji
- every example runs with `python3 -I -c` in an empty temp directory

Final line:

```
glossary: 219 terms, 1104 aliases, 219/219 examples ran, 0 errors
```

## Terms per day
| Day | Count | Terms |
|---|---|---|
| 1 | 17 | interpreter, repl, comment, indentation, syntax_error, type_func, print, int, float, complex, str, bool, list_type, dict_type, tuple_type, set_type, arithmetic_operators |
| 2 | 13 | builtin_function, variable, name_binding, object, assignment, multiple_assignment, snake_case, keyword, argument, len, input, type_conversion, min_max_sum |
| 3 | 5 | comparison_operators, equality, identity, membership, logical_operators |
| 4 | 10 | concatenation, escape_sequence, f_string, index, slice, method, string_methods, split, join, find_index |
| 5 | 9 | mutable, aliasing, append, pop, del_statement, copy, list_sort, sorted_func, nested_list |
| 6 | 2 | immutable, single_tuple |
| 7 | 7 | set_operations, union, intersection, difference, subset, set_add, hashable |
| 8 | 5 | dict_key, dict_get, dict_methods, dict_update, none |
| 9 | 4 | if_statement, elif, conditional_expression, truthiness |
| 10 | 10 | loop, iteration, while_loop, for_loop, break, continue_stmt, range_func, nested_loop, for_else, pass_stmt |
| 11 | 9 | function, parameter, return, default_parameter, keyword_argument, args, kwargs, scope, docstring |
| 12 | 8 | module, import_stmt, from_import, math_module, random_module, os_module, statistics_module, dunder_name |
| 13 | 6 | list_comprehension, lambda, iterable, iterator, generator, any_all |
| 14 | 6 | higher_order_function, closure, decorator, map_func, filter_func, reduce_func |
| 15 | 10 | exception, traceback, name_error, index_error, key_error, type_error, value_error, zero_division_error, attribute_error, import_error |
| 16 | 4 | datetime_module, strftime, strptime, timedelta |
| 17 | 7 | try_except, finally_clause, raise_stmt, packing, spread, enumerate, zip_func |
| 18 | 11 | regex, raw_string, re_search, match_object, re_findall, re_sub, re_split, regex_flags, character_class, quantifier, anchor |
| 19 | 10 | open_func, file_mode, with_statement, file_read, file_write, encoding, json, json_loads, json_dumps, csv |
| 20 | 4 | pip, package, requirements_txt, requests_lib |
| 21 | 10 | class_kw, instance, init_method, self, attribute, str_repr, inheritance, super_func, isinstance, property |
| 22 | 3 | web_scraping, html, beautifulsoup |
| 23 | 2 | venv, activate |
| 24 | 13 | mean, median, standard_deviation, statistics, numpy, ndarray, shape, dtype, vectorization, np_arange, boolean_indexing, dot_product, missing_value |
| 25 | 9 | pandas, series, dataframe, column, read_csv, data_exploration, loc_iloc, groupby, apply_method |
| 26 | 5 | flask, route, template, web_server, deployment |
| 27 | 10 | database, sql_nosql, mongodb, collection, document, crud, insert_find, query, update_delete, connection_string |
| 28 | 8 | api, http, request_response, http_methods, status_code, header, url, rest |
| 29 | 2 | endpoint, serialization |
| 30 | 0 | (the conclusions day teaches no new concept) |

## How the term set was shaped
- The first draft had 296 entries. To fit the 220 cap, I folded close siblings into one entry and merged their aliases:
  - `//`, `%` and `**` went into arithmetic operators.
  - negative index went into index.
  - step and `[::-1]` went into slice.
  - strip, replace, startswith, the is-methods and count went into string methods.
  - extend and insert went into append; remove and clear went into pop.
  - symmetric difference went into difference; disjoint went into subset.
  - `except ... as e` and try-else went into try/except; custom exceptions went into raise.
  - re.match went into re.search.
  - `\d \w \s .` went into character classes.
  - variance went into standard deviation; mode went into median.
  - ObjectId went into document; sort/limit went into query.
  - Smaller cases were folded the same way.
- I dropped these entirely as low value: debugging, expression vs statement, ord/chr, "sequence", "file extension", `match` statement.
- Every concept the original lessons teach still has a home, and its English and Turkish names stay findable through the aliases.

## Alias design
Ownership:
- Each alias string belongs to exactly one term.

Assumed matching rule, and why:
- I assumed the strictest likely rule: plain lowercase substring search over the card's text and code.
- With that rule, short tokens misfire badly. `int(` matched 566 of 714 cards because it sits inside `print(`. Other examples: `tur` inside `return`, `pack` inside `package`, `class ` inside `<class 'int'>`, and `mutable` inside `immutable`.

Fixes:
- For short code words, the aliases use the backticked form that card prose uses (`` `int` ``, `` `if` ``, `` `return` ``, `` `self` ``).
- Code-call forms carry a delimiter (` int(`, ` any(`, `    break`).
- I removed everyday words in both languages: function, hata, error, liste, metin, koşul, yanıt, gövde, en sık, kodlama, collection, document, series, difference, mean.

Measured against the current 714 cards:
- median 3 glossary entries per card, maximum 13
- no alias above 66 cards
- in-word hits only where harmless (e.g. `range(` inside numpy's `arange(`)

Six terms currently match no card because the drafts don't cover them yet: set_operations, hashable, traceback, loc_iloc, groupby, apply_method. Their aliases are standard spellings (`traceback`, `hata izi`, `.loc[`, `groupby(`...), so they will light up once those topics are written.

## Terms I was unsure about
- **`day` values.** I used the day the original lesson first teaches the concept. Day 1's quick tour of the data types counts as teaching them, so int, float, str, bool, list, dict, tuple and set are all Day 1. Exceptions:
  - **immutable**: Day 6, not Day 1. Day 1 only says "tuples are immutable" in passing; Day 6 teaches it, and that pairs with mutable on Day 5.
  - **sorted**: Day 5 (lists), although the Day 2 built-ins screenshot and the Day 2 draft cards mention it.
  - **min/max/sum/abs**: Day 2 (built-ins).
- **Beyond the original course, placed where the drafts or master brief put them:**
  - any/all: Day 13. Its example uses a generator expression.
  - iterable/iterator/generator: Day 13 (Day 13 drafts use `yield`).
  - `@property`, `__str__/__repr__` and isinstance: Day 21.
  - truthiness and the ternary: Day 9.
  - scope/global and docstring: Day 11.
  - loc/iloc, groupby, apply and missing values: Days 24-25. The master brief asks for pandas groupby/filter/missing values. NaN appears on Day 24 because numpy introduces it.
  - serialization (jsonify, ObjectId to str): Day 29.
- **round()** was merged into **float** (Day 1). The original first uses `round` on Day 25, but the Day 2 draft cards already use it.
- **Days 26-29 examples are offline stand-ins:**
  - Flask routes: a dict of functions.
  - MongoDB: lists of dicts.
  - HTTP: `http.HTTPStatus` and `urllib.parse`.
  - requests: a response dict.
  - templates: `string.Template`.
  - the venv check: `sys.prefix`.

  Each definition says what the real tool does.
- **web_server** keeps `sunucu`/`server` as aliases. They are domain words on Days 26-29, but they will also show on any earlier card that mentions a server.
