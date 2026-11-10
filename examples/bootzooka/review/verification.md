# Verification log

Method: neutral questions (45, grouped in three batches) answered by fresh agents that had not seen the draft, from `origin/HEAD` only; then reconciliation; then an adversarial review by another fresh agent; then `build.js --verify`.
The first answering agent for the startup/build batch could not read files (command approvals refused) and answered nothing; it was rerun with the `git grep -n -E '.'` fallback and answered all 15.

## Batch A: UI, session, HTTP layer (15 questions)
| Topic | Result | Action |
|---|---|---|
| Register path/method/response, key storage, Bearer header, GET /user, login fields, routes, generated client, base URL, 401 mapping, jsoniter, /api/v1 + docs + static, Argon2 | confirmed | kept |
| Register request body | Answerer: UI sends `repeatedPassword` too (whole form object is passed to `mutate`); backend `Register_IN` has 3 fields. Draft said the UI does not send it. | **Fixed** the step text; added evidence `Register/index.tsx:92` |
| Base URL per mode | partial (answerer did not find where `.env.docker` is used) | Batch C confirmed `--mode docker` in `build.sbt:129`; claim softened and `.env.*` refs not cited (see skill problems) |
| Reset endpoint called from UI; link route | Answerer: no UI page calls `usePostPasswordresetReset`; UI router has no `/password-reset` route | Draft said the UI calls it. **Fixed**: that step is now backend-side (http-api -> password-reset) and says no UI caller is cited. Absence itself is NOT stated on the map (absence-claim rule); reported in the hand-over. Searches: `PasswordresetReset`, `passwordreset/reset`, `code=`, `searchParams`, `useSearchParams` over `ui/src` |

## Batch B: password reset, e-mail, user service (16 questions)
All confirmed: forgot always answers 200 with empty body; code row in `password_reset_codes`; link from `reset-link-pattern`; outbox + background loop (1 s / 10 rows defaults); sender choice Mailgun > SMTP > Dummy; Mailgun POST fields `from,to,subject,html`; SMTP via javax.mail; rows deleted after send; reset semantics (one-time, expiry deletes); other e-mail triggers; 4 tables in V1; registration/login steps; Auth for two token kinds; test `PasswordResetApiTest`.
Extra observations, not added to the map: if a send throws, the batch is not deleted and is retried (possible duplicates); `Auth.apply` and `updatePassword` are separate transactions.

## Batch C: startup, build, CI (15 questions, rerun)
All confirmed: Main order, pureconfig + env overrides (`API_HOST`, `API_PORT`, `PORT` wins, `MIGRATE_ON_START`), Hikari + Flyway + 5 s retry, two e-mail loops, MacWire autowire, 0.0.0.0:8080 and `never`, Postgres only, Mailgun conditional, OTel via autoconfigure, sbt projects, Docker/CI facts, test DB (embedded Postgres) and Dummy sender, `Sensitive`, endpoint list (9 endpoints), no scheduler or broker found.
Searched for absence (Q15): `cron|schedul|rabbit|kafka|redis|queue|Timer|every(|repeat` over `backend/src/main`, docker-compose, helm values. Only the DB outbox matched. Not placed on the map as an absence claim.

## Adversarial review (fresh agent)
| Item | Problem | Action |
|---|---|---|
| reset-password last step drawn as UI call | not evidenced | fixed as above |
| reset-password summary | implied UI completes the reset | reworded |
| connection ui -> http-api | dev vs packaged base-URL values lacked direct evidence | wording softened to what `vite.config.ts` and `build.sbt:129` show |
| Mailgun `from` example invented | | now `Bootzooka <bootzooka@<mailgun-domain>>`, added `MailgunEmailSender.scala:19` |
| "no cookie or JWT" | negative claim | removed |
| fact "All API errors" | overstated | now "API endpoint errors" |
| missing `/admin/version` | | added to http-api `exposes` with evidence |
Not adopted: a separate fact "UI has no /password-reset route" (absence claim; reported in hand-over instead). Logout/profile/change-password flows: out of the agreed first flows.

## Mechanical check
`build.js --pin --verify`: 138/138 references OK.

## Update 2026-11-10: five hints from an independent reviewer
Each hint was re-read in code on `origin/HEAD` before it went on the map.
| Hint | Result | Where on the map |
|---|---|---|
| 1 Observability | Confirmed: SDK autoconfigure, runtime metrics, logback appender (`Dependencies.scala:68-72`), Tapir tracing and metrics (`HttpApi.scala:43,48`), traced and metered sttp backend (`Dependencies.scala:42`), two custom instruments (`Metrics.scala`), compose OTLP env and `grafana/otel-lgtm` | components `otel`, `otel-lgtm`; connections from main, http-api, user, email-service, email-sender; `otel -> otel-lgtm` |
| 2 Local development | 8081 (`vite.config.ts:16`), 8080 default, both start scripts, compose Postgres `25432:5432` confirmed. CORS narrowed (see dropped.md) | facts "Local development"; component `compose`; ui -> http-api text |
| 3 Helm | Chart, templates, values and its own workflow confirmed; "publishes" not confirmed | component `helm-chart`; facts "Deployment to Kubernetes"; 3 connections |
| 4 API keys | Logout deletes `data.apiKey` from the body and ignores the authenticated id (`UserApi.scala:37-38`); reset does `updatePassword` only (`PasswordResetService.scala:49-53`; search `validate\|invalidate\|apiKey` over `passwordreset/` finds only config validation); change-password validates, deletes all keys, creates one (`UserService.scala:130-137`) | callouts on `security`, `password-reset`; flow `api-key-lifecycle`; reset-flow step text |
| 5 E-mail | Whole batch sent, then deleted (`EmailService.scala:32-33`), errors caught in the loop (`:54`); Mailgun posts `html` (`MailgunEmailSender.scala:22`) while templates are `.txt` and SMTP uses `plain` | callouts on `email-service`, `email-sender`; reset-flow step text |

### Adversarial review (fresh agent with git, new items only)
| Item | Problem | Action |
|---|---|---|
| connection user -> otel; otel purpose | counter is incremented before the result check, so failures count | wording fixed |
| component otel-lgtm `exposes` OTLP :4318 | no cited line shows it | removed |
Everything else the reviewer was pointed at held (logout, reset vs change-password, batch resend, html field, helm publish job, CORS and OTLP wording, no credentials quoted).

### Mechanical check
`build.js --pin --verify`: 249/249 references OK. `ui-audit` not run (see report).
