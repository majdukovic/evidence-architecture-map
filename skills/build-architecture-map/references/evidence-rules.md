# Evidence rules

The map is a source of truth for people who cannot check it themselves. **Accuracy beats coverage.** If a claim
cannot be tied to a line of code on the default branch, it is left out (and noted in `review/dropped.md`).

## Read the right code

- Read the **default branch as the remote has it**, with git, never the working tree, which may be on a
  feature branch with local changes:
  ```bash
  git -C <repo> grep -n -E '<pattern>' origin/HEAD -- '<path glob>'   # search
  git -C <repo> show origin/HEAD:<path>                               # read
  git -C <repo> ls-tree -r --name-only origin/HEAD                    # list files
  ```
  `origin/HEAD` is itself a revision, so no variable is needed. Check it exists with
  `git -C <repo> rev-parse --verify origin/HEAD`; only if that fails, run `git -C <repo> remote set-head origin -a`
  (this contacts the remote).
- If `git show` is blocked in your environment, `node <skill-dir>/scripts/show.js <repo-dir> <path> [from] [to]` or
  `git -C <repo> grep -n '' origin/HEAD -- <path>` print the same file with line numbers.
- Keep each shell command simple: one `git -C <repo> ...` per call, no `cd`, no shell variables or `$(...)`.
  Agent permission systems often cannot vet compound commands and will block or prompt for them.
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

When the two ends of a connection live in different repos or projects, cite both. Events matched by type name (an
event bus that routes on the class name) need the publish call and the handler subscription for that same name; when
several projects declare a class with the same name, cite the declaration each side uses. When a name is built at runtime
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
- When the line you need sits near a credential (a shared config file with a password in one profile), cite another
  line that proves the same thing: the code that reads the setting, another part of the file at least three lines
  away, or a deployment manifest. Leave the claim out if nothing else proves it.
- Never copy text from private chats, tickets or customer data into the map.
- If you find a committed secret while reading, do not repeat it; tell the user which file holds it so they can
  rotate it.
