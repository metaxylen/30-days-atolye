#!/usr/bin/env python3
"""Validator for atolye/content/exercises/day11..day20.json (TAG d11-20).

Run: <repo>/.venv/bin/python atolye/content/tools/validate_d11-20.py [first last]
(or ONLY_DAYS=11,12 in the environment)
"""
import json, os, subprocess, sys, tempfile, collections

HERE = os.path.dirname(os.path.abspath(__file__))
EX_DIR = os.path.join(HERE, "..", "exercises")
DAYS = [int(x) for x in os.environ.get('ONLY_DAYS', '').split(',') if x] or list(range(11, 21))
if len(sys.argv) >= 3:
    DAYS = list(range(int(sys.argv[1]), int(sys.argv[2]) + 1))
TIMEOUT = 5

HARNESS = r'''
import sys, json, io, contextlib
req = json.load(sys.stdin)
ns = {"__name__": "__main__"}
buf = io.StringIO()
res = {"error": None, "stdout": "", "test_fail": [], "ns": {}}
try:
    with contextlib.redirect_stdout(buf):
        exec(compile(req["code"], "<learner>", "exec"), ns)
except BaseException as e:
    res["error"] = type(e).__name__ + ": " + str(e)
res["stdout"] = buf.getvalue()
ns["__stdout__"] = res["stdout"]
ns["__source__"] = req["code"]
if res["error"] is None:
    for i, t in enumerate(req["tests"]):
        try:
            exec(compile(t, "<test>", "exec"), ns)
        except BaseException as e:
            res["test_fail"].append([i, type(e).__name__ + ": " + str(e)])
for _k, _v in list(ns.items()):
    if not _k.startswith("__") and isinstance(_v, (int, float, str, bool, list, dict, tuple, type(None))):
        try:
            if eval(repr(_v)) == _v:
                res["ns"][_k] = repr(_v)
        except Exception:
            pass
sys.stdout.write("\n@@RESULT@@" + json.dumps(res))
'''

import ast, re

def ws(x):
    return re.sub(r"\s+", "", x)

def is_full_solution(hint, sol):
    """Heuristic: hint gives away the solution if it contains the whole solution code, or every
    non-def body line of it, or if it parses as a program that passes the tests."""
    h = ws(hint)
    if ws(sol) in h:
        return True
    body = [ws(l) for l in sol.strip().split("\n") if l.strip() and not l.strip().startswith(("def ", "import ", "from "))]
    if body and all(b in h for b in body):
        return True
    return False

def hint_program_passes(hint, tests):
    try:
        ast.parse(hint)
    except SyntaxError:
        return False
    if "___" in hint:
        return False
    r = run(hint, tests)
    return not r["error"] and not r["test_fail"]

def sig_name(e):
    m = re.match(r"\s*def\s+(\w+)", e.get("signature") or "")
    return m.group(1) if m else None

REC = r'''
import sys, json
req = json.load(sys.stdin)
ns = {"__name__": "__main__"}
exec(compile(req["sol"], "<sol>", "exec"), ns)
orig = ns[req["fn"]]

def lit(r):
    try:
        return eval(repr(r), {"datetime": __import__("datetime")}) == r and repr(r)
    except Exception:
        return False

def rec(f, log):
    def w(*a, **k):
        r = f(*a, **k)
        if callable(r) and not isinstance(r, type):
            sub = []
            log.append(["fn", sub])
            return rec(r, sub)
        log.append(["lit", lit(r) or None])
        return r
    return w

top = []
ns[req["fn"]] = rec(orig, top)
ns["__stdout__"] = ""
ns["__source__"] = req["sol"]
for t in req["vis"]:
    try:
        exec(compile(t, "<t>", "exec"), ns)
    except BaseException:
        pass
sys.stdout.write("@@R@@" + json.dumps(top))
'''

