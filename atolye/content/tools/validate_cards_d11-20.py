#!/usr/bin/env python3
"""Validate atolye/content/cards/dayNN.json for days 11-20.
Run: .venv/bin/python atolye/content/tools/validate_cards_d11-20.py
Each code run: fresh subprocess, 5s timeout, temp cwd. Output compared after rstrip().
"""
import json, os, re, subprocess, sys, tempfile, shutil, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CARDS = os.path.join(ROOT, "atolye", "content", "cards")
DAYS = range(11, 21)
checks = 0
failures = []

def ok(cond, msg):
    global checks
    checks += 1
    if not cond:
        failures.append(msg)

def run(code):
    d = tempfile.mkdtemp(prefix="vc_")
    try:
        p = os.path.join(d, "snippet_main.py")
        open(p, "w").write(code)
        r = subprocess.run([sys.executable, p], cwd=d, capture_output=True, text=True, timeout=5)
        return r.returncode, r.stdout.rstrip(), r.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "timeout"
    finally:
        shutil.rmtree(d, ignore_errors=True)

EMOJI = re.compile("[\U0001F000-\U0001FFFF☀-➿⬀-⯿️‍←-⇿⌀-⏿]")
def norm(s): return re.sub(r"[^a-z0-9]", "", s.lower())
def words(s): return len(s.split())
def nonempty(c, k): return isinstance(c.get(k), str) and c[k].strip() != ""

def strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from strings(v)
    elif isinstance(o, list):
        for v in o: yield from strings(v)

def lesson_path(n):
    if n == 1: return os.path.join(ROOT, "readme.md")
    g = glob.glob(os.path.join(ROOT, f"{n:02d}_Day_*", f"{n:02d}_*.md"))
    return g[0]

def code_sections(n):
    """headings (## / ### / ####) whose own text (until next heading) has a ```py fence."""
    text = open(lesson_path(n), encoding="utf-8").read()
    secs, cur, buf = [], None, []
    in_fence = False
    def flush():
        if cur and "```py" in "\n".join(buf): secs.append(cur)
    for line in text.splitlines():
        if line.strip().startswith("```"):
            in_fence = not in_fence
            buf.append(line); continue
        m = None if in_fence else re.match(r"^(#{2,4})\s+(.*)", line)
        if m:
            flush()
            title = m.group(2).strip()
            if "Exercises" in title or "Testimony" in title:
                cur = None  # stop collecting
            else:
                cur = title
            buf = []
        else:
            buf.append(line)
    flush()
    return secs

CHECKPOINT = {"predict", "fill", "truefalse", "order"}
total_sections = covered_sections = 0
summary = []

