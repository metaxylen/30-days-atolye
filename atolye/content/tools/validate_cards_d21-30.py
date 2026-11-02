#!/usr/bin/env python
"""Validator for atolye/content/cards/day21.json .. day30.json.

Run: .venv/bin/python atolye/content/tools/validate_cards_d21-30.py

Checks: JSON shape per card type, TR + EN twins present and non-empty, unique ids,
every code runs (fresh subprocess, 5 s timeout) and stdout equals expected_output,
predict answer in choices and equal to the real output, fill answers each produce
expected_output, order produces expected_output, body words <= 160 (both languages), median explain body >= 45 words per day,
no emoji, a checkpoint at least every 4 cards, and every original ##/### section
that contains a code fence is covered by >= 1 card (section or also_sections).
"""
import json
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve()
ATOLYE = HERE.parents[2]
REPO = ATOLYE.parent
CARDS = ATOLYE / "content" / "cards"
DAYS = range(21, 31)
MARK = "@@RESULT@@"

RUNNER = r'''
import sys, io, contextlib, traceback, json
code = sys.stdin.read()
ns = {"__name__": "__main__"}
buf = io.StringIO()
res = {"ok": True, "stdout": "", "error": None}
try:
    with contextlib.redirect_stdout(buf):
        exec(compile(code, "<card>", "exec"), ns)
except BaseException:
    res["ok"] = False
    res["error"] = traceback.format_exc()[-500:]
res["stdout"] = buf.getvalue()
sys.stdout.write("\n@@RESULT@@" + json.dumps(res))
'''

# Sections deliberately not mapped to a card: (day, heading) -> reason
DROPPED = {}
SKIP_PREFIX = ("Exercises", "\U0001F4BB Exercises")  # exercise statements live in content/exercises

EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍←-⇿⌀-⏿]")


def run(code):
    try:
        p = subprocess.run([sys.executable, "-I", "-c", RUNNER], input=code,
                           capture_output=True, text=True, timeout=5)
    except subprocess.TimeoutExpired:
        return {"ok": False, "stdout": "", "error": "TIMEOUT (5s)"}
    if MARK not in p.stdout:
        return {"ok": False, "stdout": "", "error": "runner crashed: " + p.stderr[-300:]}
    return json.loads(p.stdout.rsplit(MARK, 1)[1])


def norm(s):
    return "\n".join(l.rstrip() for l in s.rstrip().split("\n")).strip("\n")


def ne(x):
    return isinstance(x, str) and x.strip() != ""


def words(s):
    return len(s.split())


def lesson_file(day):
    d = next(REPO.glob(f"{day:02d}_Day_*"))
    return next(d.glob("*.md"))


def original_sections(day):
    """Level 2-3 headings that have a fenced code block, heading text normalised."""
    sections, cur, in_fence, has = [], None, False, False
    for line in lesson_file(day).read_text(encoding="utf-8").splitlines():
        if line.lstrip().startswith("```"):
            if not in_fence:
                has = True
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = re.match(r"^(#{1,3})\s+(.*\S)\s*$", line)
        if m:
            if cur and has:
                sections.append(cur)
            cur, has = (m.group(2) if len(m.group(1)) >= 2 else None), False
    if cur and has:
        sections.append(cur)
    out = []
    for s in sections:
        if s.startswith(SKIP_PREFIX) or s.startswith("Exercises"):
            continue
        out.append(s)
    return out


def check_runs(code, expected, label, errs, jobs):
    jobs.append((label, code, expected))


