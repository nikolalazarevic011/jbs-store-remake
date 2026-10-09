/**
 * Home Page module.
 *
 * Owns the bespoke Hero carousel and the Rail scroll controls on the Home Page.
 * Loaded only on the home page (page_type `default`) via app.js, so none of this
 * reaches the rest of the store.
 */

import PageManager from './page-manager';

const REDUCED_MOTION = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default class Home extends PageManager {
    constructor(context) {
        super(context);
    }

    onReady() {
        this.initHero();
        this.initRails();
        this.initConference();
    }

    /**
     * Featured Conference: hydrate the section from the live product via the
     * BigCommerce Storefront GraphQL API.
     *
     * The SKU lives on the section (`data-eh-conference-sku`). On any failure the
     * server-rendered fallback markup is left untouched (silent fallback), so the
     * section always shows a valid product.
     */
    initConference() {
        const section = document.querySelector('[data-eh-conference]');
        if (!section) return;

        const sku = section.getAttribute('data-eh-conference-sku');
        if (!sku) return;

        hydrateConference(section, sku).catch((error) => {
            console.warn('[Home] Featured Conference hydration failed:', error);
        });
    }

    /**
     * Hero carousel: dots, arrows, autoplay, pause on hover/focus.
     */
    initHero() {
        const section = document.querySelector('.eh-hero');
        const slides = Array.from(document.querySelectorAll('[data-eh-hero-slide]'));
        const dots = Array.from(document.querySelectorAll('[data-eh-hero-dot]'));
        const prevBtn = document.querySelector('[data-eh-hero-prev]');
        const nextBtn = document.querySelector('[data-eh-hero-next]');

        if (!section || slides.length < 2) return;

        let index = slides.findIndex(slide => slide.classList.contains('is-active'));
        if (index < 0) index = 0;

        let timer = null;

        const show = (next) => {
            index = (next + slides.length) % slides.length;

            slides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === index);
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === index);
                dot.setAttribute('aria-current', i === index ? 'true' : 'false');
            });
        };

        const stop = () => {
            if (timer) window.clearInterval(timer);
            timer = null;
        };

        const start = () => {
            if (REDUCED_MOTION || timer) return;
            timer = window.setInterval(() => show(index + 1), 7000);
        };

        const restart = () => {
            stop();
            start();
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                show(index - 1);
                restart();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                show(index + 1);
                restart();
            });
        }

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                show(i);
                restart();
            });
        });

        section.addEventListener('mouseenter', stop);
        section.addEventListener('mouseleave', start);
        section.addEventListener('focusin', stop);
        section.addEventListener('focusout', (event) => {
            if (!section.contains(event.relatedTarget)) start();
        });

        show(index);
        start();
    }

    /**
     * Rails: arrow controls scroll one card at a time.
     *
     * Scrolling is animated with requestAnimationFrame rather than native
     * `behavior: 'smooth'`, which is unreliable across browsers and does not
     * animate at all in some headless environments.
     */
    initRails() {
        const rails = Array.from(document.querySelectorAll('[data-eh-rail]'));

        rails.forEach((rail) => {
            const section = rail.closest('.eh-section') || document;
            const prev = section.querySelector('[data-eh-rail-prev]');
            const next = section.querySelector('[data-eh-rail-next]');

            const step = () => {
                const item = rail.querySelector('.eh-card, .eh-speaker');
                if (!item) return rail.clientWidth;
                const gap = parseFloat(getComputedStyle(rail).columnGap || '0') || 0;
                return item.getBoundingClientRect().width + gap;
            };

            const scroll = (direction) => {
                scrollRail(rail, rail.scrollLeft + (direction * step()));
            };

            if (prev) prev.addEventListener('click', () => scroll(-1));
            if (next) next.addEventListener('click', () => scroll(1));
        });
    }
}

/**
 * Animate a Rail's horizontal scroll position.
 * @param {HTMLElement} rail
 * @param {number} target
 */
function scrollRail(rail, target) {
    const max = rail.scrollWidth - rail.clientWidth;
    const to = Math.max(0, Math.min(target, max));
    const from = rail.scrollLeft;
    const distance = to - from;

    if (REDUCED_MOTION || distance === 0) {
        rail.scrollLeft = to;
        return;
    }

    const duration = 350;
    let start = null;
    let done = false;

    const easeOutCubic = t => 1 - ((1 - t) ** 3);

    const finish = () => {
        if (done) return;
        done = true;
        rail.scrollLeft = to;
    };

    const step = (timestamp) => {
        if (done) return;
        if (start === null) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        rail.scrollLeft = from + (distance * easeOutCubic(progress));

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            done = true;
        }
    };

    window.requestAnimationFrame(step);

    // requestAnimationFrame is suspended while a tab is hidden, so guarantee the
    // scroll completes even if the animation frames never arrive.
    window.setTimeout(finish, duration + 50);
}

