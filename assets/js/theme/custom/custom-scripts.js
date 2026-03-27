import epicSearch from "./epic-search";

export default function customScripts(context) {
    if (context.themeSettings["epic-toggle-search"]) epicSearch();

    searchFix();
    navActiveFix();
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
