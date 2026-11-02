#!/usr/bin/env python3
"""Validator for atolye/content/bosses/part1..part5.json (end-of-part boss projects).

Run: .venv/bin/python atolye/content/tools/validate_bosses.py [part ...]
Checks per stage: JSON shape, solution passes all tests, starter fails >= 1 test,
a hard-coded attacker (prints/assigns the solution's captured outputs and values only) fails >= 1 test,
the last hint is not the full solution, and stage N's starter == stage N-1's solution (modulo comments).
Every code run uses a fresh subprocess (own temp cwd) with a 5 s timeout.
"""
import ast, json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
DIR = os.path.join(HERE, "..", "bosses")
PARTS = [int(a) for a in sys.argv[1:]] or [1, 2, 3, 4, 5]
TIMEOUT = 5

RUNNER = r'''
import sys, io, json
spec = json.load(open(sys.argv[1]))
buf = io.StringIO(); real = sys.stdout; sys.stdout = buf
ns = {"__name__": "__main__"}
res = {"run_error": None, "stdout": "", "test_errors": [], "values": {}}
try:
    exec(compile(spec["code"], "<learner>", "exec"), ns)
except BaseException as e:
    res["run_error"] = type(e).__name__ + ": " + str(e)
sys.stdout = real
res["stdout"] = buf.getvalue()
if spec.get("dump"):
    import ast as _ast
    for k, v in list(ns.items()):
        if k.startswith("_"):
            continue
        try:
            r = repr(v)
            if _ast.literal_eval(r) == v:
                res["values"][k] = r
        except Exception:
            pass
ns["__stdout__"] = res["stdout"]
ns["__source__"] = spec["code"]
for t in spec["tests"]:
    if res["run_error"] is not None:
        res["test_errors"].append("RunError: " + res["run_error"])
        continue
    try:
        exec(compile(t, "<test>", "exec"), ns)
        res["test_errors"].append(None)
    except BaseException as e:
        res["test_errors"].append(type(e).__name__ + ": " + str(e))
print("\n@@RESULT@@" + json.dumps(res))
'''
RUNNER_PATH = os.path.join(tempfile.gettempdir(), "atolye_runner_bosses.py")
with open(RUNNER_PATH, "w") as f:
    f.write(RUNNER)

def run(code, tests, dump=False):
    with tempfile.TemporaryDirectory() as td:
        spec = os.path.join(td, "spec.json")
        with open(spec, "w") as f:
            json.dump({"code": code, "tests": tests, "dump": dump}, f)
        try:
            p = subprocess.run([sys.executable, "-I", RUNNER_PATH, spec], cwd=td,
                               capture_output=True, text=True, timeout=TIMEOUT)
        except subprocess.TimeoutExpired:
            return {"run_error": "Timeout", "stdout": "", "test_errors": ["Timeout"] * len(tests), "values": {}}
        m = re.search(r"@@RESULT@@(.*)$", p.stdout, re.S)
        if not m:
            return {"run_error": "Crash: " + p.stderr[-300:], "stdout": "", "test_errors": ["Crash"] * len(tests), "values": {}}
        return json.loads(m.group(1))

failures = []
def fail(where, msg):
    failures.append("%s: %s" % (where, msg))
    print("FAIL", where, "-", msg)

def norm(code):
    return [l.rstrip() for l in code.splitlines() if l.strip() and not l.strip().startswith("#")]

def attacker(sol_res):
    lines = ["import sys"]
    for k, r in sol_res["values"].items():
        if k.isidentifier():
            lines.append("%s = %s" % (k, r))
    lines.append("sys.stdout.write(%r)" % sol_res["stdout"])
    return "\n".join(lines) + "\n"

BANNED = re.compile(r"\binput\s*\(|\brequests\b|urllib|socket|pip install|subprocess|\bos\.system")
ALLOWED_HEAVY = {5}  # numpy / pandas only in part 5

