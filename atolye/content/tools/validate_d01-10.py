#!/usr/bin/env python3
"""Validator for atolye/content/exercises/day01..day10.json.

Run: .venv/bin/python atolye/content/tools/validate_d01-10.py [first last]
Every code run happens in a fresh subprocess with a 5 s timeout.
"""
import ast, json, os, re, subprocess, sys, tempfile, collections

HERE = os.path.dirname(os.path.abspath(__file__))
EX_DIR = os.path.join(HERE, "..", "exercises")
FIRST, LAST = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) >= 3 else (1, 10)

RUNNER = r'''
import sys, io, json, traceback
spec = json.load(open(sys.argv[1]))
buf = io.StringIO(); real = sys.stdout; sys.stdout = buf
ns = {"__name__": "__main__"}
res = {"run_error": None, "stdout": "", "test_errors": []}
try:
    exec(compile(spec["code"], "<learner>", "exec"), ns)
except BaseException as e:
    res["run_error"] = type(e).__name__ + ": " + str(e)
sys.stdout = real
res["stdout"] = buf.getvalue()
if res["run_error"] is None or spec.get("tests_even_on_error"):
    ns["__stdout__"] = res["stdout"]
    ns["__source__"] = spec["code"]
    for i, t in enumerate(spec["tests"]):
        try:
            exec(compile(t, "<test>", "exec"), ns)
            res["test_errors"].append(None)
        except BaseException as e:
            res["test_errors"].append(type(e).__name__ + ": " + str(e))
print("\n@@RESULT@@" + json.dumps(res))
'''
RUNNER_PATH = os.path.join(tempfile.gettempdir(), "atolye_runner_d01_10.py")
with open(RUNNER_PATH, "w") as f:
    f.write(RUNNER)

def run(code, tests=()):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump({"code": code, "tests": list(tests)}, f); p = f.name
    try:
        out = subprocess.run([sys.executable, "-I", RUNNER_PATH, p], capture_output=True, text=True, timeout=5, cwd=tempfile.gettempdir())
    except subprocess.TimeoutExpired:
        return {"run_error": "TIMEOUT", "stdout": "", "test_errors": []}
    finally:
        os.unlink(p)
    if "@@RESULT@@" not in out.stdout:
        return {"run_error": "runner crash: " + out.stderr[-300:], "stdout": "", "test_errors": []}
    return json.loads(out.stdout.split("@@RESULT@@")[1])

CAPTURE = r'''
import sys, io, json, ast
spec = json.load(open(sys.argv[1]))
buf = io.StringIO(); real = sys.stdout; sys.stdout = buf
ns = {"__name__": "__main__"}
try:
    exec(compile(spec["code"], "<sol>", "exec"), ns)
except BaseException as e:
    pass
sys.stdout = real
lits = {}
for k, v in list(ns.items()):
    if k.startswith("__"): continue
    if not isinstance(v, (int, float, complex, str, bool, list, tuple, dict, set, frozenset, type(None))): continue
    try:
        r = repr(v)
        if ast.literal_eval(r) == v: lits[k] = r
    except Exception:
        pass
print("\n@@RESULT@@" + json.dumps({"stdout": buf.getvalue(), "lits": lits}))
'''
CAPTURE_PATH = os.path.join(tempfile.gettempdir(), "atolye_capture_d01_10.py")
with open(CAPTURE_PATH, "w") as f:
    f.write(CAPTURE)

def hardcoded_version(code):
    """Build a program that only assigns the literal results and prints the literal stdout."""
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump({"code": code}, f); p = f.name
    try:
        out = subprocess.run([sys.executable, "-I", CAPTURE_PATH, p], capture_output=True, text=True, timeout=5, cwd=tempfile.gettempdir())
    except subprocess.TimeoutExpired:
        return None
    finally:
        os.unlink(p)
    if "@@RESULT@@" not in out.stdout: return None
    d = json.loads(out.stdout.split("@@RESULT@@")[1])
    lines = [f"{k} = {v}" for k, v in d["lits"].items()]
    if d["stdout"]: lines.append(f"print({d['stdout']!r}, end='')")
    return "\n".join(lines) + "\n"

