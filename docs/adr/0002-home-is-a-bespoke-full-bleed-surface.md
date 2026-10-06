# The Home Page is a bespoke full-bleed surface

The Home Page was rebuilt as a purpose-built editorial page that behaves differently from
every other template in the theme. It **drops the Epic category sidebar** that
`epic-sidebar-position-home` still configures, renders its Sections **full-bleed outside
the shared `.container`**, uses a **bespoke Hero partial instead of the Config-driven
`components/carousel`**, and **suppresses the site-wide body background image** on the home
`page-type_` class so the Sections' own backgrounds are not interrupted.

All four deviations are deliberate. The other templates share a catalog-driven shape: a
container, a sidebar, a product grid. The Home Page is editorial rather than
catalog-driven, and forcing it into that shared shape would have required either
over-loading the Carousel settings, or a sidebar wide enough to swallow the Design
Reference's full-bleed bands. A future reader looking at the Home Page will otherwise
assume the missing sidebar and the background opt-out are bugs and "fix" them, which is
exactly why this is recorded.

The trade-off is duplication: Home does not reuse the header-adjacent patterns the rest of
the store relies on, so a change to the shared container or sidebar does not reach it. The
`epic-sidebar-position-home` setting and the `epic_sidebar`/`home_*` Widget regions are
left defined so no other page or existing merchant Widget content breaks.
