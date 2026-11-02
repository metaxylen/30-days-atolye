# Report: content-b (Days 6-10)

## Plan (written before the content)

Rule I follow on all five days: no concept before it is taught. Days 6-8 use no `if` and no loops; Day 9 uses `if` but no loops; loops arrive on Day 10. Functions arrive on Day 11, so every practice task on Days 6-10 is script-style: the prompt gives the first line (the input data), and hidden tests re-run the learner's program with a different first line. That checks behaviour on new inputs without asking for a `def`.

### Day 6 - Tuples
Sections and teaching sequences: Tuples (hook: a record that must not change; tuple vs list vs JavaScript array) -> Creating a Tuple (the comma makes the tuple; `('Ankara')` mistake; `tuple()` from other values) -> Tuple length (`len`, `count`, `index`, `ValueError` from `index`) -> Accessing Tuple Items (indexes, `IndexError`, unpacking, swap with `a, b = b, a`, `*rest`) -> Slicing tuples (new tuple, step, reverse) -> Changing Tuples to Lists (immutability errors; list round trip; rebinding moves the name tag; a list inside a tuple can still change) -> Checking an Item in a Tuple (`in`, `not in`) -> Joining Tuples (`+`, `*`, concatenation `TypeError`, comparison and `sorted`) -> Deleting Tuples (`del` removes the name, not items) -> when to choose a tuple.
Exercise blocks: create/len/count/index; index and slice; unpacking and swap; immutability and list round trip; membership and joining (interleaves strings and lists).

### Day 7 - Sets
Sections: Sets (hook: duplicates; unordered, unique; why printed order is not fixed) -> Creating a Set (`{}` is a dict, `set()`) -> Getting Set's Length -> Accessing Items in a Set (no indexes, `TypeError`; `sorted()` for a stable view) -> Checking an Item (fast membership) -> Adding Items (`add`, `update` with any iterable, `update('abc')` mistake) -> Removing Items (`remove` vs `discard`, `KeyError`, `pop` arbitrary) -> Clearing / Deleting -> Converting List to Set (deduplicate; order lost; `len(set(x))`) -> Joining Sets (`union`/`|` new set vs `update` in place) -> Intersection (`&`) -> Subset/Superset (`<=`, `>=`) -> Difference (`-`, direction matters) -> Symmetric Difference (`^`) -> isdisjoint. Only hashable items (list in a set -> `TypeError`).
Exercise blocks: create/add/remove; dedupe and membership; union/intersection; difference/symmetric difference; subset/disjoint.

### Day 8 - Dictionaries
Sections: Dictionaries (hook: look up by name, not by position; dict vs JavaScript object) -> Creating (literal, `dict()`, nested values) -> Length -> Accessing (`[]`, `KeyError`, `get` with default, nested access) -> Adding / Modifying (same syntax; the key decides) -> Checking Keys (`in` checks keys, not values) -> Removing (`pop` with default, `popitem` removes the last inserted pair, `del`) -> items/keys/values (views, not lists; `list(...)`) -> Clearing (`clear()` returns `None`) / Deleting -> Copy (alias vs `copy()`, shallow copy and a nested list) -> counting with `get(key, 0) + 1`, insertion order, keys must be hashable (tuple keys).
Exercise blocks: create/access/get; add/modify/update; membership and removal; views and conversion; aliasing and copy; counting pattern.

### Day 9 - Conditionals
Sections: Conditionals (hook: programs that decide; indentation is the block) -> If Condition (colon and indentation; `IndentationError`; `=` vs `==` `SyntaxError`) -> If Else -> If Elif Else (order of branches; first true wins; grade ranges) -> Short Hand (conditional expression returns a value) -> Nested Conditions -> If Condition and Logical Operators (`and`, chained comparison `0 <= x <= 100`) -> If and Or Logical Operators (`or`; `x == 'a' or 'b'` mistake; `in` on a tuple) -> truthiness (empty values are false; `if items:`), `is None`.
Exercise blocks: if/else; elif ladders; short hand; nested and `and`; `or`, `in` and truthiness.

### Day 10 - Loops
Sections: Loops (hook: repeat without copy-paste) -> While Loop (condition checked before each round; infinite-loop mistake; while-else) -> Break and Continue Part 1 -> For Loop (iteration over list, string, tuple, dict keys, `items()`, set) -> Break and Continue Part 2 -> The Range Function (range is lazy, not a list; stop excluded; negative step) -> Nested For Loop -> For Else (else runs only when no `break`) -> Pass. Wider: accumulator and counter patterns, `enumerate`, `zip`, building a new list, never change a list while looping over it.
Exercise blocks: while; for over sequences and accumulators; range; break/continue/for-else; nested loops; enumerate/zip and dict loops.
