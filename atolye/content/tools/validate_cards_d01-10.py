#!/usr/bin/env python3
"""Validator for atolye/content/cards/day01.json .. day10.json.

Run: .venv/bin/python atolye/content/tools/validate_cards_d01-10.py [first last]
Every code run happens in a fresh subprocess with a 5 s timeout (python -I).
Last line: "VALIDATOR RESULT: 0 failures" on success.
"""
import glob, json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
CARDS = os.path.join(HERE, "..", "cards")
FIRST, LAST = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) >= 3 else (1, 10)
CHECK_TYPES = {"predict", "fill", "truefalse", "order"}
TYPES = {"explain", "predict", "fill", "truefalse", "order", "recap"}
failures = []
RUN_DIR = tempfile.mkdtemp(prefix="cardval_")


def fail(day, cid, msg):
    failures.append("day%02d %s: %s" % (day, cid, msg))


def run(code):
    """Run code in a fresh interpreter, return (stdout, error)."""
    try:
        r = subprocess.run([sys.executable, "-I", "-W", "ignore", "-c", code], capture_output=True, text=True,
                           timeout=5, cwd=RUN_DIR)
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT"
    if r.returncode != 0:
        return r.stdout, "exit %d: %s" % (r.returncode, r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "")
    return r.stdout, None


def norm(s):
    return s.rstrip("\n")


EMOJI = re.compile("[\U0001F000-\U0001FFFF⌀-⏿☀-➿⬀-⯿️‍←-⇿]")


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for k, v in o.items():
            yield from strings(k)
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)


def words(s):
    return len(s.split())


def nonempty(v):
    return (isinstance(v, str) and v.strip() != "") or (isinstance(v, list) and len(v) > 0 and all(isinstance(x, str) and x.strip() for x in v))


def check_twins(day, cid, obj):
    for k in list(obj.keys()):
        if k.endswith("_tr"):
            t = k[:-3]
            if t not in obj or not nonempty(obj[t]):
                fail(day, cid, "missing/empty English twin '%s' for '%s'" % (t, k))
            elif not nonempty(obj[k]):
                fail(day, cid, "empty '%s'" % k)
            elif isinstance(obj[k], list) and len(obj[k]) != len(obj[t]):
                fail(day, cid, "'%s' and '%s' have different length" % (k, t))


def need(day, cid, c, keys):
    for k in keys:
        if k not in c:
            fail(day, cid, "missing field '%s'" % k)
            return False
    return True


def need_pair(day, cid, c, base):
    for k in (base + "_tr", base):
        if k not in c or not nonempty(c[k]):
            fail(day, cid, "missing/empty field '%s'" % k)


def sec_norm(s):
    s = re.sub(r"^[#\s]+", "", s)
    s = re.sub(r"[^\w\s\-/().,?']", "", s, flags=re.UNICODE).strip()
    s = re.sub(r"\s+", " ", s).strip().rstrip(":").strip()
    return s.lower()


def original_md(day):
    if day == 1:
        return os.path.join(REPO, "readme.md")
    cands = glob.glob(os.path.join(REPO, "%02d_Day_*" % day, "%02d_*.md" % day))
    return cands[0] if cands else None


def parse_sections(path):
    """Return (all_headings:set, code_sections:set) of ##/### sections; #### counted as 'all' only."""
    allh, code_secs = set(), set()
    cur, in_fence = None, False
    for line in open(path, encoding="utf-8"):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            if in_fence and cur:
                code_secs.add(cur)
            continue
        if in_fence:
            continue
        m = re.match(r"^(#{2,4})\s+(.*)$", line)
        if m:
            name = sec_norm(m.group(2))
            allh.add(name)
            if len(m.group(1)) <= 3:
                cur = name
    return allh, {c for c in code_secs if "exercise" not in c}


