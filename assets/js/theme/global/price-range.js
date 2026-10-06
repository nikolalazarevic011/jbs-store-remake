import API_CONFIG from '../api-config';

/**
 * Price range overlay for "Picklist parents" (products whose price is driven by
 * a product_list_with_images option list of child products).
 *
 * Cards (and option-parent product pages) only receive the parent's cheapest
 * child price from BigCommerce. This module batches the product ids rendered on
 * the page, asks the storefront picklist API for each product's child-price
 * range, and swaps the full range (`$5.00 – $8.00`) into the existing price
 * element.
 *
 * Behaviour:
 * - additive: the current price stays visible until a range arrives
 * - silent fallback: on any error / missing id the existing price is untouched
 * - no spinner, no layout shift
 */

// Grid cards and list-view rows both carry the product id; their price lives in
// different wrappers.
const CARD_SELECTOR = '[data-entity-id][data-product-price], article.card[data-entity-id], article.listItem[data-entity-id]';
const CARD_PRICE_SELECTOR = '[data-test-info-type="price"], .listItem-price';
// The visible price is rendered into one of these spans by components/products/price.
const PRICE_VALUE_SELECTOR = '[data-product-price-without-tax], [data-product-price-with-tax]';
// Custom surfaces opt in explicitly with these attributes.
const CUSTOM_ITEM_SELECTOR = '[data-price-range-id]';
const CUSTOM_PRICE_SELECTOR = '[data-price-range-price]';
const PRODUCT_VIEW_SELECTOR = '.productView[data-entity-id]';
const PRODUCT_VIEW_PRICE_SELECTOR = '.productView-price';
const BATCH_SIZE = 100;
const EN_DASH = '\u2013';

// A currency prefix is a short symbol/code immediately preceding a number,
// e.g. "$5.00", "£5.00", "USD 5.00". Price labels such as "MSRP:" or
// "Now: (Inc. Tax)" never sit directly before a digit, so they can't be
// mistaken for currency.
const CURRENCY_BEFORE_NUMBER = /([^\d\s]{1,3})\s*\d/;

function currencyPrefixFrom(text) {
    const match = String(text || '').match(CURRENCY_BEFORE_NUMBER);

    return match ? match[1] : null;
}

function detectCurrencyPrefix(root) {
    const candidates = root.querySelectorAll(`${CARD_PRICE_SELECTOR}, .price, .productView-price`);

    for (const node of candidates) {
        const prefix = currencyPrefixFrom(node.textContent);

        if (prefix) {
            return prefix;
        }
    }

    return '$';
}

function formatRange(range, currencyPrefix) {
    const min = Number(range.min).toFixed(2);
    const max = Number(range.max).toFixed(2);

    return `${currencyPrefix}${min} ${EN_DASH} ${currencyPrefix}${max}`;
}

function priceRangeEndpoint() {
    const base = String(API_CONFIG.BASE_URL || '').replace(/\/$/, '');
    const path = API_CONFIG.ENDPOINTS?.PRODUCT_PRICE_RANGES || '/products/price-ranges';

    // Support both clean URLs and query-string routes.
    const separator = path.indexOf('?') === -1 ? '?' : '&';

    return `${base}${path}${separator}`;
}

async function fetchRanges(ids) {
    const response = await fetch(`${priceRangeEndpoint()}ids=${ids.join(',')}`, {
        headers: API_CONFIG.DEFAULT_HEADERS || { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Price range request failed (${response.status})`);
    }

    const json = await response.json();

    return json && json.success ? (json.data || {}) : {};
}

function chunk(items, size) {
    const chunks = [];

    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }

    return chunks;
}

function resolvePriceValueNode($container) {
    const $values = $container.querySelectorAll(PRICE_VALUE_SELECTOR);

    for (const $value of $values) {
        if (/\d/.test($value.textContent)) {
            return $value;
        }
    }

    return $container;
}

function collectPriceNodes(root) {
    const byId = new Map();

    root.querySelectorAll(CARD_SELECTOR).forEach((card) => {
        const id = Number(card.getAttribute('data-entity-id'));

        if (!id) return;

        const $container = card.querySelector(CARD_PRICE_SELECTOR);

        if (!$container) return;

        // Respect stores that hide pricing from guests: leave login prompts alone.
        if (!/\d/.test($container.textContent)) return;

        if (!byId.has(id)) {
            byId.set(id, []);
        }

        byId.get(id).push(resolvePriceValueNode($container));
    });

    // Custom surfaces (data-attribute opt-in).
    root.querySelectorAll(CUSTOM_ITEM_SELECTOR).forEach((item) => {
        const id = Number(item.getAttribute('data-price-range-id'));

        if (!id) return;

        const $price = item.matches(CUSTOM_PRICE_SELECTOR)
            ? item
            : item.querySelector(CUSTOM_PRICE_SELECTOR);

        if (!$price || !/\d/.test($price.textContent)) return;

        if (!byId.has(id)) {
            byId.set(id, []);
        }

        byId.get(id).push($price);
    });

    return byId;
}

function applyRanges(byId, ranges, pagePrefix) {
    Object.keys(ranges).forEach((id) => {
        const range = ranges[id];
        const $nodes = byId.get(Number(id));

        if (!$nodes || !$nodes.length) return;

        $nodes.forEach(($node) => {
            const prefix = currencyPrefixFrom($node.textContent) || pagePrefix;
            $node.textContent = formatRange(range, prefix);
        });
    });
}

function injectProductViewHeadline(root, ranges, currencyPrefix) {
    const $productView = root.querySelector(PRODUCT_VIEW_SELECTOR);

    if (!$productView) return;

    const id = Number($productView.getAttribute('data-entity-id'));
    const range = ranges[id];

    if (!range) return;

    // The price block is only server-rendered for products without options, so
    // an option-parent has no headline price. Don't duplicate an existing one.
    if ($productView.querySelector(PRODUCT_VIEW_PRICE_SELECTOR)) return;

    const $slot = $productView.querySelector('.productView-product');

    if (!$slot) return;

    const $headline = document.createElement('div');
    $headline.className = 'productView-price';
    $headline.setAttribute('data-product-price-range', String(id));
    $headline.textContent = formatRange(range, currencyPrefix);

    const $below = $slot.querySelector('[data-content-region="product_below_price"]');

    if ($below) {
        $below.insertAdjacentElement('beforebegin', $headline);
    } else {
        $slot.appendChild($headline);
    }
}

/**
 * Run the price-range overlay for the current page.
 *
 * @param {Document|HTMLElement} [root]
 * @returns {Promise<object>} the ranges that were applied (for tests)
 */
export default async function priceRange(root = document) {
    try {
        const byId = collectPriceNodes(root);

        // On a product page, always include the viewed product so an
        // option-parent can get a headline range.
        const $productView = root.querySelector(PRODUCT_VIEW_SELECTOR);

        if ($productView) {
            const id = Number($productView.getAttribute('data-entity-id'));

            if (id && !byId.has(id)) {
                byId.set(id, []);
            }
        }

        const ids = Array.from(byId.keys());

        if (!ids.length) return {};

        const ranges = {};

        for (const batch of chunk(ids, BATCH_SIZE)) {
            /* eslint-disable no-await-in-loop */
            const result = await fetchRanges(batch);
            Object.assign(ranges, result);
        }

        const pagePrefix = detectCurrencyPrefix(root);

        applyRanges(byId, ranges, pagePrefix);
        injectProductViewHeadline(root, ranges, pagePrefix);

        return ranges;
    } catch (error) {
        // Silent fallback: leave whatever price the page already shows.
        return {};
    }
}
