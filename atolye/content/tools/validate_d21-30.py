#!/usr/bin/env python
"""Validator for atolye/content/exercises/day21.json .. day30.json.

Run: .venv/bin/python atolye/content/tools/validate_d21-30.py

Checks (see brief): JSON shape, required fields per type, unique ids, twin and
review_pool references, and actually RUNS every predict / type_it / fill_blank /
parsons / modify / write / debug exercise in a fresh subprocess (5 s timeout).
Convention: tests are `assert` snippets exec'd after the learner code in the same
namespace; learner stdout is available as the string `__stdout__`, the learner's source as `__source__`.
"""
import ast
import json
import re
import subprocess
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "exercises"
DAYS = range(21, 31)
MARK = "@@RESULT@@"

RUNNER = r'''
import sys, json, io, contextlib, traceback
d = json.load(sys.stdin)
ns = {"__name__": "__main__"}
buf = io.StringIO()
res = {"ok": True, "stdout": "", "error": None, "failed_test": None}
try:
    with contextlib.redirect_stdout(buf):
        exec(compile(d["code"], "<learner>", "exec"), ns)
except BaseException:
    res["ok"] = False
    res["error"] = traceback.format_exc()[-600:]
res["stdout"] = buf.getvalue()
if res["ok"]:
    ns["__stdout__"] = res["stdout"]
    ns["__source__"] = d["code"]
    for i, t in enumerate(d["tests"]):
        try:
            exec(compile(t, "<test>", "exec"), ns)
        except BaseException:
            res["ok"] = False
            res["failed_test"] = i
            res["error"] = traceback.format_exc()[-600:]
            break
sys.stdout.write("\n" + "@@RESULT@@" + json.dumps(res))
'''


def run(code, tests=()):
    try:
        p = subprocess.run(
            [sys.executable, "-I", "-c", RUNNER],
            input=json.dumps({"code": code, "tests": list(tests)}),
            capture_output=True, text=True, timeout=5,
        )
    except subprocess.TimeoutExpired:
        return {"ok": False, "stdout": "", "error": "TIMEOUT (5s)", "failed_test": None}
    out = p.stdout
    if MARK not in out:
        return {"ok": False, "stdout": "", "error": "runner crashed: " + p.stderr[-300:], "failed_test": None}
    return json.loads(out.rsplit(MARK, 1)[1])


def norm(s):
    return "\n".join(l.rstrip() for l in s.rstrip().split("\n")).strip("\n")


REQ = {
    "predict": ["prompt", "prompt_tr", "code", "choices", "expected_output", "explanation", "misconceptions",
                "explanation_tr", "misconceptions_tr"],
    "fill_blank": ["prompt", "prompt_tr", "starter_code", "blanks", "tests"],
    "parsons": ["prompt", "prompt_tr", "lines", "correct_order", "distractors"],
    "modify": ["prompt", "prompt_tr", "starter_code", "tests", "hints", "hints_tr", "solution"],
    "write": ["prompt", "prompt_tr", "starter_code", "signature", "tests", "hints", "hints_tr", "solution", "twin"],
    "debug": ["prompt", "prompt_tr", "starter_code", "hints", "hints_tr", "solution"],
    "explain": ["prompt", "prompt_tr", "model_answer", "model_answer_tr", "keywords", "keywords_tr", "min_words"],
    "type_it": ["prompt", "prompt_tr", "code", "expected_output"],
}