def hardcoded_program(e, sol, tests_all):
    """Build a cheating program: for functions replay the results recorded on the visible tests
    in call order; for scripts assign the final literals and print the captured stdout."""
    fn = sig_name(e)
    vis = [t["code"] for t in e.get("tests", []) if t.get("visible", True)]
    if fn:
        with tempfile.TemporaryDirectory() as d:
            p = subprocess.run([sys.executable, "-I", "-c", REC], input=json.dumps({"sol": sol, "fn": fn, "vis": vis}),
                               cwd=d, capture_output=True, text=True, timeout=TIMEOUT)
        if "@@R@@" not in p.stdout:
            return None, "recording crashed: " + p.stderr[-200:]
        res = json.loads(p.stdout.split("@@R@@")[-1])
        def spec(items):
            out = []
            for kind, val in items:
                if kind == "fn":
                    out.append("('fn', %s)" % spec(val))
                else:
                    if val is None: raise ValueError("visible-test result not reproducible as a literal")
                    out.append("('lit', %s)" % val)
            return "[" + ", ".join(out) + "]"
        try:
            sp = spec(res)
        except ValueError as ex:
            return None, str(ex)
        return ("import datetime\ndef _stub(spec):\n    q = [0]\n    def f(*a, **k):\n        i = q[0]\n        q[0] += 1\n        if i < len(spec):\n            kind, val = spec[i]\n            return _stub(val) if kind == 'fn' else val\n        return None\n    return f\n%s = _stub(%s)\n" % (fn, sp)), None
    r = run(sol, [])
    if r["error"]:
        return None, "solution raised"
    lines = ["%s = %s" % (k, v) for k, v in r["ns"].items() if k not in ("__builtins__",)]
    if r["stdout"]:
        lines.append("print(%r, end='')" % r["stdout"])
    return "\n".join(lines) + "\n", None

def norm(s):
    return "\n".join(l.rstrip() for l in s.rstrip().split("\n"))

def run(code, tests=()):
    with tempfile.TemporaryDirectory() as d:
        try:
            p = subprocess.run([sys.executable, "-I", "-c", HARNESS], input=json.dumps({"code": code, "tests": list(tests)}),
                               cwd=d, capture_output=True, text=True, timeout=TIMEOUT)
        except subprocess.TimeoutExpired:
            return {"error": "TIMEOUT", "stdout": "", "test_fail": []}
    if "@@RESULT@@" not in p.stdout:
        return {"error": "harness crash: " + p.stderr[-300:], "stdout": "", "test_fail": []}
    return json.loads(p.stdout.split("@@RESULT@@")[-1])

failures = []
counts = collections.Counter()
def fail(where, msg):
    failures.append("%s: %s" % (where, msg))

def has(e, keys, where):
    for k in keys:
        if k not in e or e[k] in (None, "") and k not in ("starter_code",):
            fail(where, "missing/empty field '%s'" % k)
            return False
    return True

def check_tests(tests, where, need_hidden=False):
    if not isinstance(tests, list) or not tests:
        fail(where, "tests missing"); return []
    codes = []
    hidden = 0
    for i, t in enumerate(tests):
        if "code" not in t: fail(where, "test %d has no code" % i)
        else: codes.append(t["code"])
        if t.get("visible") is False:
            hidden += 1
            if not t.get("failure_message"): fail(where, "hidden test %d lacks failure_message" % i)
        else:
            if not (isinstance(t.get("label_tr"), str) and t["label_tr"].strip()): fail(where, "visible test %d lacks label_tr" % i)
        if t.get("failure_message") and not (isinstance(t.get("failure_message_tr"), str) and t["failure_message_tr"].strip()):
            fail(where, "test %d lacks failure_message_tr" % i)
    if need_hidden:
        if not (3 <= len(tests) <= 6): fail(where, "write needs 3-6 tests, has %d" % len(tests))
        if hidden < 2: fail(where, "write needs >=2 hidden tests, has %d" % hidden)
    return codes

def check_hints(e, where):
    h = e.get("hints")
    if not isinstance(h, list) or len(h) != 3 or not all(isinstance(x, str) and x for x in h):
        fail(where, "hints must be a 3-item list")

