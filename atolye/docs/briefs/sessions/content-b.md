# Session content-b: Days 6-10

Read `atolye/docs/briefs/content-master.md` in full and follow it exactly. It is your whole brief.

- Your tag: `content-b`. Your branch: `content-b` (create it from main, commit after each finished day, push with `git push -u origin content-b`; never push to main).
- Your days: 6 to 10. You own ONLY `atolye/content/cards/day06.json` … `day10.json`, `atolye/content/exercises/day06.json` … `day10.json` and your report `atolye/docs/reports/content-b.md`.
- You are NOT the validator owner: do not commit changes to files in `atolye/content/tools/`. To validate cards, copy `validate_cards_d01-10.py` to /tmp, raise its word limit from 90 to 160, add a median explain-body >= 45 words check per day, fix its REPO path to point at the repo root, and run that copy; run `validate_d01-10.py` unchanged.
- Five other sessions write the other days at the same time; never touch their files.
- Validate with `.venv/bin/python atolye/content/tools/<validator> 6 10` until 0 failures, then push and finish with the report.
