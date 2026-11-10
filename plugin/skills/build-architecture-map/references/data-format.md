# Map folder: data format

A map folder holds plain JSON that `scripts/build.js` turns into `architecture.html` (interactive) and
`ARCHITECTURE.md` (renders on GitHub, GitLab, Bitbucket and Azure DevOps). Create one with `scripts/init.js`.

```
<map-dir>/
  map.json            title, where the repos are, how to link to them        (you write)
  components.json     layers and components                                   (you write)
  connections.json    who talks to whom                                       (you write)
  flows.json          step-by-step flows with payloads                        (you write, optional)
  facts.json          evidence-backed facts: how the team builds, ships, runs (you write, optional)
  intro.html          text in the map's side panel before anything is chosen  (optional)
  about.html          the "How to read this" page; a verification section is always appended (optional)
  pins.json           commit and web URL per repo, written by build.js --pin  (generated)
  review/             CoVe working files: discovery.md, verification.md, dropped.md
  architecture.html   generated
  ARCHITECTURE.md     generated
```

## Evidence

Every component, connection, flow step and fact needs at least one evidence item:

```json
{ "ref": "orders-service:src/main/scala/acme/orders/OrdersRoutes.scala:42", "quote": "path(\"orders\" / Segment)" }
```

- `ref` is `repo:path:line`. `repo` is a key under `map.json` `repos` (or simply the repo's folder name under
  `reposDir`); `path` is relative to the repo root; `line` is 1-based, on the repo's **default branch**.
- `quote` is an exact substring of that line, 4 to 120 characters (aim for 10 to 60). Pick the part that proves
  the claim, not boilerplate: `basicRequest.post(uri"$paymentsUrl/charges")`, not `def charge(`.
- `verify.js` accepts the quote on the cited line or up to two lines away (exactly on the line right after `--pin`).
- One line per reference. To prove something that spans a block (a config section, a multi-line call), cite each key
  line as its own evidence item.

## map.json

```json
{
  "title": "Acme Platform Map",
  "reposDir": "../repos",
  "link": "github",
  "repos": {
    "orders-service": { "path": "backend/orders" },
    "infra": { "web": "https://git.acme.internal/platform/infra", "link": "gitlab" },
    "legacy": { "fileTemplate": "https://code.acme.internal/{sha}/{path}#{line}" }
  }
}
```

| Key | Meaning |
|---|---|
| `title` | Shown in the header and the browser tab. Required. |
| `reposDir` | Folder that holds the clones, relative to the map folder. Default `..`. Override with `--repos`. |
| `link` | Default git host for links: `github`, `gitlab`, `bitbucket`, `bitbucket-server`, `azure`, `gitea`. Normally detected from the remote URL; set it for self-hosted GitHub Enterprise or GitLab. |
| `repos.<name>.path` | Clone folder relative to `reposDir`, when it differs from the name. Monorepos are one repo. |
| `repos.<name>.web` | Web URL of the repo. Normally read from `git remote get-url origin` by `--pin`. |
| `repos.<name>.clone` | Clone URL for CI (`verify-ci.sh`). Default: `web` + `.git`. |
| Libraries | To cite a library's source (see *Claims that rest on a library* in `evidence-rules.md`), clone it at the version
  the build file pins, for example `git clone --branch v4.1.0 --depth 1 <url> <reposDir>/spring-cloud-gateway`, and cite
  it as `spring-cloud-gateway:path:line`. No `map.json` entry is needed when the folder name is the repo name. |
| `repos.<name>.fileTemplate` / `treeTemplate` | Custom link format with `{web}`, `{sha}`, `{path}`, `{line}`. |
| `output.html` / `output.markdown` | Output file names. Default `architecture.html`, `ARCHITECTURE.md`. |

## components.json

```json
{
  "layers": [ { "id": "entry", "label": "Entry points" }, { "id": "services", "label": "Services", "color": "#2f7fd1" } ],
  "components": [
    {
      "id": "orders",
      "label": "Orders service",
      "short": "Takes orders",
      "layer": "services",
      "repo": "orders-service",
      "purpose": "Accepts orders from the web shop and asks <b>Payments</b> to charge them.",
      "callout": "Orders never talks to the card provider directly.",
      "exposes": ["POST /orders", "Kafka: order-events"],
      "stores": ["PostgreSQL: orders"],
      "evidence": [ { "ref": "orders-service:src/main/scala/acme/orders/OrdersRoutes.scala:42", "quote": "path(\"orders\" / Segment)" } ],
      "tests": [ { "kind": "test", "name": "PlaceOrderSpec", "note": "End-to-end order placement", "ref": "orders-service:src/it/scala/PlaceOrderSpec.scala:12", "quote": "class PlaceOrderSpec" } ],
      "links": [ { "label": "Orders dashboard", "url": "https://grafana.acme.internal/d/orders", "kind": "dashboard" } ]
    }
  ]
}
```

- Layers are drawn top to bottom in the order given. Colours are optional. Start from the layers `init.js` writes and
  agree them before drafting, so every research agent uses the same ids.
- `id`: lower-case letters, digits, dashes. Used in links (`#node.orders`).
- `short`: 2 to 4 words under the box label. `purpose`: one or two sentences for a newcomer.
- `exposes` / `stores`: short tags (endpoints, topics, queues, tables, buckets).
- `condition`: for a component that exists only in some setups (an optional profile, a feature flag, a deployment
  variant), say when, e.g. `"Only with the alloydb kustomize component"`. Drawn dashed. Also valid on connections.
- **Modular monolith** (one deployable with modules): components can be the modules a newcomer needs (often 5 to 12),
  connected `in-process` with the call site as evidence. Use layers that fit, for example `ui`, `api`, `modules`,
  `data`, `external`, instead of the default `services`.
