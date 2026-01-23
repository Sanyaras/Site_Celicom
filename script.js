/**
 * ЦЕЛИКОМ - WMS для фулфилментов
 * JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // =====================================================
    // THEME TOGGLE
    // =====================================================
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check saved theme or system preference
    function getTheme() {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        return prefersDark.matches ? 'dark' : 'light';
    }
    
    // Apply theme
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
    
    // Initialize theme
    setTheme(getTheme());
    
    // Toggle theme on click
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            setTheme(next);
        });
    }
    
    // Listen to system preference changes
    prefersDark.addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    // =====================================================
    // Mobile Menu Toggle
    const burger = document.querySelector('.header__burger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu__link');
    
    if (burger && mobileMenu) {
        burger.addEventListener('click', function() {
            mobileMenu.classList.toggle('is-open');
            burger.classList.toggle('is-active');
            document.body.classList.toggle('menu-open');
            
            // Animate burger
            const spans = burger.querySelectorAll('span');
            if (burger.classList.contains('is-active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close menu on link click
        mobileLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('is-open');
                burger.classList.remove('is-active');
                document.body.classList.remove('menu-open');
                
                const spans = burger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }
    
    // Header scroll effect (driven by a single RAF loop below)
    const header = document.querySelector('.header');
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // =====================================================
    // Apple-style Scroll Animation Observer
    // =====================================================
    const animationObserverOptions = {
        root: null,
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const revealTimers = new WeakMap();
    const animationObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            const el = entry.target;
            const prevTimer = revealTimers.get(el);
            if (prevTimer) {
                clearTimeout(prevTimer);
                revealTimers.delete(el);
            }

            if (entry.isIntersecting) {
                const delay = parseInt(el.dataset.delay || '0', 10);
                if (delay > 0) {
                    const t = setTimeout(function() {
                        el.classList.add('is-visible');
                        revealTimers.delete(el);
                    }, delay);
                    revealTimers.set(el, t);
                } else {
                    el.classList.add('is-visible');
                }
            } else {
                // reversible: fold back when scrolling up
                el.classList.remove('is-visible');
            }
        });
    }, animationObserverOptions);
    
    // Observe all elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach(function(el) {
        animationObserver.observe(el);
    });
    
    // Also observe legacy class
    document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
        animationObserver.observe(el);
    });
    
    // =====================================================
    // Scroll-driven sections (Apple-style, but clean)
    // =====================================================
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.innerWidth >= 1024;

    function clamp(n, min, max) {
        return Math.max(min, Math.min(max, n));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function smoothstep(t) {
        const x = clamp(t, 0, 1);
        return x * x * (3 - 2 * x);
    }

    function formatRuInt(n) {
        const v = Math.round(Number(n) || 0);
        return new Intl.NumberFormat('ru-RU').format(v);
    }

    function formatTariffLabel(plan, price) {
        const p = String(plan || '').trim();
        const pr = Number(price);
        if (!p) return '';
        if (Number.isFinite(pr) && pr > 0) return p + ' — ' + formatRuInt(pr) + ' ₽/мес';
        return p;
    }

    function setActiveByIndex(nodes, index, className) {
        nodes.forEach(function(n, i) {
            if (i === index) n.classList.add(className);
            else n.classList.remove(className);
        });
    }

    // =====================================================
    // Single scroll RAF loop (performance)
    // =====================================================
    const scrollUpdates = [];
    let rafPending = false;

    function inViewport(el, pad) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        const p = pad ?? 200;
        return r.bottom > -p && r.top < (window.innerHeight + p);
    }

    function requestTick() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(function() {
            rafPending = false;

            // header shadow
            if (header) {
                header.style.boxShadow = (window.pageYOffset > 50) ? '0 2px 10px rgba(0, 0, 0, 0.1)' : 'none';
            }

            // per-section updates (only when near viewport)
            scrollUpdates.forEach(function(item) {
                if (!item || !item.el || !item.fn) return;
                if (inViewport(item.el, item.pad)) item.fn();
            });
        });
    }

    window.addEventListener('scroll', requestTick, { passive: true });

    // ===== HERO fold (Apple-like: zoom/expand/collapse, reversible) =====
    const heroFold = document.querySelector('[data-hero-fold]');
    if (heroFold) {
        const content = heroFold.querySelector('.hero__content');
        const visual = heroFold.querySelector('.hero__visual');
        const mockup = heroFold.querySelector('[data-hero-mockup]');
        const floats = heroFold.querySelectorAll('[data-hero-float]');

        function updateHeroFold() {
            if (!isDesktop || prefersReducedMotion) {
                heroFold.classList.remove('is-active');
                if (content) content.style.transform = '';
                if (content) content.style.opacity = '';
                if (visual) visual.style.transform = '';
                if (mockup) {
                    mockup.style.transform = '';
                    mockup.style.opacity = '';
                }
                floats.forEach(function(card) {
                    card.style.transform = '';
                    card.style.opacity = '';
                });
                return;
            }

            const rect = heroFold.getBoundingClientRect();
            const maxScroll = heroFold.offsetHeight - window.innerHeight;
            const scrolled = -rect.top;
            const p = clamp(scrolled / Math.max(1, maxScroll), 0, 1);

            const inRange = p > 0 && p < 1;
            heroFold.classList.toggle('is-active', inRange);

            // piecewise progress
            const t0 = smoothstep(clamp(p / 0.35, 0, 1));
            const t1 = smoothstep(clamp((p - 0.35) / 0.35, 0, 1));
            const t2 = smoothstep(clamp((p - 0.7) / 0.3, 0, 1));

            // mockup: expand then settle, then gently move out
            const scaleA = lerp(1, 1.06, t0);
            const scaleB = lerp(scaleA, 0.95, t1);
            const scale = scaleB;
            const x = lerp(0, 32, t1) + lerp(0, 36, t2);
            const y = lerp(0, -16, t0) + lerp(0, -18, t1) + lerp(0, -42, t2);
            // Keep the hero visible throughout the fold to avoid “empty white slides”.
            const opacity = clamp(1 - (t2 * 0.85), 0.35, 1);

            if (mockup) {
                mockup.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
                mockup.style.opacity = opacity.toFixed(3);
            }

            // text: subtle fold away
            if (content) {
                // Don't fade text too aggressively; keep it readable while scrolling.
                const textFade = clamp(1 - (p * 0.45), 0.6, 1);
                const tx = lerp(0, -10, t1);
                const ty = lerp(0, -14, t0) + lerp(0, -10, t1);
                content.style.opacity = textFade.toFixed(3);
                content.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
            }

            if (visual) {
                const vy = lerp(0, -6, t0);
                visual.style.transform = 'translate3d(0,' + vy.toFixed(1) + 'px,0)';
            }

            // floating cards: appear then collapse into mockup
            const appear = smoothstep(clamp(p / 0.12, 0, 1));
            const collapse = smoothstep(clamp((p - 0.22) / 0.28, 0, 1));
            const cardOpacity = appear * (1 - (collapse * 0.9));

            floats.forEach(function(card) {
                const cY = lerp(0, 18, collapse);
                const cS = lerp(1, 0.92, collapse);
                card.style.opacity = cardOpacity.toFixed(3);
                card.style.transform = 'translate3d(0,' + cY.toFixed(1) + 'px,0) scale(' + cS.toFixed(3) + ')';
            });
        }

        scrollUpdates.push({ el: heroFold, fn: updateHeroFold, pad: 500 });
        window.addEventListener('resize', updateHeroFold);
        updateHeroFold();
    }

    // ===== Features story =====
    const stories = document.querySelectorAll('[data-story]');
    stories.forEach(function(story) {
        const stepsCount = parseInt(story.dataset.steps || '4', 10);
        const container = story.querySelector('.story__container');
        const sticky = story.querySelector('.story__sticky');
        const steps = story.querySelectorAll('.story-step');
        const panels = story.querySelectorAll('.story-panel');
        const bar = story.querySelector('.story__progress span');

        if (!container || !sticky || steps.length === 0 || panels.length === 0) return;

        // Set scroll height based on steps
        if (isDesktop && !prefersReducedMotion) {
            container.style.height = (Math.max(3, stepsCount) * 80) + 'vh';
        } else {
            container.style.height = 'auto';
        }

        // Click-to-switch (works great on mobile too)
        steps.forEach(function(stepEl, idx) {
            stepEl.addEventListener('click', function() {
                setActiveByIndex(steps, idx, 'is-active');
                setActiveByIndex(panels, idx, 'is-active');
            });
        });

        function updateStory() {
            if (!isDesktop || prefersReducedMotion) return;
            const rect = container.getBoundingClientRect();
            const viewport = window.innerHeight;
            const maxScroll = container.offsetHeight - viewport;
            const scrolled = -rect.top;
            const progress = clamp(scrolled / Math.max(1, maxScroll), 0, 1);

            const activeIndex = clamp(Math.floor(progress * stepsCount), 0, stepsCount - 1);
            setActiveByIndex(steps, activeIndex, 'is-active');
            setActiveByIndex(panels, activeIndex, 'is-active');
            if (bar) bar.style.width = (progress * 100) + '%';
        }

        scrollUpdates.push({ el: container, fn: updateStory, pad: 500 });

        updateStory();
        window.addEventListener('resize', updateStory);
    });

    // =====================================================
    // Ecosystem lines: connect center to role cards (Apple-like, reversible)
    // =====================================================
    const ecosystem = document.querySelector('[data-ecosystem]');
    if (ecosystem) {
        const grid = ecosystem.querySelector('.ecosystem__grid');
        const svg = ecosystem.querySelector('[data-ecosystem-lines]');
        const centerBadge = ecosystem.querySelector('.ecosystem__badge');
        const map = {
            seller: ecosystem.querySelector('.role-card--seller'),
            manager: ecosystem.querySelector('.role-card--manager'),
            warehouse: ecosystem.querySelector('.role-card--warehouse'),
            logistics: ecosystem.querySelector('.role-card--logistics')
        };

        function pointFromRectCenter(rect, rootRect) {
            return {
                x: rect.left + rect.width / 2 - rootRect.left,
                y: rect.top + rect.height / 2 - rootRect.top
            };
        }

        function updateEcosystem() {
            if (!isDesktop || prefersReducedMotion) return;
            if (!grid || !svg || !centerBadge) return;

            const rootRect = grid.getBoundingClientRect();
            const w = Math.max(1, rootRect.width);
            const h = Math.max(1, rootRect.height);
            svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

            const centerRect = centerBadge.getBoundingClientRect();
            const c = pointFromRectCenter(centerRect, rootRect);

            // scroll progress → draw amount (reversible)
            const total = rootRect.height + window.innerHeight;
            const p = clamp((window.innerHeight - rootRect.top) / Math.max(1, total), 0, 1);
            const draw = smoothstep(clamp((p - 0.12) / 0.62, 0, 1));

            const keys = Object.keys(map);
            keys.forEach(function(k, idx) {
                const card = map[k];
                const path = svg.querySelector('[data-ecosystem-line="' + k + '"]');
                if (!card || !path) return;

                const r = card.getBoundingClientRect();
                const target = pointFromRectCenter(r, rootRect);
                const dx = target.x - c.x;
                const dy = target.y - c.y;
                const len = Math.max(1, Math.hypot(dx, dy));

                // start on badge edge; end near card edge
                const badgeR = Math.min(centerRect.width, centerRect.height) / 2;
                const cardR = Math.min(r.width, r.height) / 2;
                const sx = c.x + (dx / len) * (badgeR + 10);
                const sy = c.y + (dy / len) * (badgeR + 10);
                const ex = target.x - (dx / len) * Math.max(16, cardR - 28);
                const ey = target.y - (dy / len) * Math.max(16, cardR - 28);

                // gentle arc
                const px = -dy / len;
                const py = dx / len;
                const bend = (idx % 2 === 0 ? 1 : -1) * 22;
                const c1x = sx + dx * 0.25 + px * bend;
                const c1y = sy + dy * 0.25 + py * bend;
                const c2x = sx + dx * 0.65 + px * (bend * 0.55);
                const c2y = sy + dy * 0.65 + py * (bend * 0.55);

                const d = 'M ' + sx.toFixed(1) + ' ' + sy.toFixed(1) +
                    ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) +
                    ', ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) +
                    ', ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
                path.setAttribute('d', d);

                // dash draw
                const pathLen = Math.max(1, path.getTotalLength());
                path.style.strokeDasharray = String(pathLen);
                path.style.strokeDashoffset = String(pathLen * (1 - draw));
                path.style.opacity = String(0.15 + draw * 0.85);
            });

            // subtle center pulse tied to draw
            centerBadge.style.transform = 'scale(' + (0.98 + draw * 0.04).toFixed(3) + ')';
        }

        scrollUpdates.push({ el: ecosystem, fn: updateEcosystem, pad: 900 });
        window.addEventListener('resize', updateEcosystem);
        updateEcosystem();
    }

    // ===== Pricing story =====
    const pricingStory = document.querySelector('[data-pricing-story]');
    if (pricingStory) {
        const stages = parseInt(pricingStory.dataset.stages || '3', 10);
        const container = pricingStory.querySelector('.pricing-story__container');
        const sticky = pricingStory.querySelector('.pricing-story__sticky');
        const stageEls = pricingStory.querySelectorAll('.pricing-stage');
        const bar = pricingStory.querySelector('.pricing-story__progress span');
        const compare = pricingStory.querySelector('.compare');
        const compareRows = pricingStory.querySelectorAll('.compare__row');
        const roiCard = pricingStory.querySelector('.roi-card');

        if (container && stageEls.length > 0) {
            function enableStaticPricing() {
                pricingStory.classList.add('pricing-story--static');
                container.style.height = 'auto';
                stageEls.forEach(function(el) {
                    el.classList.add('is-active');
                    el.style.transform = '';
                    el.style.opacity = '';
                    el.style.pointerEvents = '';
                });
            }

            function shouldFallbackToStatic() {
                if (!isDesktop || prefersReducedMotion) return true; // mobile already behaves as static
                const stickyH = sticky ? sticky.getBoundingClientRect().height : window.innerHeight;
                const maxAllowed = Math.max(260, stickyH - 24);
                return Array.from(stageEls).some(function(el) {
                    return (el.scrollHeight || 0) > maxAllowed;
                });
            }

            if (isDesktop && !prefersReducedMotion) {
                // give enough scroll room for smooth crossfades
                container.style.height = (Math.max(2, stages) * 110) + 'vh';
            } else {
                container.style.height = 'auto';
                // On mobile show all stages (CSS may override; this is a safe fallback)
                stageEls.forEach(function(el) { el.classList.add('is-active'); });
            }

            // If plans/ROI are taller than the sticky viewport, disable the slider to avoid overlays.
            if (shouldFallbackToStatic()) {
                enableStaticPricing();
                return;
            }

            function updatePricing() {
                if (!isDesktop || prefersReducedMotion) return;
                const rect = container.getBoundingClientRect();
                const viewport = window.innerHeight;
                const maxScroll = container.offsetHeight - viewport;
                const scrolled = -rect.top;
                const progress = clamp(scrolled / Math.max(1, maxScroll), 0, 1);

                // Stage transition (plans -> ROI)
                // We want “scroll down like a slider”, not an overlay.
                // Desktop CSS makes the sticky area a viewport; JS translates stages vertically.
                const isTwoStages = stages === 2;
                const tSlide = isTwoStages ? smoothstep(clamp((progress - 0.12) / 0.76, 0, 1)) : 0;
                const viewportH = sticky ? sticky.getBoundingClientRect().height : window.innerHeight;
                const distBase = Math.max(520, viewportH * 1.05);

                stageEls.forEach(function(el) {
                    const s = parseInt(el.dataset.stage || '0', 10);
                    let w = 0;
                    let y = 0;
                    let sc = 1;
                    const dist = Math.max(distBase, (el.scrollHeight || 0) + 80);

                    if (isTwoStages) {
                        if (s === 0) {
                            // stage 0 leaves upward
                            w = 1 - (tSlide * 0.14);
                            y = lerp(0, -dist, tSlide);
                            sc = lerp(1, 0.99, tSlide);
                        } else if (s === 1) {
                            // stage 1 enters from below
                            w = 0.86 + (tSlide * 0.14);
                            y = lerp(dist, 0, tSlide);
                            sc = lerp(0.99, 1, tSlide);
                        } else {
                            w = 0;
                        }
                    } else {
                        // default: discrete stage selection for other configurations
                        const activeStage = clamp(Math.floor(progress * stages), 0, stages - 1);
                        w = (s === activeStage) ? 1 : 0;
                        y = (s === activeStage) ? 0 : 18;
                        sc = (s === activeStage) ? 1 : 0.985;
                    }

                    // Earlier stages sit above later ones.
                    el.style.zIndex = String(100 - (Number.isFinite(s) ? s : 0));
                    el.style.opacity = w.toFixed(3);
                    el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
                    if (isTwoStages) {
                        const active = (s === 0) ? (tSlide < 0.5) : (tSlide >= 0.5);
                        el.style.pointerEvents = active ? 'auto' : 'none';
                        el.classList.toggle('is-active', active);
                    } else {
                        el.style.pointerEvents = (w > 0.55) ? 'auto' : 'none';
                        el.classList.toggle('is-active', w > 0.75);
                    }
                });
                if (bar) bar.style.width = (progress * 100) + '%';

                // “Fold/unfold” comparison rows inside stage 1 (reversible)
                if (compare && compareRows.length > 0) {
                    const stageStart = 1 / stages;
                    const stageEnd = Math.min(1, 2 / stages);
                    const local = clamp((progress - stageStart) / Math.max(0.0001, (stageEnd - stageStart)), 0, 1);
                    const inCompare = stages >= 2 ? (progress >= stageStart) : false;

                    compare.style.opacity = inCompare ? '1' : '0.001';
                    compare.style.transform = inCompare
                        ? 'translate3d(0,' + (lerp(18, 0, smoothstep(local))).toFixed(1) + 'px,0) scale(' + (lerp(0.985, 1, smoothstep(local))).toFixed(3) + ')'
                        : 'translate3d(0,18px,0) scale(0.985)';

                    compareRows.forEach(function(row, i) {
                        const base = i * 0.08;
                        const t = smoothstep(clamp((local - base) / 0.22, 0, 1));
                        const r = inCompare ? t : 0;
                        row.style.setProperty('--r', r.toFixed(3));
                    });
                }

                // ROI bars (stage 1) — fill on scroll (reversible)
                if (roiCard) {
                    if (stages === 2) {
                        // start filling a bit after ROI starts entering
                        const local = clamp((tSlide - 0.25) / 0.75, 0, 1);
                        roiCard.style.setProperty('--fill', smoothstep(local).toFixed(3));
                    } else {
                        const roiStart = (1 / stages);
                        const local = clamp((progress - roiStart) / Math.max(0.0001, (1 - roiStart)), 0, 1);
                        roiCard.style.setProperty('--fill', smoothstep(local).toFixed(3));
                    }
                }
            }

            scrollUpdates.push({ el: container, fn: updatePricing, pad: 700 });

            updatePricing();
            window.addEventListener('resize', updatePricing);
        }
    }

    // =====================================================
    // FBS meter: appear + fill on scroll (reversible)
    // =====================================================
    const fbsMeters = document.querySelectorAll('[data-fbs-meter]');
    if (fbsMeters.length > 0) {
        fbsMeters.forEach(function(meter) {
            function updateMeter() {
                if (prefersReducedMotion) {
                    meter.style.setProperty('--fill', '1');
                    return;
                }
                const rect = meter.getBoundingClientRect();
                const total = rect.height + window.innerHeight;
                const p = clamp((window.innerHeight - rect.top) / Math.max(1, total), 0, 1);
                meter.style.setProperty('--fill', smoothstep(p).toFixed(3));
            }

            updateMeter();
            scrollUpdates.push({ el: meter, fn: updateMeter, pad: 900 });
            window.addEventListener('resize', updateMeter);
        });
    }

    // Contact “submit” (no backend): opens Telegram share and copies text
    const contactBtn = document.getElementById('contactSubmit');
    if (contactBtn) {
        contactBtn.addEventListener('click', async function() {
            const form = document.querySelector('.contact-form');
            if (!form) return;

            const name = (form.querySelector('input[name="name"]')?.value || '').trim();
            const phone = (form.querySelector('input[name="phone"]')?.value || '').trim();
            const company = (form.querySelector('input[name="company"]')?.value || '').trim();
            const message = (form.querySelector('textarea[name="message"]')?.value || '').trim();
            const tariff = (form.querySelector('input[name="tariff"]')?.value || '').trim();

            const lines = [
                'Заявка с сайта Целиком',
                tariff ? ('Тариф: ' + tariff) : null,
                name ? ('Имя: ' + name) : null,
                phone ? ('Телефон: ' + phone) : null,
                company ? ('Компания: ' + company) : null,
                message ? ('Комментарий: ' + message) : null
            ].filter(Boolean);

            const text = lines.join('\n');

            try {
                if (navigator.clipboard && text) {
                    await navigator.clipboard.writeText(text);
                }
            } catch (_) {
                // ignore clipboard errors
            }

            const url = 'https://t.me/share/url?url=' + encodeURIComponent('https://celikom.ru') +
                '&text=' + encodeURIComponent(text || 'Здравствуйте! Хочу презентацию Целиком.');
            window.open(url, '_blank');
        });
    }

    // =====================================================
    // PLAN PICK → store in form (tariff)
    // =====================================================
    const tariffInput = document.getElementById('selectedTariff');
    const tariffLabel = document.getElementById('selectedTariffLabel');
    const planPickers = Array.from(document.querySelectorAll('[data-plan-pick]'));

    function applyTariffToUi(label) {
        if (tariffInput) tariffInput.value = label || '';
        if (tariffLabel) tariffLabel.textContent = label || '—';
    }

    function markPickedPlan(planName) {
        // reset
        document.querySelectorAll('.plan.is-picked').forEach(function(p) { p.classList.remove('is-picked'); });
        document.querySelectorAll('[data-plan-pick].is-picked').forEach(function(b) { b.classList.remove('is-picked'); });

        if (!planName) return;
        const btn = document.querySelector('[data-plan-pick][data-plan="' + CSS.escape(planName) + '"]');
        if (!btn) return;
        btn.classList.add('is-picked');
        const card = btn.closest('.plan');
        if (card) card.classList.add('is-picked');
    }

    function setPickedTariff(plan, price) {
        const label = formatTariffLabel(plan, price);
        if (!label) return;
        localStorage.setItem('celikom_tariff', label);
        localStorage.setItem('celikom_tariff_name', String(plan || '').trim());
        applyTariffToUi(label);
        markPickedPlan(String(plan || '').trim());
    }

    // restore selection
    const savedTariff = (localStorage.getItem('celikom_tariff') || '').trim();
    const savedPlanName = (localStorage.getItem('celikom_tariff_name') || '').trim();
    if (savedTariff) applyTariffToUi(savedTariff);
    if (savedPlanName) markPickedPlan(savedPlanName);

    if (planPickers.length > 0) {
        planPickers.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const plan = btn.dataset.plan || '';
                const price = btn.dataset.planPrice || '';
                setPickedTariff(plan, price);
            });
        });
    }

    // =====================================================
    // LIVE METRICS (admin-driven, with safe fallback)
    // =====================================================
    (function initLiveMetrics() {
        const root = document.querySelector('[data-live-metrics]');
        if (!root) return;

        const updatedEl = root.querySelector('[data-metrics-updated]');
        const items = Array.from(root.querySelectorAll('[data-metric][data-key]'));
        if (items.length === 0) return;

        function formatMetricValue(n) {
            const v = Math.max(0, Math.round(Number(n) || 0));
            // trust-style “+” like in the reference block
            return formatRuInt(v) + '+';
        }

        function setUpdatedText(s) {
            if (!updatedEl) return;
            updatedEl.textContent = s || '—';
        }

        function readDefaults() {
            const out = {};
            items.forEach(function(el) {
                const k = el.dataset.key;
                const d = Number(el.dataset.default);
                if (k) out[k] = Number.isFinite(d) ? d : 0;
            });
            return out;
        }

        async function fetchMetrics(endpoint) {
            const res = await fetch(endpoint, { cache: 'no-store' });
            if (!res.ok) throw new Error('metrics http ' + res.status);
            const data = await res.json();
            const metrics = (data && typeof data === 'object' && data.metrics && typeof data.metrics === 'object') ? data.metrics : data;
            const updatedAt = data?.updatedAt || data?.updated_at || data?.updated || metrics?.updatedAt || metrics?.updated_at || null;
            return { metrics, updatedAt };
        }

        function setTargets(metrics) {
            items.forEach(function(el) {
                const k = el.dataset.key;
                const target = Number(metrics?.[k]);
                const safe = Number.isFinite(target) ? target : Number(el.dataset.default) || 0;
                el.dataset.target = String(safe);
            });
        }

        function paintInstant() {
            items.forEach(function(el) {
                const v = Number(el.dataset.target || el.dataset.default || '0');
                const out = el.querySelector('[data-metric-value]');
                if (out) out.textContent = formatMetricValue(v);
            });
        }

        function animateIn() {
            if (prefersReducedMotion) {
                paintInstant();
                return;
            }
            const start = performance.now();
            const dur = 900;
            const starts = items.map(function(el) { return 0; });
            const targets = items.map(function(el) { return Number(el.dataset.target || el.dataset.default || '0'); });

            function tick(now) {
                const t = clamp((now - start) / dur, 0, 1);
                const e = 1 - Math.pow(1 - t, 3);
                items.forEach(function(el, i) {
                    const out = el.querySelector('[data-metric-value]');
                    if (!out) return;
                    const v = lerp(starts[i], targets[i], e);
                    out.textContent = formatMetricValue(v);
                });
                if (t < 1) requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        }

        // load remote (optional) then animate on first view
        (async function boot() {
            const endpoint = (root.dataset.endpoint || window.CELICOM_METRICS_ENDPOINT || '').trim();
            const defaults = readDefaults();

            try {
                if (endpoint) {
                    const res = await fetchMetrics(endpoint);
                    setTargets({ ...defaults, ...(res.metrics || {}) });
                    setUpdatedText(res.updatedAt ? String(res.updatedAt) : 'сейчас');
                } else {
                    setTargets(defaults);
                    setUpdatedText('сейчас');
                }
            } catch (_) {
                setTargets(defaults);
                setUpdatedText('сейчас');
            }

            const io = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (!entry.isIntersecting) return;
                    animateIn();
                    io.disconnect();
                });
            }, { threshold: 0.25 });

            io.observe(root);
        })();
    })();

    // =====================================================
    // CAROUSELS (About + Wow)
    // =====================================================
    function initCarousel(root) {
        const slides = Array.from(root.querySelectorAll('[data-carousel-slide]'));
        if (slides.length <= 1) return;

        const viewport = root.querySelector('.carousel__viewport');
        const prevBtn = root.querySelector('[data-carousel-prev]');
        const nextBtn = root.querySelector('[data-carousel-next]');
        const dots = Array.from(root.querySelectorAll('[data-carousel-dots] .dot'));

        let index = 0;
        let heightSyncedOnce = false;

        function syncLinkedMock() {
            // For the WOW block we optionally sync the right mockup with the active slide.
            if ((root.dataset.carousel || '').toLowerCase() !== 'wow') return;
            const active = slides[index];
            if (!active) return;

            const titleEl = root.querySelector('[data-wow-order-title]');
            const statusEl = root.querySelector('[data-wow-order-status]');
            const hintEl = root.querySelector('[data-wow-meter-hint]');

            if (titleEl && active.dataset.mockupTitle) titleEl.textContent = active.dataset.mockupTitle;
            if (statusEl && active.dataset.mockupStatus) statusEl.textContent = active.dataset.mockupStatus;
            if (hintEl && active.dataset.mockupHint) hintEl.textContent = active.dataset.mockupHint;
        }

        function syncViewportHeight(immediate) {
            if (!viewport) return;
            const active = slides[index];
            if (!active) return;

            const minH = parseInt(getComputedStyle(viewport).minHeight || '0', 10);
            const target = Math.max(active.scrollHeight || 0, Number.isFinite(minH) ? minH : 0);

            if (immediate) {
                // avoid “jump” animation on first paint
                const prevTransition = viewport.style.transition;
                viewport.style.transition = 'none';
                viewport.style.height = target + 'px';
                // re-enable transition next frame
                requestAnimationFrame(function() {
                    viewport.style.transition = prevTransition;
                });
            } else {
                viewport.style.height = target + 'px';
            }
        }

        function setIndex(next) {
            const max = slides.length;
            index = ((next % max) + max) % max;

            slides.forEach(function(s, i) {
                if (i === index) s.classList.add('is-active');
                else s.classList.remove('is-active');
            });

            if (dots.length === max) {
                dots.forEach(function(d, i) {
                    if (i === index) d.classList.add('is-active');
                    else d.classList.remove('is-active');
                });
            }

            // After class toggles → measure and set viewport height
            requestAnimationFrame(function() {
                syncViewportHeight(!heightSyncedOnce);
                heightSyncedOnce = true;
            });

            // Keep linked mockup in sync (WOW section)
            syncLinkedMock();
        }

        if (prevBtn) prevBtn.addEventListener('click', function() { setIndex(index - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function() { setIndex(index + 1); });

        if (dots.length === slides.length) {
            dots.forEach(function(dot, i) {
                dot.addEventListener('click', function() { setIndex(i); });
                dot.style.cursor = 'pointer';
            });
        }

        setIndex(0);

        // Optional: change slides based on page scroll (WOW section only)
        if (root.hasAttribute('data-carousel-scroll') && (root.dataset.carousel || '').toLowerCase() === 'wow') {
            function updateFromScroll() {
                // keep click/keyboard usable on mobile; scroll-sync is a desktop enhancement
                if (!isDesktop || prefersReducedMotion) return;
                const rect = root.getBoundingClientRect();
                const total = Math.max(1, rect.height + window.innerHeight);
                const p = clamp((window.innerHeight - rect.top) / total, 0, 1);
                const nextIdx = clamp(Math.floor(p * slides.length), 0, slides.length - 1);
                if (nextIdx !== index) setIndex(nextIdx);
            }
            scrollUpdates.push({ el: root, fn: updateFromScroll, pad: 800 });
            updateFromScroll();
        }

        // Keep height correct on resize / font load / images
        window.addEventListener('resize', function() { syncViewportHeight(false); });
        window.addEventListener('load', function() { syncViewportHeight(false); });
    }

    document.querySelectorAll('[data-carousel]').forEach(function(el) {
        initCarousel(el);
    });

    // =====================================================
    // FAQ: keep only one open
    // =====================================================
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(function(item) {
            item.addEventListener('toggle', function() {
                if (!item.open) return;
                faqItems.forEach(function(other) {
                    if (other !== item) other.open = false;
                });
            });
        });
    }

    // =====================================================
    // Floating CTA: hide when contact is visible
    // =====================================================
    const floatingCta = document.getElementById('floatingCta');
    const contactSection = document.getElementById('contact');
    if (floatingCta && contactSection) {
        const ctaObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                const hidden = entry.isIntersecting;
                floatingCta.style.opacity = hidden ? '0' : '';
                floatingCta.style.pointerEvents = hidden ? 'none' : '';
                floatingCta.style.transform = hidden ? 'translateY(10px)' : '';
            });
        }, { threshold: 0.45 });
        ctaObserver.observe(contactSection);
    }
    
    // =====================================================
    // SUPPORT SECTION - CHAT SCROLL ANIMATION
    // =====================================================
    const supportSections = document.querySelectorAll('.support-section');
    if (supportSections.length > 0) {
        function updateSupportSection(section) {
            const chatSection = section.querySelector('.support-chat-section');
            const telegram = section.querySelector('.telegram-window');
            if (!chatSection || !telegram) return;

            const messages = telegram.querySelectorAll('[data-msg]');
            const timelineItems = section.querySelectorAll('.timeline-item');

            // Mobile / reduced motion: show all
            if (prefersReducedMotion || window.innerWidth < 768) {
                messages.forEach(function(m) { m.classList.add('is-visible'); });
                timelineItems.forEach(function(t) { t.classList.add('is-active'); });
                telegram.classList.remove('is-typing');
                return;
            }

            const rect = chatSection.getBoundingClientRect();
            const total = rect.height + window.innerHeight;
            // Make the first message/step visible immediately when the section enters the viewport.
            // Without this bias, on some layouts the progress may stay below the first threshold
            // and the chat/timeline looks "empty".
            let progress = clamp((window.innerHeight - rect.top) / Math.max(1, total), 0, 1);
            progress = clamp(progress + 0.08, 0, 1);

            const thresholds = [0.02, 0.22, 0.44, 0.62, 0.78]; // msg1..msg4 + resolved

            messages.forEach(function(msg) {
                const id = parseInt(msg.dataset.msg || '0', 10);
                if (!id) return;
                const idx = id - 1;
                const th = thresholds[idx] ?? 0.5;
                if (progress >= th) msg.classList.add('is-visible');
                else msg.classList.remove('is-visible');
            });

            // Timeline mirrors the chat
            timelineItems.forEach(function(item) {
                const step = parseInt(item.dataset.step || '0', 10);
                if (!step) return;
                const idx = step - 1;
                const th = thresholds[idx] ?? 0.5;
                if (progress >= th) item.classList.add('is-active');
                else item.classList.remove('is-active');
            });

            // Typing indicator between messages (reversible)
            const isTyping =
                (progress > thresholds[0] && progress < thresholds[1]) ||
                (progress > thresholds[1] && progress < thresholds[2]);
            telegram.classList.toggle('is-typing', isTyping);
        }

        function updateAllSupport() {
            supportSections.forEach(function(section) {
                updateSupportSection(section);
            });
        }

        scrollUpdates.push({ el: supportSections[0], fn: updateAllSupport, pad: 700 });
        window.addEventListener('resize', updateAllSupport);
        updateAllSupport();
    }

    // initial tick to sync header + any visible sections
    requestTick();
    
    console.log('Целиком - Site loaded successfully');
});
