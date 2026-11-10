# Example: Bootzooka (Scala)

A map of [Bootzooka](https://github.com/softwaremill/bootzooka), SoftwareMill's Scala web app template: a Scala 3
backend (Tapir, Magnum, Flyway) with a React UI, PostgreSQL and e-mail through Mailgun or SMTP. It is a modular
monolith, so its components are modules connected in-process.

Built by an unattended `claude -p` run that had only this plugin and the prompt in
[`prompts/build-map.md`](../../prompts/build-map.md), with the scope answers filled in. Nobody steered it.

| | |
|---|---|
| Map | 17 components, 31 connections, 4 flows (35 steps), 17 facts |
| Evidence | 252 references, all OK on `master` |
| CoVe | 45 neutral questions answered by agents that never saw the draft; corrections included a UI call that does not exist and a payload field the UI does send |
| Independent spot-check (30 sampled claims) | 28 correct, 2 minor, 0 wrong; the minor ones were then fixed |
| Update run (`update-architecture-map`, unattended) | added the 5 gaps the spot-check found; claims that depend on library behaviour (what CORS permits, which OTLP signals are sent) were narrowed |
| Spot-check of the 35 added statements | 33 correct, 2 minor, 0 wrong; the minor ones were then fixed |
| Cost | about USD 6 across the build and the update |

A finding about Bootzooka itself, confirmed by the spot-check: the password reset e-mail links to
`/password-reset?code=...`, but the UI router has no such route, so the link lands on the not-found page; with the
default settings it also points at the dev-server port.

The update added OpenTelemetry (SDK, Tapir tracing and metrics, the otel-lgtm container), the local development
setup, the Helm chart and its CI, a flow for the API-key lifecycle (logout and password reset do not do what you might
assume), and how the e-mail outbox can send a batch twice. The update run noted committed development passwords in
`docker-compose.yml` and the Helm `values.yaml`; the map does not cite those lines.

Check it yourself:

```bash
git clone --depth 1 https://github.com/softwaremill/bootzooka .repos/bootzooka
node ../../skills/build-architecture-map/scripts/verify.js .
```

Bootzooka is Apache License 2.0; the map quotes short excerpts and links to it at a fixed commit.