- **Deployment artefacts** (a Helm chart, docker-compose, Terraform) that newcomers need: put them in a `deploy` layer,
  connect them to what they start or configure with a short protocol such as `deploys` or `configures`, and cite the
  manifest lines.
- **A caller outside the code** (a person following a link in an email, a partner system): add it as a component in
  the `people` or `external` layer, with evidence of what reaches it (the line that builds the link or the webhook).
- `gateway: true` marks a router (API gateway, ingress, BFF). A flow step with no direct connection is drawn
  through it on the map.
- `seqLabel`: shorter name for sequence diagrams.
- `tests`: the most useful tests or test helpers for this component, each with `ref` and `quote`. Optional; leave it
  out (or `[]`) when there is no test worth linking.
- `links`: docs, dashboards, runbooks, tickets, channels. **Not evidence**, never checked, shown under
  "Related links". Never link anything that needs a secret in the URL.

`purpose`, `callout`, flow `summary`, step `description`, fact `text`, `intro.html` and `about.html` may use
simple HTML (`b`, `i`, `code`, `a`, `br`, `p`, `ul`, `li`). The build rejects scripts, iframes, styles,
`on*` handlers and `javascript:` links.

## connections.json

```json
[
  { "from": "orders", "to": "payments", "protocol": "HTTP", "what": "Charges the card for a new order",
    "evidence": [ { "ref": "orders-service:src/main/scala/acme/orders/PaymentsClient.scala:31", "quote": "uri\"$paymentsUrl/charges\"" } ] }
]
```

- Direction is the direction of the call or message: the caller or publisher is `from`.
- One entry per `from` + `to` + `protocol`; the build rejects duplicates. When one component makes several calls to
  another over the same protocol, describe them together in `what` and give evidence for each.
- `protocol` is short free text: `HTTP`, `HTTPS`, `gRPC`, `GraphQL`, `Kafka`, `RabbitMQ`, `SQS`, `JDBC`, `Redis`, `S3`, `SMTP`,
  `WebSocket`, `in-process` (an embedded store or library).
- `condition`: when the connection exists only in some setups (a profile, a flag, an optional component). Drawn dashed.
- For a message broker, prefer publisher -> consumer with the broker as the protocol (`"protocol": "RabbitMQ"`) and the
  event in `what`; it keeps the map readable. Add the broker as its own component (publisher -> broker -> consumer) only
  when newcomers need to see it, for example when it does routing they must understand. Pick one style and keep it.

## flows.json

```json
[
  {
    "id": "place-order",
    "title": "Place an order",
    "tagline": "Web shop to payment",
    "featured": true,
    "summary": "What happens when a customer presses <b>Buy</b>.",
    "actors": ["web", "orders", "payments", "orders-db"],
    "steps": [
      { "from": "web", "to": "orders", "kind": "req", "label": "Submit the order", "protocol": "HTTP",
        "call": { "verb": "POST", "target": "/orders" },
        "request": { "items": [ { "sku": "A-1", "qty": 2 } ], "...": "..." },
        "response": { "orderId": "<uuid>", "status": "PENDING" },
        "requestSchema": { "ref": "orders-service:src/main/scala/acme/orders/model.scala:8", "quote": "final case class NewOrder(" },
        "description": "The web shop posts the basket.",
        "evidence": [ { "ref": "orders-service:src/main/scala/acme/orders/OrdersRoutes.scala:42", "quote": "path(\"orders\" / Segment)" } ] }
    ],
    "tests": [ { "name": "PlaceOrderSpec", "why": "Places an order through the API", "ref": "orders-service:src/it/scala/PlaceOrderSpec.scala:12", "quote": "class PlaceOrderSpec" } ]
  }
]
```

- `featured: true` flows are listed first under "Start here", in file order.
- Every step's `from` and `to` must be in `actors`. Actors appear left to right in the order listed.
- `kind`: `req` (a call that waits), `res` (the answer to an earlier `req`, so it goes back to the caller), `async`
  (message or fire-and-forget), `self` (work inside one component; set `from` and `to` to that component).
- `request` / `response`: JSON objects or strings. **Real field names and casing from the code**; when a serialiser
  renames fields (ASP.NET Core and many Jackson setups write camelCase), use the names on the wire and cite the
  serialiser setting, or keep the class's names and say so in the step's description. Then: made-up
  values, at most about 10 fields, `"...": "..."` for the rest, placeholders like `<token>` for secrets.
- `requestSchema` / `responseSchema`: evidence pointing at the class, schema, proto `message` or OpenAPI
  definition. Shown as "Full definition".
- `payloadNote` when there is no JSON: `no-body`, `sql`, `internal`, `unknown`, `class-fields`.
  `noPayload: true` hides the "payload not shown" note on a step that has none by nature.
- If you cannot confirm a payload from code, leave `request` / `response` out. The page says so.

## facts.json

Short, checkable statements about how the system is built and run: build tool, deployment, CI, config
source, shared libraries, conventions. They appear on the "How to read this" page, grouped.

```json
[
  { "group": "How it ships", "items": [
    { "text": "Every service is deployed with the shared Helm chart in <code>infra</code>.",
      "evidence": [ { "ref": "infra:charts/service/Chart.yaml:2", "quote": "name: service" } ] }
  ] }
]
```

## pins.json (generated)

```json
{ "verifiedOn": "2026-11-10", "repos": { "orders-service": { "branch": "main", "sha": "3f2c...", "web": "https://github.com/acme/orders-service" } } }
```

`build.js --pin` writes it from each repo's `origin/HEAD`. Links on the page and in the Markdown point at these
commits, so they keep working after the code moves on. `verify.js` checks against the current default branch
(drift) unless you pass `--at pinned`.