for n in DAYS:
    path = os.path.join(CARDS, f"day{n:02d}.json")
    if not os.path.exists(path):
        ok(False, f"day{n:02d}.json missing"); continue
    try:
        D = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        ok(False, f"day{n:02d}: invalid JSON {e}"); continue
    tag = f"day{n:02d}"
    ok(D.get("day") == n, f"{tag}: day field")
    ok(nonempty(D, "title_tr") and nonempty(D, "title"), f"{tag}: day title / title_tr")
    ok(isinstance(D.get("est_minutes"), int) and D["est_minutes"] > 0, f"{tag}: est_minutes")
    cards = D.get("cards", [])
    ok(10 <= len(cards) <= 30, f"{tag}: card count {len(cards)} not in 10..30")
    ids = [c.get("id") for c in cards]
    ok(len(set(ids)) == len(ids), f"{tag}: ids not unique")
    ok(bool(cards) and cards[-1].get("type") == "recap", f"{tag}: last card must be recap")
    ntrace = sum(1 for c in cards if c.get("trace"))
    ok(2 <= ntrace <= 5, f"{tag}: trace cards = {ntrace}, want 2..5")
    # checkpoints
    run_len = 0
    for c in cards:
        if c.get("type") in CHECKPOINT or c.get("type") == "recap": run_len = 0
        else:
            run_len += 1
            ok(run_len <= 3, f"{tag}: more than 3 non-checkpoint cards in a row ending at {c.get('id')}")
    for i, c in enumerate(cards):
        cid = c.get("id", f"#{i}")
        t = c.get("type")
        ok(cid == f"d{n:02d}-c{i+1:02d}", f"{tag}/{cid}: id should be d{n:02d}-c{i+1:02d}")
        ok(t in {"explain", "predict", "fill", "truefalse", "order", "recap"}, f"{cid}: bad type {t}")
        ok(nonempty(c, "section"), f"{cid}: section")
        for s in strings(c):
            ok(not EMOJI.search(s), f"{cid}: emoji/symbol found in {s[:40]!r}")
        code = c.get("code")
        if code is not None:
            ok(isinstance(code, str) and len([l for l in code.splitlines() if l.strip()]) <= 10,
               f"{cid}: code longer than 10 lines ({len([l for l in code.splitlines() if l.strip()])})")
        if t == "explain":
            ok(nonempty(c, "title_tr") and nonempty(c, "title"), f"{cid}: title/title_tr")
            ok(nonempty(c, "body_tr") and nonempty(c, "body"), f"{cid}: body/body_tr")
            ok(words(c.get("body_tr", "")) <= 90, f"{cid}: body_tr {words(c.get('body_tr',''))} words")
            ok(words(c.get("body", "")) <= 90, f"{cid}: body {words(c.get('body',''))} words")
            if code is not None:
                rc, out, err = run(code)
                ok(rc == 0, f"{cid}: code failed: {err.strip()[-200:]}")
                if "expected_output" in c:
                    ok(out == c["expected_output"].rstrip(), f"{cid}: output mismatch {out!r} != {c['expected_output']!r}")
            else:
                ok("expected_output" not in c and not c.get("trace") and not c.get("hide_output"), f"{cid}: output/trace without code")
            if c.get("hide_output"): ok("expected_output" in c, f"{cid}: hide_output without expected_output")
        elif t == "predict":
            ok(isinstance(c.get("choices"), list) and 3 <= len(c["choices"]) <= 4 and len(set(c["choices"])) == len(c["choices"]), f"{cid}: choices 3-4 unique")
            ok(c.get("answer") in c.get("choices", []), f"{cid}: answer not in choices")
            ok(nonempty(c, "why_tr") and nonempty(c, "why"), f"{cid}: why/why_tr")
            rc, out, err = run(code or "")
            ok(rc == 0, f"{cid}: code failed: {err.strip()[-200:]}")
            ok(out == c.get("answer", "").rstrip(), f"{cid}: answer {c.get('answer')!r} != real {out!r}")
        elif t == "fill":
            ok(code and code.count("___") == 1, f"{cid}: exactly one ___ needed")
            ok(isinstance(c.get("answers"), list) and c["answers"], f"{cid}: answers")
            ok(nonempty(c, "why_tr") and nonempty(c, "why") and "expected_output" in c, f"{cid}: why/expected_output")
            for a in c.get("answers", []):
                rc, out, err = run((code or "").replace("___", a))
                ok(rc == 0 and out == c.get("expected_output", "").rstrip(), f"{cid}: answer {a!r} -> {out!r} {err.strip()[-100:]}")
        elif t == "truefalse":
            ok(nonempty(c, "statement_tr") and nonempty(c, "statement"), f"{cid}: statement/statement_tr")
            ok(isinstance(c.get("answer"), bool), f"{cid}: answer bool")
            ok(nonempty(c, "why_tr") and nonempty(c, "why"), f"{cid}: why/why_tr")
        elif t == "order":
            L, O = c.get("lines"), c.get("correct_order")
            ok(isinstance(L, list) and 3 <= len(L) <= 6, f"{cid}: 3-6 lines")
            ok(isinstance(O, list) and sorted(O) == list(range(len(L or []))), f"{cid}: correct_order is not a permutation")
            ok(O != list(range(len(L or []))), f"{cid}: lines not shuffled")
            if isinstance(L, list) and isinstance(O, list) and sorted(O) == list(range(len(L))):
                rc, out, err = run("\n".join(L[j] for j in O))
                ok(rc == 0 and out == c.get("expected_output", "").rstrip(), f"{cid}: order output {out!r} {err.strip()[-100:]}")
        elif t == "recap":
            P, PT = c.get("points_tr"), c.get("points")
            ok(isinstance(P, list) and 3 <= len(P) <= 5 and all(isinstance(x, str) and x.strip() for x in P), f"{cid}: points_tr 3-5")
            ok(isinstance(PT, list) and isinstance(P, list) and len(PT) == len(P) and all(isinstance(x, str) and x.strip() for x in PT), f"{cid}: points twin length/non-empty")
            ok(c.get("link") == "learn", f"{cid}: link must be 'learn'")
            ok(nonempty(c, "title_tr") and nonempty(c, "title"), f"{cid}: title twin")
    # section coverage
    secs = code_sections(n)
    have = {norm(c.get("section", "")) for c in cards}
    miss = [s for s in secs if norm(s) not in have]
    total_sections += len(secs); covered_sections += len(secs) - len(miss)
    ok(not miss, f"{tag}: sections with code but no card: {miss}")
    cnt = sum(1 for c in cards if c.get("type") in CHECKPOINT)
    summary.append(f"day{n:02d}: {len(cards)} cards, {cnt} checkpoints, {len(secs)-len(miss)}/{len(secs)} code sections mapped")

print("\n".join(summary))
print(f"section mapping: {covered_sections}/{total_sections}")
for f in failures: print("FAIL:", f)
print(f"RESULT: {checks} checks, {len(failures)} failures")
