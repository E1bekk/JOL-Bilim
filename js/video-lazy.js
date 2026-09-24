document.addEventListener("DOMContentLoaded", () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = conn && conn.saveData === true;
    const effectiveType = conn && conn.effectiveType;
    const slowConn = effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (saveData || slowConn || prefersReducedMotion) {
        console.log("Video lazy loading skipped due to save-data, slow connection, or reduced-motion preference.");
        return;
    }

    const videos = document.querySelectorAll("video");
    if (!videos.length) return;

    const observerOptions = {
        root: null,
        rootMargin: "200px",
        threshold: 0.01
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            const video = entry.target;
            const source = video.querySelector("source");
            
            if (entry.isIntersecting) {
                if (source && source.dataset.src && !source.getAttribute("src")) {
                    source.src = source.dataset.src;
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
