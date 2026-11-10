# Dropped claims

| Claim | Why dropped |
|---|---|
| vets-db: "a MySQL profile exists in the shared config" with evidence config repo `application.yml:100` (JDBC URL) | The verifier rejects the cited line because the following lines hold a plaintext credential. The MySQL profile is still evidenced for customers-db / visits-db through other lines. |
| vets-db callout: "docker-compose.yml starts no database container" | Absence claim; no search can prove it cleanly from one line. |
| Admin server discovers apps through Eureka | Only annotations/dependencies seen; the Spring Boot Admin library was not read. Map says only that admin-server is a Eureka client. |
| tracing-server.yml in the config repo configures the Zipkin container | Compose runs the stock `openzipkin/zipkin` image; nothing shows it loads the config repo file. |
| Tracing connections from admin-server / discovery-server / config-server | No zipkin dependency in their poms. |
| Which config-server backend (git vs native) compose uses | Compose sets no `native` profile or `GIT_REPO`; the default git URI is shown, but the choice in compose is inferred, so the flow says only what the config shows. |
| vets cache ttl / heap-size are applied by a Caffeine cache | No code consumes `VetsProperties`; only binding exists. |
| genai -> gateway or genai -> visits calls | Not found; genai calls customers directly via Eureka and (optionally) vets at startup. |
| genai addPetToOwner request payload | `PetRequest` fields not read; step not included. |
| Azure OpenAI as a provider | Starter is commented out in the pom; only OpenAI recorded. |
| Retry filter / unused RestTemplate bean as map items | Not needed by the first flows (retry mentioned in text only if reviewers allow). |
| Secrets noticed (path only) | Config repo `application.yml` (mysql profile credential); main repo `README.md` (MySQL root password in docker example). Not cited anywhere. |

## Update 2026-11-10

| Claim | Why dropped |
|---|---|
| Admin server finds the services it monitors through Eureka (hint 4) | The code shows only that admin-server is a Eureka client and ships `spring-boot-admin-starter-server`; no service has a `spring-boot-admin-client` dependency and no instance list is configured. That Spring Boot Admin builds its list from the discovery client is library behaviour; the library source is not in the cloned repos. Same reason as the earlier drop. The map still says only that admin-server is a Eureka client. |
| Chat memory is shared by all users (hint 5) | Nothing in the repo passes a conversation id, but what the memory then uses is the Spring AI default id, which was not read. Kept only the verified part (endpoint takes message text only, no id set) with an explicit "not checked" note. |
| "Every" breaker gets the 10 s limit through Resilience4j `configureDefault` semantics (hint 2, strong form) | The bean and the absence of any other limit are shown; that the default applies to every breaker id and that a timeout triggers the fallback is library behaviour. Wording uses "default" and "the only time limit configured". |
| Hint 3, "docker-compose has no MySQL container", as a bare absence claim | Rewritten as an enumeration of all eleven compose services with a line each. A search for `mysql` in docker-compose.yml found nothing (recorded in verification.md). |
| README text on running MySQL (`docker run ... mysql`, `ENV SPRING_PROFILES_ACTIVE docker,mysql`) as evidence | A README is a hint, and the docker example sits next to a root password. Not cited for the new facts. |
| The exact MySQL URL (`localhost:3306/petclinic`) in the config-repo callout and the Data fact | The only line that states it sits next to a committed credential, which the verifier refuses to link (an earlier draft cited a nearby line to get round this). Would be confirmed by: Configuration that sets the URL in a file without credentials |
| Reviewer hint: the default CircuitBreaker filter covers `/api/customer`, so owner/pet create and edit calls are subject to the 10-second limit and the 503 fallback (update 2026-11-10, hint 6) | Only the configuration part is on the map: `CircuitBreaker` is in `default-filters` (application.yml:10-14), the customers route lists only `StripPrefix=2`, the default customizer sets a 10 s limit (ApiGatewayApplication.java:84-88), `/fallback` accepts GET and POST and returns 503 (FallbackController.java:12-15), and nothing in the config repo overrides it. Dropped as claims: that default filters are applied to the customers route, that the default customizer governs the breaker, that a timeout triggers the fallback and that `forward:` keeps the method (all Spring Cloud Gateway / Resilience4j behaviour; the libraries were not cloned), and so the end-to-end "these calls time out after 10 s into a 503". The reviewer also found `/fallback` does not map PUT, so no 503 statement is attached to the PUT steps. "The only time limit configured" was removed: the search was too narrow to support an absence claim.. Would be confirmed by: Clone Spring Cloud Gateway and Spring Cloud CircuitBreaker at the versions of Spring Cloud 2025.1.0 and cite them |
| Whether all chat users share one memory | It depends on the Spring AI default conversation id, which is library behaviour outside these repos. Would be confirmed by: Clone Spring AI at the pinned version and cite its default |
