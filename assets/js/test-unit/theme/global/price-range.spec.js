import priceRange from '../../../theme/global/price-range';

function card(id, priceText) {
    return `
        <article class="card" data-entity-id="${id}" data-product-price="${priceText}">
            <div class="card-body">
                <div class="card-text price-card-text" data-test-info-type="price">
                    <div class="price-section price-section--withoutTax price--withoutTax">
                        <span data-product-price-without-tax class="price">${priceText}</span>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function listItem(id, priceText) {
    return `
        <article class="listItem" data-entity-id="${id}" data-product-price="${priceText}">
            <div class="listItem-body">
                <div class="listItem-price">
                    <div class="price-section price-section--withoutTax price--withoutTax">
                        <span data-product-price-without-tax class="price">${priceText}</span>
                    </div>
                </div>
            </div>
        </article>
    `;
}

function loginCard(id) {
    return `
        <article class="card" data-entity-id="${id}" data-product-price="Log in for pricing">
            <div class="card-body">
                <div class="card-text price-card-text" data-test-info-type="price">
                    <span class="price">Log in for pricing</span>
                </div>
            </div>
        </article>
    `;
}

function productView(id, extra = '') {
    return `
        <div class="productView" data-entity-id="${id}">
            <section class="productView-details product-data">
                <div class="productView-product">
                    <h1 class="productView-title">Conference</h1>
                    <div data-content-region="product_below_price"></div>
                    ${extra}
                </div>
            </section>
        </div>
    `;
}

function mockFetch(payload, ok = true) {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok,
            status: ok ? 200 : 500,
            json: () => Promise.resolve(payload),
        }),
    );
}

function pricesIn(root) {
    return Array.from(root.querySelectorAll('[data-product-price-without-tax]')).map((el) =>
        el.textContent.trim(),
    );
}

describe('priceRange', () => {
    let root;

    beforeEach(() => {
        root = document.createElement('div');
        document.body.appendChild(root);
    });

    afterEach(() => {
        root.remove();
        document.body.innerHTML = '';
        jest.restoreAllMocks();
        delete global.fetch;
    });

    describe('listing cards', () => {
        it('swaps in the range for a qualifying card, preserving the price markup', async () => {
            root.innerHTML = card(131, '$20.00');
            mockFetch({ success: true, data: { 131: { min: 20, max: 25, count: 2 } } });

            const applied = await priceRange(root);

            expect(applied[131]).toBeDefined();
            expect(pricesIn(root)[0]).toBe('$20.00 \u2013 $25.00');
            expect(root.querySelector('.price-section--withoutTax')).not.toBeNull();
        });

        it('leaves a non-qualifying card unchanged', async () => {
            root.innerHTML = card(131, '$20.00') + card(99999, '$12.00');
            mockFetch({ success: true, data: { 131: { min: 20, max: 25 } } });

            await priceRange(root);

            const texts = pricesIn(root);

            expect(texts[0]).toBe('$20.00 \u2013 $25.00');
            expect(texts[1]).toBe('$12.00');
        });

        it('overlays list-view rows too', async () => {
            root.innerHTML = listItem(131, '$20.00');
            mockFetch({ success: true, data: { 131: { min: 20, max: 25 } } });

            await priceRange(root);

            expect(root.querySelector('.listItem-price [data-product-price-without-tax]').textContent)
                .toBe('$20.00 \u2013 $25.00');
        });

        it('leaves login-for-pricing cards untouched', async () => {
            root.innerHTML = loginCard(131);
            mockFetch({ success: true, data: { 131: { min: 20, max: 25 } } });

            await priceRange(root);

            expect(root.querySelector('[data-test-info-type="price"]').textContent.trim())
                .toBe('Log in for pricing');
        });

        it('falls back silently when the request fails', async () => {
            root.innerHTML = card(131, '$20.00');
            mockFetch({ success: false }, false);

            await priceRange(root);

            expect(pricesIn(root)[0]).toBe('$20.00');
        });

        it('falls back silently when the response has no data', async () => {
            root.innerHTML = card(131, '$20.00');
            mockFetch({ success: true, data: {} });

            await priceRange(root);

            expect(pricesIn(root)[0]).toBe('$20.00');
        });

        it('batches and chunks ids beyond the per-request cap', async () => {
            const cards = [];

            for (let i = 1; i <= 150; i += 1) {
                cards.push(card(i, '$5.00'));
            }

            root.innerHTML = cards.join('');
            mockFetch({ success: true, data: {} });

            await priceRange(root);

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('requests the ids via the price-ranges route', async () => {
            root.innerHTML = card(131, '$20.00');
            mockFetch({ success: true, data: {} });

            await priceRange(root);

            expect(global.fetch.mock.calls[0][0]).toContain('products/price-ranges');
            expect(global.fetch.mock.calls[0][0]).toContain('ids=131');
        });
    });

    describe('custom surfaces', () => {
        it('overlays an element that is itself the price node', async () => {
            root.innerHTML = '<span class="landing-feature__price" data-price-range-id="131" data-price-range-price>$20.00</span>';
            mockFetch({ success: true, data: { 131: { min: 20, max: 25 } } });

            await priceRange(root);

            expect(root.querySelector('[data-price-range-id]').textContent)
                .toBe('$20.00 \u2013 $25.00');
        });
    });

    describe('option-parent product page', () => {
        it('injects a headline range', async () => {
            root.innerHTML = productView(131);
            mockFetch({ success: true, data: { 131: { min: 20, max: 25 } } });

            await priceRange(root);

            const headline = root.querySelector('.productView-price[data-product-price-range]');

            expect(headline).not.toBeNull();
            expect(headline.textContent).toBe('$20.00 \u2013 $25.00');
        });

        it('does not inject when the product has no qualifying range', async () => {
            root.innerHTML = productView(131);
            mockFetch({ success: true, data: {} });

            await priceRange(root);

            expect(root.querySelector('.productView-price[data-product-price-range]')).toBeNull();
        });

        it('does not duplicate an existing server-rendered price', async () => {
            root.innerHTML = productView(
                132,
                '<div class="productView-price"><span>$12.00</span></div>',
            );
            mockFetch({ success: true, data: { 132: { min: 12, max: 12 } } });

            await priceRange(root);

            expect(root.querySelectorAll('.productView-price').length).toBe(1);
        });
    });
});
