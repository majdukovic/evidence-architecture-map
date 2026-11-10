# Context sources: tools, ways of working, earlier AI sessions

Everything here is **optional** and only ever produces **hints** (see `evidence-rules.md`). Use what the user
has and agrees to; skip what is missing. Never install tools or connect accounts on the user's behalf.

## Ask first

Before reading anything outside the repos, ask the user which sources you may use. Offer the ones you can
detect (an MCP server, a CLI on `PATH`, a folder) and let them choose. Never read other people's private
messages, and never copy ticket, chat or customer content into the map.

## The team's own instructions to agents

These are usually the richest hint source and cost nothing:

- `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md`, `.claude/skills/*/SKILL.md`,
  `.claude/commands/*.md`, in each repo and in the user's home config (`~/.claude/CLAUDE.md`).
- Claude Code auto-memory, if the user has it: `~/.claude/projects/<project-folder>/memory/*.md`
  (the folder name is the project path with `/` replaced by `-`).
- Earlier Claude Code sessions: `~/.claude/projects/<project-folder>/*.jsonl`. Search them for component and
  topic names (`grep -l`, then read the matching lines) rather than reading whole transcripts. Treat what they
  say as an old opinion: the code may have changed since.

## Work trackers and wikis (Jira, Confluence, Linear, Notion, GitHub/GitLab issues, Azure Boards)

Use whatever access exists: an MCP server, a CLI (`gh`, `glab`, `az`, `jira`), or exported pages.

- Useful: architecture and design pages, ADRs, onboarding guides, epics that introduced a service, incident
  write-ups that name the components involved.
- Turn each into candidate components, connections and flows in `review/discovery.md`, with the page as the
  source. Then confirm in code.
- A page may be linked from a component under `links` (kind `doc` or `ticket`).

## Dashboards and monitoring (Grafana, Datadog, New Relic, Prometheus, Kibana)

- Service maps and dependency graphs show who calls whom **in production**. They are excellent leads for
  connections you might miss in code, and for components that are deployed but unused.
- Dashboard JSON or alert rules **committed to git** count as code evidence for facts.
- A dashboard per component is a good `links` entry (kind `dashboard`).

## Chat (Slack, Microsoft Teams, Discord)

- Only with the user's explicit agreement, and only channels they point you to (for example a team or
  platform channel).
- Good for names of components people actually use, and for "which flows confuse newcomers".
- Never quote chat on the map. A channel may be linked under `links` (kind `channel`).

## Ways of working

What a newcomer needs about how the team works goes in `facts.json`, each with code evidence:

| Fact | Typical evidence |
|---|---|
| Build tool and versions | `build.sbt` `scalaVersion`, `project/build.properties`, `.tool-versions`, `.nvmrc` |
| How code is tested in CI | the CI file's test step |
| How it is deployed and where | deployment manifests, CI deploy job, Helm chart, Terraform module |
| Where configuration comes from | config loading code, `application.conf` with `${?VAR}`, secrets manager client |
| Shared libraries and patterns | the shared module and two services that use it |
| Ownership | `CODEOWNERS` lines |
| Branching and release | CI triggers (`on: push: branches: [main]`), release job |

Leave out anything you can only find in a wiki or chat; mention it to the user instead.
