---
name: update-architecture-map
description: Use when an existing evidence-grounded architecture map (a folder with components.json, connections.json, pins.json and a generated architecture.html) must change because a service was added, removed or renamed, a call, topic, endpoint or payload changed, someone reports the map is wrong, or build.js --verify or the scheduled CI check reports failing references.
---

# Update an architecture map

The map must stay true to the code: every statement points at a line on the default branch. If you cannot point
at it, leave it out. The HTML and Markdown are generated; edit only the JSON (and `intro.html` / `about.html`).

The scripts and rules live in the `build-architecture-map` skill folder, next to this one
(`${CLAUDE_SKILL_DIR}/../build-architecture-map` in the plugin; `<build-skill-dir>` below): `scripts/build.js`, `scripts/verify.js`,
`references/evidence-rules.md`, `references/data-format.md`, `references/where-to-look.md`,
`references/review-brief.md`. Read the evidence rules first. Run scripts with `node`; `scripts/show.js <repo-dir> <path>
[from] [to]` prints a file from the default branch with line numbers, for exact quotes. Read code with
`git -C <repo> show origin/HEAD:<path>`, one simple command per call, and wait for any review agent to finish before
ending your turn.

## 1. Baseline

Fetch the cited repos if the user agrees (`git -C <repo> fetch -q origin`; the list is in `pins.json`); in an unattended
run, do not fetch unless the prompt says so. Then:

```bash
node <build-skill-dir>/scripts/verify.js <map-dir> [--repos <dir>]     # what has drifted already; --repos if map.json's reposDir is wrong here
```

## 2. Make the change

| Case | What to do |
|---|---|
| `quote is on line N` (note) or `quote moved to line N` | Check the line still means the same, then update the line number. |
| `quote not found` / `file not on the default branch` | The code changed. Re-read it and update the statement **and** its evidence together, or drop the statement. |
| New component | Add it to `components.json` with evidence; add every connection in **and** out (callers' clients, gateway routes, topic consumers); add tests and links if useful; add flow steps if it joins a flow. |
| Changed connection, endpoint, topic or payload | Update the connection and every flow step that uses it; payload field names from the definition. |
| New or changed flow | Steps `req` / `res` / `async` / `self`, every actor listed, evidence per step, `requestSchema` / `responseSchema` where a definition exists, a test in `tests` if one really exercises it. |
| Component removed or renamed | Update `components.json`, every connection, every flow's `actors` and steps. The build fails on dangling ids. |
| "The map is wrong" report | Treat the report as a hint. Check the code; fix or drop the claim; never change a claim only because someone said so. |

## 3. Independent review (do not skip)

Give the new and changed items to a fresh agent that can run `git` (not a read-only agent without a shell) with
`references/review-brief.md`, and wait for its result. It did not write them and must
decide from code alone whether each cited line proves the statement. Apply its corrections. Add rows to
`<map-dir>/review/verification.md` and drops to `<map-dir>/review/dropped.md`.

## 4. Build and verify

```bash
node <build-skill-dir>/scripts/build.js <map-dir> --verify          # all references OK on the current pins; fix every "note" on a line you edited
node <build-skill-dir>/scripts/build.js <map-dir> --pin --verify    # move every link to today's default branch
```

Run the UI audit as the build skill describes (Playwright MCP with a `file://` page, or `scripts/run-ui-audit.mjs` with
Playwright installed in your folder); if neither is possible, say so in your report. Summarise for the user what changed, how many
references pass, what the review corrected and what was dropped. Commit only when asked.
