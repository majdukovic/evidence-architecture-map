# Evidence Architecture Map

Architecture maps that newcomers can trust. This plugin has Claude map how the components of your system fit
together and talk to each other, and **every component, connection, flow step and fact on the map links to the line of
code that proves it**. Claims that cannot be confirmed in code are left out.

Claude reads your repositories through git on their default branches (any language, any git host, monorepos too),
drafts claims with evidence, checks them with Chain of Verification (independent agents that never saw the draft
answer neutral questions from the code), has another agent try to disprove what is left, and runs a script that
re-checks every quote. The result is an interactive page, `architecture.html`, and an `ARCHITECTURE.md` with Mermaid
diagrams.

## Install

In Claude Code:

```
/plugin marketplace add majdukovic/evidence-architecture-map
/plugin install evidence-architecture-map@evidence-architecture-map
```

## Skills

- **build-architecture-map**: ask "Build an architecture map of the repos in ~/code/acme for new backend engineers".
  Claude agrees the scope with you first: which repos, for whom, which flows matter, and which other sources it may
  read.
- **update-architecture-map**: keeps an existing map true when the code changes or someone reports a mistake.

Requirements: git and Node.js 18 or newer. Playwright is optional, for the UI audit.

## What the plugin runs and sends

- **Runs locally:** read-only `git` commands on the repos you point it at (`git show`, `git grep`, `git ls-tree`; never
  `checkout`, `pull` or `push`) and `node` for the bundled scripts. No hooks, no MCP servers, no package installs.
- **Writes:** only the map folder you choose.
- **Network:** the bundled scripts make no network calls, except `verify-ci.sh`, which clones the repos listed in the
  map's `pins.json` from your own git host when you run it in CI. The generated page is self-contained and loads
  nothing from the internet.
- **Other sources:** docs, tickets, dashboards, chat or agent history are read only when you allow it, through tools
  you already have, and only as hints. Their content is never copied onto the map.
- **Personal data:** none is collected or sent anywhere. Evidence quotes are short excerpts of your code, and the
  build and verifier refuse anything that looks like a credential.

Documentation, examples (Online Boutique, eShop, PetClinic, Bootzooka) and CI recipes:
https://github.com/majdukovic/evidence-architecture-map

MIT licence.
