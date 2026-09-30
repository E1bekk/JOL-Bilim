// Анимация появления при прокрутке.
// Заголовки появляются по буквам, карточки и тексты — плавно по очереди.
// Работает каждый раз: ушёл с экрана — элемент прячется, вернулся — появляется снова.
// При прокрутке вниз элементы выплывают снизу, при прокрутке вверх — сверху.
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const EASE = 'cubic-bezier(.2,.7,.2,1)';
    const style = document.createElement('style');
    style.textContent = `
        .rv-word { display: inline-block; white-space: nowrap; }
        .rv-char {
            display: inline-block;
            opacity: 0;
            translate: 0 var(--rv-dy, 0.6em);
            filter: blur(6px);
            transition: opacity .9s ${EASE}, translate .9s ${EASE}, filter .9s ${EASE};
            transition-delay: calc(var(--i, 0) * 24ms);
        }
        .rv-in .rv-char { opacity: 1; translate: 0 0; filter: none; }
        .rv-hiding .rv-char { transition-duration: .35s; transition-delay: 0ms; }

        .rv-block {
            opacity: 0;
            translate: 0 var(--rv-shift, 40px);
            filter: blur(4px);
            transition: opacity 1.1s ease, translate 1.1s ${EASE}, filter 1.1s ease;
            transition-delay: var(--rv-delay, 0ms);
        }
        .rv-block.rv-in { opacity: 1; translate: 0 0; filter: none; }
        .rv-block.rv-hiding { transition-duration: .4s; transition-delay: 0ms; }
        /* у «стеклянных» карточек без размытия — на телефонах так плавнее */
        .rv-block.liquid-glass, .rv-block .liquid-glass { filter: none; }
    `;
    document.head.appendChild(style);

    // Не трогаем меню, модальные окна и служебные элементы
    const EXCLUDE = 'nav, #mobile-menu, #tariff-modal, #paywall, #open-in-browser, script, style';

    // Заголовки → буквы (сохраняем вложенные теги вроде <em> и <br>)
    function splitChars(el) {
        let i = 0;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            const text = node.textContent;
            if (!text.trim()) return;
            const frag = document.createDocumentFragment();
            text.split(/(\s+)/).forEach(part => {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                const word = document.createElement('span');
                word.className = 'rv-word';
                for (const ch of part) {
                    const c = document.createElement('span');
                    c.className = 'rv-char';
                    c.style.setProperty('--i', Math.min(i++, 40)); // не растягиваем длинные заголовки
                    c.textContent = ch;
                    word.appendChild(c);
                }
                frag.appendChild(word);
            });
            node.parentNode.replaceChild(frag, node);
        });
        el.setAttribute('aria-label', el.textContent); // для экранных дикторов — целый текст
    }

    const headings = Array.from(document.querySelectorAll('h1, h2'))
        .filter(el => !el.closest(EXCLUDE));
    headings.forEach(splitChars);

    // Блоки, которые появляются целиком
    const BLOCK_SELECTOR = [
        '.eyebrow', '.search-bar', '.hint', '.hero .btn-glass',
        '.feat', '.price-card', '.parents p', '.parents .btn-white', 'footer',
        '.left-panel > div', '.right-panel-content > div', '.right-panel-content > div > *',
        '.form-col > p', '.form-group', '#telegram-auth-container'
    ].join(', ');
    const blocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR))
        .filter(el => !el.closest(EXCLUDE))
        .filter((el, _, all) => !all.some(other => other !== el && other.contains(el))); // без вложенных двойных анимаций

    // Соседние блоки появляются по очереди
    const groups = new Map();
    blocks.forEach(el => {
        el.classList.add('rv-block');
        const list = groups.get(el.parentElement) || [];
        el.style.setProperty('--rv-delay', Math.min(list.length, 6) * 150 + 'ms');
        list.push(el);
        groups.set(el.parentElement, list);
    });

    const hideTimers = new WeakMap();
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const el = entry.target;
            const fromTop = entry.boundingClientRect.top < (entry.rootBounds ? entry.rootBounds.top : 0) + 1;
            if (entry.isIntersecting) {
                clearTimeout(hideTimers.get(el));
                el.classList.remove('rv-hiding');
                // вход сверху (листаем вверх) — выплываем сверху, снизу — снизу
                el.style.setProperty('--rv-dy', fromTop ? '-0.6em' : '0.6em');
                el.style.setProperty('--rv-shift', fromTop ? '-40px' : '40px');
                requestAnimationFrame(() => el.classList.add('rv-in'));
            } else if (el.classList.contains('rv-in')) {
                // ушёл с экрана — прячем, чтобы при возвращении анимация повторилась
                el.style.setProperty('--rv-dy', fromTop ? '-0.6em' : '0.6em');
                el.style.setProperty('--rv-shift', fromTop ? '-40px' : '40px');
                el.classList.add('rv-hiding');
                el.classList.remove('rv-in');
                hideTimers.set(el, setTimeout(() => el.classList.remove('rv-hiding'), 400));
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    headings.forEach(el => observer.observe(el));
    blocks.forEach(el => observer.observe(el));
})();
