import epicSearch from "./epic-search";
import initAudioPlayer from "./audio-player";

export default function customScripts(context) {
    if (context.themeSettings["epic-toggle-search"]) epicSearch();

    searchFix();
    navActiveFix();
    initAudioPlayer();
    initWidgetPlayButtons();
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
