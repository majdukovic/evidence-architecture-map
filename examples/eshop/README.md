# Example: eShop (.NET)

A map of Microsoft's [eShop](https://github.com/dotnet/eShop) reference application: ASP.NET Core services, a
RabbitMQ event bus, gRPC, PostgreSQL, Redis and a Blazor web app.

Built by an unattended `claude -p` run that had only this plugin and the prompt in
[`prompts/build-map.md`](../../prompts/build-map.md), with the scope answers filled in. Nobody steered it.

| | |
|---|---|
| Map | 14 components, 28 connections, 3 flows (32 steps), 13 facts |
| Evidence | 221 references, all OK on `main` |
| CoVe | 33 neutral questions answered by agents that never saw the draft; 4 claims corrected (for example, the price-change webhook handler is a no-op) |
| Adversarial review | 10 findings, all applied |
| Independent spot-check (30 sampled claims) | 26 correct, 4 minor, 0 wrong; the 4 minor ones were then fixed |
| Cost | about USD 9 across the run and one resume |

Things the spot-check said a newcomer would still want, left for a later update: integration events can be lost when
a handler fails, Catalog's write endpoints have no authentication, the webhook registration handshake, the mobile
apps, and that a failed checkout still empties the basket.

Check it yourself:

```bash
git clone --depth 1 https://github.com/dotnet/eShop .repos/eShop
node ../../skills/build-architecture-map/scripts/verify.js .
```

eShop is MIT licensed; the map quotes short excerpts and links to it at a fixed commit.
