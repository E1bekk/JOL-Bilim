document.addEventListener("DOMContentLoaded", () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = conn && conn.saveData === true;
    const effectiveType = conn && conn.effectiveType;
    const slowConn = effectiveType === '2g' || effectiveType === 'slow-2g';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (saveData || slowConn || prefersReducedMotion) {
        console.log("Video lazy loading skipped due to save-data, slow connection, or reduced-motion preference.");
        return;
    }

    // Приложение (Capacitor / Android WebView) -> лёгкие видео из папки videos/
    // Сайт в браузере (телефон или ноутбук) -> качественные оригиналы с Pexels
    const isNativeApp = !!(
        (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) ||
        /; wv\)/.test(navigator.userAgent)
    );

    const HD_SOURCES = {
        'hero-bg-small.mp4':      'https://videos.pexels.com/video-files/14058189/14058189-hd_1920_1080_24fps.mp4',
        'how-bg-small.mp4':       'https://videos.pexels.com/video-files/16542902/16542902-hd_1920_1080_24fps.mp4',
        'pricing-bg-small.mp4':   'https://videos.pexels.com/video-files/13382270/13382270-hd_1920_1080_24fps.mp4',
        'parents-bg-small.mp4':   'https://videos.pexels.com/video-files/39115389/16646099_2560_1440_24fps.mp4',
        'cabinet-bg-small.mp4':   'https://videos.pexels.com/video-files/7184620/7184620-hd_1920_1080_30fps.mp4',
        'dashboard-bg-small.mp4': 'https://videos.pexels.com/video-files/8295518/8295518-hd_1920_1080_30fps.mp4',
        'parent-bg-small.mp4':    'https://videos.pexels.com/video-files/20360283/20360283-hd_1080_1920_30fps.mp4'
    };

    function pickSource(smallSrc) {
        if (isNativeApp || !smallSrc) return smallSrc;
        const fileName = smallSrc.split('/').pop();
        return HD_SOURCES[fileName] || smallSrc;
    }

    const videos = document.querySelectorAll("video");
    if (!videos.length) return;

    const observerOptions = {
        root: null,
        rootMargin: "200px",
        threshold: 0.01
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const source = video.querySelector("source");

            if (entry.isIntersecting) {
                if (source && source.dataset.src && !source.getAttribute("src")) {
                    const smallSrc = source.dataset.src;
                    const chosen = pickSource(smallSrc);
                    source.src = chosen;
                    if (chosen !== smallSrc) {
                        // если качественное видео не загрузилось — откатываемся на лёгкое
                        source.addEventListener("error", () => {
                            source.src = smallSrc;
                            video.load();
                            video.play().catch(() => {});
                        }, { once: true });
                    }
                    video.load();
                }
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, observerOptions);

    videos.forEach(video => {
        const source = video.querySelector("source");
        if (source && source.getAttribute("src")) {
            source.dataset.src = source.getAttribute("src");
            source.removeAttribute("src");
            video.load();
        }
        observer.observe(video);
    });
});
