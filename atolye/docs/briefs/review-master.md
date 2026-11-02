# Independent review of a content session (master brief for review sessions)

Another writer produced the lesson cards and exercises for five days of Atölye, following `atolye/docs/briefs/content-master.md`. You did not write them. Your job: make them as correct, clear and instructive as possible, because this content is final and the owner will not edit it again. You review AND fix.

## Setup
- Check out the writer's branch (given in your task), create your own branch `review-<letter>` from it, commit your fixes there, push with `git push -u origin review-<letter>`. Never push to main or to the writer's branch.
- `python3 -m venv .venv && .venv/bin/pip install -q numpy pandas`; run the validators for the days (`atolye/content/tools/validate_cards_dXX-YY.py first last` and `validate_dXX-YY.py first last`). If the card validator on this branch still has the 90-word limit, run a /tmp copy with the limit at 160 and a median explain-body >= 45 words check; do not commit validator changes unless the writer's report says it owned them.
- Do NOT spawn subagents or forks. Edit only the five days' card and exercise files and your report `atolye/docs/reports/review-<letter>.md`.

## Read first
`atolye/docs/briefs/content-master.md` (the standard, glossary and mental models), `atolye/docs/pedagogy-research.md`, the original lessons for the days, the writer's report `atolye/docs/reports/content-<letter>.md`, and the previous days' cards (read-only) to check order of concepts.

## What to check, card by card and exercise by exercise
1. **Technical correctness**: every statement about Python is true for Python 3.12+ (watch for subtle errors: integer caching claims, "strings are arrays", wrong complexity claims, wrong error names/messages, mutable default arguments, float rounding, dict ordering, scope rules). Run every code snippet yourself and compare with the stated output and quoted error text.
2. **Clarity for the reader**: a developer who knows JavaScript but not Python must understand each card on first read. Cut jargon, split overloaded cards, add the missing step of reasoning. No concept used before it is taught (check earlier days too).
3. **Pedagogy**: each section follows hook → concrete example → how it works underneath → second realistic example → common mistake with the real error → checkpoint; checkpoints test understanding, not pattern matching; distractors in predict questions reflect real misconceptions and each `misconceptions` entry explains the wrong belief.
4. **Exercises**: prompts unambiguous (names, inputs, exact output format, example call); a correct but differently written solution must pass (try writing 1-2 alternative correct solutions per write task and run the tests); hard-coded answers must fail; hints teach the next thought, last rung is not the solution; difficulty ramps smoothly.
5. **Turkish quality**: natural, native textbook Turkish; correct suffixes with apostrophes on code terms; the glossary terms used exactly; English twin says the same thing equally clearly.
6. **Consistency**: the mental models (name tags, etc.) are used and never contradicted.

## Report (`atolye/docs/reports/review-<letter>.md`, commit and push)
- Counts: cards and exercises read, issues found per category (correctness / clarity / pedagogy / exercise / Turkish / consistency), issues fixed.
- The 10 most important fixes with before → after.
- Anything you could not fix and why.
- Validators' final lines pasted (must be 0 failures), and the alternative-solution test results.
