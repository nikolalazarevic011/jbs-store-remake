# Storefront Home Page

The front surface of the JBS store. Every visitor can reach it, and it carries the
editorial, non-catalog presentation of the brand. This context exists to keep the
vocabulary of that page separate from the catalog surfaces that follow it.

## Language

**Home Page**:
The storefront surface a visitor reaches at the site root. It is editorial rather than
catalog-driven: it introduces the brand and routes visitors into the store.
_Avoid_: Landing page, homepage, storefront, front page

**Design Reference**:
The externally produced prototype that specifies the target look, section order, and
copy for the Home Page. It is a specification to be adapted, not a template to be copied.
_Avoid_: Mockup, spec, template, prototype

**Section**:
One full-width horizontal band of the Home Page, with its own heading and content, that
can be shown or hidden as a unit.
_Avoid_: Block, module, widget, component, row, band

**Section Toggle**:
A merchant-facing switch that controls whether one Section renders.
_Avoid_: Setting, flag, option, preference

**Hero**:
The first Section of the Home Page: a full-bleed image carousel with overlaid headline,
supporting line, and actions.
_Avoid_: Banner, slider, jumbotron

**Rail**:
A horizontally scrolling row of cards inside a Section.
_Avoid_: Carousel, slider, scroller

**Format Tile**:
A compact card representing one way a product is delivered, used by the Shop by Format
Section to let visitors choose delivery before choosing a product.
_Avoid_: Category tile, icon tile

**Product Card**:
A single product as shown inside a Rail or grid: image, name, price, and action.
_Avoid_: Product tile, product item

**Page Tail**:
The blank vertical space between the last Section and the Footer. It belongs to the theme
chrome around the Sections, not to any Section, so it is set once for the whole Home Page.
_Avoid_: Bottom gap, whitespace, dead space

**Readable Account Typography**:
The targeted SCSS mixin and rules in `assets/scss/custom/_custom.scss` that lift body copy to 15px, form controls and labels to 16px (eliminating iOS auto-zoom on input focus), headings to 23px, and product titles to 17px across account, order, download, and authentication views without altering any store theme palette colors.
_Avoid_: global root font override, account color overrides

**Fluid Navigation Scaling**:
The responsive font size clamp (`clamp(12px, calc(0.79vw + 3.1px), 15px)`) and horizontal padding rules in `assets/scss/epic/theme.scss` applied to top-level navigation items on the Primary Navigation Bar, ensuring category menus fit on a single row across tablet and desktop breakpoints without wrapping.
_Avoid_: fixed nav font size

