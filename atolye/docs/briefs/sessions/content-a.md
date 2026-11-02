# Session content-a: Days 1-5

Read `atolye/docs/briefs/content-master.md` in full and follow it exactly. It is your whole brief.

- Your tag: `content-a`. Your branch: `content-a` (create it from main, commit after each finished day, push with `git push -u origin content-a`; never push to main).
- Your days: 1 to 5. You own ONLY `atolye/content/cards/day01.json` … `day05.json`, `atolye/content/exercises/day01.json` … `day05.json` and your report `atolye/docs/reports/content-a.md`.
- You are the VALIDATOR OWNER for the d01-10 range: in `atolye/content/tools/validate_cards_d01-10.py` raise the explain-body word limit from 90 to 160 and add a check that the median explain-body word count (both body_tr and body) is >= 45 for each day; keep every other check. Do not loosen `validate_d01-10.py` (the exercise validator); only fix a real bug in it, and say so in the report.
- Five other sessions write the other days at the same time; never touch their files.
- Validate with `.venv/bin/python atolye/content/tools/<validator> 1 5` until 0 failures, then push and finish with the report.
