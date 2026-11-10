# Chain of Verification (CoVe)

CoVe separates **writing** claims from **checking** them, so the checker cannot just agree with the writer.

1. **Baseline:** the draft map (components, connections, flow steps, facts) with evidence.
2. **Plan questions:** for each claim, write one or more **neutral** questions whose answers would confirm or
   refute it. Neutral means the question does not contain the claimed answer.
3. **Answer independently:** agents that have **not seen the draft** answer the questions from code alone.
4. **Reconcile:** compare each answer with the claim. Keep, fix or drop. Log every row in
   `review/verification.md`; record drops in `review/dropped.md`.

## Writing neutral questions

| Claim | Leading (bad) | Neutral (good) |
|---|---|---|
| Orders calls Payments over HTTP to charge cards | Does Orders call Payments over HTTP? | Which other services does the Orders service call when an order is placed, over which protocol, and with which endpoint? |
| Orders publishes `order-placed` to Kafka, consumed by Shipping | Does Shipping consume order-placed? | Which components consume the Kafka topic(s) that Orders produces to? |
| Orders stores orders in PostgreSQL | Is the orders DB PostgreSQL? | Where does the Orders service persist orders, and what kind of store is it? |
| Step 3 response has `status` and `orderId` | Does the response contain status and orderId? | What are the field names of the response body returned by `POST /orders`? |

Write each question from the item's **topic** (the component and the aspect: who it calls, what it stores, what a
message contains), not by rewording the claim's sentence, which leaks the answer. Ask about direction, protocol,
endpoint or topic, and payload shape separately when they matter. Group questions
by repo so one agent can answer a batch efficiently (about 10 to 25 questions per agent).

## Brief for an answering agent

Copy everything below into the agent's prompt, followed by the questions. Do **not** include the draft map, the
claimed answers or the evidence refs.

---

Answer each question below **only from the code** on each repository's default branch. You have not seen any
earlier analysis, and that is deliberate: do not guess what someone else concluded.

- Repos are cloned under: <reposDir>. Read with git only, never the working tree:
  `git -C <repo> grep -n -E '<p>' origin/HEAD -- <glob>`, `git -C <repo> show origin/HEAD:<path>`.
  One simple command per call (no `cd`, no shell variables). If `git show` is refused, `git -C <repo> grep -n '' origin/HEAD -- <path>` or
  `node <skill-dir>/scripts/show.js <repo-dir> <path> [from] [to]` print the file with line numbers. Never checkout, reset, pull or edit.
- For each question give: the answer in one or two sentences; one to three evidence items as
  `repo:path:line` plus an exact quote from that line; and a confidence: `confirmed` (the code shows it
  directly), `partial` (some of it shown, say what is missing) or `not found` (say what you searched).
- If the code contradicts the premise of a question, say so. "Not found" is a good answer when it is true.
- Never quote credentials or personal data.
- Run only commands of the form `git -C <repo> ...` or `node <script> ...` with absolute paths, one per call: other
  shell commands may be refused in unattended runs.

Return a table: `Q-id | answer | evidence | confidence`.

---

## Reconciling

| Independent answer | Action |
|---|---|
| Agrees, `confirmed` | Keep. If its evidence is stronger than the draft's, add it. |
| Agrees in part, or `partial` | Narrow the claim to what is confirmed, or investigate once more yourself. |
| Disagrees | Read both sets of evidence yourself. Fix the claim if the answer is right; if you still believe the draft, ask a second, differently worded question to a fresh agent. Two disagreements: drop. |
| `not found` | Drop, unless your own evidence is unambiguous **and** a fresh agent confirms it when pointed at the file. |

Then run the adversarial review (`review-brief.md`) on the reconciled map, and the mechanical check
(`build.js --verify`). Only claims that pass all three stay on the map.
