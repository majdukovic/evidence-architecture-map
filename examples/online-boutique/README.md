# Demo: Online Boutique

A map of Google's [Online Boutique](https://github.com/GoogleCloudPlatform/microservices-demo) (microservices-demo),
built with this kit by following `skills/build-architecture-map/SKILL.md` end to end.

- `architecture.html`: the interactive page (download it and open it in a browser, or serve this folder).
- `ARCHITECTURE.md`: the same content with Mermaid diagrams.
- `review/`: the Chain of Verification log (`verification.md`), scope notes (`discovery.md`) and dropped claims.

## What verification changed

| Pass | Result |
|---|---|
| Draft (2 research agents) | 14 components, 18 connections, 3 flows, every quote checked mechanically |
| CoVe: 108 neutral questions answered by 3 agents that never saw the draft | 98 claims kept, 10 corrected (overstated scope, a wrong CI fact, deployment details) |
| Adversarial review (2 fresh agents) | 10 more fixes, for example: the payment service logs full card details (the draft said nothing is recorded); example money amounts did not match the currency service's arithmetic; a missing call in the place-order flow; AlloyDB and Secret Manager are required by the shopping assistant |
| Final | 17 components, 25 connections, 3 flows (37 steps), 411/411 references OK, UI audit clean |

## Check it yourself

```bash
git clone --depth 1 https://github.com/GoogleCloudPlatform/microservices-demo .repos/microservices-demo
node ../../skills/build-architecture-map/scripts/verify.js .            # against today's main: shows any drift
git -C .repos/microservices-demo fetch --depth 1 origin "$(node -p 'require("./pins.json").repos["microservices-demo"].sha')"
node ../../skills/build-architecture-map/scripts/verify.js . --at pinned   # against the commit it was built from
```

Quotes are short excerpts from microservices-demo, which is licensed under the Apache License 2.0.
