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
