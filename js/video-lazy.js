document.addEventListener("DOMContentLoaded", () => {
    const videos = document.querySelectorAll("video");
    if (!videos.length) return;

    const ua = navigator.userAgent || '';

    // Встроенные браузеры соцсетей (TikTok, Instagram, Facebook, Snapchat и др.).
    // На iPhone они не дают видео играть внутри страницы: показывают плеер с кнопками
    // и разворачивают видео на весь экран. Там вместо видео показываем статичную картинку.
    const knownInApp = /TikTok|musical_ly|trill|Bytedance|ByteLocale|TTWebView|Instagram|FBAN|FBAV|FB_IAB|FBIOS|Snapchat|Line\/|MicroMessenger|Pinterest|VKClient|OKApp/i.test(ua);
    // На iPhone/iPad все обычные браузеры (Safari, Chrome, Firefox, Edge) пишут о себе "Safari/".
    // Встроенные браузеры приложений — нет. Так ловим любые соцсети, даже неизвестные.
    const isAppleMobile = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const isIOSWebView = isAppleMobile && !/Safari\//.test(ua);
    const isInAppBrowser = knownInApp || isIOSWebView;

    // Всем видео — атрибуты, которые запрещают плеер, картинку-в-картинке и трансляцию
    videos.forEach(video => {
        video.muted = true;
        video.controls = false;
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.setAttribute("disablepictureinpicture", "");
        video.setAttribute("disableremoteplayback", "");
        video.setAttribute("x-webkit-airplay", "deny");
    });

    if (isInAppBrowser) {
        // для фона внутри секций главной страницы (там стили заданы для тега video)
        const style = document.createElement("style");
        style.textContent =
            ".video-section img.video-poster{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0;}" +
            "#open-in-browser{position:fixed; left:12px; right:12px; bottom:max(12px, env(safe-area-inset-bottom)); z-index:300;" +
            " display:flex; align-items:center; gap:12px; padding:12px 14px 12px 16px; border-radius:16px;" +
            " background:rgba(12,12,14,0.92); border:1px solid rgba(255,255,255,0.12); color:#F3F1E9;" +
            " font:13px/1.4 'Inter',sans-serif; box-shadow:0 10px 30px rgba(0,0,0,0.5);" +
            " backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); animation:oib-in .4s ease both;}" +
            "#open-in-browser b{color:#E3A83B; font-weight:600;}" +
            "#open-in-browser button{flex-shrink:0; margin-left:auto; width:28px; height:28px; border-radius:50%; border:none;" +
            " background:rgba(255,255,255,0.08); color:#F3F1E9; font-size:16px; line-height:28px; cursor:pointer;}" +
            "@keyframes oib-in{from{opacity:0; transform:translateY(12px);}to{opacity:1; transform:none;}}";
        document.head.appendChild(style);

        // Чёткие вертикальные кадры для телефона (снятые из HD-видео); если нет — обычный постер
        const HD_POSTERS = ['hero', 'parents', 'dashboard', 'parent'];

        videos.forEach(video => {
            const poster = video.getAttribute("poster");
            if (!poster) { video.remove(); return; }
            const img = document.createElement("img");
            const m = poster.match(/([a-z]+)-bg-poster\.webp$/);
            if (m && HD_POSTERS.includes(m[1])) {
                img.src = poster.replace('-bg-poster.webp', '-bg-poster-hd.webp');
                img.addEventListener("error", () => { img.src = poster; }, { once: true });
            } else {
                img.src = poster;
            }
            img.alt = "";
            img.setAttribute("aria-hidden", "true");
            img.className = (video.className ? video.className + " " : "") + "video-poster";
            img.style.cssText = video.style.cssText;
            img.style.objectFit = "cover";
            img.style.pointerEvents = "none";
            video.replaceWith(img);
        });
        // Плашка: в обычном браузере фон будет с видео
        let dismissed = false;
        try { dismissed = sessionStorage.getItem("jolBilimOibClosed") === "1"; } catch (e) {}
        if (!dismissed) {
            const bar = document.createElement("div");
            bar.id = "open-in-browser";
            bar.innerHTML = '<span>Сайт выглядит лучше в браузере: нажми <b>⋯</b> вверху и выбери <b>«Открыть в браузере»</b></span>' +
                '<button type="button" aria-label="Закрыть">×</button>';
            bar.querySelector("button").addEventListener("click", () => {
                bar.remove();
                try { sessionStorage.setItem("jolBilimOibClosed", "1"); } catch (e) {}
            });
            document.body.appendChild(bar);
        }

        console.log("In-app browser detected: videos replaced with posters.");
        return;
    }

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
        /; wv\)/.test(ua)
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
