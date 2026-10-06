# Home Sections are hardcoded with visibility-only theme-setting toggles

The Home Page's Sections were rebuilt from the Design Reference with their heading text and
layout written directly into Handlebars partials under `templates/components/epic/home/`,
not as Page Builder Widgets. Each Section is wrapped in a per-Section theme-setting
`{{#if theme_settings.epic-home-*-enable}}` toggle so a merchant can hide it from the
BigCommerce store control panel without a code change. The toggle controls visibility
only, a merchant cannot edit a Section's copy from the control panel.

We chose this over Widget regions because Page Builder Widgets would have handed content
authoring to the merchant at the cost of the fixed editorial layout the Design Reference
specifies, and because the reference copy is placeholder-quality and expected to be
replaced in code before launch. The trade-off is deliberate: **editing Section content is
a deployment, not a merchant action.** If Sections later need merchant-editable copy,
that is a Widget migration, and this ADR should be superseded rather than worked around.

`epic-home-hero-enable` is the clearest example: the Hero is a bespoke partial, not the
shared `components/carousel`, so it cannot be driven by the existing Carousel settings.
