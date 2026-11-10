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
