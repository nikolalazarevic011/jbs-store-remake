export default function initAudioPlayer() {
    let globalAudio = null;
    let activeBtn = null;

    function cleanEmptySampleButtons() {
        document.querySelectorAll('.play-sample-btn').forEach(btn => {
            const url = btn.getAttribute('data-sample-url');
            if (!url || !url.trim() || !url.includes('http')) {
                const wrapper = btn.closest('.productView-sample');
                if (wrapper) {
                    wrapper.remove();
                } else {
                    btn.remove();
                }
            }
        });
    }

    // Run cleanup initially
    cleanEmptySampleButtons();

    // Observe DOM mutations to clean up dynamically loaded empty buttons (e.g. quick view, filters)
    const domObserver = new MutationObserver(() => {
        cleanEmptySampleButtons();
    });
    domObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    function resetBtnState(btn) {
        if (!btn) return;
        btn.classList.remove('is-playing', 'is-loading');
        const textEl = btn.querySelector('.play-btn-text');
        if (textEl) textEl.textContent = 'Play Sample';
        
        const playIcon = btn.querySelector('.icon-play');
        const pauseIcon = btn.querySelector('.icon-pause');
        const loadingIcon = btn.querySelector('.icon-loading');
        
        if (playIcon) playIcon.style.display = '';
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (loadingIcon) loadingIcon.style.display = 'none';
    }

    function setBtnPlaying(btn) {
        if (!btn) return;
        btn.classList.remove('is-loading');
        btn.classList.add('is-playing');
        const textEl = btn.querySelector('.play-btn-text');
        if (textEl) textEl.textContent = 'Pause';

        const playIcon = btn.querySelector('.icon-play');
        const pauseIcon = btn.querySelector('.icon-pause');
        const loadingIcon = btn.querySelector('.icon-loading');
        
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = '';
        if (loadingIcon) loadingIcon.style.display = 'none';
    }

    function setBtnLoading(btn) {
        if (!btn) return;
        btn.classList.remove('is-playing');
        btn.classList.add('is-loading');
        const textEl = btn.querySelector('.play-btn-text');
        if (textEl) textEl.textContent = 'Loading...';

        const playIcon = btn.querySelector('.icon-play');
        const pauseIcon = btn.querySelector('.icon-pause');
        const loadingIcon = btn.querySelector('.icon-loading');
        
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) playIcon.style.display = 'none';
        if (loadingIcon) loadingIcon.style.display = '';
    }

    function initAudio() {
        if (globalAudio) return;
        globalAudio = new Audio();

        globalAudio.addEventListener('play', () => {
            if (activeBtn) setBtnPlaying(activeBtn);
        });

        globalAudio.addEventListener('playing', () => {
            if (activeBtn) setBtnPlaying(activeBtn);
        });

        globalAudio.addEventListener('pause', () => {
            if (activeBtn) resetBtnState(activeBtn);
        });

        globalAudio.addEventListener('waiting', () => {
            if (activeBtn) setBtnLoading(activeBtn);
        });

        globalAudio.addEventListener('loadstart', () => {
            if (activeBtn) setBtnLoading(activeBtn);
        });

        globalAudio.addEventListener('ended', () => {
            resetBtnState(activeBtn);
            activeBtn = null;
        });

        globalAudio.addEventListener('error', (e) => {
            console.error('Audio playback error:', e);
            alert('Failed to play the sample. Please try again.');
            resetBtnState(activeBtn);
            activeBtn = null;
        });
    }

    document.body.addEventListener('click', (event) => {
        const btn = event.target.closest('.play-sample-btn');
        if (!btn) return;
        event.preventDefault();

        initAudio();

        const url = btn.getAttribute('data-sample-url');
        if (!url) return;

        if (activeBtn === btn) {
            if (!globalAudio.paused) {
                globalAudio.pause();
            } else {
                globalAudio.play().catch(err => console.error('Play failed:', err));
            }
        } else {
            if (activeBtn) {
                resetBtnState(activeBtn);
            }
            activeBtn = btn;
            setBtnLoading(activeBtn);
            
            globalAudio.src = url;
            globalAudio.load();
            globalAudio.play().catch(err => {
                console.error('Play failed:', err);
                resetBtnState(activeBtn);
                activeBtn = null;
            });
        }
    });
}
