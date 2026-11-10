# Brief: research agent (drafting claims)

Copy this brief into each research agent's prompt, then add its slice (the repos or the domain it covers)
and the list of component ids already agreed, so agents use the same ids.

---

You are mapping part of a software system so newcomers can trust the result. Your job is to **draft claims with
evidence** for the slice below. Another agent will later try to disprove every claim, and a script will check
every quote, so only write what you can point at.

**Slice:** <repos / domain>
**Repos are cloned under:** <reposDir>. **Known component ids:** <ids>

## How to read code

- Only from each repo's default branch, with git, never the working tree:
  `git -C <repo> grep -n -E '<pattern>' origin/HEAD -- '<glob>'`, `git -C <repo> show origin/HEAD:<path>`.
  One simple command per call: no `cd`, no shell variables.
- Never checkout, reset, stash, pull or edit anything.
- Search hints by ecosystem: `<skill-dir>/references/where-to-look.md`. Evidence rules:
  `<skill-dir>/references/evidence-rules.md`. Read both first.

## What to produce

Write JSON fragments in the formats of `<skill-dir>/references/data-format.md`:

1. **Components** in your slice: `id`, `label`, `short`, `layer`, `repo`, `purpose` (one or two plain
   sentences), `exposes`, `stores`, `evidence`.
2. **Connections** in and out of your slice: direction is caller/publisher -> callee/consumer. Each needs the
   call site **and** the line that points it at the target (config, URL, topic name). Cite both ends when they
   are in different repos.
3. **Flow steps** if asked: real field names from the DTO / case class / proto, made-up values, at most about
   10 fields, `requestSchema` / `responseSchema` pointing at the definition.
4. **Facts** about how the slice is built, configured and shipped, if clearly shown in code.

Every evidence item is `{ "ref": "repo:path:line", "quote": "<exact substring of that line, 10 to 60 chars (the build accepts 4 to 120)>" }`.
Copy the quote from the line as printed by `node <skill-dir>/scripts/show.js <repo-dir> <path> <from> <to>` (numbered
lines from `origin/HEAD`), never from memory. Write your result to a fragment file (`{ "components": [...],
"connections": [...], "flows": [...], "facts": [...] }`) so the coordinator can merge it with `merge.js`.

## Also report

- **Not confirmed:** things you expected (from docs or names) but could not find in code, and what you searched.
- **Surprises:** anything a newcomer would get wrong (a service that looks central but is unused, a
  misleading name, an unexpected direction).
- **Secrets:** if you see a committed credential, give only the file path, never the value.

Do not invent ids for components outside your slice: name them in prose and the coordinator will match them.
Keep your answer to the JSON fragments plus those three short lists.