def squash(s):
    return re.sub(r"\s+", "", s)

def hint_gives_solution(where, ex, hint, sol_codes):
    """True when a hint contains the full solution or is itself a runnable full solution."""
    h = squash(hint)
    for sc in sol_codes:
        if squash(sc) and squash(sc) in h: return "contains solution.code"
    cands = {hint}
    cands.update(re.findall(r"`([^`]+)`", hint))
    cands.update(l for l in hint.split("\n") if l.strip())
    for c in cands:
        try:
            tree = ast.parse(c)
        except SyntaxError:
            continue
        if not any(isinstance(n, ast.stmt) and not isinstance(n, ast.Expr) or (isinstance(n, ast.Expr) and isinstance(n.value, ast.Call)) for n in ast.walk(tree)):
            continue
        r = run(c, test_codes(ex))
        if r["run_error"]: continue
        if any(r["test_errors"]): continue
        if "expected_output" in ex and norm(r["stdout"]) != norm(ex["expected_output"]): continue
        if not ex.get("tests") and "expected_output" not in ex: continue
        return "runnable program that passes the tests"
    return None

def norm(s):
    return "\n".join(l.rstrip() for l in s.rstrip().split("\n")) if s.strip() else ""

failures = []
def fail(where, msg):
    failures.append(f"{where}: {msg}")

COMMON = ["id", "type", "prompt", "prompt_tr"]
REQ = {
    "predict": ["code", "choices", "expected_output", "explanation", "misconceptions"],
    "fill_blank": ["starter_code", "blanks", "tests", "hints"],
    "parsons": ["lines", "correct_order", "distractors", "expected_output"],
    "modify": ["starter_code", "tests", "hints", "solution"],
    "write": ["starter_code", "tests", "hints", "solution", "twin"],
    "debug": ["starter_code", "hints", "solution"],
    "explain": ["model_answer", "keywords"],
    "type_it": ["code", "expected_output"],
}

def test_codes(ex):
    return [t["code"] for t in ex.get("tests", [])]

def check_tests_shape(where, ex):
    for t in ex.get("tests", []):
        if "code" not in t: fail(where, "test without code")
        if t.get("visible", True) is False and not t.get("failure_message"):
            fail(where, "hidden test without failure_message")
        if not str(t.get("failure_message_tr", "")).strip(): fail(where, f"test `{t.get('code','')[:40]}` missing failure_message_tr")
        if t.get("visible", True) is not False and not str(t.get("label_tr", "")).strip(): fail(where, f"visible test `{t.get('code','')[:40]}` missing label_tr")

def nonempty(where, obj, key):
    v = obj.get(key)
    if v is None or (isinstance(v, (str, list, dict)) and len(v) == 0) or (isinstance(v, str) and not v.strip()):
        fail(where, f"missing/empty {key}"); return False
    return True

def check_tr(where, ex):
    t = ex.get("type")
    nonempty(where, ex, "prompt_tr")
    if t == "predict":
        nonempty(where, ex, "explanation_tr")
        mt = ex.get("misconceptions_tr")
        if not isinstance(mt, dict) or set(mt) != set(ex.get("misconceptions", {})): fail(where, "misconceptions_tr keys must equal misconceptions keys")
        elif any(not str(v).strip() for v in mt.values()): fail(where, "empty misconceptions_tr value")
    if "hints" in ex:
        ht = ex.get("hints_tr")
        if not isinstance(ht, list) or len(ht) != len(ex["hints"]) or any(not str(h).strip() for h in ht): fail(where, "hints_tr must be same length as hints, non-empty")
    if "solution" in ex: nonempty(where, ex["solution"], "approach_tr") or None
    if t == "explain":
        nonempty(where, ex, "model_answer_tr")
        if not isinstance(ex.get("keywords_tr"), list) or not ex.get("keywords_tr"): fail(where, "keywords_tr missing")
        if not isinstance(ex.get("min_words"), int) or ex.get("min_words", 0) < 4: fail(where, "min_words must be int >= 4")

