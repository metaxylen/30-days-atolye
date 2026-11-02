# Session content-c: Days 11-15

Read `atolye/docs/briefs/content-master.md` in full and follow it exactly. It is your whole brief.

- Your tag: `content-c`. Your branch: `content-c` (create it from main, commit after each finished day, push with `git push -u origin content-c`; never push to main).
- Your days: 11 to 15. You own ONLY `atolye/content/cards/day11.json` … `day15.json`, `atolye/content/exercises/day11.json` … `day15.json` and your report `atolye/docs/reports/content-c.md`.
- You are the VALIDATOR OWNER for the d11-20 range: in `atolye/content/tools/validate_cards_d11-20.py` raise the explain-body word limit from 90 to 160 and add a check that the median explain-body word count (both body_tr and body) is >= 45 for each day; keep every other check. Do not loosen `validate_d11-20.py` (the exercise validator); only fix a real bug in it, and say so in the report.
- Five other sessions write the other days at the same time; never touch their files.
- Validate with `.venv/bin/python atolye/content/tools/<validator> 11 15` until 0 failures, then push and finish with the report.
