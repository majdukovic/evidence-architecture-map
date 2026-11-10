# Example: eShop (.NET)

A map of Microsoft's [eShop](https://github.com/dotnet/eShop) reference application: ASP.NET Core services, a
RabbitMQ event bus, gRPC, PostgreSQL, Redis and a Blazor web app.

Built by an unattended `claude -p` run that had only this plugin and the prompt in
[`prompts/build-map.md`](../../prompts/build-map.md), with the scope answers filled in. Nobody steered it.

| | |
|---|---|
| Map | 16 components, 31 connections, 3 flows (32 steps), 15 facts |
| Evidence | 263 references, all OK on `main` |
| CoVe | 33 neutral questions answered by agents that never saw the draft; 4 claims corrected (for example, the price-change webhook handler is a no-op) |
| Adversarial review | 10 findings, all applied |
| Independent spot-check (30 sampled claims) | 26 correct, 4 minor, 0 wrong; the 4 minor ones were then fixed |
| Update run (`update-architecture-map`, unattended) | added the 5 gaps the first spot-check found; all confirmed in code, wording narrowed where code proves less |
| Spot-check of the 17 added statements | 14 correct, 3 minor, 0 wrong; the 3 minor ones were then fixed |
| Cost | about USD 11 across the build, one resume and the update |

The update added: integration events acknowledged even when a handler fails and failed outbox events never re-read,
Catalog's unauthenticated write endpoints, the webhook registration handshake, the two mobile apps (which start on
mock services), and that a failed checkout still deletes the basket.

Check it yourself:

```bash
git clone --depth 1 https://github.com/dotnet/eShop .repos/eShop
node ../../plugin/skills/build-architecture-map/scripts/verify.js .
```

eShop is MIT licensed; the map quotes short excerpts and links to it at a fixed commit.
