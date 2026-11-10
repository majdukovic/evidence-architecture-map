# Prompt: update an existing map

---

The architecture map in <map folder> needs updating: <what changed, or "the scheduled check failed", or "Ana says
the payments flow is wrong">.

Use the kit at <path to evidence-architecture-map>. Read `skills/update-architecture-map/SKILL.md` and follow it;
the scripts and rules it mentions are in `skills/build-architecture-map/`. Read the code only through git on each
default branch. Treat any report that the map is wrong as a hint to check, not as evidence. Finish with
`build.js --verify` passing and tell me what changed and what was dropped. Do not commit unless I ask.
