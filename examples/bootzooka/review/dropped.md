# Dropped or narrowed claims

| Claim | Why | Where it went |
|---|---|---|
| "The UI calls POST /passwordreset/reset to finish a reset" (draft flow step) | No UI page calls it; only the generated client has the hook. Two independent searches agree. | Step rewritten as a backend endpoint; observation left for the hand-over |
| "The UI does not send `repeatedPassword`" | Wrong: the whole form object is posted | Corrected |
| "There is no cookie or JWT" | Negative claim, no citing line | Removed |
| "All API errors are JSON" | Overstated | Narrowed to endpoint errors |
| `requestSchema` for Login_IN, PasswordReset_IN, Register_IN (backend), Register_OUT, Login_OUT | The verifier's credential heuristic rejects any line within ~2 lines of a field named `password` (false positives on DTO definitions) | Replaced with the generated TS type `RegisterIN` or the handler lines that construct the response; no schema link for Login and reset requests |
| Citation of `ui/.env.docker` and `ui/.env.example` for the base URL | Build refuses files that look like secret holders (`.env*`) | Cited `vite.config.ts:11` and `build.sbt:129` |
| OpenTelemetry exporter as a component/connection | Only configured by environment variables at runtime; no line names a target in code | Not mapped (mentioned in discovery) |
| Logout, profile update, change-password, `/admin/version` as flows or components | Outside the agreed first flows | Listed only as endpoints (`user`, `http-api`) |

## Update 2026-11-10 (five reviewer hints)
Rows 10-12 above are superseded: `ui/.env.example:1` is now cited and the verifier accepts it (it holds no credential); the OpenTelemetry exporter is mapped as `otel -> otel-lgtm`, configured by the compose environment, not by a target in code; logout and change-password are now the flow `api-key-lifecycle`.

| Claim | Why | Where it went |
|---|---|---|
| Hint 2: "the dev setup relies on a CORS interceptor" | The code shows two origins (port 8081 dev server, example env pointing at 8080) and `CORSInterceptor.default` installed. What the default allows is library behaviour, and nothing in the repo proves the dev flow needs it | Stated as the two facts only; no claim about what CORS permits or that it is required |
| Hint 3: Helm CI "publishes" the chart | The `publish-chart` job in the workflow contains only a checkout step (file ends at line 140) | Fact says the job has a checkout and nothing after it; the chart's purpose text says lint, test-install and docs check only |
| Hint 1: "OTLP export of traces, metrics and logs" | What the auto-configured SDK exports by default is library behaviour (not checked). Only the endpoint and protocol env vars in compose are in the repo | Connection says telemetry goes to the configured OTLP endpoint; no list of signals |
| Reviewer: `otel-lgtm` exposes OTLP/HTTP :4318 | Compose publishes only port 3000; line 15 shows where the backend sends, not what the container serves | Removed from `exposes`; the address stays in the connection evidence |
| Reviewer: counter counts "registered users" | Counter is added before the registration result is checked, so failed attempts count | Wording changed to "on every registration request" |
| What `asStringOrFail` does on a non-2xx Mailgun answer | Library behaviour (sttp) | Not stated; the batch-resend claim rests only on the repo's own `catch` and delete order |
| Literal passwords in `docker-compose.yml` and `helm/.../values.yaml` | Credentials sit near some useful lines | Cited only lines at least 3 lines away; nothing quoted from them |
