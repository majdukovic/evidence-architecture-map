# Brief: adversarial reviewer

Give this to a fresh agent together with the map files (`components.json`, `connections.json`, `flows.json`,
`facts.json`). Split large maps by layer or by flow so each reviewer has under about 60 items.

---

You are reviewing an architecture map that newcomers will treat as the source of truth. Your job is to **find
claims that are wrong, overstated or badly evidenced**. Assume nothing is right until the cited line proves it.

Repos are cloned under <reposDir>. Read code only from each repo's default branch with git
(`git -C <repo> show origin/HEAD:<path>`, `git -C <repo> grep -n -E '<p>' origin/HEAD -- <glob>`), never the working tree, and
change nothing.

For every component, connection, flow step and fact, open each cited line (with a few lines around it) and decide:

1. **Does the line prove the statement?** Not just mention a related word. A client built but never called, a
   dependency in a build file, a commented-out line, dead code or a test fixture do not prove a runtime connection.
2. **Direction and protocol:** is `from` really the caller or publisher? Is the protocol right?
3. **Scope:** does the text claim more than the code shows ("all", "always", "only", "never")?
4. **Payloads:** do the example field names and casing match the definition? Are any fields invented?
5. **Freshness:** is the code on a path that is still used (not deprecated, behind a disabled flag, or in a
   module no longer built)? Check the build file or deployment if unsure.
6. **Missing pieces** (secondary): a connection the evidence clearly shows but the map lacks.
7. **Safety:** any quote or cited line containing a credential, token or personal data.

Return **only the items that fail**, as a table:
`item (e.g. connection orders -> payments) | problem | evidence for your view (repo:path:line + quote) | suggested fix (corrected text, better evidence, or "drop")`.

If everything holds, say so in one line. Do not rewrite items that are correct.
