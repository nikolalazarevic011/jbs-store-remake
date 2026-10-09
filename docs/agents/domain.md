# Domain docs

Layout: single-context

Where to find domain docs
- Primary context file: `GLOSSARY.md` at the repository root. It holds the vocabulary for the surfaces in play (Home Page, Section, Section Toggle, Hero, and so on). Create and maintain it as the single source of contextual information for agents.
- ADRs: `docs/adr/` at the repository root, one file per architectural decision (`0001-...` onwards).

Consumer rules for agents
- Read `GLOSSARY.md` before naming anything in templates, SCSS, or settings. Its `_Avoid_` lines are the words not to use.
- Read the ADRs before changing a decision they cover, and add a new numbered ADR when you make a decision worth keeping.
- Keep `GLOSSARY.md` concise: terms, definitions, and the words to avoid.
