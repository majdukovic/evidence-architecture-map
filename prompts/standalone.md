# Prompt: architecture overview with no kit (Markdown only)

For when you cannot install or clone anything. You get an `ARCHITECTURE.md` with Mermaid diagrams and evidence
links, but no interactive page and no automatic re-check. Replace the parts in `<...>`.

---

You are writing the architecture overview of <system> that <audience> will treat as the source of truth. Accuracy
beats coverage: a statement that you cannot point at in code does not go in.

**Sources.** Code in these repos, read only through git on each default branch, never the working tree:
<repos and where they are cloned>. Read with `git -C <repo> grep -n -E '<pattern>' origin/HEAD -- <glob>` and
`git -C <repo> show origin/HEAD:<path>`. Do not checkout, pull, edit or commit anything. You may also
read <docs, wikis, tickets, dashboards, chat, earlier agent sessions the user allows>, but only as hints for where
to look: never state something because a document, ticket, chat or earlier session says it.

**Evidence.** Each statement carries one or more references: `repo:path:line` plus an exact quote of 10 to 60
characters from that line. A connection between two components needs the call site and the line that points it
at the other component (config, URL, topic name); a library in a build file is not enough. Payload examples use
the real field names from the class, schema or proto, with made-up values. Never quote or link a credential,
token or personal data.

**Method (Chain of Verification).**
1. Discover: list the deployable components, their entry points, what they expose, what they call, what they
   publish and consume, and where they store data.
2. Draft: components (purpose, exposes, stores), connections (from, to, protocol, what, evidence), the <3 to 6>
   flows a newcomer needs first (step by step, with request and response), and a few facts about how the system
   is built and shipped, each with evidence.
3. Verify: write neutral questions for every claim (questions that do not contain the claimed answer). Have them
   answered from the code by sub-agents that have not seen your draft, or in a fresh session if you cannot start
   sub-agents. Keep claims the answers confirm, correct the ones they correct, and drop the rest.
4. Review: have another fresh agent try to disprove every remaining claim by opening each cited line. Apply what
   holds up.
5. Check mechanically: for every reference, run `git show <branch>:<path> | sed -n '<line>p'` and confirm the
   quote is in it. Fix or drop failures.

**Output.** `ARCHITECTURE.md` with: a short intro; a Mermaid `flowchart` of components grouped by layer with
protocol-labelled arrows; a section per component; a connections table; a section per flow with a Mermaid
`sequenceDiagram` and numbered steps; facts; and, at the end, the commit SHA of each repo you read. Every
reference is a link to the file at that commit and line (for GitHub
`https://github.com/<org>/<repo>/blob/<sha>/<path>#L<line>`). Then list for me, separately, what you dropped and
why, and any committed secrets you noticed (file path only).
