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
