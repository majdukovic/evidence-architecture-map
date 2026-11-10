# Example: Bootzooka (Scala)

A map of [Bootzooka](https://github.com/softwaremill/bootzooka), SoftwareMill's Scala web app template: a Scala 3
backend (Tapir, Magnum, Flyway) with a React UI, PostgreSQL and e-mail through Mailgun or SMTP. It is a modular
monolith, so its components are modules connected in-process.

Built by an unattended `claude -p` run that had only this plugin and the prompt in
[`prompts/build-map.md`](../../prompts/build-map.md), with the scope answers filled in. Nobody steered it.

| | |
|---|---|
| Map | 13 components, 19 connections, 3 flows (29 steps), 8 facts |
| Evidence | 141 references, all OK on `master` |
| CoVe | 45 neutral questions answered by agents that never saw the draft; corrections included a UI call that does not exist and a payload field the UI does send |
| Independent spot-check (30 sampled claims) | 28 correct, 2 minor, 0 wrong; the minor ones were then fixed |
| Cost | about USD 4 |

A finding about Bootzooka itself, confirmed by the spot-check: the password reset e-mail links to
`/password-reset?code=...`, but the UI router has no such route, so the link lands on the not-found page; with the
default settings it also points at the dev-server port.

Things the spot-check said a newcomer would still want, left for a later update: OpenTelemetry tracing and metrics,
the local dev setup (ports, CORS, docker-compose Postgres), the Helm chart, logout and password-reset behaviour around
API keys, and that the e-mail outbox can resend a batch after a partial failure.

Check it yourself:

```bash
git clone --depth 1 https://github.com/softwaremill/bootzooka .repos/bootzooka
node ../../skills/build-architecture-map/scripts/verify.js .
```

Bootzooka is Apache License 2.0; the map quotes short excerpts and links to it at a fixed commit.
