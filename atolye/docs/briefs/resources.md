# Session resources: curated outside resources per day and section

Read `atolye/docs/briefs/content-master.md` (audience: Turkish junior developer who knows some JavaScript, new to Python) and the original lessons (`readme.md` = Day 1, `NN_Day_*/NN_*.md` = Days 2-30) section by section.

Write ONE new file `atolye/content/resources.json` (plus your report `atolye/docs/reports/resources.md`). The app shows these in the side columns next to the lesson cards (never inside the lesson text), filtered to the current day and, when set, the current card's section.

Schema:
```json
{ "version": 1, "days": { "5": [
  { "section": "Accessing List Items Using Positive Indexing",
    "kind": "docs | article | video | interactive | practice",
    "title": "...", "source": "docs.python.org",
    "url": "https://...", "lang": "en | tr",
    "minutes": 8,
    "why": "One sentence: what this adds beyond the lesson.",
    "why_tr": "Tek cümle: dersin ötesinde ne katıyor." } ] } }
```
- Per day 4-8 items; `section` must equal an original `##`/`###` heading of that day, or be omitted for whole-day items.
- Quality over quantity; prefer: the official docs (docs.python.org tutorial/library/reference pages with the exact `#anchor`), Real Python articles, Python Tutor (pythontutor.com) for visualising, high-quality YouTube videos (e.g. Corey Schafer, freeCodeCamp, mCoding, ArjanCodes; and at least one good Turkish-language source per part of the course if one exists), Exercism Python track exercises, pandas/numpy official user guides for Days 24-25, MDN/HTTP docs for API days. Each item must add something the lesson doesn't (a deeper explanation, a visualisation, more practice, a real-world use).
- **Verify every URL for real**: fetch it (curl -sIL or a GET, follow redirects) and keep only 200 responses whose page title matches; for YouTube, check `https://www.youtube.com/oembed?url=<video-url>&format=json` returns 200 and the title matches. Never invent a URL or a video. Record the check in the report (url → status → title).
- Turkish `why_tr` in natural textbook Turkish; no emoji.

Branch `resources` from main; commit and push with `git push -u origin resources`; never push to main. Do not spawn subagents. Report: items per day, the verification table, anything you dropped.