STAGE_KEYS = ["id", "title_tr", "prompt_tr", "prompt", "starter_code", "tests", "hints", "hints_tr", "solution"]
nstages = 0
for part in PARTS:
    path = os.path.join(DIR, "part%d.json" % part)
    where0 = "part%d" % part
    if not os.path.exists(path):
        fail(where0, "file missing"); continue
    try:
        doc = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        fail(where0, "invalid JSON: %s" % e); continue
    for k in ["part", "title_tr", "story_tr", "stages", "reward_xp", "test_conventions"]:
        if k not in doc or doc[k] in ("", None, []):
            fail(where0, "missing/empty field " + k)
    if doc.get("part") != part:
        fail(where0, "part field != %d" % part)
    if doc.get("reward_xp") != 300:
        fail(where0, "reward_xp must be 300")
    stages = doc.get("stages", [])
    if not 3 <= len(stages) <= 5:
        fail(where0, "needs 3-5 stages, has %d" % len(stages))
    prev_sol = None
    ids = set()
    for n, st in enumerate(stages, 1):
        nstages += 1
        w = "%s/stage%d" % (where0, n)
        miss = [k for k in STAGE_KEYS if k not in st or st[k] in ("", None, [])]
        if not isinstance(st.get("starter_code"), str):
            miss.append("starter_code")
        elif "starter_code" in miss and st["starter_code"] == "":
            miss.remove("starter_code")
        if miss:
            fail(w, "missing/empty fields %s" % miss); continue
        if st["id"] in ids:
            fail(w, "duplicate id")
        ids.add(st["id"])
        sol = st["solution"]
        if not sol.get("code") or not sol.get("approach_tr"):
            fail(w, "solution needs code and approach_tr"); continue
        tests = st["tests"]
        if not 3 <= len(tests) <= 6:
            fail(w, "needs 3-6 tests, has %d" % len(tests))
        hidden = [t for t in tests if t.get("visible") is False]
        if len(hidden) < 2:
            fail(w, "needs >= 2 hidden tests")
        if not any(t.get("anti_hardcode") for t in tests):
            fail(w, "needs >= 1 anti_hardcode test")
        for i, t in enumerate(tests):
            if not t.get("code"):
                fail(w, "test %d has no code" % i)
            if not t.get("failure_message") or not t.get("failure_message_tr"):
                fail(w, "test %d lacks failure_message/_tr" % i)
            if t.get("visible") is not False and not t.get("label_tr"):
                fail(w, "visible test %d lacks label_tr" % i)
        if len(st["hints"]) != 3 or len(st["hints_tr"]) != 3:
            fail(w, "needs exactly 3 hints and 3 hints_tr")
        # forbidden constructs
        for label, txt in [("solution", sol["code"]), ("starter", st["starter_code"])] + [("test%d" % i, t["code"]) for i, t in enumerate(tests)]:
            if BANNED.search(txt):
                fail(w, "%s uses a banned construct (input/network/pip/subprocess)" % label)
            if part not in ALLOWED_HEAVY and re.search(r"\b(numpy|pandas)\b", txt):
                fail(w, "%s uses numpy/pandas outside part 5" % label)
        codes = [t["code"] for t in tests]
        # 1. solution passes
        r = run(sol["code"], codes, dump=True)
        if r["run_error"]:
            fail(w, "solution crashes: %s" % r["run_error"]); prev_sol = sol["code"]; continue
        bad = [(i, e) for i, e in enumerate(r["test_errors"]) if e]
        for i, e in bad:
            fail(w, "solution fails test %d: %s" % (i, e))
        # 2. starter fails >= 1
        rs = run(st["starter_code"], codes)
        if rs["run_error"] is None and not any(rs["test_errors"]):
            fail(w, "starter_code already passes every test")
        # 3. hard-coded attacker fails >= 1
        ra = run(attacker(r), codes)
        if ra["run_error"] is None and not any(ra["test_errors"]):
            fail(w, "hard-coded attacker passes every test")
        elif ra["run_error"] is None and sum(1 for e in ra["test_errors"] if e is None) > 0:
            anti_idx = [i for i, t in enumerate(tests) if t.get("anti_hardcode")]
            if all(ra["test_errors"][i] is None for i in anti_idx):
                fail(w, "hard-coded attacker passes all anti_hardcode tests")
        # 4. last hint is not the solution
        added = [l.strip() for l in norm(sol["code"]) if l.strip() not in {x.strip() for x in norm(st["starter_code"])}]
        for lang, hs in (("en", st["hints"]), ("tr", st["hints_tr"])):
            last = hs[-1]
            if sol["code"].strip() in last:
                fail(w, "last %s hint contains the full solution" % lang)
            long_added = [a for a in added if len(a) > 12]
            if long_added and sum(1 for a in long_added if a in last) / len(long_added) >= 0.5:
                fail(w, "last %s hint contains most of the added solution lines" % lang)
        # 5. chain
        if prev_sol is not None:
            if norm(st["starter_code"]) != norm(prev_sol):
                fail(w, "starter_code != previous stage solution (modulo comments)")
        if norm(sol["code"])[:len(norm(st["starter_code"]))] != norm(st["starter_code"]) or norm(sol["code"]) == norm(st["starter_code"]):
            fail(w, "solution must extend its starter_code")
        prev_sol = sol["code"]
        print("ok   %s  (%d tests, %d hidden)" % (w, len(tests), len(hidden)))

print()
print("Validated %d stages across %d parts: %d failures" % (nstages, len(PARTS), len(failures)))
sys.exit(1 if failures else 0)