def collect(path, data, errs):
    """Static checks; returns list of (label, thunk) jobs."""
    jobs = []
    def err(m):
        errs.append(f"{path.name}: {m}")
    for k in ("day", "title", "test_conventions", "blocks", "review_pool"):
        if k not in data:
            err(f"missing top-level field {k}")
    ids = {}
    blocks = data.get("blocks", [])
    if not nonempty(data.get("title_tr")):
        err("title_tr missing")
    if "__source__" not in data.get("test_conventions", ""):
        err("test_conventions must mention __source__")
    if not 3 <= len(blocks) <= 6:
        err(f"{len(blocks)} blocks (need 3-6)")
    types = Counter()
    for b in blocks:
        for k in ("id", "concept", "tags", "worked_example", "exercises"):
            if k not in b:
                err(f"block {b.get('id')} missing {k}")
        if not nonempty(b.get("concept_tr")):
            err(f"block {b.get('id')} concept_tr missing")
        we = b.get("worked_example", {})
        ntr = we.get("notes_tr", [])
        if len(ntr) != len(we.get("notes", [])) or not all(nonempty(x) for x in ntr):
            err(f"{b.get('id')} worked_example.notes_tr missing or wrong length")
        if len(we.get("code", "").strip().split("\n")) > 10:
            err(f"{b.get('id')} worked_example longer than 10 lines")
        if not 2 <= len(we.get("notes", [])) <= 4:
            err(f"{b.get('id')} worked_example needs 2-4 notes")
        jobs.append((f"{b.get('id')} worked_example", lambda c=we.get("code", ""): check_runs(c)))
        ex = b.get("exercises", [])
        order = [e.get("type") for e in ex]
        if not order or order[0] != "predict":
            err(f"{b.get('id')} must start with predict (got {order[:1]})")
        if len(order) > 1 and order[1] not in ("fill_blank", "parsons"):
            err(f"{b.get('id')} second exercise must be fill_blank/parsons")
        if len(order) > 2 and order[2] not in ("modify", "write"):
            err(f"{b.get('id')} third exercise must be modify/write")
        for e in ex:
            eid = e.get("id", "?")
            if eid in ids:
                err(f"duplicate id {eid}")
            ids[eid] = e
            t = e.get("type")
            types[t] += 1
            if t not in REQ:
                err(f"{eid} unknown type {t}")
                continue
            for k in REQ[t]:
                if k not in e or e[k] in (None,) :
                    err(f"{eid} ({t}) missing field {k}")
            jobs.append((eid, lambda e=e: check_exercise(e) + check_tr(e)
                         + (check_ladder(e) if "hints" in e and "solution" in e else [])
                         + (check_hardcode(e) if e.get("type") in ("write", "modify") else [])))
    for b in blocks:
        for e in b.get("exercises", []):
            if e.get("type") == "write":
                tw = ids.get(e.get("twin"))
                if tw is None or tw.get("type") != "write":
                    err(f"{e.get('id')} twin {e.get('twin')} missing or not write")
    rp = data.get("review_pool", [])
    if not 4 <= len(rp) <= 6:
        err(f"review_pool has {len(rp)} (need 4-6)")
    for r in rp:
        if r not in ids:
            err(f"review_pool id {r} not found")
    kinds = {ids[r]["type"] for r in rp if r in ids}
    if not {"predict", "write"} <= kinds:
        err("review_pool should mix predict and write")
    for need in ("debug", "explain"):
        if types[need] < 1:
            err(f"need at least one {need}, found {types[need]}")
    for b in blocks:
        n = len(b.get("exercises", []))
        if not 7 <= n <= 10:
            err(f"{b.get('id')} has {n} exercises (need 7-10)")
    return jobs, types


def check_runs(code):
    r = run(code)
    return [] if r["ok"] else ["worked_example fails: " + r["error"]]


def check_tests(code, tests, label):
    r = run(code, [t["code"] for t in tests])
    if r["ok"]:
        return []
    ft = r["failed_test"]
    return [f"{label} fails" + (f" test #{ft}: {tests[ft]['code']}" if ft is not None else "") + "\n      " + (r["error"] or "").strip().split("\n")[-1]]


def starter_with_blanks(e):
    code = e["starter_code"]
    parts = code.split("___")
    if len(parts) - 1 != len(e["blanks"]):
        return None
    out = parts[0]
    for bl, rest in zip(e["blanks"], parts[1:]):
        out += bl["answer"][0] + rest
    return out