def collect(path, errs):
    jobs = []
    data = json.loads(path.read_text(encoding="utf-8"))
    day = data.get("day")
    e = lambda m: errs.append(f"{path.name}: {m}")
    for k in ("day", "title_tr", "title", "est_minutes", "cards"):
        if k not in data:
            e(f"missing top-level {k}")
    for k in ("title_tr", "title"):
        if not ne(data.get(k)):
            e(f"{k} empty")
    cards = data.get("cards", [])
    if not 20 <= len(cards) <= 50:
        e(f"{len(cards)} cards (need 20-50)")
    ids = set()
    prefix = f"d{day:02d}-c"
    covered = set()
    kinds = []
    for i, c in enumerate(cards):
        cid = c.get("id", f"#{i}")
        L = lambda m: e(f"{cid}: {m}")
        if not re.fullmatch(rf"{prefix}\d\d", str(c.get("id"))):
            L("bad id format")
        if cid in ids:
            L("duplicate id")
        ids.add(cid)
        t = c.get("type")
        kinds.append(t)
        if not ne(c.get("section")):
            L("section missing")
        covered.add(c.get("section"))
        covered.update(c.get("also_sections", []))
        blob = json.dumps(c, ensure_ascii=False)
        if EMOJI.search(blob):
            L("emoji / pictograph found")

        def need(*keys):
            for k in keys:
                if not ne(c.get(k)):
                    L(f"{t}: {k} missing/empty")

        if t == "explain":
            need("title_tr", "title", "body_tr", "body")
            for k in ("body_tr", "body"):
                if words(c.get(k, "")) > 160:
                    L(f"{k} has {words(c[k])} words (>160)")
            if "code" in c:
                lines = [l for l in c["code"].split("\n") if l.strip()]
                if len(lines) > 20:
                    L(f"code has {len(lines)} lines (>20)")
                if "expected_output" not in c:
                    L("code without expected_output")
                else:
                    jobs.append((f"{cid} code", c["code"], c["expected_output"]))
            elif c.get("trace") or c.get("hide_output"):
                L("trace/hide_output without code")
        elif t == "predict":
            need("prompt_tr", "prompt", "code", "why_tr", "why")
            ch = c.get("choices", [])
            if not 3 <= len(ch) <= 4 or len(set(ch)) != len(ch):
                L("choices need 3-4 unique items")
            if c.get("answer") not in ch:
                L("answer not in choices")
            jobs.append((f"{cid} predict", c.get("code", ""), c.get("answer", ""), "exact"))
        elif t == "fill":
            need("prompt_tr", "prompt", "code", "why_tr", "why", "expected_output")
            if c.get("code", "").count("___") != 1:
                L("code must contain exactly one ___")
            if not c.get("answers"):
                L("answers missing")
            for a in c.get("answers", []):
                jobs.append((f"{cid} fill[{a}]", c["code"].replace("___", a), c.get("expected_output", "")))
        elif t == "truefalse":
            need("statement_tr", "statement", "why_tr", "why")
            if not isinstance(c.get("answer"), bool):
                L("answer must be bool")
        elif t == "order":
            need("prompt_tr", "prompt", "expected_output")
            lines, co = c.get("lines", []), c.get("correct_order", [])
            if not 3 <= len(lines) <= 6:
                L("order needs 3-6 lines")
            if sorted(co) != list(range(len(lines))):
                L("correct_order must be a permutation of line indices")
            else:
                jobs.append((f"{cid} order", "\n".join(lines[j] for j in co), c.get("expected_output", "")))
        elif t == "recap":
            pt, pe = c.get("points_tr"), c.get("points")
            if not (isinstance(pt, list) and isinstance(pe, list) and 3 <= len(pt) <= 5
                    and len(pt) == len(pe) and all(ne(x) for x in pt + pe)):
                L("points_tr/points need 3-5 non-empty items and equal length")
            if c.get("link") != "learn" or not ne(c.get("cta_tr")) or not ne(c.get("cta")):
                L("recap needs cta_tr, cta and link=learn")
            if i != len(cards) - 1:
                L("recap must be the last card")
        else:
            L(f"unknown type {t}")
    if kinds and kinds[-1] != "recap":
        e("last card must be recap")
    # checkpoint spacing: never more than 3 explain cards in a row
    run_len = 0
    for i, k in enumerate(kinds):
        if k == "explain":
            run_len += 1
            if run_len > 3:
                e(f"{cards[i]['id']}: more than 3 explain cards without a checkpoint")
        else:
            run_len = 0
    for k in ("body_tr", "body"):
        ws = sorted(words(c[k]) for c in cards if c.get("type") == "explain" and ne(c.get(k)))
        if ws and ws[len(ws) // 2] < 45:
            e(f"median explain {k} is {ws[len(ws) // 2]} words (<45)")
    # section coverage
    need_sec = [s for s in original_sections(day) if (day, s) not in DROPPED]
    missing = [s for s in need_sec if s not in covered]
    for s in missing:
        e(f"original section not represented: {s!r}")
    stats = {"day": day, "cards": len(cards),
             "checkpoints": sum(k in ("predict", "fill", "truefalse", "order") for k in kinds),
             "trace": sum(1 for c in cards if c.get("trace")),
             "hide": sum(1 for c in cards if c.get("hide_output")),
             "median": sorted(words(c["body"]) for c in cards if c.get("type") == "explain")[sum(1 for c in cards if c.get("type") == "explain") // 2],
             "sections": f"{len(need_sec) - len(missing)}/{len(need_sec)}"}
    return jobs, stats


def exec_job(job):
    label, code, expected = job[0], job[1], job[2]
    r = run(code)
    if not r["ok"]:
        return f"{label}: code failed: {r['error']}"
    if norm(r["stdout"]) != norm(expected):
        return f"{label}: stdout {norm(r['stdout'])!r} != expected {norm(expected)!r}"
    return None


def main():
    errs, jobs, stats = [], [], []
    for d in DAYS:
        p = CARDS / f"day{d:02d}.json"
        if not p.exists():
            errs.append(f"{p.name}: file missing")
            continue
        try:
            j, s = collect(p, errs)
        except Exception as ex:  # noqa
            errs.append(f"{p.name}: crashed while validating: {ex!r}")
            continue
        jobs += j
        stats.append(s)
    with ThreadPoolExecutor(max_workers=4) as ex:
        for r in ex.map(exec_job, jobs):
            if r:
                errs.append(r)
    for s in stats:
        print(f"day {s['day']}: {s['cards']} cards, {s['checkpoints']} checkpoints, "
              f"{s['trace']} trace, {s['hide']} hide, median {s['median']} words, sections covered {s['sections']}")
    print(f"ran {len(jobs)} code snippets")
    for m in errs:
        print("FAIL:", m)
    print(f"{len(errs)} failures")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
