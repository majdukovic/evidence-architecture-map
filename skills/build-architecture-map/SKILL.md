---
name: build-architecture-map
description: Use when someone wants a high-level architecture overview, system map, component diagram, onboarding guide or "how do our services talk to each other" document for one or more code repositories, in any language or git host, and it must be trustworthy enough for newcomers to treat as the source of truth.
---

# Build an evidence-grounded architecture map

## Overview

Produce a map of components, their connections and key flows where **every statement links to the line of code
that proves it**. Output: an interactive page (`architecture.html`) and `ARCHITECTURE.md`, built from JSON.

**Core principle: accuracy beats coverage.** A claim that cannot be pointed at in code is left out. Docs,
tickets, dashboards, chat and earlier AI sessions are hints for where to look, never evidence.

Bundled files (paths relative to this skill's folder, `${CLAUDE_SKILL_DIR}` in Claude Code):
`scripts/init.js`, `scripts/show.js`, `scripts/merge.js`, `scripts/build.js`, `scripts/verify.js`, `scripts/verify-ci.sh`,
`scripts/ui-audit.js`, `references/*.md`. Always run scripts through their interpreter: `node <skill-dir>/scripts/build.js ...`.

## Phase 0: Agree the scope (ask, do not assume)

Ask the user, in one message:
1. Which repos are in scope and where they are cloned (one folder of clones is easiest). Monorepo is fine. Libraries
   whose behaviour matters (a gateway, a resilience library) can be added as repos too.
2. Who the map is for, and the 3 to 6 flows a newcomer must understand first.
3. Which hint sources you may read: docs folders, agent instructions and history, wiki, tracker, dashboards,
   chat. See `references/context-sources.md`. Default: repos and their docs only.
4. Where the map folder should live (a docs repo, or a folder next to the clones) and its title.

Then `node <skill-dir>/scripts/init.js <map-dir> --title "<title>" --repos <clones-dir>`. Always pass `--repos`:
it records where the clones are (`reposDir` in `map.json`), and every later command depends on it.
Check each repo with `git -C <repo> rev-parse --verify origin/HEAD`; only if that fails, run
`git -C <repo> remote set-head origin -a` (it contacts the remote). Fetch only if the user agrees; in an unattended run,
do not fetch unless the prompt says so.

**Commands:** read code with `git -C <repo> show origin/HEAD:<path>` and `git -C <repo> grep -n -E '<p>' origin/HEAD -- <glob>`.
One simple command per call: no `cd`, no shell variables or `$(...)`, no long `&&` chains. Agent permission
systems block or prompt for commands they cannot vet, which stalls unattended runs.

## Phase 1: Discover (hints only)

Read `references/where-to-look.md`, `references/evidence-rules.md` and `references/data-format.md`.
For each repo, from the default branch with git: language and build, deployables, entry points, API
contracts, clients, messaging, datastores, deployment, CI. Add allowed hint sources. Write candidates to
`<map-dir>/review/discovery.md` (the `review/` folder is inside the map folder). Agree layer names and component ids before Phase 2.

## Phase 2: Draft claims with evidence

Split by repo group or domain and use parallel research agents with `references/research-brief.md` (or do it
yourself in slices). Have each write a fragment file, then combine them with
`node <skill-dir>/scripts/merge.js <map-dir> <fragment.json>...` (it reports id conflicts to resolve by hand, and rewrites the files as 2-space JSON, so edit them afterwards with a
JSON-aware tool or the Edit tool, not text replacement on old formatting). For bulk edits, write a small script to a
file and run `node <file>`; inline `node -e '...'` with braces is often blocked by permission checks.
To read a file with line numbers for exact quotes: `node <skill-dir>/scripts/show.js <repo-dir> <path> [from] [to]`.
Every item has evidence; payloads use real field names. Run `node <skill-dir>/scripts/build.js <map-dir> --pin`
early to catch format errors.

## Phase 3: Chain of Verification (do not skip)

Follow `references/cove-brief.md`. Use agents that can run `git` and `node` (a general-purpose agent, not a read-only one without a shell). **Run every
research, answering and review agent in the foreground and wait for its result before moving on.** Several can run in parallel in one turn, but do not end your turn while any is still
running: in non-interactive runs (`claude -p`, CI) background agents are stopped soon after your last turn, and
their work is lost.
1. Write neutral questions for every claim.
2. Answer them with **fresh agents that have not seen the draft**, from code only. If you cannot spawn agents,
   run the answering pass in a new session that has not seen the draft.
3. Reconcile: keep, fix or drop. Log in `review/verification.md`, drops in `review/dropped.md`.
4. Adversarial review with `references/review-brief.md` by another fresh agent. Apply what holds up.

## Phase 4: Build, verify, audit

```bash
node <skill-dir>/scripts/build.js <map-dir> --pin --verify     # must end "N/N references OK"
```
Fix every failure the verifier lists: re-read the code and update the claim, not just the line number.
Run the UI audit until `problems` and `consoleErrors` are empty: with the Playwright MCP (first `browser_run_code_unsafe` with
`async (page) => { await page.goto('file:///<map-dir>/architecture.html'); }`, then `browser_run_code_unsafe` with
`filename` set to `scripts/ui-audit.js`), or with
`node <skill-dir>/scripts/run-ui-audit.mjs <map-dir>` after `npm i -D playwright && npx playwright install chromium`
in your working folder. If neither is possible, say so in the hand-over; do not skip it silently.

## Phase 5: Hand over

Tell the user: what is on the map (counts), what was dropped and why, any committed secrets you noticed (file
path only), and how to keep it true: re-run `build.js --verify` after changes, schedule
`bash <skill-dir>/scripts/verify-ci.sh <map-dir>` in CI, use the `update-architecture-map` skill for edits.
Do not commit, push or publish unless asked.

## Common mistakes

| Mistake | Fix |
|---|---|
| Repeating what a wiki, README or old AI chat says ("X is legacy") | Hint only. Confirm in code or leave it out. |
| Reading the working tree, which is on a feature branch | `git show origin/HEAD:<path>`, always. |
| A client library in the build file taken as a connection | Need the call site and the line that targets the other component. |
| Payload fields from memory | Copy names from the DTO, case class, proto or schema; link it as `requestSchema`. |
| Verifier asked questions that contain the answer | Neutral questions; the answerer never sees the draft. |
| Fixing a failing reference by changing only the line number | Re-read: the code may have changed meaning. |
| Quoting a config line with a password next to it | Never. The verifier fails it; cite something else. |
| Mapping everything | 10 to 40 components and 3 to 8 flows is plenty for a newcomer. |
