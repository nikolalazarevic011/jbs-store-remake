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
