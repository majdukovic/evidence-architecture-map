# evidence-architecture-map

Architecture maps that newcomers can trust. **Every component, connection, flow step and fact on the map links to
the line of code that proves it**, and a script re-checks every link against your repos.

You point a coding agent (Claude Code, or any agent that can run shell commands) at your repositories. It
discovers the components and how they talk, drafts claims with evidence, checks them with **Chain of
Verification** (independent agents that never saw the draft answer neutral questions from the code), has another
agent try to disprove what is left, and builds:

- **`architecture.html`**: one self-contained interactive page with a layered map, step-by-step flows with real
  request and response shapes, a searchable component list, and shareable links to every component and step.
- **`ARCHITECTURE.md`**: the same content with Mermaid diagrams, readable on GitHub, GitLab, Bitbucket and Azure DevOps.

Anything the code cannot confirm is left out and recorded in `review/dropped.md`. It works for any language and any
git host, including monorepos.

See the demo: [`examples/online-boutique`](examples/online-boutique), a map of Google's
[Online Boutique](https://github.com/GoogleCloudPlatform/microservices-demo) microservices demo
(17 components, 25 connections, 3 flows, 411 checked references).

![Map view: a component card with its connections and evidence](docs/map.png)
![Flow view: a step with its request payload and the definition it comes from](docs/flow.png)

## Why

Architecture docs drift, and AI-written docs repeat whatever the wiki, the README or an old chat said. This kit
treats those as **hints for where to look**, never as evidence. Accuracy beats coverage: a smaller map that is
right is worth more than a complete one that is half wrong.

## Install

**Claude Code plugin**

```
/plugin marketplace add majdukovic/evidence-architecture-map
/plugin install evidence-architecture-map@evidence-architecture-map
```

Then ask, for example: *"Build an architecture map of the repos in ~/code/acme for new backend engineers"*, or run
`/evidence-architecture-map:build-architecture-map`. To change an existing map, ask to update it, or run
`/evidence-architecture-map:update-architecture-map`.

**Claude Code without the plugin system:** copy `skills/build-architecture-map` and `skills/update-architecture-map`
into your project's `.claude/skills/` (or `~/.claude/skills/`).

**Any other agent:** clone this repo and use a prompt from [`prompts/`](prompts):
[`build-map.md`](prompts/build-map.md), [`update-map.md`](prompts/update-map.md), or
[`standalone.md`](prompts/standalone.md) when you cannot run the kit's scripts at all (Markdown output only).

**Requirements:** git and Node.js 18 or newer. No npm packages. Optional: Playwright, for the UI audit.

## How it works

| Phase | What happens | Where it is defined |
|---|---|---|
| 0. Scope | The agent asks which repos, for whom, which flows matter, and which other sources it may read | `SKILL.md` |
| 1. Discover | Reads each repo's default branch through git (never your working tree); collects hints | [`where-to-look.md`](skills/build-architecture-map/references/where-to-look.md), [`context-sources.md`](skills/build-architecture-map/references/context-sources.md) |
| 2. Draft | Research agents write components, connections, flows and facts, each with evidence | [`research-brief.md`](skills/build-architecture-map/references/research-brief.md), [`evidence-rules.md`](skills/build-architecture-map/references/evidence-rules.md) |
| 3. Verify | Neutral questions answered by agents that have not seen the draft; then an adversarial review | [`cove-brief.md`](skills/build-architecture-map/references/cove-brief.md), [`review-brief.md`](skills/build-architecture-map/references/review-brief.md) |
| 4. Build and check | `build.js` validates the data and builds the page; `verify.js` checks every quote is still on its line | [`scripts/`](skills/build-architecture-map/scripts) |
| 5. Keep it true | Re-run the check in CI; the update skill handles changes | [`examples/ci/`](examples/ci) |

Evidence is `repo:path:line` plus an exact quote from that line:

```json
{ "ref": "orders-service:src/main/scala/acme/orders/PaymentsClient.scala:31", "quote": "uri\"$paymentsUrl/charges\"" }
```

Links open the code at the commit that was checked (recorded in `pins.json`), so they keep working after the code
moves on. The verifier reads the **current** default branch, so it fails when the code changes under the map.

## Use with your tools

The skill asks before reading anything outside the repos, and uses whatever access you already have (MCP
servers, CLIs such as `gh`, `glab`, `az` or a Jira CLI, or exported pages):

- **Jira, Confluence, Linear, Notion, issues:** candidate components and flows; pages can be added as related links.
- **Grafana, Datadog, Prometheus:** service maps are good leads for connections; dashboards become related links.
  Dashboards and alert rules kept in git count as evidence.
- **Slack, Teams:** only channels you point to, as hints. Never quoted on the map.
- **`CLAUDE.md`, `AGENTS.md`, agent memory and earlier sessions:** good hints for where to look, checked against
  today's code before use.

Related links on the page are labelled as not evidence and are never checked.

## The scripts

```bash
K=skills/build-architecture-map/scripts
node $K/init.js docs/architecture-map --title "Acme Platform Map" --repos ~/code/acme   # new map folder
node $K/build.js docs/architecture-map --pin --verify   # pin commits, build, check every reference
node $K/build.js docs/architecture-map --verify         # rebuild after edits
node $K/verify.js docs/architecture-map [--at pinned] [--json]
bash $K/verify-ci.sh docs/architecture-map              # clone the cited repos shallowly and check (CI)
node $K/run-ui-audit.mjs docs/architecture-map          # click through every component and step (needs Playwright)
node test/run-tests.js                                  # the kit's own tests
```

The build refuses: components, connections, steps or facts without evidence; unknown ids; malformed references;
quotes that look like credentials; references to files that usually hold secrets (`.env`, keys, `credentials`,
`secrets.yaml`); and HTML that could run script. The verifier also fails a reference whose surrounding lines look
like a credential, so the page never links to one.

The data format is described in [`data-format.md`](skills/build-architecture-map/references/data-format.md).

## Limitations

- The verifier proves a quote is still on the cited line. Whether the line **means** what the claim says is
  checked by the independent agents and the reviewer, not by a script. Expect them to reduce errors, not to
  remove every one. Read the map critically and report what is wrong.
- Wiring that only exists at runtime (service mesh rules applied by hand, feature flags in a SaaS console) cannot
  be proven from code and is left out unless it is in git.
- A full run on a large system uses many agent calls. Start with the flows that matter most.

## Licence

MIT, see [LICENSE](LICENSE). The demo quotes short excerpts from
[GoogleCloudPlatform/microservices-demo](https://github.com/GoogleCloudPlatform/microservices-demo)
(Apache License 2.0) and links to it at a fixed commit.
