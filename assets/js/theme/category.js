import { hooks } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import urlUtils from './common/utils/url-utils';
import { createTranslationDictionary } from './common/utils/translations-utils';

export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').trigger('focus');
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        this.initFacetedSearch();

        // Pagination must be hard navigation to avoid facetedSearch ajax
        // injecting a mismatched sidebar fragment that breaks the float grid
        // and appears as "css broke". Strip the hook attribute so
        // stencil-utils never emits facetedSearch-facet-clicked for pagination.
        this.disableAjaxPagination();

        if (!$('#facetedSearch').length) {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);

            // Refresh range view when shop-by-price enabled
            const urlParams = new URLSearchParams(window.location.search);

            if (urlParams.has('search_query')) {
                $('.reset-filters').show();
            }

            $('input[name="price_min"]').attr('value', urlParams.get('price_min'));
            $('input[name="price_max"]').attr('value', urlParams.get('price_max'));
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.trigger('focus');
        }
    }

    disableAjaxPagination() {
        const stripPaginationFacetAttr = () => {
            // Pagination should always be hard navigation — facetedSearch ajax
            // for pagination swaps the sidebar fragment and has historically
            // produced unstyled flashes / broken grid. Remove the hook attr
            // so stencil-utils never emits facetedSearch-facet-clicked for pages.
            $('.pagination a[data-faceted-search-facet]').removeAttr('data-faceted-search-facet');
        };

        stripPaginationFacetAttr();

        // Facet filtering still uses ajax and re-renders productListing (which
        // includes a fresh paginator with the attribute). Re-strip after each
        // facetedSearch refresh so pagination stays hard-nav.
        $('body').on('compareReset', stripPaginationFacetAttr);
        // Mutation fallback in case compareReset is not triggered
        const observer = new MutationObserver(stripPaginationFacetAttr);
        const listing = document.getElementById('product-listing-container');
        if (listing) observer.observe(listing, { childList: true, subtree: true });

        // Last-resort capture handler: if a pagination link still has the
        // attribute (race), force hard navigation before the faceted hook runs.
        document.addEventListener('click', (e) => {
            const target = e.target.closest && e.target.closest('.pagination a[data-faceted-search-facet]');
            if (target && target.href) {
                e.preventDefault();
                e.stopImmediatePropagation();
                window.location.assign(target.href);
            }
        }, true);
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            // Validate fragment — if stencil returns a full document, force hard navigation
            const isInvalidFragment = typeof content.productListing === 'string'
                && /<\s*html|<\s*head/i.test(content.productListing);
            if (isInvalidFragment) {
                window.location.assign(urlUtils.getUrl());
                return;
            }

            $productListingContainer.html(content.productListing);
            if (content.sidebar) {
                $facetedSearchContainer.html(content.sidebar);
            }

            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }
}
