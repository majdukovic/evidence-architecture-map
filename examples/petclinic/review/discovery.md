# Discovery notes

Working notes, not claims. Everything here is a lead to check in code.

## Scope
- System: Spring PetClinic Microservices (Spring Boot / Spring Cloud, Maven multi-module)
- Audience: backend engineers new to the system
- Repos in scope (name, local path, default branch, language, build tool):
  - `spring-petclinic-microservices` - `../.repos/spring-petclinic-microservices` - origin/main - Java 17, Maven (root pom.xml, 9 service modules + docker/)
  - `spring-petclinic-microservices-config` - `../.repos/spring-petclinic-microservices-config` - origin/main - YAML only; served by the config server
- First flows requested: (1) UI page showing an owner and their pets via the API gateway; (2) adding a visit for a pet; (3) service start-up: config + discovery.

## Hints from docs, tickets, dashboards, chat and agent history
Only the repos' own docs were allowed (README.md, scripts/chaos/README.md, config repo README.md). Nothing else read.
| Hint | Source | Checked in code? |
|---|---|---|
| Config and Discovery must start before other apps | README.md "Starting services locally" | pending (docker-compose depends_on, bootstrap/import config) |
| Services: customers, vets, visits, genai, api-gateway, config, discovery (+ admin, tracing, prometheus, grafana) | README.md "Microservices Overview" / compose | pending |
| Config server serves the config repo; `native` profile + GIT_REPO | README.md | pending (config-server application.yml) |
| Gateway routes to services through Eureka (lb://) | README.md "Looking for something" | pending (api-gateway.yml in config repo) |
| Customers/Vets/Visits use HSQLDB by default, MySQL profile optional | README.md "Database configuration" | pending |
| Circuit breaker fallback in the gateway | README.md | pending |
| Frontend is Vue.js served as static files by the gateway | README.md | pending |
| Custom metrics @Timed on OwnerResource, PetResource, VisitResource | README.md | pending |
| `docs/microservices-architecture-diagram.jpg` | README.md (image) | not read: images are not evidence |

## Candidate components
| Name | Repo | Kind | Why it matters |
|---|---|---|---|
| api-gateway (+ Vue UI) | microservices | service/UI | Entry point, routing, aggregation of owner+visits |
| customers-service | microservices | service | owners, pets |
| visits-service | microservices | service | visits |
| vets-service | microservices | service | vets (cached) |
| genai-service | microservices | service | chatbot using LLM + calls the gateway/other services |
| config-server | microservices | infra | serves config from the config repo |
| discovery-server | microservices | infra | Eureka registry |
| admin-server | microservices | infra | Spring Boot Admin |
| tracing-server | microservices (compose) + config repo | infra | Zipkin |
| prometheus, grafana | microservices (docker/) | observability | metrics |
| config repo | config | config | per-service YAML |
| HSQLDB/MySQL per service | microservices | datastore | persistence |
| OpenAI / Azure OpenAI | external | external | LLM for genai |

## Candidate flows
1. Show owner and their pets in the UI (browser -> gateway -> customers [+ visits]).
2. Add a visit for a pet (browser -> gateway -> visits).
3. Service start-up: config import from config-server, Eureka registration, gateway lb:// routing.
(Optional 4. Chatbot; 5. vets list - only if budget allows.)

## Decisions log (non-interactive run)
- Phase 0 answers were supplied in the prompt; no questions asked.
- `git remote set-head origin -a` was run on both repos as the skill instructs. This contacts the remote (a read-only ls-remote-like call, not a fetch); origin/HEAD already resolved to main. Logged as a skill problem.
- Git reads use `git cat-file -p origin/main:<path>` (the harness asked for approval on `git show` and on shell variables/loops).
- Conservative choice: no browser-based UI audit claim is made unless Playwright actually runs.
