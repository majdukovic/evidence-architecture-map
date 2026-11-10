# Dropped or not mapped

| Item | Why |
|---|---|
| "Webhooks API sends webhooks on product price change" | Handler is a no-op (`Webhooks.API/IntegrationEvents/ProductPriceChangedIntegrationEventHandler.cs:7`). Replaced by an explicit note that it is not implemented. |
| "Every service exposes /health" | Only in Development (`ServiceDefaults/Extensions.cs:115`). Narrowed. |
| "Every service uses service discovery and resilient HTTP clients" | Basket and OrderProcessor use the basic defaults only. Narrowed. |
| Evidence `.github/workflows/playwright.yml:36` for "AppHost started with HTTP endpoints" | Lines 37-38 hold test credentials; the verifier rejects nearby credentials. Fact narrowed to the `npm run test:e2e` line. |
| ClientApp (MAUI) and HybridApp components | Out of scope for the three requested flows (decision D2). ClientApp is the only caller of PUT /api/orders/cancel in the repo. |
| Tests per component / per flow (`tests`, `e2e/`) | Not read; no claim made. |
| Ship order flow | No caller of `PUT /api/orders/ship` found in the repo, so there is no flow to show. |
| `.github/skills/*` (Aspire/Playwright agent skills) | Not repo documentation of the system; not read (see discovery.md). |
| Absence claim "WebApp never reads a database itself" (components.json callout) | Absence claims need a search that would have found it; dropped per evidence-rules.md. |
