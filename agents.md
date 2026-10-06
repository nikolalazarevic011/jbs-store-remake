# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Deploying the theme

Use the reusable `deploy_theme.py` for all theme deploys. It bumps the version, bundles with the Stencil CLI, uploads the zip, waits for the theme job, and optionally activates.

```bash
python deploy_theme.py --dry-run                  # show the plan, change nothing
python deploy_theme.py --bump patch               # bump + bundle + upload (no activate)
python deploy_theme.py --bump patch --activate    # bump + bundle + upload + activate
python deploy_theme.py --no-bump --activate       # deploy the current version as-is
```

- Credentials come from `secrets.stencil.json` (git-ignored). Never hardcode them.
- The store hash defaults to the JBS store and can be overridden with `--store-hash` or `BIGCOMMERCE_STORE_HASH`.
- `--variation` picks the theme variation to activate (default: the first). Use `--variation "Camping"` for this store.
- The old one-off scripts (`push_theme_jbs.py`, `activate_theme_jbs.py`) are superseded by `deploy_theme.py`.


# Project goals
based on replit's ideas at - C:\Users\NLazarevic\ME\jbs new store\replit-design v2
keep the current project's colors, they should be similar to the replits anyway
keep header and footer intact,


## Instructions

1. My personal GitHub: https://github.com/nikolalazarevic011
2. Work GitHub:
   - Work user: https://github.com/nlazarevic733
   - Work repo/org: https://github.com/lwcc-web
3. Use `gh` CLI for GitHub operations.
4. Use the installed `jira-cli` (`jira`) for Jira operations instead of the MCP server. Run `jira --help` if you need to see available commands. Jira space for this project is called {JNS}, ASK ME FOR IT IF I FORGET TO PASTE IT HERE
5. Use the Notion MCP or CLI for Notion operations. Create sub-pages inside pages if you cannot fit all thoughts on one page due to body limits, and to keep content organized. Notion page is https://app.notion.com/p/NEW-JBS-store-330778a5fc8a80d1ad13ca4a2f3053ac 
6. If you are unsure about how to implement a specific pattern or library feature, always use the Context7 MCP or CLI to query up-to-date documentation and examples.
7. Use the Chrome DevTools MCP for browser debugging, web development, and live UI/runtime inspection.
   - When to use: Debugging frontend code, inspecting DOM elements/CSS styles, monitoring console logs and JavaScript errors, analyzing live network requests, checking local storage/session data, or validating UI layouts in real-time.
   - How to use: Connect to active Chrome instances or inspect local web server previews to diagnose and verify visual or functional bugs directly in the browser environment before making code changes.
8. If any of the previous cli or MCP or CLI commands fail TELL USER/ME so he can fix it   
9. NEVER add any AI-agent attribution (e.g. `Co-authored-by:` trailers, `Authored-by`, agent names) to commits or PRs. Every commit/PR must look authored purely by the user; strip any such marker before pushing/merging.
10. NEVER push to a WORK repo/remote without my explicit consent. This applies to the `lwcc-web` org and any repo under the work account (`nlazarevic733`), including the `work` remote. Personal repos (`nikolalazarevic011`) may be pushed normally. If a push targets a work remote, STOP and ask first — even if an earlier instruction said "push". Also never `gh auth switch` to the work account on your own; ask first (it is shared with other repos).
11. To my work repo/org - https://github.com/lwcc-web , never commit the any bmad or skills (like mattpocock that we installed) files or folders like./skills-lock.json or any or .agent folders etc
12. api keys to api call backoffice for whatever u need, find them at - C:\Users\NLazarevic\ME\jbs new store\webhook
13. local dev theme stencil server at - http://localhost:42134/, if you're reading this it's prob already started so try accessing it
  