def check_ladder(where, ex, sol_codes):
    hints = ex.get("hints", [])
    if not hints: return
    for key in ("hints", "hints_tr"):
        hs = ex.get(key) or []
        if hs:
            g = hint_gives_solution(where, ex, hs[-1], sol_codes)
            if g: fail(where, f"last rung of {key} gives away the solution ({g})")
            for h in hs[:-1]:
                g = hint_gives_solution(where, ex, h, sol_codes)
                if g: fail(where, f"early rung of {key} gives away the solution ({g})")

def check_anti_hardcode(where, ex):
    anti = [i for i, t in enumerate(ex.get("tests", [])) if t.get("anti_hardcode") is True]
    if not anti: fail(where, "no test marked anti_hardcode: true"); return
    for i in anti:
        t = ex["tests"][i]
        if t.get("visible", True) is not False: fail(where, "anti_hardcode test must be hidden (visible:false)")
        if not t.get("failure_message") or not t.get("failure_message_tr"): fail(where, "anti_hardcode test needs failure_message and failure_message_tr")
    sol = ex["solution"]["code"]
    hc = hardcoded_version(sol)
    if hc is None: fail(where, "could not build hard-coded version"); return
    r = run(hc, test_codes(ex))
    if r["run_error"]:
        return  # hard-coded program crashed: also fails every test
    if not any(r["test_errors"][i] for i in anti if i < len(r["test_errors"])):
        fail(where, "hard-coded version PASSES the anti_hardcode tests")
    if not any(r["test_errors"]): fail(where, "hard-coded version passes ALL tests")
    if "def " not in sol and not any("__source__" in ex["tests"][i]["code"] for i in anti):
        fail(where, "script-style exercise: an anti_hardcode test must inspect __source__")

def check_solution_passes(where, code, ex, label="solution"):
    r = run(code, test_codes(ex))
    if r["run_error"]: fail(where, f"{label} raised {r['run_error']}"); return None
    for t, e in zip(ex.get("tests", []), r["test_errors"]):
        if e: fail(where, f"{label} fails test `{t['code'][:60]}`: {e}")
    if "expected_output" in ex and norm(r["stdout"]) != norm(ex["expected_output"]):
        fail(where, f"{label} stdout {r['stdout']!r} != expected_output {ex['expected_output']!r}")
    return r

def starter_fails(where, ex):
    r = run(ex["starter_code"], test_codes(ex))
    if r["run_error"]: return True
    if any(r["test_errors"]): return True
    if "expected_output" in ex and norm(r["stdout"]) != norm(ex["expected_output"]): return True
    return False

