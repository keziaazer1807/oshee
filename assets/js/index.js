/* ==========================================================================
   Oshee_ Personal Profile — Pure Vanilla JS
   Zero external dependencies | Works cleanly over HTTP and file://
   ========================================================================== */

(() => {
    "use strict";

    const STORAGE_KEY_THEME = "oshee_theme";
    const MUSIC_TRACKS = [
        {
            src: "./assets/music/Anh Chưa Từng Hết Yêu buitruonglinh.mp3",
            title: "Anh Chưa Từng Hết Yêu — buitruonglinh"
        },
        {
            src: "./assets/music/Chỉ Là Không Có Nhau buitruonglinh.mp3",
            title: "Chỉ Là Không Có Nhau — buitruonglinh"
        },
        {
            src: "./assets/music/Giờ Thì buitruonglinh.mp3",
            title: "Giờ Thì — buitruonglinh"
        },
        {
            src: "./assets/music/In Love x Nơi Này Có Anh.mp3",
            title: "In Love x Nơi Này Có Anh"
        },
        {
            src: "./assets/music/She Neva Knows.mp3",
            title: "She Neva Knows"
        }
    ];
    const LOCAL_QUOTES = [
        "Trưởng thành là khi bạn học được cách giữ bình tĩnh giữa những điều không như ý.",
        "Không có bước chân nào là lãng phí, mọi trải nghiệm đều dạy ta cách vững vàng hơn.",
        "Giữ tâm trí tĩnh lặng trước ồn ào, và giữ đôi chân bền bỉ trước đường dài.",
        "Sống chậm lại một nhịp để hiểu mình muốn gì, thay vì mải miết chạy theo đám đông.",
        "Áp lực không sinh ra để đánh gục bạn, mà để mài giũa bản lĩnh thêm sắc bén.",
        "Hạnh phúc đôi khi chỉ là cuối ngày mỉm cười vì hôm nay mình đã cố gắng trọn vẹn.",
        "Đừng sợ đi chậm, chỉ sợ đứng yên và tự thuyết phục mình rằng thế là đủ.",
        "Sức mạnh thật sự không nằm ở sự phô trương, mà ở sự kiên định trong thầm lặng.",
        "Mỗi người có một múi giờ riêng, nở hoa sớm hay muộn đều mang vẻ đẹp riêng biệt.",
        "Buông bỏ những điều ngoài tầm kiểm soát là bước đầu tiên để tìm thấy sự tự do.",
        "Giá trị của bạn nằm ở cách đứng dậy sau vấp ngã, chứ không phải chưa từng sai.",
        "Đừng đánh đổi sự bình yên bên trong chỉ để lấy sự công nhận từ bên ngoài.",
        "Khi nội tâm đủ vững vàng, mọi biến động bên ngoài chỉ còn là phép thử.",
        "Tự do lớn nhất là làm chủ được suy nghĩ, cảm xúc và thời gian của chính mình.",
        "Mọi việc đến trong đời đều có lý do: hoặc là một món quà, hoặc là một bài học."
    ];

    function safeGetStorage(key) {
        try {
            return window.localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    function safeSetStorage(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch {
            /* Ignore storage errors under restricted file:// contexts */
        }
    }

    /* ----------------------------------------------------------------------
       Toast Notification System
       ---------------------------------------------------------------------- */
    const toastContainer = document.getElementById("toast-container");

    function showToast(message, type = "success") {
        if (!toastContainer) return;

        const toast = document.createElement("div");
        toast.className = `toast-item ${type === "error" ? "toast-error" : "toast-success"}`;

        const dot = document.createElement("span");
        dot.className = "toast-dot";
        dot.setAttribute("aria-hidden", "true");

        const text = document.createElement("span");
        text.textContent = message;

        toast.appendChild(dot);
        toast.appendChild(text);
        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("is-visible");
        });

        window.setTimeout(() => {
            toast.classList.remove("is-visible");
            window.setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 240);
        }, 2600);
    }

    /* ----------------------------------------------------------------------
       Theme Switcher (Dark Default + Light Mode)
       ---------------------------------------------------------------------- */
    const rootEl = document.documentElement;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const themeBtn = document.querySelector(".change-theme");

    function applyTheme(theme, persist = true) {
        const isDark = theme !== "light";
        rootEl.classList.toggle("dark", isDark);
        rootEl.classList.toggle("light", !isDark);

        if (themeMeta) {
            themeMeta.setAttribute("content", isDark ? "#090d16" : "#f4f7fb");
        }
        if (themeBtn) {
            themeBtn.setAttribute("aria-pressed", String(!isDark));
        }
        if (persist) {
            safeSetStorage(STORAGE_KEY_THEME, isDark ? "dark" : "light");
        }
    }

    const savedTheme = safeGetStorage(STORAGE_KEY_THEME);
    if (savedTheme === "light" || savedTheme === "dark") {
        applyTheme(savedTheme, false);
    } else {
        applyTheme("dark", false);
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const nextTheme = rootEl.classList.contains("dark") ? "light" : "dark";
            applyTheme(nextTheme, true);
        });
    }

    const prefersReducedMotionQuery = window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    /* ----------------------------------------------------------------------
       Page Preloader & Opening Transition
       ---------------------------------------------------------------------- */
    const preloaderEl = document.getElementById("page-preloader");
    if (window.__osheePreloaderFailsafe) {
        window.clearTimeout(window.__osheePreloaderFailsafe);
        window.__osheePreloaderFailsafe = null;
    }

    if (preloaderEl) {
        const reduceMotion = Boolean(prefersReducedMotionQuery && prefersReducedMotionQuery.matches);
        const minDwellMs = reduceMotion ? 250 : 2600;
        const hardFailsafeMs = reduceMotion ? 1500 : 4800;
        const exitFallbackMs = reduceMotion ? 120 : 1100;

        let isWindowLoaded = document.readyState === "complete";
        let hasStartedReveal = false;
        let hasFinishedCleanup = false;
        let dwellTimerId = null;
        let failsafeTimerId = null;
        let cleanupTimerId = null;

        function clearAllPreloaderTimers() {
            if (dwellTimerId !== null) {
                window.clearTimeout(dwellTimerId);
                dwellTimerId = null;
            }
            if (failsafeTimerId !== null) {
                window.clearTimeout(failsafeTimerId);
                failsafeTimerId = null;
            }
            if (cleanupTimerId !== null) {
                window.clearTimeout(cleanupTimerId);
                cleanupTimerId = null;
            }
        }

        function finishPreloaderCleanup() {
            if (hasFinishedCleanup) return;
            hasFinishedCleanup = true;
            hasStartedReveal = true;
            clearAllPreloaderTimers();
            preloaderEl.removeEventListener("transitionend", onPreloaderTransitionEnd);

            rootEl.classList.remove("is-preloading");
            rootEl.classList.add("is-loaded");
            preloaderEl.classList.add("is-leaving");
            preloaderEl.setAttribute("aria-hidden", "true");
            preloaderEl.hidden = true;
        }

        function onPreloaderTransitionEnd(event) {
            if (event.target === preloaderEl && event.propertyName === "opacity") {
                finishPreloaderCleanup();
            }
        }

        function startPreloaderReveal() {
            if (hasStartedReveal) return;
            hasStartedReveal = true;
            clearAllPreloaderTimers();

            if (
                document.activeElement &&
                preloaderEl.contains(document.activeElement) &&
                typeof document.activeElement.blur === "function"
            ) {
                document.activeElement.blur();
            }

            preloaderEl.setAttribute("aria-hidden", "true");
            preloaderEl.classList.add("is-leaving");
            rootEl.classList.remove("is-preloading");
            rootEl.classList.add("is-loaded");

            preloaderEl.addEventListener("transitionend", onPreloaderTransitionEnd);
            cleanupTimerId = window.setTimeout(finishPreloaderCleanup, exitFallbackMs);
        }

        function schedulePreloaderReveal() {
            if (hasStartedReveal || !isWindowLoaded) return;
            const elapsedMs = typeof performance !== "undefined" && typeof performance.now === "function"
                ? performance.now()
                : 0;
            const remainingMs = Math.max(0, minDwellMs - elapsedMs);

            if (remainingMs <= 16) {
                requestAnimationFrame(() => startPreloaderReveal());
            } else {
                dwellTimerId = window.setTimeout(() => {
                    requestAnimationFrame(() => startPreloaderReveal());
                }, remainingMs);
            }
        }

        if (isWindowLoaded) {
            schedulePreloaderReveal();
        } else {
            window.addEventListener(
                "load",
                () => {
                    isWindowLoaded = true;
                    schedulePreloaderReveal();
                },
                { once: true }
            );
        }

        failsafeTimerId = window.setTimeout(startPreloaderReveal, hardFailsafeMs);

        window.addEventListener("pageshow", (event) => {
            if (event.persisted) {
                finishPreloaderCleanup();
            }
        });
    } else {
        rootEl.classList.remove("is-preloading");
        rootEl.classList.add("is-loaded");
    }

    /* ----------------------------------------------------------------------
       Sticky Header & Scroll-To-Top Progress
       ---------------------------------------------------------------------- */
    const siteHeader = document.getElementById("site-header");
    const scrollTopBtn = document.getElementById("croll-to-top");
    const scrollPercentText = scrollTopBtn ? scrollTopBtn.querySelector(".text") : null;

    function handleScroll() {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        if (siteHeader) {
            siteHeader.classList.toggle("not-top", scrollY > 16);
        }

        if (scrollTopBtn) {
            const docHeight = document.documentElement.scrollHeight;
            const viewHeight = window.innerHeight;
            const scrollable = Math.max(0, docHeight - viewHeight);
            const pct = scrollable > 0 ? Math.min(100, Math.max(0, Math.round((scrollY / scrollable) * 100))) : 0;

            if (scrollPercentText) {
                scrollPercentText.textContent = String(pct);
            }
            scrollTopBtn.setAttribute("data-show", scrollY > 40 ? "true" : "false");
            scrollTopBtn.classList.toggle("ended", pct >= 98);
        }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener("click", () => {
            const reduceMotion = Boolean(prefersReducedMotionQuery && prefersReducedMotionQuery.matches);
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

    /* ----------------------------------------------------------------------
       Live Clock (#real-time)
       ---------------------------------------------------------------------- */
    const clockEl = document.getElementById("real-time");

    function updateClock() {
        if (!clockEl) return;
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        clockEl.textContent = `${hh}:${mm}:${ss}`;
    }

    updateClock();
    window.setInterval(updateClock, 1000);

    /* ----------------------------------------------------------------------
       Local Quote Rotation (#cham-ngon)
       ---------------------------------------------------------------------- */
    const quoteEl = document.getElementById("cham-ngon");
    const quotePill = document.querySelector(".thought-pill");
    let quoteIndex = 0;
    let quoteIntervalId = null;
    let quoteFadeTimeoutId = null;

    function cycleQuote() {
        if (!quoteEl) return;
        quoteIndex = (quoteIndex + 1) % LOCAL_QUOTES.length;
        if (quoteFadeTimeoutId !== null) {
            window.clearTimeout(quoteFadeTimeoutId);
        }
        quoteEl.style.opacity = "0";
        quoteFadeTimeoutId = window.setTimeout(() => {
            quoteEl.textContent = LOCAL_QUOTES[quoteIndex];
            quoteEl.style.opacity = "1";
            quoteFadeTimeoutId = null;
        }, 160);
    }

    function startQuoteTimer() {
        if (quoteIntervalId !== null) {
            window.clearInterval(quoteIntervalId);
        }
        quoteIntervalId = window.setInterval(cycleQuote, 12000);
    }

    if (quotePill) {
        quotePill.addEventListener("click", () => {
            cycleQuote();
            startQuoteTimer();
        });
    }
    startQuoteTimer();

    /* ----------------------------------------------------------------------
       Verified Tooltip & Interactive Spoiler Pill
       ---------------------------------------------------------------------- */
    const verifiedBtn = document.querySelector(".verified-container");
    if (verifiedBtn) {
        verifiedBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            verifiedBtn.classList.toggle("is-open");
        });
        document.addEventListener("click", () => {
            verifiedBtn.classList.remove("is-open");
        });
    }

    const spoilerBtn = document.querySelector(".spoiler-pill");
    if (spoilerBtn) {
        spoilerBtn.addEventListener("click", () => {
            const revealed = spoilerBtn.classList.toggle("revealed");
            spoilerBtn.setAttribute("aria-expanded", String(revealed));
        });
    }

    /* ----------------------------------------------------------------------
       Subtle Brand Sparkles
       ---------------------------------------------------------------------- */
    const prefersReducedMotion = Boolean(prefersReducedMotionQuery && prefersReducedMotionQuery.matches);
    if (!prefersReducedMotion) {
        const stars = document.querySelectorAll(".magic-star");
        const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const animateStar = (star) => {
            star.style.setProperty("--star-left", `${rand(-8, 102)}%`);
            star.style.setProperty("--star-top", `${rand(-35, 75)}%`);
            star.style.animation = "none";
            void star.offsetHeight;
            star.style.animation = "";
        };

        stars.forEach((star, index) => {
            window.setTimeout(() => {
                animateStar(star);
                window.setInterval(() => animateStar(star), 1800);
            }, index * 450);
        });
    }

    /* ----------------------------------------------------------------------
       Music Player (.confirm-btn) & Continuous Now-Playing (#now-playing)
       ---------------------------------------------------------------------- */
    const musicBtn = document.querySelector(".confirm-btn");
    const nowPlayingEl = document.getElementById("now-playing");
    const nowPlayingTitleEl = document.getElementById("now-playing-title");
    const nowPlayingNextBtn = nowPlayingEl ? nowPlayingEl.querySelector(".now-playing-next") : null;
    let audioInstance = null;
    let desiredPlaying = false;
    let playToken = 0;
    let hasLoadedTrack = false;
    let currentTrackIdx = -1;
    let pendingPlayCount = 0;
    let shuffleQueue = [];

    function getTrack(idx) {
        return idx >= 0 && idx < MUSIC_TRACKS.length ? MUSIC_TRACKS[idx] : null;
    }

    function resolveTrackSrc(track) {
        if (!track || typeof track.src !== "string") return "";
        return encodeURI(track.src);
    }

    function updateNowPlaying(playing, track = getTrack(currentTrackIdx)) {
        if (!nowPlayingEl) return;
        const isActive = Boolean(playing && track);
        if (isActive) {
            const nextTitle = track.title || "";
            if (nowPlayingTitleEl) {
                const changed = nowPlayingTitleEl.textContent !== nextTitle;
                nowPlayingTitleEl.textContent = nextTitle;
                nowPlayingTitleEl.title = nextTitle;
                if (changed && !prefersReducedMotion) {
                    nowPlayingTitleEl.classList.remove("is-swapping");
                    void nowPlayingTitleEl.offsetWidth;
                    nowPlayingTitleEl.classList.add("is-swapping");
                } else if (!changed) {
                    nowPlayingTitleEl.classList.remove("is-swapping");
                }
            }
            nowPlayingEl.setAttribute("data-playing", "true");
            nowPlayingEl.setAttribute("aria-hidden", "false");
            if (nowPlayingNextBtn) {
                nowPlayingNextBtn.tabIndex = 0;
            }
        } else {
            nowPlayingEl.setAttribute("data-playing", "false");
            nowPlayingEl.setAttribute("aria-hidden", "true");
            if (nowPlayingTitleEl) {
                nowPlayingTitleEl.textContent = "";
                nowPlayingTitleEl.removeAttribute("title");
                nowPlayingTitleEl.classList.remove("is-swapping");
            }
            if (nowPlayingNextBtn) {
                nowPlayingNextBtn.tabIndex = -1;
            }
        }
    }

    function setPlayingState(playing, track = getTrack(currentTrackIdx)) {
        if (musicBtn) {
            musicBtn.classList.toggle("is-playing", playing);
            musicBtn.setAttribute("aria-pressed", String(playing));
        }
        updateNowPlaying(playing, track);
    }

    function refillShuffleQueue(excludeIdx) {
        const indices = MUSIC_TRACKS.map((_, idx) => idx);
        for (let i = indices.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = indices[i];
            indices[i] = indices[j];
            indices[j] = tmp;
        }
        if (indices.length > 1 && excludeIdx >= 0 && indices[0] === excludeIdx) {
            const swapIdx = indices.length - 1;
            const tmp = indices[0];
            indices[0] = indices[swapIdx];
            indices[swapIdx] = tmp;
        }
        shuffleQueue = indices;
    }

    function pickTrackIndex(advance) {
        if (MUSIC_TRACKS.length === 0) return -1;
        if (MUSIC_TRACKS.length === 1) return 0;
        if (!advance && currentTrackIdx >= 0 && currentTrackIdx < MUSIC_TRACKS.length) {
            return currentTrackIdx;
        }
        if (shuffleQueue.length === 0) {
            refillShuffleQueue(currentTrackIdx);
        }
        return shuffleQueue.shift();
    }

    function resetAudioElement(audio) {
        hasLoadedTrack = false;
        if (!audio) return;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
    }

    function playWithToken(audio, token, successMessage) {
        pendingPlayCount += 1;
        return Promise.resolve(audio.play())
            .then(() => {
                if (token !== playToken || !desiredPlaying) {
                    if (!desiredPlaying && !audio.paused) {
                        audio.pause();
                    }
                    return;
                }
                setPlayingState(true, getTrack(currentTrackIdx));
                showToast(successMessage, "success");
            })
            .catch((err) => {
                if (token !== playToken || !desiredPlaying || (err && err.name === "AbortError")) {
                    return;
                }
                desiredPlaying = false;
                setPlayingState(false);
                resetAudioElement(audio);
                showToast("Không thể phát nhạc ngay lúc này!", "error");
            })
            .finally(() => {
                pendingPlayCount = Math.max(0, pendingPlayCount - 1);
            });
    }

    function switchToNextTrack(successMessage) {
        if (MUSIC_TRACKS.length === 0) return;
        const audio = ensureAudioInstance();
        desiredPlaying = true;
        const token = ++playToken;
        currentTrackIdx = pickTrackIndex(true);
        const track = getTrack(currentTrackIdx);
        if (!track) {
            desiredPlaying = false;
            setPlayingState(false);
            showToast("Không thể phát nhạc ngay lúc này!", "error");
            return;
        }
        audio.src = resolveTrackSrc(track);
        hasLoadedTrack = true;
        setPlayingState(true, track);
        playWithToken(audio, token, successMessage);
    }

    function ensureAudioInstance() {
        if (audioInstance) return audioInstance;
        audioInstance = new Audio();
        audioInstance.preload = "auto";
        audioInstance.addEventListener("ended", () => {
            if (!desiredPlaying || MUSIC_TRACKS.length === 0) return;
            switchToNextTrack("Đang phát nhạc tiếp theo!");
        });
        audioInstance.addEventListener("error", () => {
            hasLoadedTrack = false;
            if (pendingPlayCount === 0 && desiredPlaying) {
                playToken += 1;
                desiredPlaying = false;
                setPlayingState(false);
                resetAudioElement(audioInstance);
                showToast("Không thể phát nhạc ngay lúc này!", "error");
            }
        });
        return audioInstance;
    }

    if (musicBtn) {
        musicBtn.addEventListener("click", () => {
            const audio = ensureAudioInstance();
            desiredPlaying = !desiredPlaying;
            const token = ++playToken;

            if (desiredPlaying) {
                const needsLoad =
                    !hasLoadedTrack ||
                    Boolean(audio.error) ||
                    audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE;
                if (needsLoad) {
                    if (audio.error || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                        resetAudioElement(audio);
                    }
                    currentTrackIdx = pickTrackIndex(currentTrackIdx >= 0);
                    const track = getTrack(currentTrackIdx);
                    if (!track) {
                        desiredPlaying = false;
                        setPlayingState(false);
                        showToast("Không thể phát nhạc ngay lúc này!", "error");
                        return;
                    }
                    audio.src = resolveTrackSrc(track);
                    hasLoadedTrack = true;
                }
                setPlayingState(true, getTrack(currentTrackIdx));
                playWithToken(audio, token, "Đang phát nhạc!");
            } else {
                setPlayingState(false);
                audio.pause();
                if (audio.readyState >= 1) {
                    audio.currentTime = 0;
                }
                showToast("Đã tắt nhạc!", "success");
            }
        });
    }

    if (nowPlayingNextBtn) {
        nowPlayingNextBtn.addEventListener("click", () => {
            if (!desiredPlaying) return;
            switchToNextTrack("Đang phát nhạc tiếp theo!");
        });
    }

    /* ----------------------------------------------------------------------
       Accessible Lightbox Modal (QR Code + Picture Gallery)
       ---------------------------------------------------------------------- */
    const lightbox = document.getElementById("lightbox-modal");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");
    const lightboxCounter = document.getElementById("lightbox-counter");
    const lightboxPrev = document.getElementById("lightbox-prev");
    const lightboxNext = document.getElementById("lightbox-next");
    const lightboxCloseBtn = lightbox ? lightbox.querySelector(".lightbox-close") : null;

    const qrTrigger = document.getElementById("openModalBtn");
    const galleryTriggers = Array.from(document.querySelectorAll("[data-gallery-item]"));
    const galleryItems = galleryTriggers.map((el) => ({
        src: el.getAttribute("data-gallery-src") || el.getAttribute("href"),
        alt: el.getAttribute("data-gallery-alt") || "Picture"
    }));

    let activeList = [];
    let activeIndex = 0;
    let lastFocusedEl = null;

    function renderLightboxFrame() {
        if (!lightboxImg || activeList.length === 0) return;
        const item = activeList[activeIndex];
        lightboxImg.src = item.src;
        lightboxImg.alt = item.alt;

        if (lightboxCaption) {
            lightboxCaption.textContent = item.alt;
        }

        const isMulti = activeList.length > 1;
        if (lightboxCounter) {
            lightboxCounter.textContent = isMulti ? `${activeIndex + 1} / ${activeList.length}` : "";
        }
        if (lightboxPrev) {
            lightboxPrev.hidden = !isMulti;
        }
        if (lightboxNext) {
            lightboxNext.hidden = !isMulti;
        }
    }

    function openLightbox(items, startIndex, triggerEl) {
        if (!lightbox || items.length === 0) return;
        lastFocusedEl = triggerEl || document.activeElement;
        activeList = items;
        activeIndex = Math.max(0, Math.min(startIndex, items.length - 1));
        renderLightboxFrame();

        lightbox.hidden = false;
        lightbox.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        if (lightboxCloseBtn) {
            lightboxCloseBtn.focus();
        }
    }

    function closeLightbox() {
        if (!lightbox || lightbox.hidden) return;
        lightbox.hidden = true;
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
            lastFocusedEl.focus();
        }
        lastFocusedEl = null;
    }

    function stepLightbox(delta) {
        if (activeList.length <= 1) return;
        activeIndex = (activeIndex + delta + activeList.length) % activeList.length;
        renderLightboxFrame();
    }

    if (qrTrigger) {
        qrTrigger.addEventListener("click", () => {
            const qrSrc = qrTrigger.getAttribute("data-qr-src") || "./assets/img/qr-code.jpg";
            openLightbox([{ src: qrSrc, alt: "QR Code — Oshee_" }], 0, qrTrigger);
        });
    }

    galleryTriggers.forEach((trigger, idx) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            openLightbox(galleryItems, idx, trigger);
        });
    });

    if (lightbox) {
        lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => {
            el.addEventListener("click", closeLightbox);
        });
    }

    if (lightboxPrev) {
        lightboxPrev.addEventListener("click", () => stepLightbox(-1));
    }

    if (lightboxNext) {
        lightboxNext.addEventListener("click", () => stepLightbox(1));
    }

    function getFocusableLightboxControls() {
        return [lightboxCloseBtn, lightboxPrev, lightboxNext].filter(
            (el) => el && !el.hidden && !el.disabled
        );
    }

    document.addEventListener("keydown", (event) => {
        if (!lightbox || lightbox.hidden) return;
        if (event.key === "Escape") {
            closeLightbox();
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            stepLightbox(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            stepLightbox(1);
        } else if (event.key === "Tab") {
            const focusables = getFocusableLightboxControls();
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (event.shiftKey) {
                if (active === first || !lightbox.contains(active)) {
                    event.preventDefault();
                    last.focus();
                }
            } else if (active === last || !lightbox.contains(active)) {
                event.preventDefault();
                first.focus();
            }
        }
    });
})();
