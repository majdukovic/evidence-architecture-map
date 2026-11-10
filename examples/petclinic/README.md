# Example: Spring PetClinic Microservices (Java, two repos)

A map of [spring-petclinic-microservices](https://github.com/spring-petclinic/spring-petclinic-microservices)
together with its configuration repo,
[spring-petclinic-microservices-config](https://github.com/spring-petclinic/spring-petclinic-microservices-config):
Spring Cloud Gateway, Eureka discovery, a config server, Resilience4j, Zipkin, Prometheus and Grafana, and a Spring AI
chat service.

Built by an unattended `claude -p` run that had only this plugin and the prompt in
[`prompts/build-map.md`](../../prompts/build-map.md), with the scope answers filled in. Nobody steered it.

| | |
|---|---|
| Map | 17 components, 35 connections, 5 flows (32 steps), 31 facts, across 2 repos |
| Evidence | 316 references, all OK on `main` |
| CoVe | 40 neutral questions answered by agents that never saw the draft |
| Adversarial review | 21 findings, applied or narrowed (for example, vets caching is off under docker-compose) |
| Independent spot-check (30 sampled claims) | 28 correct, 2 minor, 0 wrong; the 2 minor ones were then fixed |
| Cost | about USD 6 |

Things the spot-check said a newcomer would still want, left for a later update: a flow for creating and editing
owners and pets, the gateway's 10-second circuit-breaker timeouts, the shared `petclinic` database under the `mysql`
profile, and how the admin server finds the services.

Check it yourself:

```bash
git clone --depth 1 https://github.com/spring-petclinic/spring-petclinic-microservices .repos/spring-petclinic-microservices
git clone --depth 1 https://github.com/spring-petclinic/spring-petclinic-microservices-config .repos/spring-petclinic-microservices-config
node ../../skills/build-architecture-map/scripts/verify.js .
```

Both repos are Apache License 2.0; the map quotes short excerpts and links to them at fixed commits.