counts = collections.Counter(); files = 0; total_ex = 0
for day in range(FIRST, LAST + 1):
    path = os.path.join(EX_DIR, f"day{day:02d}.json")
    where0 = f"day{day:02d}"
    if not os.path.exists(path):
        fail(where0, "file missing"); continue
    try:
        doc = json.load(open(path))
    except Exception as e:
        fail(where0, f"JSON parse error {e}"); continue
    files += 1
    for k in ["day", "title", "title_tr", "test_conventions", "blocks", "review_pool"]:
        if k not in doc: fail(where0, f"missing top-level {k}")
    if "title_tr" in doc: nonempty(where0, doc, "title_tr")
    if "__source__" not in doc.get("test_conventions", ""): fail(where0, "test_conventions must mention __source__")
    if doc.get("day") != day: fail(where0, "day number mismatch")
    if not (4 <= len(doc.get("blocks", [])) <= 7): fail(where0, "needs 4-7 blocks")
    ids = {}; dtypes = collections.Counter()
    for b in doc.get("blocks", []):
        bw = f"{where0}/{b.get('id')}"
        for k in ["id", "concept", "tags", "worked_example", "exercises"]:
            if k not in b: fail(bw, f"block missing {k}")
        nonempty(bw, b, "concept_tr")
        we = b.get("worked_example", {})
        nt = we.get("notes_tr")
        if not isinstance(nt, list) or len(nt) != len(we.get("notes", [])) or any(not str(x).strip() for x in nt): fail(bw, "worked_example.notes_tr must match notes length")
        if len(we.get("code", "").strip().split("\n")) > 12: fail(bw, "worked_example longer than 12 lines")
        if not (2 <= len(we.get("notes", [])) <= 4): fail(bw, "worked_example needs 2-4 notes")
        for _n in we.get("notes", []):
            if len(_n.split()) < 6: fail(bw, f"worked_example note too short (full sentences please): {_n!r}")
        r = run(we.get("code", ""))
        if r["run_error"]: fail(bw, f"worked_example raised {r['run_error']}")
        types_in_block = [e.get("type") for e in b.get("exercises", [])]
        if not types_in_block or types_in_block[0] != "predict": fail(bw, "first exercise must be predict")
        if len(types_in_block) < 3 or types_in_block[1] not in ("fill_blank", "parsons"): fail(bw, "second exercise must be fill_blank or parsons")
        if not (7 <= len(types_in_block) <= 10): fail(bw, f"block needs 7-10 exercises, has {len(types_in_block)}")
        if len(types_in_block) < 3 or types_in_block[2] not in ("debug", "modify", "write"): fail(bw, "third exercise must be debug, modify or write")
        if "debug" not in types_in_block: fail(bw, "block needs at least one debug exercise")
        if types_in_block.count("predict") < 2: fail(bw, "block needs at least two predict exercises")
        if types_in_block.count("write") < 2 or types_in_block.count("write") % 2: fail(bw, "block needs an even number (>=2) of write exercises")
        for ex in b.get("exercises", []):
            w = f"{where0}/{ex.get('id')}"
            total_ex += 1
            t = ex.get("type")
            counts[t] += 1; dtypes[t] += 1
            if ex.get("id") in ids: fail(w, "duplicate id")
            ids[ex.get("id")] = ex
            for k in COMMON + REQ.get(t, []):
                if k not in ex or ex[k] in ("", None) and k != "starter_code": fail(w, f"missing field {k}")
            if t not in REQ: fail(w, f"unknown type {t}"); continue
            check_tests_shape(w, ex)
            check_tr(w, ex)
            if t == "predict":
                r = run(ex["code"])
                if r["run_error"]: fail(w, f"code raised {r['run_error']}")
                elif norm(r["stdout"]) != norm(ex["expected_output"]): fail(w, f"stdout {r['stdout']!r} != expected_output {ex['expected_output']!r}")
                if ex["expected_output"] not in ex["choices"]: fail(w, "expected_output not in choices")
                if len(set(ex["choices"])) != len(ex["choices"]) or not (3 <= len(ex["choices"]) <= 5): fail(w, "choices must be 3-5 and unique")
                wrong = [c for c in ex["choices"] if c != ex["expected_output"]]
                for c in wrong:
                    if c not in ex["misconceptions"]: fail(w, f"no misconception for wrong choice {c!r}")
            elif t == "type_it":
                r = run(ex["code"])
                if r["run_error"]: fail(w, f"code raised {r['run_error']}")
                elif norm(r["stdout"]) != norm(ex["expected_output"]): fail(w, f"stdout {r['stdout']!r} != expected_output")
            elif t == "fill_blank":
                parts = ex["starter_code"].split("___")
                if len(parts) - 1 != len(ex["blanks"]): fail(w, "blank count mismatch"); continue
                n_alt = max(len(bl["answer"]) for bl in ex["blanks"])
                for ai in range(n_alt):
                    code = parts[0]
                    for bl, rest in zip(ex["blanks"], parts[1:]):
                        code += bl["answer"][min(ai, len(bl["answer"]) - 1)] + rest
                    check_solution_passes(w, code, ex, f"fill alt {ai}")
                if len(ex["hints"]) < 1: fail(w, "needs hints")
                fills = []
                for ai in range(n_alt):
                    c = parts[0]
                    for bl, rest in zip(ex["blanks"], parts[1:]):
                        c += bl["answer"][min(ai, len(bl["answer"]) - 1)] + rest
                    fills.append(c)
                check_ladder(w, ex, fills)
                if starter_fails(w, ex) is False: pass  # blanks make it invalid python usually; fine either way
            elif t == "parsons":
                n = len(ex["lines"])
                if sorted(ex["correct_order"]) != list(range(n)): fail(w, "correct_order must be a permutation of line indices")
                else:
                    code = "\n".join(ex["lines"][i] for i in ex["correct_order"])
                    r = run(code)
                    if r["run_error"]: fail(w, f"ordered lines raised {r['run_error']}")
                    elif norm(r["stdout"]) != norm(ex["expected_output"]): fail(w, f"ordered output {r['stdout']!r} != expected_output")
                if not (1 <= len(ex["distractors"]) <= 2): fail(w, "parsons needs 1-2 distractors")
                if ex["lines"] == [ex["lines"][i] for i in ex["correct_order"]]: fail(w, "lines not shuffled")
                for dline in ex["distractors"]:
                    if dline in ex["lines"]: fail(w, "distractor duplicates a real line")
            elif t in ("modify", "write", "debug"):
                if t != "debug" and not ex.get("tests"): fail(w, "needs tests")
                if t == "debug" and not (ex.get("tests") or "expected_output" in ex): fail(w, "debug needs tests or expected_output")
                sol = ex.get("solution", {})
                if "approach" not in sol or "code" not in sol: fail(w, "solution needs approach and code")
                else:
                    check_solution_passes(w, sol["code"], ex)
                    check_ladder(w, ex, [sol["code"]])
                    if t in ("write", "modify"): check_anti_hardcode(w, ex)
                if len(ex.get("hints", [])) != 3: fail(w, "hints must have exactly 3 steps")
                if t in ("modify", "debug"):
                    if ex.get("starter_code", "").strip() == "": fail(w, "starter_code empty")
                    elif not starter_fails(w, ex): fail(w, "starter code already passes (should fail)")
                if t == "modify" and not (ex["starter_code"].strip()): fail(w, "empty starter")
                if t == "write":
                    if ex["starter_code"] != "": fail(w, "write starter_code must be empty")
                    tests = ex["tests"]
                    if not (3 <= len(tests) <= 7): fail(w, "write needs 3-7 tests")
                    if sum(1 for tt in tests if tt.get("visible", True) is False) < 2: fail(w, "write needs >= 2 hidden tests")
                    if sig := ex.get("signature"):
                        if not sig.startswith("def "): fail(w, "signature must start with def")
                    if ex.get("twin") not in ids and ex.get("twin") is not None:
                        pass  # checked after the loop
                    # a trivially empty program must fail
                    if starter_fails(w, dict(ex, starter_code="pass")) is False: fail(w, "empty program passes the tests")
            elif t == "explain":
                if not ex["keywords"]: fail(w, "keywords empty")
    # cross checks
    for eid, ex in ids.items():
        if ex["type"] == "write":
            tw = ids.get(ex["twin"])
            if tw is None: fail(f"{where0}/{eid}", f"twin {ex['twin']} missing")
            else:
                if tw["type"] != "write": fail(f"{where0}/{eid}", "twin is not a write exercise")
                if tw.get("twin") != eid: fail(f"{where0}/{eid}", "twin not reciprocal")
                if tw["id"].rsplit("-e", 1)[0] != eid.rsplit("-e", 1)[0]: fail(f"{where0}/{eid}", "twin not in same block")
    pool = doc.get("review_pool", [])
    if not (4 <= len(pool) <= 8): fail(where0, "review_pool needs 4-8 ids")
    for pid in pool:
        if pid not in ids: fail(where0, f"review_pool id {pid} missing")
    if not any(ids[p]["type"] == "predict" for p in pool if p in ids) or not any(ids[p]["type"] == "write" for p in pool if p in ids):
        fail(where0, "review_pool needs at least one predict and one write")
    if dtypes["explain"] < 1: fail(where0, "needs at least 1 explain")
    if day <= 7 and dtypes["type_it"] < 1: fail(where0, "days 1-7 need at least 1 type_it")
    if day > 7 and dtypes["type_it"] > 2: fail(where0, "too many type_it")
    if dtypes["write"] < 2: fail(where0, "needs at least a twin pair of write exercises")

print("files:", files)
print("exercises:", total_ex, "by type:", dict(sorted(counts.items())))
for f in failures: print("FAIL", f)
print(f"SUMMARY: files={files} exercises={total_ex} failures={len(failures)}")
sys.exit(1 if failures else 0)