def check_exercise(e):
    t = e["type"]
    probs = []
    tests = e.get("tests", [])
    for tt in tests:
        if "code" not in tt:
            probs.append("test without code")
    if t in ("predict", "type_it"):
        r = run(e["code"])
        if not r["ok"]:
            return ["code raises: " + r["error"]]
        if norm(r["stdout"]) != norm(e["expected_output"]):
            probs.append(f"stdout {norm(r['stdout'])!r} != expected {norm(e['expected_output'])!r}")
        if t == "predict":
            ch = e["choices"]
            if e["expected_output"] not in ch:
                probs.append("expected_output not in choices")
            if len(set(ch)) != len(ch) or not 3 <= len(ch) <= 5:
                probs.append("choices must be 3-5 distinct")
            wrong = [c for c in ch if c != e["expected_output"]]
            if set(e["misconceptions"]) != set(wrong):
                probs.append("misconceptions keys must equal the wrong choices")
        return probs
    if t == "explain":
        low = e["model_answer"].lower()
        if not e["keywords"]:
            probs.append("no keywords")
        for k in e["keywords"]:
            if k.lower() not in low:
                probs.append(f"keyword {k!r} not in model_answer")
        return probs
    if t == "fill_blank":
        code = starter_with_blanks(e)
        if code is None:
            return ["number of ___ != number of blanks"]
        probs += check_tests(code, tests, "fill_blank solution")
        # starter with literal blanks must not already pass
        r = run(e["starter_code"], [x["code"] for x in tests])
        if r["ok"]:
            probs.append("starter with blanks passes tests")
        return probs
    if t == "parsons":
        lines, order = e["lines"], e["correct_order"]
        if sorted(order) != list(range(len(lines))):
            return ["correct_order is not a permutation of lines"]
        if not 1 <= len(e["distractors"]) <= 2:
            probs.append("parsons needs 1-2 distractors")
        code = "\n".join(lines[i] for i in order)
        r = run(code, [x["code"] for x in tests])
        if not r["ok"]:
            return ["correct order fails: " + r["error"]]
        if "expected_output" in e and norm(r["stdout"]) != norm(e["expected_output"]):
            probs.append(f"stdout {norm(r['stdout'])!r} != expected")
        if order == list(range(len(lines))):
            probs.append("lines are already in correct order (not shuffled)")
        return probs
    if t in ("modify", "write", "debug"):
        sol = e["solution"]
        if "approach" not in sol or "code" not in sol:
            return ["solution needs approach and code"]
        if len(e["hints"]) != 3:
            probs.append("need exactly 3 hints")
        exp = e.get("expected_output")
        if t == "write":
            if not 3 <= len(tests) <= 6:
                probs.append(f"{len(tests)} tests (need 3-6)")
            hid = [x for x in tests if x.get("visible") is False]
            if len(hid) < 2:
                probs.append("need >=2 hidden tests")
            for x in hid:
                if not x.get("failure_message"):
                    probs.append("hidden test lacks failure_message")
            if e["starter_code"].strip():
                probs.append("write starter_code must be empty")
        if t == "debug" and not tests and exp is None:
            probs.append("debug needs tests and/or expected_output")
        # solution passes
        r = run(sol["code"], [x["code"] for x in tests])
        if not r["ok"]:
            probs.append("solution fails: " + (r["error"] or "").strip().split("\n")[-1] + (f" (test {tests[r['failed_test']]['code']})" if r["failed_test"] is not None else ""))
        elif exp is not None and norm(r["stdout"]) != norm(exp):
            probs.append(f"solution stdout {norm(r['stdout'])!r} != expected {norm(exp)!r}")
        # starter must fail
        rs = run(e["starter_code"], [x["code"] for x in tests])
        starter_fails = (not rs["ok"]) or (exp is not None and norm(rs["stdout"]) != norm(exp))
        if t in ("modify", "debug") and not starter_fails:
            probs.append("starter code already passes (must fail)")
        return probs
    return probs


