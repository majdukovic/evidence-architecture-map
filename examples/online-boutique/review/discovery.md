# Discovery notes

Working notes, not claims. Everything here is a lead to check in code.

## Scope
- System: Online Boutique (GoogleCloudPlatform microservices-demo).
- Audience: newcomers who want to see how the demo shop's services fit together.
- Repos in scope: microservices-demo (`.repos/microservices-demo`, `origin/main`; Go, C#, Node.js, Java, Python; Docker images built by Skaffold).
- Deployment in scope: the default deployment from `kubernetes-manifests` (what Skaffold's `app` config deploys), plus the load generator.
- Optional variants: AlloyDB, Spanner and Secret Manager were first left out, then added as optional components after the adversarial review showed the shopping assistant cannot start without AlloyDB and Secret Manager, and the cart and catalogue services have optional AlloyDB and Spanner stores in code. Memorystore is only a different REDIS_ADDR value and the packaging service is not in this repo, so neither is a component.
- Kept although optional: the shopping assistant (and the Gemini API behind it). It is only deployed by the `shopping-assistant` kustomize component, but the frontend always registers `POST /bot`, requires `SHOPPING_ASSISTANT_SERVICE_ADDR` at start-up and calls the assistant over HTTP, so it is part of the frontend's real call graph.

## Hints from docs, tickets, dashboards, chat and agent history
| Hint | Source | Checked in code? |
|---|---|---|

## Candidate components
| Name | Repo | Kind (service, UI, job, datastore, broker, external) | Why it matters |
|---|---|---|---|

## Candidate flows
1.
