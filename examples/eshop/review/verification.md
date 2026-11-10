# Verification log

Method: Chain of Verification. Three fresh agents answered neutral questions from code only (they never saw the draft): A) catalog / basket / web / auth / BFF (10 questions), B) ordering lifecycle and events (12 questions), C) infra, webhooks, CI, outbox (11 questions). Then one adversarial reviewer (see end) and `build.js --verify`.

| Area | Result |
|---|---|
| WebApp -> Catalog (path, params, API v2.0, response shape, pictures) | Agreed (A Q1-Q3). Added nuance: v2 list query includes CatalogBrand not CatalogType (not put on map; no claim made). |
| Basket gRPC contract, Redis key, anonymous GetBasket vs unauthenticated Update | Agreed (A Q4-Q6). |
| Basket consumes OrderStarted | Agreed (A Q7, B Q10). |
| mobile-bff routes catalog/ordering/identity, no basket | Agreed (A Q8). |
| DB / store per service | Agreed (A Q9, C Q1/Q2). |
| Token authority (Basket, Ordering, Webhooks use Identity; Catalog does not) | Agreed (A Q10). |
| Checkout call, x-requestid, basket deleted twice (gRPC by WebApp and via event) | Agreed (B Q1). Both deletions are on the map. |
| Order created Submitted, events written to outbox then published after commit | Agreed (B Q2, C Q9). |
| Idempotency | Agreed (B Q3). |
| Grace-period worker, SQL, defaults 1 min / 30 s | Agreed (B Q4, C Q10). |
| Status transitions in Order aggregate | Agreed (B Q5); flow only claims the Submitted -> AwaitingValidation -> StockConfirmed -> Paid path plus cancel paths. |
| Ordering publishes / subscribes list | Agreed (B Q6, C Q3). |
| Catalog stock check / stock removal on Paid | Agreed (B Q7). |
| Payment simulated by config flag | Agreed (B Q8). |
| Exchange eshop_event_bus, direct, routing key = class name | Agreed (B Q9). |
| WebApp and Webhooks subscriptions | Agreed (B Q10, C Q3). |
| **Webhooks API sends a webhook on price change** | **DISAGREED by C Q4/Q6**: handler returns Task.CompletedTask. I confirmed in `ProductPriceChangedIntegrationEventHandler.cs:7`. FIXED: component purpose, callout, connection text now say Paid/Shipped only; price-change handler is a no-op. |
| **Services expose /health via ServiceDefaults** | **Overstated** (C Q7): only in Development. FIXED in facts. |
| **Discovery and resilience apply to all services** | **Overstated** (C Q7): Basket and OrderProcessor call AddBasicServiceDefaults. FIXED: facts scoped to AddServiceDefaults users. |
| Stock rejected path | B Q11: Cancelled without any cancelled event. ADDED to flow step description. |
| Cancel/ship callers | B Q12: WebApp cannot cancel/ship; only the MAUI ClientApp calls cancel; no caller of ship. Flow summary already says WebApp only creates and lists. ClientApp not mapped (D2). |
| Playwright workflow contents | C Q8 partial; map only claims that CI runs `npm run test:e2e` (line 34, read directly). |

Casing note: JSON examples use the C# property names (PascalCase) for HTTP/event payloads; actual wire casing was not verified by any agent (A Q2). The flow step says so ("shown as declared in the C# classes").

## Adversarial review (fresh agent, run in the foreground on the second attempt)
First attempt was killed by the harness (background agent stopped after the turn ended); re-run to completion. Findings applied: (1) ordering-api purpose said "each change is published" -> "most" (stock-rejection cancel publishes nothing); (2) stock-rejection claim now cites Order.cs:155; (3) webapp->ordering-api now cites GetOrders and the list route; (4) catalog-api->rabbitmq and ordering-api->rabbitmq now cite each event's creation line; (5) browse flow: removed the unproven "no signed-in user needed" claim; (6) migrations fact scoped to Catalog/Ordering/Webhooks with the dev-convenience comment; (7) basket-delete step notes publish happens inside the request; (8) mobile-bff api-version note. Finding "webapp->identity: authorization code flow" fixed by dropping the wording, because the only proving line (ResponseType) sits next to a hard-coded client secret, which the verifier rejects. Not done: separate flows for shipping/cancel, webhooks registration and identity sign-in (out of the requested scope).

Mechanical: `build.js --pin --verify` -> 203/203 references OK.
