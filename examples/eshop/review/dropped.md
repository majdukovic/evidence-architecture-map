# Dropped or not mapped

| Item | Why |
|---|---|
| "Webhooks API sends webhooks on product price change" | Handler is a no-op (`Webhooks.API/IntegrationEvents/ProductPriceChangedIntegrationEventHandler.cs:7`). Replaced by an explicit note that it is not implemented. |
| "Every service exposes /health" | Only in Development (`ServiceDefaults/Extensions.cs:115`). Narrowed. |
| "Every service uses service discovery and resilient HTTP clients" | Basket and OrderProcessor use the basic defaults only. Narrowed. |
| Evidence `.github/workflows/playwright.yml:36` for "AppHost started with HTTP endpoints" | Lines 37-38 hold test credentials; the verifier rejects nearby credentials. Fact narrowed to the `npm run test:e2e` line. |
| ClientApp (MAUI) and HybridApp components | Were out of scope for the three requested flows (decision D2). Added on 2026-11-10 as components with connections to Mobile BFF and (ClientApp) Basket API after a reviewer's hint was confirmed in code. Still no flow for them. |
| "The Mobile BFF listens on port 11632" (implied by hint 4) | No code fixes the BFF's port: the AppHost only calls `AddYarp("mobile-bff").WithExternalHttpEndpoints()`. The apps' default `:11632` and HybridApp's constant `MobileBffHost` are the only links, so the connection text says the match is by default setting, not by the AppHost. |
| Hint "the apps are the *real* users of the mobile BFF" | Narrowed: the repo shows both apps calling the BFF routes, but "real users" is not provable from code. The map says "callers in the repo". ClientApp reaches Identity directly (default `:5243`), not through the BFF's /identity route, so no ClientApp -> BFF identity claim was made. |
| "Failed outbox events are never retried" (absolute wording) | Rewritten as what the code shows: pending events are read only when `NotPublished` for the current transaction, so nothing here re-reads `PublishedFailed`. No search can prove that nothing outside `src/` retries, so "never" was not used. |
| "Catalog write endpoints have no authentication" (absolute wording) | Kept, scoped to code: write routes carry no authorization requirement and `Catalog.API` has no authentication/authorization setup (a search of `src/Catalog.API/**/*.cs` for authenticat/authoriz found nothing). Deployment-level protection outside the repo is not covered. |
| Tests per component / per flow (`tests`, `e2e/`) | Not read; no claim made. |
| Ship order flow | No caller of `PUT /api/orders/ship` found in the repo, so there is no flow to show. |
| `.github/skills/*` (Aspire/Playwright agent skills) | Not repo documentation of the system; not read (see discovery.md). |
| Absence claim "WebApp never reads a database itself" (components.json callout) | Absence claims need a search that would have found it; dropped per evidence-rules.md. |
