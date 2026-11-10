# Prompt: build an evidence-grounded architecture map

Use this with Claude Code without the plugin, or with any coding agent that can run shell commands and
(ideally) start sub-agents. Replace the parts in `<...>`, then paste it.

---

Build an evidence-grounded architecture map of <system name> for <audience, e.g. engineers joining the team>.

Use the kit at <path to a clone of evidence-architecture-map> (clone https://github.com/majdukovic/evidence-architecture-map
if it is not there). Read `plugin/skills/build-architecture-map/SKILL.md` and follow it phase by phase; its
`references/` and `scripts/` folders are the method and the tools. `<skill-dir>` in those files means
`plugin/skills/build-architecture-map` inside the kit.

Inputs:
- Repos: <list, or "every repo cloned under ~/code/acme">. Read them only through git on each default branch.
- First flows to explain: <e.g. sign-up, place an order, nightly settlement>.
- Hint sources you may use: <e.g. the repos' docs folders and CLAUDE.md files, Confluence space ARCH via the
  MCP server, the Grafana service map>. Nothing else.
- Put the map folder at: <path>.

Ground rules: every statement on the map needs a `repo:path:line` reference plus a quote from that line, checked
by the kit's verifier; anything you cannot confirm in code is left out and listed in `review/dropped.md`;
verification uses Chain of Verification with agents that have not seen the draft. Ask me before fetching repos,
reading any source outside the repos, committing or publishing.
