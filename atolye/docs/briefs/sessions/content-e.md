# Session content-e: Days 21-25

Read `atolye/docs/briefs/content-master.md` in full and follow it exactly. It is your whole brief.

- Your tag: `content-e`. Your branch: `content-e` (create it from main, commit after each finished day, push with `git push -u origin content-e`; never push to main).
- Your days: 21 to 25. You own ONLY `atolye/content/cards/day21.json` … `day25.json`, `atolye/content/exercises/day21.json` … `day25.json` and your report `atolye/docs/reports/content-e.md`.
- You are the VALIDATOR OWNER for the d21-30 range: in `atolye/content/tools/validate_cards_d21-30.py` raise the explain-body word limit from 90 to 160 and add a check that the median explain-body word count (both body_tr and body) is >= 45 for each day; keep every other check. Do not loosen `validate_d21-30.py` (the exercise validator); only fix a real bug in it, and say so in the report.
- Five other sessions write the other days at the same time; never touch their files.
- Validate with `.venv/bin/python atolye/content/tools/<validator> 21 25` until 0 failures, then push and finish with the report.
