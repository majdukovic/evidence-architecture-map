# Evidence rules

The map is a source of truth for people who cannot check it themselves. **Accuracy beats coverage.** If a claim
cannot be tied to a line of code on the default branch, it is left out (and noted in `review/dropped.md`).

## Read the right code

- Read the **default branch as the remote has it**, with git, never the working tree, which may be on a
  feature branch with local changes:
  ```bash
  git -C <repo> fetch -q origin                                   # once, if allowed
  head=$(git -C <repo> rev-parse --abbrev-ref origin/HEAD)        # e.g. origin/main
  git -C <repo> grep -n -E '<pattern>' "$head" -- '<path glob>'   # search
  git -C <repo> show "$head:<path>" | sed -n '30,60p'             # read
  git -C <repo> ls-tree -r --name-only "$head" | grep -E '...'    # list files
  ```
  If `origin/HEAD` is missing: `git -C <repo> remote set-head origin -a`.
- Never `checkout`, `reset`, `stash`, `pull` or edit anything in the user's repos.
- Line numbers in refs are line numbers in `git show <head>:<path>`, not in the working tree.

## What proves what

| Claim | Strong evidence | Not enough on its own |
|---|---|---|
| Component exists and runs | Its entry point (`main`, `App`, `Server`), its Dockerfile / deployment manifest | A folder name, a README sentence |
| Component exposes an endpoint | The route or handler definition (`path("orders")`, `@GetMapping`, `router.post`, `rpc Charge`) | An OpenAPI file nobody serves |
| A calls B (HTTP/gRPC) | The call site in A **and** the line that points the client at B (config key, base URL, service name) | A client library in the build file; a client built but never called |
| A publishes, B consumes | The topic/queue/routing key in A's producer **and** B's subscription for the same name | A topic name in config only; a shared constants file |
| A stores data in X | The connection config or data access code naming X (JDBC URL, keyspace, bucket, table) | A driver dependency |
| Flow step payload | The DTO / case class / proto / schema with those field names | Field names from docs or memory |
| A test covers a flow | The test function that calls the flow's endpoint, with no skip/ignore marker | The test file name |
| A fact about ways of working | CI config, build file, deployment manifest, CODEOWNERS, lint config | A Confluence page, a chat message |

When the two ends of a connection live in different repos, cite both. When a name is built at runtime
(string concatenation, config lookups), cite the line that sets the value **and** the line that uses it.

## Hints are not evidence

Docs, ADRs, READMEs, Jira, Confluence, Grafana, Slack, Teams, email and earlier AI sessions (CLAUDE.md,
memory files, chat transcripts) tell you **where to look**. They never prove anything on their own:

- Use them to build the list of candidate components and flows (`review/discovery.md`).
- Confirm every candidate in code before it goes on the map.
- They may appear only as `links` (Related links), which the page labels as not evidence.
- Infrastructure and observability **kept in git** (Terraform, Helm, Kubernetes, docker-compose, Grafana
  dashboards as JSON, alert rules) is code and counts as evidence.

## Wording

- Say exactly what the line shows. "Orders calls Payments over HTTP to charge a card", not "Orders depends on
  Payments for all billing".
- No hedging inside claims ("probably", "seems to"). If you are unsure, it is not a claim yet.
- Absence claims ("X never calls Y") need a search that would have found it: cite nothing, say what you
  searched in `review/verification.md`, and prefer to leave such claims out.
- Name things the way a newcomer would recognise them. Explain jargon once, in `about.html`.

## Never

- Never quote or link a credential, token, password, private key, webhook URL or personal data. The build
  rejects credential-looking quotes and files that usually hold secrets (`.env`, `*.pem`, `credentials`,
  `secrets.yaml`...), and the verifier fails a reference whose nearby lines look like a credential.
- Never cite production secret stores, even to prove a component exists.
- Never copy text from private chats, tickets or customer data into the map.
- If you find a committed secret while reading, do not repeat it; tell the user which file holds it so they can
  rotate it.