def check_tr_basics(e, where):
    t = e.get("type")
    h = e.get("hints")
    if h is not None:
        ht = e.get("hints_tr")
        if not isinstance(ht, list) or len(ht) != len(h) or not all(isinstance(x, str) and x.strip() for x in ht):
            fail(where, "hints_tr must be a list the same length as hints")
    if t == "predict":
        if not (isinstance(e.get("explanation_tr"), str) and e["explanation_tr"].strip()): fail(where, "explanation_tr missing")
        mt = e.get("misconceptions_tr")
        if not isinstance(mt, dict) or set(mt) != set(e.get("misconceptions", {})) or not all(isinstance(v, str) and v.strip() for v in mt.values()):
            fail(where, "misconceptions_tr must have the same keys, non-empty")
    if t in ("modify", "write", "debug"):
        s = e.get("solution", {})
        if not (isinstance(s.get("approach_tr"), str) and s["approach_tr"].strip()): fail(where, "solution.approach_tr missing")
    if t == "explain":
        if not (isinstance(e.get("model_answer_tr"), str) and e["model_answer_tr"].strip()): fail(where, "model_answer_tr missing")
        kt = e.get("keywords_tr")
        if not isinstance(kt, list) or not kt or not all(isinstance(x, str) and x.strip() for x in kt):
            fail(where, "keywords_tr missing")
        else:
            low = e.get("model_answer_tr", "").lower()
            for kw in kt:
                if kw.lower() not in low: fail(where, "keyword_tr %r not in model_answer_tr" % kw)
        if not isinstance(e.get("min_words"), int) or e["min_words"] < 4: fail(where, "min_words missing")

def check_ladder(e, scode, tests, where):
    for field in ("hints", "hints_tr"):
        h = e.get(field)
        if not isinstance(h, list) or not h: continue
        last = h[-1]
        if is_full_solution(last, scode):
            fail(where, "%s last rung gives away the full solution" % field)
        if field == "hints" and hint_program_passes(last, tests):
            fail(where, "last hint is a runnable program that passes the tests")
        for i, x in enumerate(h[:-1]):
            if ws(scode) in ws(x):
                fail(where, "%s rung %d contains the full solution" % (field, i + 1))

def check_hardcode(e, scode, where):
    tests = e.get("tests", [])
    prog, why = hardcoded_program(e, scode, tests)
    if prog is None:
        fail(where, "cannot build hard-coded version: " + why); return
    codes = [t["code"] for t in tests]
    r = run(prog, codes)
    hidden_idx = {i for i, t in enumerate(tests) if t.get("visible") is False}
    failed = {i for i, _ in r["test_fail"]}
    if r["error"] and not failed:
        # a crash is also a failure, but we want a hidden test to catch it
        failed = set(hidden_idx)
    if not (failed & hidden_idx):
        fail(where, "hard-coded version is NOT caught by any hidden test")
    counts["hardcode_checked"] += 1

def check_solution(e, where):
    s = e.get("solution")
    if not isinstance(s, dict) or not s.get("approach") or not s.get("code"):
        fail(where, "solution needs approach and code"); return None
    return s["code"]

