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
| Map | 17 components, 35 connections, 7 flows (57 steps), 34 facts, across 2 repos |
| Evidence | 452 references, all OK on `main` |
| CoVe | 40 neutral questions answered by agents that never saw the draft |
| Adversarial review | 21 findings, applied or narrowed (for example, vets caching is off under docker-compose) |
| Independent spot-check (30 sampled claims) | 28 correct, 2 minor, 0 wrong; the 2 minor ones were then fixed |
| Update run (`update-architecture-map`, unattended) | 4 of the 5 gaps the first spot-check found were added; how the admin server finds services was dropped (it is library behaviour outside these repos) |
| Spot-check of the 23 added statements | 22 correct, 1 minor, 0 wrong; the minor one was then fixed |
| Cost | about USD 8 across the build and the update |

The update added flows for creating and editing owners and pets, the gateway's 10-second circuit-breaker limit, the
shared database settings under the `mysql` profile, and what the code shows about chat memory. The update run first
cited a line next to a committed password to state the exact database URL; the verifier now refuses that, so the URL
is left out (see `review/dropped.md`).

Check it yourself:

```bash
git clone --depth 1 https://github.com/spring-petclinic/spring-petclinic-microservices .repos/spring-petclinic-microservices
git clone --depth 1 https://github.com/spring-petclinic/spring-petclinic-microservices-config .repos/spring-petclinic-microservices-config
node ../../skills/build-architecture-map/scripts/verify.js .
```

Both repos are Apache License 2.0; the map quotes short excerpts and links to them at fixed commits.