total_cards = 0
mapping_report = []
for day in range(FIRST, LAST + 1):
    p = os.path.join(CARDS, "day%02d.json" % day)
    if not os.path.exists(p):
        fail(day, "-", "file missing: %s" % p)
        continue
    try:
        data = json.load(open(p, encoding="utf-8"))
    except Exception as e:
        fail(day, "-", "invalid JSON: %s" % e)
        continue
    if data.get("day") != day:
        fail(day, "-", "wrong 'day' value")
    for k in ("title_tr", "title"):
        if not nonempty(data.get(k)):
            fail(day, "-", "day-level '%s' missing" % k)
    if not isinstance(data.get("est_minutes"), int) or data["est_minutes"] <= 0:
        fail(day, "-", "est_minutes must be a positive int")
    cards = data.get("cards", [])
    if not (10 <= len(cards) <= 60):
        fail(day, "-", "card count %d outside 10-60" % len(cards))
    total_cards += len(cards)
    for s in strings(data):
        if EMOJI.search(s):
            fail(day, "-", "emoji/symbol char in text: %r" % s[:50])
    ids = set()
    n_check = 0
    for i, c in enumerate(cards):
        cid = c.get("id", "?")
        exp_id = "d%02d-c%02d" % (day, i + 1)
        if cid != exp_id:
            fail(day, cid, "id should be %s" % exp_id)
        if cid in ids:
            fail(day, cid, "duplicate id")
        ids.add(cid)
        t = c.get("type")
        if t not in TYPES:
            fail(day, cid, "bad type %r" % t)
            continue
        if not nonempty(c.get("section")):
            fail(day, cid, "missing section")
        check_twins(day, cid, c)
        if t in CHECK_TYPES:
            n_check += 1
        # body word limits
        for k in ("body_tr", "body"):
            if k in c and words(c[k]) > 160:
                fail(day, cid, "%s has %d words (>160)" % (k, words(c[k])))
        if t == "explain":
            need_pair(day, cid, c, "title")
            need_pair(day, cid, c, "body")
            if "code" in c:
                if len(c["code"].splitlines()) > 10:
                    fail(day, cid, "code longer than 10 lines")
                if "expected_output" not in c:
                    fail(day, cid, "code without expected_output")
                else:
                    out, err = run(c["code"])
                    if err:
                        fail(day, cid, "code error: %s" % err)
                    elif norm(out) != norm(c["expected_output"]):
                        fail(day, cid, "stdout mismatch: got %r expected %r" % (norm(out), c["expected_output"]))
            elif c.get("hide_output") or c.get("trace"):
                fail(day, cid, "hide_output/trace without code")
        elif t == "predict":
            if need(day, cid, c, ["code", "choices", "answer"]):
                need_pair(day, cid, c, "why")
                if not (3 <= len(c["choices"]) <= 4):
                    fail(day, cid, "choices must be 3-4")
                if len(set(c["choices"])) != len(c["choices"]):
                    fail(day, cid, "duplicate choices")
                if c["answer"] not in c["choices"]:
                    fail(day, cid, "answer not in choices")
                if len(c["code"].splitlines()) > 10:
                    fail(day, cid, "code longer than 10 lines")
                out, err = run(c["code"])
                if err:
                    fail(day, cid, "code error: %s" % err)
                elif norm(out) != c["answer"]:
                    fail(day, cid, "answer %r != real output %r" % (c["answer"], norm(out)))
        elif t == "fill":
            if need(day, cid, c, ["code", "answers", "expected_output"]):
                need_pair(day, cid, c, "why")
                if c["code"].count("___") != 1:
                    fail(day, cid, "fill code must contain exactly one ___")
                if not c["answers"] or not all(isinstance(a, str) and a for a in c["answers"]):
                    fail(day, cid, "answers must be non-empty strings")
                for a in c["answers"]:
                    out, err = run(c["code"].replace("___", a))
                    if err:
                        fail(day, cid, "answer %r error: %s" % (a, err))
                    elif norm(out) != norm(c["expected_output"]):
                        fail(day, cid, "answer %r gives %r not %r" % (a, norm(out), c["expected_output"]))
                out, err = run(c["code"].replace("___", "None_blank_check"))
                if err is None and norm(out) == norm(c["expected_output"]):
                    fail(day, cid, "blank is not needed (placeholder also passes)")
        elif t == "truefalse":
            if need(day, cid, c, ["answer"]):
                need_pair(day, cid, c, "statement")
                need_pair(day, cid, c, "why")
                if not isinstance(c["answer"], bool):
                    fail(day, cid, "answer must be bool")
        elif t == "order":
            if need(day, cid, c, ["lines", "correct_order", "expected_output"]):
                n = len(c["lines"])
                if not (3 <= n <= 6):
                    fail(day, cid, "order needs 3-6 lines")
                if sorted(c["correct_order"]) != list(range(n)):
                    fail(day, cid, "correct_order is not a permutation")
                else:
                    if c["correct_order"] == list(range(n)):
                        fail(day, cid, "lines are not shuffled")
                    code = "\n".join(c["lines"][j] for j in c["correct_order"])
                    out, err = run(code)
                    if err:
                        fail(day, cid, "ordered code error: %s" % err)
                    elif norm(out) != norm(c["expected_output"]):
                        fail(day, cid, "ordered stdout %r != %r" % (norm(out), c["expected_output"]))
        elif t == "recap":
            if i != len(cards) - 1:
                fail(day, cid, "recap must be the last card")
            need_pair(day, cid, c, "points")
            if not (3 <= len(c.get("points_tr", [])) <= 5):
                fail(day, cid, "recap needs 3-5 points")
            if c.get("target") != "learn":
                fail(day, cid, "recap target must be 'learn'")
            need_pair(day, cid, c, "cta")
    if cards and cards[-1].get("type") != "recap":
        fail(day, "-", "last card must be recap")
    # checkpoint spacing: every window of 4 consecutive (non-recap) cards has a checkpoint
    body = [c for c in cards if c.get("type") != "recap"]
    for i in range(0, max(0, len(body) - 3)):
        if not any(c.get("type") in CHECK_TYPES for c in body[i:i + 4]):
            fail(day, body[i].get("id", "?"), "4 consecutive cards without a checkpoint")
    if n_check < len(body) // 4:
        fail(day, "-", "too few checkpoints: %d" % n_check)
    # section coverage
    md = original_md(day)
    if not md:
        fail(day, "-", "original lesson file not found")
        continue
    allh, code_secs = parse_sections(md)
    card_secs = {sec_norm(c.get("section", "")) for c in cards}
    for s in sorted(card_secs):
        if s not in allh:
            fail(day, "-", "card section %r is not a heading of the lesson" % s)
    missing = sorted(code_secs - card_secs)
    for s in missing:
        fail(day, "-", "lesson section with code has no card: %r" % s)
    kinds = {}
    for c in cards:
        kinds[c["type"]] = kinds.get(c["type"], 0) + 1
    mapping_report.append((day, len(cards), n_check, len(code_secs) - len(missing), len(code_secs),
                           sum(1 for c in cards if c.get("trace")), kinds))

print("%-4s %-6s %-12s %-14s %-6s %s" % ("day", "cards", "checkpoints", "sections+code", "trace", "types"))
for day, n, chk, ok, tot, tr, kinds in mapping_report:
    print("%-4d %-6d %-12d %d/%-12d %-6d %s" % (day, n, chk, ok, tot, tr, dict(sorted(kinds.items()))))
print("total cards: %d" % total_cards)
for f in failures:
    print("FAIL", f)
print("VALIDATOR RESULT: %d failures" % len(failures))
sys.exit(1 if failures else 0)
