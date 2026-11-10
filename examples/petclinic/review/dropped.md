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
