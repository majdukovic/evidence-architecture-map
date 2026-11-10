# Privacy

Evidence Architecture Map is a Claude Code plugin that runs on your machine. It collects no personal data and sends
nothing to its author or to any service run by its author.

- It reads the git repositories you point it at, using read-only git commands, and writes only the map folder you
  choose.
- Its scripts make no network calls, except `verify-ci.sh`, which clones the repositories listed in your map from your
  own git host when you run it.
- The generated `architecture.html` is self-contained and loads nothing from the internet.
- Other sources (documents, tickets, dashboards, chat, earlier agent sessions) are read only when you allow it, through
  tools you already have, and their content is not copied onto the map.
- The build and the verifier refuse anything that looks like a credential, so the map never quotes or links one.

What Claude itself does with your prompts and the code it reads is governed by your agreement with Anthropic, not by
this plugin.

Questions: open an issue at https://github.com/majdukovic/evidence-architecture-map/issues
