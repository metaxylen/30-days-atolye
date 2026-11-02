# Working in this repository

This repo holds the original 30 Days of Python course and **Atölye**, the interactive app built on it (`atolye/`, see `atolye/README.md`). The upstream repository is `https://github.com/metaxylen/30-days-atolye`; contributors work in their own fork.

## Every task follows this git flow

1. **Sync first.** Before reading or editing anything, make sure a remote named `upstream` points to `https://github.com/metaxylen/30-days-atolye.git` (add it if missing), then run `git fetch upstream` and start a new branch from `upstream/main`, e.g. `git switch -c <short-topic> upstream/main`.
2. **Finish with a pull request.** When the change is done and checked (below), commit on that branch, push it to your own fork (the remote pointing at your GitHub account; for the repository owner that is `upstream` itself), and open a pull request against `metaxylen/30-days-atolye` `main` with `gh pr create --repo metaxylen/30-days-atolye --base main`, filling in the PR template. `main` changes only through merged pull requests, so every push goes to the topic branch.

Tell the user the PR link at the end.

## Checks before the pull request

- `cd atolye && npm ci && npm run build` finishes without errors.
- If anything under `atolye/content/` changed, run the validators for those days from the repo root (setup: `python3 -m venv .venv && .venv/bin/pip install numpy pandas`): `atolye/content/tools/validate_cards_dXX-YY.py` and `validate_dXX-YY.py` must report 0 failures.
- The **Atolye check** workflow re-runs everything, including the end-to-end tests, on the PR; a red check means the PR is not ready.

## Content rules

- Every learner-visible text has a Turkish `*_tr` field and an English twin; keep both in step.
- Write new lesson or exercise content to the standard in `atolye/docs/briefs/content-master.md` (audience, Turkish terminology, mental models).
- Code samples must run offline in the browser (Pyodide): no `input()`, network or `pip`; numpy and pandas only on Days 24-25.