# ---------------------------------------------------------------- round 3 checks
TRACER = r"""
import sys, json, ast, pickle, base64
d = json.load(sys.stdin)
ns = {"__name__": "__main__"}
exec(compile(d["code"], "<learner>", "exec"), ns)
RET, INIT, stack = {}, {}, []
def lit(v):
    try:
        return base64.b64encode(pickle.dumps(v)).decode()
    except Exception:
        return None
def key(loc):
    return repr(sorted((k, repr(v)) for k, v in loc.items() if k != "self"))
def prof(frame, event, arg):
    co = frame.f_code
    if co.co_filename != "<learner>" or co.co_name.startswith("<"):
        return
    if event == "call":
        stack.append(key(frame.f_locals))
    elif event == "return":
        k = stack.pop() if stack else ""
        q = co.co_qualname
        if co.co_name == "__init__":
            me = frame.f_locals.get(co.co_varnames[0]) if co.co_argcount else None
            snap = {a: lit(v) for a, v in getattr(me, "__dict__", {}).items() if lit(v) is not None}
            INIT.setdefault(q, {})[k] = snap
        else:
            RET.setdefault(q, {})[k] = lit(arg)
ns["__source__"] = d["code"]
ns["__stdout__"] = ""
sys.setprofile(prof)
try:
    for t in d["tests"]:
        try:
            exec(compile(t, "<test>", "exec"), ns)
        except BaseException:
            pass
finally:
    sys.setprofile(None)
base = {k: v for k, v in ns.items() if not k.startswith("__") and not callable(v) and type(v).__name__ != "module"}
base = {k: v for k, v in base.items() if lit(v) is not None}
sys.stdout.write("\n@@RESULT@@" + json.dumps({"ret": RET, "init": INIT, "vars": {k: lit(v) for k, v in base.items()}}))
"""

PRELUDE = """
import pickle as _pk, base64 as _b64
def _un(x):
    return None if x is None else _pk.loads(_b64.b64decode(x))
_HC_R = %r
_HC_I = %r
def _hc_ret(q, k):
    d = _HC_R.get(q, {})
    return _un(d[k] if k in d else (next(iter(d.values())) if d else None))
def _hc_init(q, k):
    d = _HC_I.get(q, {})
    return {a: _un(v) for a, v in (d[k] if k in d else (next(iter(d.values())) if d else {})).items()}
"""


def trace(code, visible_codes):
    p = subprocess.run([sys.executable, "-I", "-c", TRACER], input=json.dumps({"code": code, "tests": visible_codes}),
                       capture_output=True, text=True, timeout=10)
    if MARK not in p.stdout:
        raise RuntimeError("tracer crashed: " + p.stderr[-300:])
    return json.loads(p.stdout.rsplit(MARK, 1)[1])


class _Rewrite(ast.NodeTransformer):
    def __init__(self):
        self.stack = []
        self.count = 0

    def visit_ClassDef(self, node):
        self.stack.append(node.name)
        self.generic_visit(node)
        self.stack.pop()
        return node

    def visit_FunctionDef(self, node):
        q = ".".join(self.stack + [node.name])
        self.count += 1
        keyx = "repr(sorted((k, repr(v)) for k, v in locals().items() if k != 'self'))"
        if node.name == "__init__":
            me = node.args.args[0].arg if node.args.args else "self"
            src = f"{me}.__dict__.update(_hc_init({q!r}, {keyx}))"
        else:
            src = f"return _hc_ret({q!r}, {keyx})"
        node.body = ast.parse(src).body
        node.decorator_list = [d for d in node.decorator_list]
        return node

    visit_AsyncFunctionDef = visit_FunctionDef


