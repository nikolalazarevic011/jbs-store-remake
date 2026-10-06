# Home Section CTAs link to real destinations

The Home Sections were built as a hardcoded visual pass with every call-to-action set to `href="#"` and data wiring explicitly deferred (see ADR-0001). With the catalog now split into `Conferences`, `Español`, and `Merchandise`, we wired the Home CTAs to real destinations: the Format Tiles go to `/mp3/`, `/mp4/`, `/espa-ol/`, "SHOP MERCHANDISE" and the merch cards go to `/merchandise/` and the real product URLs, and "BROWSE SESSIONS" / "view all" go to `/conferences/`.

## Considered Options

- **Wire CTAs from live category/product data (`{{categories}}`, `{{products}}`).** Rejected for this pass: the Sections are bespoke, their copy and layout are hand-tuned, and full data wiring is a larger change tracked separately.
- **Leave `href="#"`.** Rejected: dead CTAs on the primary surface are a visible defect now that the categories exist.

## Consequences

- A helper param `viewAllUrl` was added to `epic/home/section-header` so the shared "view all" link can be pointed. It falls back to `#` when omitted.
- The links are hardcoded URLs, so a category slug change (for example the Español slug becoming `/espa-ol/` rather than `/espanol/`) requires editing the templates. This is consistent with ADR-0001's premise that editing Section content is a deployment, not a merchant action.
- Product card prices and titles in `merch.html` and `releases.html` remain hardcoded and can drift from the catalog until that data wiring is done.
