# Verification log

Method: Chain of Verification. Three research agents drafted claims (slices: gateway/customers/visits; platform/ops; vets/genai). The coordinator wrote neutral questions per topic (40 questions in 3 batches, none containing a claimed answer). Three fresh agents that had not seen the draft or the map folder answered them from origin/main only. Then two adversarial reviewers (see bottom). Mechanical check: `build.js --pin --verify`.

## Reconciliation of independent answers

| Topic (questions) | Independent answer vs draft | Action |
|---|---|---|
| UI owner page -> gateway endpoint, aggregation, fallback, DTO fields (A1-A4, A13) | Agrees: `GET /api/gateway/owners/{ownerId}`, controller aggregates customers + visits via `@LoadBalanced` WebClient; visits failure -> empty list; DTO fields match | Keep |
| Add visit: URL, verb, body, route, StripPrefix=2, Retry, 201, petId overwritten (A5-A7) | Agrees. Extra detail: default `Retry` filter retries POST once on 503 | Keep; retry detail added to the add-visit step description if the reviewers do not object |
| Gateway routes, other gateway clients (A9, A10) | Agrees: 4 routes, all `lb://`; routes live in the gateway module's own application.yml, not the config repo. Extra: an unused `@LoadBalanced RestTemplate` bean exists | Keep; the unused bean is not put on the map |
| Default datastores (A8, C11) | Agrees on schema/data scripts + `mysql` profile. Independent answer: "in memory" is Spring Boot's embedded default, not stated in code | Narrowed: wording changed from "HSQLDB in memory" to "embedded HSQLDB" everywhere; "uses MySQL only when" -> "switches to MySQL when" |
| Tests (A11, C10) | Agrees; no test covers POST visit; genai has none | Keep (add-visit test list left empty) |
| Config import, config server backend, Eureka registration, lb:// (B1-B4, B12) | Agrees | Keep |
| docker-compose services, order, healthchecks, ports (B5, B11) | Agrees | Keep |
| Prometheus targets, Grafana datasource (B6, B7) | Agrees (5 jobs incl. prometheus itself; 4 services scraped) | Keep |
| Zipkin export (B8) | Agrees; endpoint only under `docker` profile; admin/discovery/config have no zipkin dependency | Keep; connections say "for the docker profile" |
| Admin server finds apps (B9) | partial: only annotations/dependencies, library not read | Map claims only "is an Eureka discovery client"; no claim that it lists apps from Eureka |
| tracing-server in config repo (B13) | compose runs stock `openzipkin/zipkin`; tracing-server.yml not shown to be loaded by it | No claim that tracing-server.yml configures it (dropped, see dropped.md) |
| Vets route, endpoint, entity fields (C1, C2) | Agrees | Keep |
| Vets caching (C3) | DISAGREES in part: `production` profile is the active profile in vets-service application.yml, so caching is on by default; Caffeine is only a dependency, no code builds a Caffeine cache or applies ttl/heap-size | Fixed: vets-service callout, list-vets summary and two facts reworded; "Caffeine as the cache library" narrowed to "dependency" |
| GenAI request path, LLM provider, tools, vets via vector store, direct calls to customers via Eureka (C4-C9, C12, C13) | Agrees | Keep |

Two disagreements found in total (caching profile, "in memory"); both fixed above, neither needed a second question round because the independent evidence was explicit and checked by me against the cited lines.

## Mechanical check
`build.js --pin --verify` initially: 289/290 references OK. The failing one (vets-db citing a `jdbc:mysql://` line whose neighbours hold a credential) was dropped; see dropped.md.

## Adversarial review
Two fresh reviewers (components+connections; flows+facts) using review-brief.md. 21 findings, all applied or narrowed; none dropped outright.

| Item | Finding | Action |
|---|---|---|
| browser / api-gateway purpose | "serves the Vue UI" had no cited line | Added ApiGatewayApplication.java:66, :77; removed router.js:30 |
| vets-service callout, caching facts, list-vets summary | Caching presented as on; Docker image sets SPRING_PROFILES_ACTIVE=docker which overrides the production default | Reworded: on only under `production`, off in docker-compose; Dockerfile:14 cited. (This also corrects my first CoVe reconciliation, which had said "on by default".) |
| llm-provider | Compose env vars uncited | Added docker-compose.yml:85-87 |
| genai -> llm-provider "HTTPS" | Transport not shown by any line | Protocol changed to HTTP, wording "via Spring AI ChatClient (OpenAI starter)" |
| genai -> vets-service | Dormant by default (vectorstore.json committed) | Relabelled "dormant fallback"; startup listener line cited |
| config-server purpose | "Every service imports" overstated (optional outside docker profile) | Reworded with profile gating |
| tracing connections | Exporter and active profile not shown | Added zipkin starter pom lines and Dockerfile:14 |
| prometheus "every 15s" | Not on the cited lines | Removed |
| *-db "JDBC" | Embedded in-process DB | Wording "embedded, in-process HSQLDB" + hsqldb pom lines |
| config-repo evidence | Duplicate ref | Removed |
| chatbot flow | Body is a JSON string, not plain text; step 2 had payload; step 3 evidence did not show system text/tools; flow incomplete | Fixed payloads and evidence, "Example tool call" label. Missing LLM tool-call reply / owners response steps NOT added (no line shows them; left out on purpose) |
| owner-with-pets step 4 / schema | PetType has id in customers-service; responseSchema pointed at PetDetails | Example type now {id,name}; schema -> OwnerDetails |
| ports facts | Gateway 8080 not docker-gated | Reworded |
| HSQLDB fact | Cited lines did not show HSQLDB | hsqldb pom lines added; "no JDBC URL" softened |
| service-startup steps 9-10 | Eureka lookup is a background registry fetch, not a request/response | Response step removed; step relabelled "Fetch the registry" |

Final `build.js --pin --verify`: 316/316 references OK.