// -----------------------------------------------------------------------------
// Featured Conference hydration (Storefront GraphQL)
// -----------------------------------------------------------------------------

// Static sku -> gid is unnecessary: `site.product(sku:)` resolves it directly.
const CONFERENCE_GQL_QUERY = `
    query FeaturedConference($sku: String!) {
        site {
            product(sku: $sku) {
                entityId
                name
                path
                sku
                description
                defaultImage {
                    url(width: 800)
                }
                prices {
                    price {
                        value
                        currencyCode
                    }
                    priceRange {
                        min {
                            value
                        }
                    }
                }
                customFields {
                    edges {
                        node {
                            name
                            value
                        }
                    }
                }
            }
        }
    }
`;

/**
 * Read the storefront API token the theme injects into the page
 * (see templates/layout/base.html `{{~inject 'storefrontAPIToken' ...}}`).
 *
 * @returns {string|null}
 */
function getStorefrontToken() {
    const scripts = Array.from(document.querySelectorAll('script:not([src])'));
    const script = scripts.find(node => node.textContent.includes('storefrontAPIToken'));

    if (!script) return null;

    // The stencilBootstrap context is serialised as an escaped JSON string, so
    // strip the backslashes before matching.
    const text = script.textContent.replace(/\\/g, '');
    const match = text.match(/"storefrontAPIToken"\s*:\s*"([^"]+)"/);

    return match && match[1] ? match[1] : null;
}

function customField(product, name) {
    const edges = (product.customFields && product.customFields.edges) || [];
    const hit = edges.find(({ node }) => node.name === name);

    return hit && hit.node.value ? hit.node.value.trim() : '';
}

function formatMoney(value, currencyCode) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return '';

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode || 'USD',
        }).format(amount);
    } catch (e) {
        return `$${amount.toFixed(2)}`;
    }
}

function setText(root, selector, text) {
    const node = root.querySelector(selector);

    if (node && text) node.textContent = text;
}

/**
 * Convert a product description (HTML) into plain text, decoding the handful of
 * entities BigCommerce emits.
 *
 * @param {string} html
 * @returns {string}
 */
function htmlToText(html) {
    if (!html) return '';

    const div = document.createElement('div');
    div.innerHTML = html;

    return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Split a product name into a leading main part and a trailing accent word so it
 * maps onto the two-tone Section title.
 *
 * @param {string} name
 * @returns {{ main: string, accent: string }}
 */
function splitConferenceTitle(name) {
    const clean = String(name || '')
        .replace(/\s*-\s*(Singles|Single)\s*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    const words = clean.split(' ');

    if (words.length < 2) {
        return { main: clean, accent: '' };
    }

    return {
        main: words.slice(0, -1).join(' '),
        accent: words[words.length - 1],
    };
}

/**
 * Fetch the conference product and write it into the section.
 *
 * @param {HTMLElement} section
 * @param {string} sku
 */
async function hydrateConference(section, sku) {
    const token = getStorefrontToken();

    if (!token) return;

    const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            query: CONFERENCE_GQL_QUERY,
            variables: { sku },
        }),
    });

    if (!response.ok) return;

    const json = await response.json();
    const product = json && json.data && json.data.site && json.data.site.product;

    if (!product) return;

    // Cover image + link
    const image = product.defaultImage && product.defaultImage.url;
    const photo = section.querySelector('[data-eh-conf-photo]');
    const link = product.path;

    if (image && photo) photo.src = image;

    if (link) {
        section.querySelectorAll('[data-eh-conf-link]').forEach((anchor) => {
            anchor.href = link;
            if (anchor.getAttribute('aria-label')) anchor.setAttribute('aria-label', product.name);
        });
    }

    // Cover labels
    const releaseYear = customField(product, 'lwcc_releaseyear');
    const format = customField(product, 'lwcc_format');

    setText(section, '[data-eh-conf-year]', releaseYear || String(new Date().getFullYear()));
    setText(section, '[data-eh-conf-format]', format ? `DIGITAL ${format}` : '');

    // Title
    const title = splitConferenceTitle(product.name);

    setText(section, '[data-eh-conf-title-main]', title.main);

    const accent = section.querySelector('[data-eh-conf-title-accent]');

    if (accent && title.accent) accent.textContent = title.accent;

    // Description
    const description = htmlToText(product.description);

    if (description) {
        setText(section, '[data-eh-conf-desc]', description);
    }

    // Price meta
    const priceValue = product.prices
        && product.prices.priceRange
        && product.prices.priceRange.min
        && product.prices.priceRange.min.value;

    const currency = product.prices && product.prices.price && product.prices.price.currencyCode;

    if (priceValue !== null && priceValue !== undefined) {
        const parts = [];

        if (format) parts.push(`DIGITAL ${format}`);
        parts.push(`FROM ${formatMoney(priceValue, currency)}`);

        setText(section, '[data-eh-conf-meta]', parts.join(' · '));
    }
}
