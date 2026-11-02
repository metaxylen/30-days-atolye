# Pedagogy research: turning the 30-days-of-python course into an interactive platform

Date: 2026-11-02. Scope: learning science, exercise types, real platforms, hints/solutions, skill candidates, then a design for our app (static React + Pyodide).

Evidence labels: **[P]** = primary paper/official page that I opened or whose search result gave bibliographic details; **[S]** = secondary (blog, forum, summary); **[U]** = from my background knowledge, NOT verified in this session (re-check before relying on it). Where a search only returned abstracts or summaries I say so.

## 0. The learner's problem in one line

"Everything is written out, so I will peek and copy." This is a known failure mode, not a character flaw: students "game" help systems when answers are one click away ([LearnLab: Help abuse](https://learnlab.org/research/wiki/index.php/Help_abuse); Aleven et al. 2006 found hint abuse on 36% of actions in one Geometry Cognitive Tutor unit, 14% if rapid successive hint requests count once). The fix is not to hide everything (minimal guidance fails novices) but to sequence: worked example, then faded example, then own attempt, with answers gated behind effort.

## 1. Learning-science principles that apply

| Principle | What the evidence says | Design consequence | Source |
|---|---|---|---|
| Retrieval practice / testing effect | Taking a test improves long-term retention more than restudying. Practice testing and distributed practice were the only two of ten techniques rated "high utility"; practice testing with corrective feedback gives the highest learning rates. Re-reading and highlighting are "low". | Every concept ends with the learner producing something from memory; never "read, then next". | Roediger & Karpicke 2006 [(Wikipedia entry citing DOI 10.1111/j.1467-9280.2006.01693.x)](https://en.wikipedia.org/wiki/Testing_effect) [S for summary, P for citation]; Dunlosky et al. 2013 [(APS summary)](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html) [S of P] |
| Worked-example effect | Studying a solved example avoids search that overloads working memory, so novices learn more from examples than from solving cold. Poorly structured examples can be as demanding as problem solving. | Start each concept with a short, annotated worked example; keep it small. | Sweller & Cooper 1985; Kirschner, Sweller & Clark 2006, Educational Psychologist 41(2) 75-86 ([discussion](https://ntnu.no/wiki/download/attachments/8324914/sweller_kirschner_clark_reply_ep07.pdf)) [S/P mix, citations confirmed via search] |
| Expertise reversal + fading | Worked examples help novices but become redundant or harmful for more experienced learners; the remedy is to remove solution steps gradually ("fading") so the learner takes over. Completion problems (half-solved) did as well as fully worked ones on test problems (Paas). Fading helps near transfer more reliably than far transfer. | Fade the example across 2-3 steps (blank a value, blank a line, blank a block) rather than jumping from "full code" to "empty editor". Skip levels for learners who pass quickly (adaptive). | Kalyuga, Ayres, Chandler & Sweller 2003; Renkl & Atkinson 2003, Educational Psychologist 38 ([overview](https://en.wikipedia.org/wiki/Expertise_reversal_effect)) [S of P] |
| Cognitive load | Working memory is the bottleneck; extraneous search and split attention hurt. | One concept plus one action per screen; show output next to code; no walls of text. | [Kirschner, Sweller, Clark reply PDF](https://ntnu.no/wiki/download/attachments/8324914/sweller_kirschner_clark_reply_ep07.pdf) [P-ish] |
| Generation effect | Information you generate yourself is remembered better than information you read (Slamecka & Graf 1978); a meta-analysis (Bertsch et al. 2007) reports d about 0.40 (not verified from the primary paper). | Learner types/produces the key line; do not show the line first. | [Search summary of Slamecka & Graf, Bertsch](https://jonathanjarrettkerr.substack.com/p/bjorks-desirable-difficulties-in) [S] |
| Desirable difficulties | Spacing, interleaving, varying presentation, reduced feedback and testing as learning events make practice feel harder but improve retention. Difficulty must be productive; confusing tasks are just difficult. | Hard-but-solvable tasks; do not make the UI itself hard. | Bjork & Linn 2006 [(PDF)](https://sites.lifesci.ucla.edu/psych-bjorklab/wp-content/uploads/sites/13/2016/07/RBjork_Linn_2006.pdf) [P, listed in results; summary via search] |
| Spaced repetition | Distributed practice works across ages, materials and retention intervals; Cepeda et al. 2006 meta-analysis (254 studies per one summary). | Reviews scheduled at growing gaps, not "day 1 then never". | Dunlosky 2013 (above); Cepeda 2006 [(summary)](https://www.mindomax.com/desirable-difficulties) [S] |
| Interleaving | In math, interleaved practice scored lower during practice but much higher on a delayed test (Rohrer & Taylor 2007); Brunmair & Richter 2019 meta-analysis g about 0.42, with moderators. Rated "moderate" by Dunlosky. | Review sets mix old concepts (loops + strings + dicts) rather than one topic at a time. | [Summary with citations](https://jonathanjarrettkerr.substack.com/p/bjorks-desirable-difficulties-in) [S] |
| Immediate feedback | A 2023 randomized trial found novices learn more when they can see program output than when they only get a correct/incorrect verdict. | Show the actual output and a diff against expected output, not just a green/red mark. | [ICER 2023 paper listing](https://icer2023.acm.org/details/icer-2023-papers/33/Investigating-the-Impact-of-On-Demand-Code-Examples-on-Novices-Open-Ended-Programmin) and secondary result summary [S] |
| Productive failure | Letting learners attempt before instruction can help (Kapur). My search did not return sources for this, so treat it as a hypothesis. | Optional: a "try first" attempt before some explanations. | [U] |

Honest caution: most numbers above come from summaries. The directional claims (testing, spacing, worked examples for novices, fading) are consistent across all sources I saw; effect sizes should not be quoted without checking the originals.

## 2. Exercise types for programming and when each fits

| Type | What the learner does | Best for | Evidence / notes |
|---|---|---|---|
| Predict-the-output | Reads code, commits to a prediction (type or multiple choice) before running | First exposure to a construct; building a mental model of how the computer runs code ("notional machine") | Core of PRIMM; futurecoder uses multiple-choice output prediction to keep learners engaged ([futurecoder README](https://github.com/alexmojaki/futurecoder)) [P]. Tracing is linked to code-writing ability, but the link is modest and question-dependent (Venables, Tan & Lister, ICER 2009: R-squared 0.15 in the Lopez et al. data) ([UTS copy](https://opus.lib.uts.edu.au/handle/10453/11384)) [P]. |
| Parsons problem (drag lines into order) | Reorders shuffled lines | Syntax-light practice of structure and control flow; early in a concept | Solved faster than fixing/writing code with the same pre/post learning gains (Ericson, Margulieux & Rick 2017, via later summaries; abstract not directly read). Easier to grade; students can game it (Denny, Luxton-Reilly & Simon 2008) ([search summary](https://en.wikipedia.org/wiki/Parsons_problem)) [S]. Plain Parsons did not show short-term near transfer to code writing in one pilot, which motivated faded Parsons (same source). Faded Parsons beat code-writing/tracing for pattern comprehension and was comparable for writing from scratch in Weinman et al. 2021 (cited in [arXiv 2512.22407](https://arxiv.org/html/2512.22407)) [S of P]; micro Parsons showed higher engagement/gains than writing in Wu et al. 2023/2024 (same source). Note: that arXiv study itself is a 9-person pilot with no control group. |
| Fill-in-the-blank / faded code | Completes blanks in working code, with more blanks over time | Second step after a worked example (completion problem) | See fading above (Renkl & Atkinson 2003; Paas) [S of P]. |
| Type-it-yourself (retype an example) | Types the example, ideally after it is hidden | Syntax fluency, first week | No controlled study of typing vs pasting for novices found. TYPOS (typing interactive worked examples) correlated with higher grades, observational and only marginally significant ([record](https://katalog.lib.cas.cz/KNAV/EdsRecord/edsair,edsair.doi...........af027eb3bb6288475c2ae11763ba9f7a)) [S]. Khan Academy disabled copy of hint code because many students pasted hints and got syntax errors, but reported no measured result and found no programming research ([KA CS blog](https://cs-blog.khanacademy.org/2013/09/sorry-students-no-more-copy-paste.html)) [P, practitioner]. Commentary: blind retyping may be no better than pasting; the useful form is read, hide, rewrite from memory ([search summary](https://www.johndcook.com/blog/?p=12603)) [S]. Use sparingly. |
| Modify-the-code | Changes a working program to meet a new requirement | After understanding; bridges to writing | PRIMM "Modify"; Use-Modify-Create ("modify someone else's project, then create your own": Lee et al. 2011, ACM Inroads 2(1) 32-37, DOI 10.1145/1929887.1929902) ([Crossref record found via search](https://api.crossref.org/works/10.1145%2F1929887.1929902)) [P for citation]. |
| Write-from-scratch vs hidden tests | Writes function/program; tests decide | End of a concept; checks transfer | futurecoder: "the code at each step is checked automatically" ([README](https://github.com/alexmojaki/futurecoder)) [P]. Exercism runs a suite of tests per exercise; tests there are visible and editable ([overview post](https://richstone.netlify.app/level-up-with-real-test-driven-development-on-exercism-and-other-challenge-platforms)) [S]. |
| Debug / fix-the-bug | Finds and fixes an error in given code | Reading errors, tracing; good for retrieval of old topics | PRIMM "Investigate" (tracing, annotating, debugging). Quiz types in the coding-tutor skill include "Debugging: what's wrong here?" ([SKILL.md mirror](https://github.com/foryourhealth111-pixel/Vibe-Skills/blob/HEAD/bundled/skills/coding-tutor/SKILL.md)) [P]. |
| Explain in plain words | Writes what a piece of code does (self-explanation) | Consolidation; catches "I copied it" | Self-explanation rated moderate utility (Dunlosky 2013) [S of P]. Venables et al. found explaining ability relates to writing, but the strength depends on the question [P]. Hard to auto-grade; use self-check against a model answer, keyword rubric, or skip grading. |

### PRIMM and Use-Modify-Create

- **PRIMM** (Sentance, Waite & Kallia 2019, Computer Science Education 29(2-3) 136-176): Predict, Run, Investigate, Modify, Make. Raspberry Pi reports a mixed-methods study with 13 teachers and 493 students, with PRIMM students outperforming a control group in pre/post tests; the summary page gives no statistics ([Raspberry Pi write-up](https://www.raspberrypi.org/?p=65416), [paper listings](https://eprints.gla.ac.uk/229013)) [P/S]. Students were aged 11-14, so adult transfer is plausible but not shown.
- **Use-Modify-Create**: three stages of engagement from using something existing, to modifying it, to creating your own (Lee et al. 2011, above). Widely promoted as scaffolding, but the SIGCSE 2020 panel describes it as promoted rather than rigorously proven ([panel PDF](https://appinventor.mit.edu/assets/files/SIGCSE2020Panel.pdf)) [S].

Our mapping: Predict + Run = predict-the-output; Investigate = trace/explain/fix-the-bug; Modify = fill-in/faded + modify-the-code; Make = write against hidden tests.

## 3. How real platforms do it

- **futurecoder** ([repo](https://github.com/alexmojaki/futurecoder)) [P]: a "fully interactive book which requires the user to run code in the provided editor or shell to advance." Code at each step is checked automatically; small hints gradually guide the learner; when stuck they "can reveal the solution bit by bit." Output-prediction multiple choice and Parsons problems appear. Common mistakes can be caught and explained, there is beginner linting, enhanced tracebacks that highlight the exact failing operation, and several debuggers (snoop, birdseye, Python Tutor). The README does not say how steps are authored or whether paste is blocked (it links to a contributing guide I did not read). Takeaway for us: step = tiny task + automatic check + progressive hint + gradual solution reveal + targeted feedback on known mistakes.
- **freeCodeCamp**: contributor guidance says a challenge should be solvable in about two minutes by someone who finished the previous ones, with the minimum number of tests needed to verify the concept (this is from a search snippet of the guidelines, not the docs page; docs.freecodecamp.org was unreachable for me) ([search result summary](https://forum.freecodecamp.org/t/understand-how-the-challenge-correction-is-works/269550)) [S]. Tests are simple assertions run in the browser (same forum source) [S]. Takeaway: very small steps, a few tests each.
- **Exercism**: browser or CLI, tests run on the site or locally ([docs](https://exercism.org/docs/using/solving-exercises)) [P]; human mentors review solutions after tests pass ([overview](https://richstone.netlify.app/level-up-with-real-test-driven-development-on-exercism-and-other-challenge-platforms)) [S]. We cannot offer mentors, so an "explain your solution" and compare-with-reference step is the offline analogue.
- **Codecademy, Brilliant**: I did not retrieve reliable sources for their internals; claims about them are omitted on purpose.
- **Boot.dev**: founder Lane Wagner calls weekly streaks arguably the most important game feature; the streak fully resets if you miss a week; a March 2024 newsletter says they tweaked to reduce competition ([Boot.dev Beat 2024-03](https://www.boot.dev/blog/news/bootdev-beat-2024-03)) [P, snippet]. Details on XP/hints were not retrievable.
- **Duolingo-style mastery/streaks**: evidence is thin and company-adjacent. A Duolingo growth write-up reports users reaching a 10-day streak were less likely to drop off ([Substack](https://marishalakhiani.substack.com/p/breaking-down-duolingos-growth-model)) [S]. Critics note users do the shortest lesson to protect a streak, limiting depth ([case study](https://jiwonvyoo.github.io/portfolio/case/duolingo/duo.html)) [S, opinion]. Small student studies (self-report) say streaks help retention ([thesis](https://repositorio.21.edu.ar/items/a054e49c-9c76-4700-9529-a8580f073a96)) [S]. No controlled trials of learning outcomes found.

What makes learners return without being childish (synthesis, my inference from the above): small completable steps with an unmistakable "I did that" signal; visible progress through the real curriculum (days done, concepts mastered) rather than cartoon rewards; a forgiving, habit-based streak; and a daily "review" that is short and has a clear end.

## 4. Hints and solutions

- **Hint ladders**: hints run general to specific, starting with a "pointing" hint then a "teaching" hint ([LearnLab](https://learnlab.org/research/wiki/index.php/Help_abuse) and search summaries) [S]. The geist-learning-lab skill's HintLadder reveals hints one at a time, labels them (Nudge, Getting Closer, Almost There, Full Hint), and counts hints used without judging ([quiz-assessment.md](https://github.com/vercel-labs/skill-geist-learning-labs/blob/HEAD/skills/geist-learning-lab/references/quiz-assessment.md)) [P].
- **Gaming risk**: rapid-click through hints is a recognized abuse pattern; a 2-second delay between hint levels was tried, and one account says students found workarounds ([LearnLab](https://learnlab.org/research/wiki/index.php/Help_abuse)) [S]. Help-seeking behavior explained about as much variance in learning gains as cognitive performance (same source). So: make each next hint cost something small (time or a failed attempt), not a moral lecture.
- **Unproductive help-seeking in programming** has been formalized (Marwan, Dombe & Price, ITiCSE 2020, [PDF](https://isnap.csc.ncsu.edu/home/public/papers/MarwanITiCSE2020.pdf)); also some learners avoid help when they need it (Maniktala et al., via [iSnap hints page](https://isnap.csc.ncsu.edu/home/public/tag/hints/)) [S]. So do not over-restrict: keep a visible, low-shame hint path.
- **Making copying effortful**: evidence for is practitioner-level (Khan Academy blocked selecting hint code; many pasted hints before that; no results reported) [P, practitioner]. Evidence against over-restricting: copy-modify is a legitimate skill (KA says so itself), restrictions are trivially bypassable in a browser (KA admits devtools), and Kirschner et al. argue unguided struggle hurts novices [P]. Blind retyping may not help (John D. Cook) [S].
- **When to reveal solutions** (recommendation, inference): after N honest attempts AND all hints used, show the solution in stages (first the approach, then the code), then require a "near-twin" exercise to confirm. Futurecoder's "reveal the solution bit by bit" is the closest shipping precedent [P].

## 5. Skill candidates (read, not installed)

Ran `DISABLE_TELEMETRY=1 npx -y skills find` for "learning design", "spaced repetition retrieval practice", "coding tutor".

| Skill | Installs | What I read | Useful ideas for us |
|---|---|---|---|
| [everyinc/compound-engineering-plugin coding-tutor](https://skills.sh/everyinc/compound-engineering-plugin/coding-tutor) | 2.5K | I could not locate the upstream SKILL.md path in the repo tree (skills.sh page truncated). I read a mirror copy: [Vibe-Skills coding-tutor/SKILL.md](https://github.com/foryourhealth111-pixel/Vibe-Skills/blob/HEAD/bundled/skills/coding-tutor/SKILL.md), which may differ from upstream. | Quiz mode with Fibonacci-ish intervals by score: score 1 -> 2 days, 5 -> 13, 8 -> 55, 10 -> 144. One question at a time. Mixed quiz types (conceptual, code reading, code writing, debugging). Honest scoring bands (1-3 re-teach ... 10 could teach it). "Show the struggle" tutorial style. Q&A and score stored per concept. |
| [lyndonkl/claude memory-retrieval-learning](https://skills.sh/lyndonkl/claude/memory-retrieval-learning) | 477 | Full SKILL.md from [GitHub](https://github.com/lyndonkl/claude/blob/HEAD/skills/memory-retrieval-learning/SKILL.md) (resources/ files not read) | Guardrails: avoid re-reading, cramming, topic-blocking; daily 15-20 min beats a weekly marathon; "expect 20-40% forgetting between reviews" (claimed without citation); retire cards after 5+ successful recalls; reviews shorter than new learning; adjust frequency by performance. |
| [vercel-labs/skill-geist-learning-labs geist-learning-lab](https://skills.sh/vercel-labs/skill-geist-learning-labs/geist-learning-lab) | ~100 | Full [SKILL.md](https://github.com/vercel-labs/skill-geist-learning-labs/blob/HEAD/skills/geist-learning-lab/SKILL.md) and quiz-assessment.md HintLadder section | Learning Loop: Orient, Attempt, Feedback, Explain, Extend, Checkpoint, Reflect. Rules: active attempt before explanation, every lesson has an attempt+feedback loop, specific feedback ("explain why"), misconception-first design, progress and review exist from day one, `aria-live` feedback focus, reduced-motion respect. Components: HintLadder, MistakeAnalyzer, ConfidenceRating, TaskRunner, SnippetCopy. Next.js-oriented, so adopt the ideas, not the code. |

Other candidates from the search (not read, so no verdict): samber/developer-relations-skills developer-education-strategy (12.7K), timini/drill-me (65), szeyu/vibe-study-skills computer-science-tutor (88), rodbv/socratic-skills guide-me (43). Nothing was installed.

## 6. Design recommendation for our app

Constraints: static React app; Pyodide runs the learner's Python in the browser; so we can run tests on their code locally. Caveat: in a static app hidden tests are only hidden from casual view (they ship in the bundle). That is acceptable: the goal is to stop reflexive copying, not to stop a determined cheater, and the learner is the only user.

### 6.1 Per-lesson (per-day) flow

Each day (30 of them) is split into 3-5 **concept blocks**. Each block runs this sequence (PRIMM + worked-example fading + retrieval):

1. **Hook / predict** (10-20 s): a 3-6 line snippet is shown. The learner commits to a prediction (multiple choice or typed output). Do this BEFORE the explanation. Nothing else is visible yet.
2. **Run and compare**: Run button executes in Pyodide; shows actual output beside the prediction; short "why" text appears after the learner has committed.
3. **Worked example**: the explanation plus a small annotated example. This is the only place complete code is shown, and it is short (under about 8 lines), one idea.
4. **Faded step A: fill-in / Parsons** (blanks in a working program, or ordering lines). Low typing, tests visible.
5. **Faded step B: modify** (change a working program to a new requirement; the starter code runs but fails the tests).
6. **Make: write against hidden tests**, with hint ladder and gated solution. Starter code is empty or a signature only.
7. **Explain/debug check** (once per day or per 2 blocks): a buggy snippet to fix, or "what does this do in plain words" with model answer revealed after submission.
8. **End of day: mixed retrieval quiz** (3-5 items, interleaved from today plus 1-2 from earlier days), closed-book (no lesson text visible).

What is hidden first: solutions, hidden tests, later hints, and the answer to the prediction. What is never copyable: the Make-step starter code is empty, and the worked example text is not offered via a "Copy" button (but selection is not fought; no anti-devtools tricks).

Day cadence: first sitting is learn + practice (blocks 1-8); a "review" queue (below) is separate and shorter, in line with "reviews shorter than new learning" ([memory-retrieval-learning](https://github.com/lyndonkl/claude/blob/HEAD/skills/memory-retrieval-learning/SKILL.md)).

Adaptive rule (expertise reversal): if the learner passes Make on the first try without hints, offer to skip the fade steps for that block; if they fail twice, insert an extra faded step.

### 6.2 Exercise data format (one JSON per day)

```json
{
  "day": 5,
  "title": "Lists",
  "blocks": [
    {
      "id": "d05-b2",
      "concept": "list-append",
      "tags": ["lists", "mutation"],
      "worked_example": {"code": "nums = [1,2]\nnums.append(3)\nprint(nums)", "notes": ["append changes the list in place"]},
      "exercises": [
        {
          "id": "d05-b2-e1",
          "type": "predict",
          "prompt": "What does this print?",
          "code": "nums=[1,2]\nnums.append(3)\nprint(len(nums))",
          "choices": ["2","3","[1,2,3]"],
          "expected_output": "3",
          "explanation": "len counts items after append.",
          "misconceptions": {"2": "append has already run before len is called."}
        },
        {
          "id": "d05-b2-e2",
          "type": "fill_blank",
          "prompt": "Add 10 to the end of prices.",
          "starter_code": "prices = [5, 7]\nprices.___(10)",
          "blanks": [{"answer": ["append"]}],
          "tests": [{"code": "assert prices == [5, 7, 10]"}]
        },
        {
          "id": "d05-b2-e3",
          "type": "parsons",
          "prompt": "Order the lines.",
          "lines": ["total = 0", "for n in nums:", "    total += n", "print(total)"],
          "correct_order": [0,1,2,3],
          "distractors": ["    total = n"]
        },
        {
          "id": "d05-b2-e4",
          "type": "modify",
          "prompt": "Change the program so it removes the first item instead.",
          "starter_code": "items = ['a','b']\nitems.append('c')",
          "tests": [{"code": "assert items == ['b']"}],
          "hints": ["Which list method removes by position?", "pop(0) removes index 0.", "items.pop(0)"],
          "solution": {"approach": "Use pop with an index.", "code": "items = ['a','b']\nitems.pop(0)"}
        },
        {
          "id": "d05-b2-e5",
          "type": "write",
          "prompt": "Write add_item(lst, x) that returns a NEW list with x added, without changing lst.",
          "starter_code": "",
          "signature": "def add_item(lst, x):",
          "tests": [
            {"code": "assert add_item([1],2)==[1,2]", "visible": true},
            {"code": "a=[1]; add_item(a,2); assert a==[1]", "visible": false, "failure_message": "You changed the original list."}
          ],
          "hints": ["Nudge: you need a copy first.", "Closer: lst + [x] or lst.copy().", "Full: ..."],
          "solution": {"approach": "...", "code": "def add_item(lst, x):\n    return lst + [x]"},
          "twin": "d05-b2-e6"
        },
        {
          "id": "d05-b2-e7",
          "type": "debug",
          "prompt": "This should print 6 but crashes. Fix it.",
          "starter_code": "nums=[1,2,3]\nprint(sum(nums)",
          "expected_output": "6",
          "hints": ["Read the first line of the error."]
        },
        {
          "id": "d05-b2-e8",
          "type": "explain",
          "prompt": "In your own words: why does append return None?",
          "model_answer": "append changes the list in place so it has nothing new to return.",
          "keywords": ["in place", "mutat"]
        }
      ]
    }
  ],
  "review_pool": ["d05-b2-e1", "d05-b2-e5"]
}
```

Field notes (design decisions, my inference):
- `type` is one of `predict | fill_blank | parsons | modify | write | debug | explain | type_it` (type_it: example hidden after first view, learner retypes; use only in the first week).
- `tests[].visible=false` are the hidden tests; every hidden test carries a `failure_message` so feedback is specific ("explain why", per geist-learning-lab rule 5 [P]).
- `misconceptions` map wrong answers or known failure patterns to a targeted message (futurecoder catches "common mistakes" [P]).
- `hints[]` is ordered pointing -> teaching -> bottom-out. `solution.approach` is shown before `solution.code`.
- `twin` is a near-identical exercise unlocked after a solution is revealed or after 3+ hints, so revealed solutions must be re-earned.
- `review_pool` items feed spaced review; each carries `concept` and `tags` for interleaving.
- Hidden-test runner: run learner code in a fresh Pyodide namespace with a timeout (worker); capture stdout; run each assertion; return the first failing `failure_message`. Never run tests as the learner sees code, so exceptions in tests do not leak test source unless `visible`.

### 6.3 Rewards (XP, streaks, spaced review) that reward the right behaviour

Principle (my inference, backed by the Duolingo critiques and help-abuse research above): pay for retrieval and independent production, not for time, clicks, or reading.

- **XP weights**: Make/write solved with no hints > with hints > after solution reveal (small, and no XP until twin is passed). Review items answered correctly after a gap > same-day repeats. Predict answered correctly BEFORE running > after. Reading and "next" buttons earn nothing.
- **Hints are free to open, but affect the mastery score** (count and display them, never shame them, as in HintLadder [P]); a clean first-try pass gives a bonus.
- **Streak**: define the daily goal as "one review session (3-5 items) OR one concept block", not "open the app". Provide freezes/forgiveness: Boot.dev's all-or-nothing weekly reset is a known drawback [P-snippet]; weekly goals (3 of 7 days) are gentler. Opinion-level evidence says shortest-lesson streak gaming is a real risk [S], so the streak requires a passing review, not a login.
- **Spaced review**: mastery score per concept (1-10). Use growing intervals, e.g. the coding-tutor skill's Fibonacci-like schedule (2 days at score 1, 13 at 5, 55 at 8) [P], or a simple Leitner box (1, 3, 7, 14, 30 days) [U]. Failed review moves the concept back a box. Retire after 5+ successful recalls (memory-retrieval-learning) [P]. Review sessions mix concepts across days (interleaving). Cap daily review length (about 5 minutes) so it stays a habit.
- **Progress display**: concepts mastered, days complete, and "due for review" count. No leaderboards, hearts, or cartoon mascots (Boot.dev itself reduced competition [P-snippet]).
- **Progress storage**: localStorage (per-learner, static app); export/import JSON for backup.

### 6.4 What to avoid

1. Showing the full solution code beside the exercise (the original complaint). Solutions only after attempts, staged.
2. Passive "read, then Next" pages with no retrieval ([Dunlosky 2013, re-reading rated low](https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html) [S of P]).
3. Jumping from fully worked code to a blank editor (use fading).
4. Pure "correct/incorrect" feedback; show output and diff ([ICER 2023 result](https://icer2023.acm.org/details/icer-2023-papers/33/Investigating-the-Impact-of-On-Demand-Code-Examples-on-Novices-Open-Ended-Programmin) [S]).
5. Over-fighting copy/paste (disabling selection, devtools tricks). Khan Academy's own experience shows limited value and easy bypass [P]; prefer pedagogical gating (empty Make editor, hidden tests, twin exercises).
6. Streaks that reward showing up, XP for time-on-page, hint-click penalties that discourage help-seeking (avoidance is also unproductive [S]).
7. Hidden-test-only failures with no message; a failing hidden test must say what went wrong without revealing the answer.
8. Making the interface itself hard (desirable difficulty must be productive, Bjork & Linn [P]).
9. Long walls of explanation per step; freeCodeCamp-style small steps (about 2 minutes) are a usable target [S].
10. Claiming fixed effect sizes in the UI copy or docs; evidence is mostly summaries (see labels).

### 6.5 Open questions / next checks

- Verify originals before quoting numbers: Ericson et al. 2017 abstract, Rohrer & Taylor 2007, Cepeda 2006, Slamecka & Graf 1978.
- Productive failure (Kapur) not sourced here.
- Codecademy, Brilliant, Boot.dev internals not sourced; do not describe them in product copy.
- Upstream everyinc coding-tutor SKILL.md path not found; I read a mirror.
- Decide: strict vs. gentle hint gating (suggest: all hints free, solution after 2 failed runs plus all hints, solution staged, twin required).