def build_attack(sol_code, visible_codes):
    """Hard-coded 'learner': replaces every function body with answers memorised from the visible tests."""
    tr = trace(sol_code, visible_codes)
    tree = ast.parse(sol_code)
    rw = _Rewrite()
    tree = ast.fix_missing_locations(rw.visit(tree))
    if rw.count == 0:
        # script style: assign final variables and print the captured stdout
        r = run(sol_code)
        lines = ["import pickle, base64"] + [f"{k} = pickle.loads(base64.b64decode({v!r}))" for k, v in tr["vars"].items()]
        lines.append(f"import sys; sys.stdout.write({r['stdout']!r})")
        return "\n".join(lines)
    return PRELUDE % (tr["ret"], tr["init"]) + "\n" + ast.unparse(tree)


STATEFUL = []


def check_hardcode(e):
    """Hard-coded version must pass the visible tests but FAIL at least one hidden test."""
    tests = e["tests"]
    vis = [t["code"] for t in tests if t.get("visible") is not False]
    hid = [t for t in tests if t.get("visible") is False]
    if not hid:
        return ["no hidden test at all (anti-hardcode test missing)"]
    try:
        atk = build_attack(e["solution"]["code"], vis)
    except Exception as ex:
        return [f"could not build hard-coded attack: {ex}"]
    rv = run(atk, vis)
    if not rv["ok"]:
        # visible tests already need state/logic that constant answers cannot supply (e.g. 30 after two adds, 0 for a
        # fresh object), so memorised answers cannot even pass the visible checks: hard-coding is impossible here.
        STATEFUL.append(e["id"])
        if "-v" in sys.argv:
            print("STATEFUL", e["id"], (rv["error"] or "").strip().split("\n")[-1][:150])
        return []
    killers = [t for t in hid if not run(atk, [t["code"]])["ok"]]
    if not killers:
        return ["hard-coded version PASSES every hidden test (add a hidden test with new arguments or an AST/source check)"]
    for t in killers:
        if not t.get("failure_message") or not t.get("failure_message_tr"):
            return ["anti-hardcode test lacks failure_message / failure_message_tr"]
    return []


def nonempty(v):
    return isinstance(v, str) and v.strip() != ""


ASCII_TR = re.compile(r"(sinif\w*|yazdirir\w*|dondur\w*|olustur\w*|yapici\w*|degis\w*|cagir\w*|duzelt\w*|calis\w*|cikti\w*|asagidaki|ogre\w*|yaz[di]r\w*)", re.A)


def ascii_tr_hit(text):
    for tok in re.findall(r"[^\W\d_]+", text):
        if ASCII_TR.fullmatch(tok.lower()):
            return tok
    return None


def tr_texts(e):
    for k in ("prompt_tr", "explanation_tr", "model_answer_tr"):
        if k in e:
            yield k, e[k]
    for i, h in enumerate(e.get("hints_tr", [])):
        yield f"hints_tr[{i}]", h
    for k, v in (e.get("misconceptions_tr") or {}).items():
        yield f"misconceptions_tr[{k[:12]}]", v
    if "solution" in e and "approach_tr" in e["solution"]:
        yield "approach_tr", e["solution"]["approach_tr"]
    for i, t in enumerate(e.get("tests", [])):
        for k in ("label_tr", "failure_message_tr"):
            if k in t:
                yield f"tests[{i}].{k}", t[k]


