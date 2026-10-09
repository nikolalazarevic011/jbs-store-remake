# The Featured Conference Section hydrates from the Storefront GraphQL API

The Featured Conference Section (`epic/home/conference.html`) renders its cover, title,
description, price and link from the live product with SKU `GBLC25JBS`. The SKU lives on
the Section element (`data-eh-conference-sku`). On load, `assets/js/theme/home.js` reads the
storefront API token the theme already injects (`storefrontAPIToken`, see
`templates/layout/base.html`) and runs a `site.product(sku:)` Storefront GraphQL query, then
writes the result into `[data-eh-conf-*]` hooks.

This is the first Home Section to take live catalog data, which ADR-0001 and ADR-0003 both
deferred ("data wiring is a larger change tracked separately"). It does not supersede them:
the Section's layout and copy are still authored in code, only the product-derived values
are dynamic.

## Considered Options

- **Server-render the product in Handlebars.** Rejected: Stencil exposes product filters on
  product, category, and search pages, not on the home template, and the section is
  SKU-driven rather than page-scoped.
- **Fetch via the custom picklist API (`jbs-new-store-bigcommerce.lwccportal.com/api`).**
  Rejected: that API has no product-by-SKU route, and adding one would put a server-side
  catalog read behind a bespoke endpoint for a value the storefront API already returns.
- **Storefront GraphQL (`/graphql` with the injected `storefrontAPIToken`).** Chosen: it is
  same-origin, needs no new secrets, and returns product, image, price and custom fields in
  one round trip.
- **Storefront REST (`/api/storefront/products?sku=`).** Not available on the store's plan.

## Consequences

- The Section keeps a hardcoded fallback (correct values for `GBLC25JBS`) in the template so
  it renders fully before JS and if the fetch fails. Hydration is silent-fallback: any error
  leaves the fallback untouched.
- The storefront token must be present on the page. If `settings.storefront_api` is ever
  unset, hydration no-ops and the fallback stands.
- The SKU is a template constant. Changing the featured product is a content edit in
  `conference.html` (`data-eh-conference-sku`), consistent with ADR-0001's premise that
  editing Section content is a deployment, not a merchant action.
- Cover labels are legible over any product photo via a top/bottom scrim on
  `.eh-cover__image` (`.eh-cover__labels` itself has no background), so a light image cannot
  wash out the year.