def validate_day(n):
    path = os.path.join(EX_DIR, "day%02d.json" % n)
    if not os.path.exists(path):
        fail(path, "file missing"); return
    try:
        data = json.load(open(path, encoding="utf-8"))
    except Exception as ex:
        fail(path, "JSON error %s" % ex); return
    counts["files"] += 1
    w = "day%02d" % n
    if data.get("day") != n: fail(w, "day field wrong")
    if "__source__" not in data.get("test_conventions", ""): fail(w, "test_conventions does not mention __source__")
    for k in ("title", "title_tr", "test_conventions", "blocks", "review_pool"):
        if not data.get(k): fail(w, "missing top-level '%s'" % k)
    blocks = data.get("blocks", [])
    if not 3 <= len(blocks) <= 6: fail(w, "need 3-6 blocks, has %d" % len(blocks))
    ids, byid, typeday = set(), {}, collections.Counter()
    for b in blocks:
        bw = w + ":" + str(b.get("id"))
        for k in ("id", "concept", "tags", "worked_example", "exercises"):
            if not b.get(k): fail(bw, "block missing '%s'" % k)
        if not (isinstance(b.get("concept_tr"), str) and b["concept_tr"].strip()): fail(bw, "concept_tr missing")
        we = b.get("worked_example", {})
        nt = we.get("notes_tr")
        if not isinstance(nt, list) or len(nt) != len(we.get("notes", [])) or not all(isinstance(x, str) and x.strip() for x in nt):
            fail(bw, "worked_example.notes_tr must match notes")
        code = we.get("code", "")
        if len(code.strip().split("\n")) > 12: fail(bw, "worked_example longer than 12 lines")
        if not (2 <= len(we.get("notes", [])) <= 4): fail(bw, "worked_example needs 2-4 notes")
        if any(len(x.split()) < 8 for x in we.get("notes", [])): fail(bw, "each worked_example note must be a full sentence (>=8 words)")
        if not (7 <= len(b.get("exercises", [])) <= 10): fail(bw, "block needs 7-10 exercises, has %d" % len(b.get("exercises", [])))
        r = run(code)
        if r["error"]: fail(bw, "worked_example fails: %s" % r["error"])
        exs = b.get("exercises", [])
        types = [e.get("type") for e in exs]
        if not types or types[0] != "predict": fail(bw, "first exercise must be predict")
        if len(types) < 3 or types[1] not in ("predict", "fill_blank", "parsons"): fail(bw, "second exercise must be predict/fill_blank/parsons")
        if not ({"fill_blank", "parsons"} & set(types)): fail(bw, "block needs a fill_blank or parsons")
        if "debug" not in types or "modify" not in types or "write" not in types: fail(bw, "block needs debug, modify and write exercises")
        if types.count("predict") < 2: fail(bw, "block needs >=2 predict exercises")
        if len(types) < 3 or types[2] not in ("fill_blank", "parsons", "debug", "modify", "write"): fail(bw, "third exercise must be fill_blank/parsons/debug/modify/write")
        for e in exs:
            ew = "%s:%s" % (w, e.get("id"))
            t = e.get("type")
            counts[t] += 1
            typeday[t] += 1
            if e.get("id") in ids: fail(ew, "duplicate id")
            ids.add(e.get("id")); byid[e.get("id")] = (b, e)
            has(e, ["id", "type", "prompt", "prompt_tr"], ew)
            check_tr_basics(e, ew)
            if t == "predict":
                if has(e, ["code", "choices", "expected_output", "explanation", "misconceptions"], ew):
                    if len(e["choices"]) < 3: fail(ew, "predict needs >=3 choices")
                    if e["expected_output"] not in e["choices"]: fail(ew, "expected_output not in choices")
                    for c in e["choices"]:
                        if c != e["expected_output"] and not e["misconceptions"].get(c):
                            fail(ew, "no misconception for wrong choice %r" % c)
                    r = run(e["code"])
                    if r["error"]: fail(ew, "code raised %s" % r["error"])
                    elif norm(r["stdout"]) != norm(e["expected_output"]):
                        fail(ew, "output %r != expected %r" % (norm(r["stdout"]), e["expected_output"]))
            elif t == "type_it":
                if has(e, ["code", "expected_output"], ew):
                    r = run(e["code"])
                    if r["error"] or norm(r["stdout"]) != norm(e["expected_output"]): fail(ew, "type_it mismatch")
            elif t == "fill_blank":
                if has(e, ["starter_code", "blanks", "tests"], ew):
                    parts = e["starter_code"].split("___")
                    if len(parts) - 1 != len(e["blanks"]): fail(ew, "blank count %d != ___ count %d" % (len(e["blanks"]), len(parts) - 1))
                    else:
                        filled = parts[0]
                        for bl, rest in zip(e["blanks"], parts[1:]):
                            filled += str(bl["answer"][0]) + rest
                        tests = check_tests(e["tests"], ew)
                        r = run(filled, tests)
                        if r["error"]: fail(ew, "filled starter raised %s" % r["error"])
                        for i, m in r["test_fail"]: fail(ew, "filled starter test %d failed: %s" % (i, m))
                        # blank-less starter must not pass
                        r2 = run(e["starter_code"], tests)
                        if not r2["error"] and not r2["test_fail"]: fail(ew, "starter with blanks passes tests")
            elif t == "parsons":
                if has(e, ["lines", "correct_order", "distractors"], ew):
                    if not 1 <= len(e["distractors"]) <= 2: fail(ew, "parsons needs 1-2 distractors")
                    if sorted(e["correct_order"]) != list(range(len(e["lines"]))) : fail(ew, "correct_order not a permutation of lines")
                    else:
                        prog = "\n".join(e["lines"][i] for i in e["correct_order"])
                        r = run(prog)
                        if r["error"]: fail(ew, "parsons program raised %s" % r["error"])
                        elif "expected_output" in e and norm(r["stdout"]) != norm(e["expected_output"]): fail(ew, "parsons output mismatch")
                    for dline in e["distractors"]:
                        if dline in e["lines"]: fail(ew, "distractor duplicates a real line")
            elif t in ("modify", "write", "debug"):
                keys = ["starter_code" if t != "write" else "tests", "hints", "solution"]
                if t == "write" and "starter_code" not in e: fail(ew, "write needs starter_code (may be empty)")
                if t == "write" and e.get("starter_code") != "" and "signature" not in e: pass
                if has(e, keys, ew):
                    check_hints(e, ew)
                    scode = check_solution(e, ew)
                    tests = check_tests(e.get("tests", []), ew, need_hidden=(t == "write")) if (t != "debug" or e.get("tests")) else []
                    if scode is not None:
                        check_ladder(e, scode, tests, ew)
                        if t in ("write", "modify"): check_hardcode(e, scode, ew)
                    if t == "debug" and not tests and "expected_output" not in e: fail(ew, "debug needs expected_output or tests")
                    if t == "write":
                        tw = e.get("twin")
                        if not tw: fail(ew, "write has no twin")
                    if scode is not None:
                        r = run(scode, tests)
                        if r["error"]: fail(ew, "solution raised %s" % r["error"])
                        for i, m in r["test_fail"]: fail(ew, "solution failed test %d: %s" % (i, m))
                        if "expected_output" in e and not r["error"] and norm(r["stdout"]) != norm(e["expected_output"]):
                            fail(ew, "solution output %r != expected %r" % (norm(r["stdout"]), e["expected_output"]))
                    if t in ("debug", "modify"):
                        r = run(e["starter_code"], tests)
                        bad = bool(r["error"]) or bool(r["test_fail"])
                        if not bad and "expected_output" in e and norm(r["stdout"]) != norm(e["expected_output"]): bad = True
                        if not bad: fail(ew, "buggy/starter code does NOT fail")
            elif t == "explain":
                if has(e, ["model_answer", "keywords"], ew):
                    low = e["model_answer"].lower()
                    for kw in e["keywords"]:
                        if kw.lower() not in low: fail(ew, "keyword %r not in model_answer" % kw)
            else:
                fail(ew, "unknown type %r" % t)
    for tid, (b, e) in byid.items():
        if e.get("type") == "write":
            tw = e.get("twin")
            if tw:
                if tw not in byid: fail("%s:%s" % (w, tid), "twin %s does not exist" % tw)
                else:
                    tb, te = byid[tw]
                    if tb is not b: fail("%s:%s" % (w, tid), "twin not in same block")
                    if te.get("type") != "write": fail("%s:%s" % (w, tid), "twin is not a write")
                    if te.get("twin") != tid: fail("%s:%s" % (w, tid), "twin not mutual")
    if typeday["debug"] < 1: fail(w, "need >=1 debug")
    if typeday["explain"] < 1: fail(w, "need >=1 explain")
    rp = data.get("review_pool", [])
    if not 4 <= len(rp) <= 6: fail(w, "review_pool needs 4-6 ids, has %d" % len(rp))
    for r_ in rp:
        if r_ not in byid: fail(w, "review_pool id %s missing" % r_)
    kinds = {byid[r_][1]["type"] for r_ in rp if r_ in byid}
    if not {"predict", "write"} <= kinds: fail(w, "review_pool needs predict and write items")

for n in DAYS:
    validate_day(n)

print("files: %d" % counts["files"])
META = ("files", "hardcode_checked")
print("exercises per type: " + ", ".join("%s=%d" % (k, v) for k, v in sorted(counts.items()) if k not in META))
print("hard-coded cheat programs generated and caught by a hidden test: %d" % counts["hardcode_checked"])
for f in failures: print("FAIL", f)
print("SUMMARY: %d files, %d exercises, %d failures" % (counts["files"], sum(v for k, v in counts.items() if k not in META), len(failures)))
sys.exit(1 if failures else 0)
