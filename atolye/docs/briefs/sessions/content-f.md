# Session content-f: Days 26-30

Read `atolye/docs/briefs/content-master.md` in full and follow it exactly. It is your whole brief.

- Your tag: `content-f`. Your branch: `content-f` (create it from main, commit after each finished day, push with `git push -u origin content-f`; never push to main).
- Your days: 26 to 30. You own ONLY `atolye/content/cards/day26.json` … `day30.json`, `atolye/content/exercises/day26.json` … `day30.json` and your report `atolye/docs/reports/content-f.md`.
- You are NOT the validator owner: do not commit changes to files in `atolye/content/tools/`. To validate cards, copy `validate_cards_d21-30.py` to /tmp, raise its word limit from 90 to 160, add a median explain-body >= 45 words check per day, fix its REPO path to point at the repo root, and run that copy; run `validate_d21-30.py` unchanged.
- Five other sessions write the other days at the same time; never touch their files.
- Validate with `.venv/bin/python atolye/content/tools/<validator> 26 30` until 0 failures, then push and finish with the report.
