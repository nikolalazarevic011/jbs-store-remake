import epicSearch from "./epic-search";
import initAudioPlayer from "./audio-player";

export default function customScripts(context) {
    if (context.themeSettings["epic-toggle-search"]) epicSearch();

    searchFix();
    navActiveFix();
    initAudioPlayer();
    initWidgetPlayButtons();
    initSpeakerSearch();
}

/**
 * Featured-speaker search narrowing.
 *
 * Speaker cards in the home page's "Featured Speakers" section link to a
 * keyword search for the speaker's name. BigCommerce search is OR-based and
 * also matches product descriptions, so a query like "Caroline Leaf" returns
 * every sibling single whose shared description lists the whole conference
 * lineup, even though only a couple of products are actually about her.
 *
 * Those speaker links carry an `eh_speaker=<name>` query parameter. On the
 * search results page we read that value and drop any card whose title does
 * not actually contain the speaker's name, leaving only the resources
 * genuinely named after that speaker.
 */

const SPEAKER_PARAM = 'eh_speaker';

const normalizeSpeakerText = (value) => String(value || '')
    .toLowerCase()
    .replace(/\b(dr|pastor|rev|mr|mrs|ms)\.?\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getSpeakerFromLocation = () => {
    try {
        return new URL(window.location.href).searchParams.get(SPEAKER_PARAM);
    } catch (error) {
        return null;
    }
};

const getCardTitle = (card) => {
    const title = card.querySelector('.card-title');
    return title ? title.textContent : '';
};

const setCountLabel = (selector, count) => {
    const node = document.querySelector(`${selector} span`);
    if (node) node.textContent = `Products (${count})`;
};

const setHeading = (count, query) => {
    const heading = document.querySelector('#search-results-heading .page-heading');
    if (!heading) return;
    const label = count === 1 ? 'result' : 'results';
    heading.textContent = `${count} ${label} for '${query}'`;
};

// Speaker searches are exact name searches, so BigCommerce's fuzzy typo
// suggestion ("Did you mean ...") is just noise. Drop it, along with its
// now-empty wrapper panel.
const removeSearchSuggestions = () => {
    document.querySelectorAll('.search-suggestion').forEach((suggestion) => {
        const panel = suggestion.closest('.panel');
        suggestion.remove();
        if (panel && !panel.textContent.trim()) panel.remove();
    });
};

function initSpeakerSearch() {
    // The narrowing only runs on the search results page.
    const container = document.getElementById('product-listing-container');
    if (!container) return;

    const speaker = getSpeakerFromLocation();
    const speakerKey = normalizeSpeakerText(speaker);
    if (!speakerKey) return;

    const cards = container.querySelectorAll('li.product');
    let removed = 0;

    cards.forEach((card) => {
        const titleKey = normalizeSpeakerText(getCardTitle(card));
        if (titleKey.includes(speakerKey)) return;
        card.remove();
        removed += 1;
    });

    // The speaker links request every match at once (`limit=100`), so all
    // results are already on this page and any pager is misleading.
    document.querySelectorAll('.pagination').forEach((pager) => pager.remove());
    removeSearchSuggestions();

    if (removed > 0) {
        const remaining = cards.length - removed;
        setCountLabel('#search-results-product-count', remaining);
        setHeading(remaining, speaker);
    }
}

export function initWidgetPlayButtons() {
    async function fetchAndInjectPlayButton(card) {
        if (card.dataset.processedPlayButton) return;
        card.dataset.processedPlayButton = 'true';

        const linkEl = card.querySelector('a');
        if (!linkEl) return;
        const href = linkEl.getAttribute('href');
        if (!href || href === '#') return;

        try {
            const res = await fetch(href);
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            const sampleBtn = doc.querySelector('.play-sample-btn');
            if (sampleBtn && sampleBtn.getAttribute('data-sample-url') && !card.querySelector('.play-sample-btn')) {
                const playBtnClone = sampleBtn.cloneNode(true);
                const priceEl = card.querySelector('[data-test-id="product-set-widget-price"]');
                if (priceEl) {
                    const container = document.createElement('div');
                    container.className = 'price-and-sample-container widget-price-container';
                    
                    priceEl.parentNode.insertBefore(container, priceEl);
                    container.appendChild(priceEl);
                    container.appendChild(playBtnClone);
                    
                    priceEl.style.width = 'auto';
                    priceEl.style.setProperty('width', 'auto', 'important');
                }
            }
        } catch (e) {
            console.error('Error fetching sample button for ' + href, e);
        }
    }

    function scanAndInject() {
        const cards = document.querySelectorAll('.css-1k0woj');
        if (cards.length > 0) {
            cards.forEach(card => {
                fetchAndInjectPlayButton(card);
            });
        }
    }

    scanAndInject();

    const observer = new MutationObserver(() => {
        scanAndInject();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

export function navActiveFix() {
    const currentPath = window.location.pathname;
    $(".navPages-list .navPages-action").each(function () {
        const $this = $(this);
        const href = $this.attr("href");
        // Match exact path or sub-path (for categories)
        if (
            href &&
            href !== "#" &&
            (href === currentPath ||
                (href !== "/" && currentPath.indexOf(href) === 0))
        ) {
            $this.addClass("activePage");
        }
    });
}

export function searchFix() {
    // hide quick search results when clicked outside of quick search
    $(window).on("click", () => {
        $(
            ".quickSearch .quickSearchResults, .header-search .quickSearchResults",
        ).hide();
    });

    $(".quickSearch, .header-search").on("click", ".modal-close", () => {
        $(
            ".quickSearch .quickSearchResults, .header-search .quickSearchResults",
        ).hide();
    });

    $(".quickSearch, .header-search").on("click", (event) => {
        event.stopPropagation();
    });

    // show quick search results when focused in search input
    $(".quickSearch input, .header-search input").on("focusin", () => {
        $(
            ".quickSearch .quickSearchResults, .header-search .quickSearchResults",
        ).show();
    });
}