def check_tr(e):
    probs = []
    t = e["type"]
    for k, v in tr_texts(e):
        if not nonempty(v):
            probs.append(f"{k} empty")
        elif ascii_tr_hit(v):
            probs.append(f"{k} looks like Turkish without diacritics: {ascii_tr_hit(v)!r}")
    if "explanation" in e and not nonempty(e.get("explanation_tr")):
        probs.append("explanation_tr missing")
    if "misconceptions" in e and set(e.get("misconceptions_tr", {})) != set(e["misconceptions"]):
        probs.append("misconceptions_tr keys differ from misconceptions")
    if "hints" in e:
        if len(e.get("hints_tr", [])) != len(e["hints"]):
            probs.append("hints_tr length != hints length")
    if "solution" in e and not nonempty(e["solution"].get("approach_tr")):
        probs.append("solution.approach_tr missing")
    for i, x in enumerate(e.get("tests", [])):
        if x.get("visible") is not False and not nonempty(x.get("label_tr")):
            probs.append(f"visible test #{i} lacks label_tr")
        if x.get("failure_message") and not nonempty(x.get("failure_message_tr")):
            probs.append(f"test #{i} has failure_message but no failure_message_tr")
        if x.get("visible") is False and not x.get("failure_message"):
            probs.append(f"hidden test #{i} lacks failure_message")
    if t == "explain":
        low = e.get("model_answer_tr", "").lower()
        kt = e.get("keywords_tr") or []
        if len(kt) < 2:
            probs.append("keywords_tr needs >= 2 stems")
        for k in kt:
            if k.lower() not in low:
                probs.append(f"keyword_tr {k!r} not in model_answer_tr")
        mw = e.get("min_words")
        if not isinstance(mw, int) or mw < 4:
            probs.append("min_words must be an int >= 4")
        if len(low.split()) < (mw or 0):
            probs.append("model_answer_tr shorter than min_words")
    return probs


def check_ladder(e):
    """Hint ladder: pointing -> teaching -> bottom-out that is NOT the full solution."""
    probs = []
    hints = e.get("hints", [])
    sol = e["solution"]["code"]
    norm_sol = re.sub(r"\s+", " ", sol).strip()
    sol_lines = [l.strip() for l in sol.split("\n") if l.strip()]
    for lang, hs in (("hints", hints), ("hints_tr", e.get("hints_tr", []))):
        if len(hs) != 3:
            continue
        last = hs[-1]
        if re.sub(r"\s+", " ", last).strip() and norm_sol in re.sub(r"\s+", " ", last):
            probs.append(f"{lang}[2] contains the full solution code")
        have = sum(1 for l in sol_lines if l in last)
        if len(sol_lines) >= 3 and have / len(sol_lines) >= 0.5:
            probs.append(f"{lang}[2] reproduces {have}/{len(sol_lines)} solution lines")
        code_like = [l for l in last.split("\n") if re.match(r"\s*(def |class |return |for |if |import |\w+\s*=[^=]|print\()", l)]
        if len(code_like) > 1:
            probs.append(f"{lang}[2] has {len(code_like)} code-like lines (max 1 partial line)")
        try:
            ast.parse(last)
            r = run(last, [t["code"] for t in e.get("tests", [])])
            if r["ok"] and e.get("tests"):
                probs.append(f"{lang}[2] is a runnable program that passes the tests")
        except SyntaxError:
            pass
    if len(set(hints)) != len(hints):
        probs.append("duplicate hints")
    return probs



def main():
    errs, per_type, nfiles, nex = [], Counter(), 0, 0
    all_jobs = []
    only = [int(a) for a in sys.argv[1:] if a.isdigit()]
    for n in (only or DAYS):
        p = ROOT / f"day{n:02d}.json"
        if not p.exists():
            errs.append(f"{p.name}: file missing")
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception as ex:
            errs.append(f"{p.name}: JSON parse error {ex}")
            continue
        nfiles += 1
        if data.get("day") != n:
            errs.append(f"{p.name}: day field {data.get('day')} != {n}")
        jobs, types = collect(p, data, errs)
        per_type.update(types)
        nex += sum(types.values())
        all_jobs += [(p.name, lab, th) for lab, th in jobs]
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda j: (j[0], j[1], j[2]()), all_jobs))
    for fname, label, probs in results:
        for pr in probs:
            errs.append(f"{fname} {label}: {pr}")
    for e in errs:
        print("FAIL", e)
    tl = ", ".join(f"{k}={v}" for k, v in sorted(per_type.items()))
    if STATEFUL:
        print(f"NOTE stateful exercises (visible tests already defeat constant answers): {len(STATEFUL)}")
    print(f"SUMMARY files={nfiles} exercises={nex} ({tl}) | {len(errs)} failures")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
