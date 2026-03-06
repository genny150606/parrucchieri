/* ═══════════════════════════════════════════
   HAIR LOVE PARRUCCHIERI — Main JavaScript
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollAnimations();
    initFaqAccordion();
    initForms();
    loadContactInfo();
    initCookieBanner();
    initPageTransitions();
});

/* ─── Page Transitions ─── */
function initPageTransitions() {
    // 1. Entrance Animation (Page Load)
    const overlay = document.createElement('div');
    overlay.className = 'luxury-transition';
    overlay.innerHTML = `
        <div class="luxury-layer luxury-layer-1 sweep-right"></div>
        <div class="luxury-layer luxury-layer-2 sweep-right"></div>
        <div class="luxury-layer luxury-layer-3 sweep-right"></div>
        <div class="luxury-logo-wrapper show">
            <img src="images/logo.png" alt="Hair Love Logo" class="curtain-logo-img">
        </div>
    `;
    document.body.appendChild(overlay);

    document.body.style.opacity = '1';

    // Start entrance animation (hide logo, slide layers right)
    setTimeout(() => {
        const logo = overlay.querySelector('.luxury-logo-wrapper');
        if (logo) {
            logo.classList.remove('show');
            logo.classList.add('hide');
        }

        // Wait for logo to fade before moving curtains
        setTimeout(() => {
            overlay.querySelectorAll('.sweep-right').forEach(layer => {
                layer.classList.add('go');
            });

            // Remove from DOM when done
            setTimeout(() => {
                overlay.remove();
            }, 1600);
        }, 300);
    }, 400); // delay to admire the logo before it sweeps away

    // 2. Exit Animation on Navigation
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            // Check modifier keys for new tab
            if (e.ctrlKey || e.shiftKey || e.metaKey || e.button === 1) return;

            const href = link.getAttribute('href');
            const target = link.getAttribute('target');

            // Ignore anchors, external links, or JS triggers
            if (!href || href.startsWith('#') || href.startsWith('javascript') || href.startsWith('mailto:') || href.startsWith('tel:') || target === '_blank') {
                return;
            }

            // Only act if it's an internal HTML page navigation
            if (href.endsWith('.html') || href === '/' || href === 'index.html') {
                e.preventDefault();

                // Create exit curtain
                const exitOverlay = document.createElement('div');
                exitOverlay.className = 'luxury-transition';
                exitOverlay.innerHTML = `
                    <div class="luxury-layer luxury-layer-1 sweep-enter"></div>
                    <div class="luxury-layer luxury-layer-2 sweep-enter"></div>
                    <div class="luxury-layer luxury-layer-3 sweep-enter"></div>
                    <div class="luxury-logo-wrapper">
                        <img src="images/logo.png" alt="Hair Love Logo" class="curtain-logo-img">
                    </div>
                `;
                document.body.appendChild(exitOverlay);

                // Force reflow
                void exitOverlay.offsetWidth;

                // Animate layers to cover screen
                exitOverlay.querySelectorAll('.sweep-enter').forEach(layer => {
                    layer.classList.add('go');
                });

                // Show logo after layers cover the screen
                setTimeout(() => {
                    const logo = exitOverlay.querySelector('.luxury-logo-wrapper');
                    if (logo) logo.classList.add('show');
                }, 800);

                // Navigate when fully covered
                setTimeout(() => {
                    window.location.href = href;
                }, 1300);
            }
        });
    });
}

/* ─── Fetch Contact Info ─── */
async function loadContactInfo() {
    if (typeof supabaseClient === 'undefined') return;

    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('value')
            .eq('key', 'contact_info')
            .single();

        if (error) {
            console.error('Errore nel caricamento dei contatti:', error);
            return;
        }

        if (data && data.value) {
            const { phone, email, address } = data.value;

            // Aggiorna gli elementi nel footer
            document.querySelectorAll('.footer-contact-item').forEach(item => {
                const icon = item.querySelector('.material-symbols-outlined').textContent.trim();
                const spans = item.querySelectorAll('span');
                if (spans.length > 1) {
                    if (icon === 'location_on' && address) spans[1].textContent = address;
                    if (icon === 'call' && phone) spans[1].textContent = phone;
                    if (icon === 'mail' && email) spans[1].textContent = email;
                }
            });

            // Aggiorna la pagina contatti.html
            document.querySelectorAll('.contact-info-card').forEach(card => {
                const icon = card.querySelector('.material-symbols-outlined').textContent.trim();
                const p = card.querySelector('p');
                if (p) {
                    if (icon === 'location_on' && address) p.textContent = address;
                    if (icon === 'call' && phone) p.textContent = phone;
                    if (icon === 'mail' && email) p.textContent = email;
                }
            });

            // Aggiorna la pagina prenotazioni.html
            document.querySelectorAll('.location-item').forEach(item => {
                const icon = item.querySelector('.material-symbols-outlined').textContent.trim();
                const spans = item.querySelectorAll('span');
                if (spans.length > 1) {
                    if (icon === 'pin_drop' && address) spans[1].textContent = address; // Usa pin_drop
                    if (icon === 'call' && phone) spans[1].textContent = phone;
                    if (icon === 'mail' && email) spans[1].textContent = email;
                }
            });
        }
    } catch (err) {
        console.error('Eccezione nel caricamento dei contatti:', err);
    }
}

/* ─── Navbar ─── */
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Hamburger toggle
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        // Close on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (navLinks && navLinks.classList.contains('open') &&
            !navLinks.contains(e.target) &&
            !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        }
    });

    // Set active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks?.querySelectorAll('a:not(.nav-cta)').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

/* ─── Scroll Animations ─── */
function initScrollAnimations() {
    window.scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add tiny delay for smoother chained feeling
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, 50);
            } else {
                // Remove to allow repeating animation on scroll up/down
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in, .reveal').forEach(el => window.scrollObserver.observe(el));

    // Counter animation for stats
    document.querySelectorAll('.stat-number').forEach(el => {
        const observer2 = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(el);
                    observer2.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        observer2.observe(el);
    });
}

function animateCounter(element) {
    const text = element.textContent;
    const match = text.match(/(\d+)/);
    if (!match) return;

    const target = parseInt(match[0]);
    const suffix = text.replace(match[0], '');
    const duration = 1500;
    const start = performance.now();

    function update(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(target * eased);
        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = text;
        }
    }

    requestAnimationFrame(update);
}

/* ─── FAQ Accordion ─── */
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question?.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');

            // Close all
            faqItems.forEach(other => {
                other.classList.remove('active');
                const otherAnswer = other.querySelector('.faq-answer');
                if (otherAnswer) otherAnswer.style.maxHeight = null;
            });

            // Toggle current
            if (!isOpen) {
                item.classList.add('active');
                if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
}

/* ─── Forms ─── */
function initForms() {
    document.querySelectorAll('form:not([data-custom-submit="true"])').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = form.querySelector('.btn-submit');
            const originalText = btn.textContent;

            // Success animation
            btn.textContent = '✓ Inviato con successo!';
            btn.style.background = 'var(--color-success)';
            btn.style.pointerEvents = 'none';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.pointerEvents = '';
                form.reset();
            }, 3000);
        });
    });
}

/* ─── Cookie Banner ─── */
function initCookieBanner() {
    if (!localStorage.getItem('cookie_consent')) {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner fade-in';
        banner.innerHTML = `
            <div class="cookie-content">
                <p>Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito e offrirti servizi personalizzati. 
                Continuando a navigare, accetti la nostra <a href="privacy-policy.html">Privacy & Cookie Policy</a>.</p>
                <div class="cookie-buttons">
                    <button id="acceptCookies" class="btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">Accetta Tutti</button>
                    <button id="rejectCookies" class="btn-secondary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">Solo Necessari</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        // Add CSS dynamically
        const style = document.createElement('style');
        style.textContent = `
            .cookie-banner {
                position: fixed;
                bottom: 0; left: 0; right: 0;
                background: rgba(13, 13, 13, 0.95);
                backdrop-filter: blur(10px);
                border-top: 1px solid var(--admin-border, rgba(212,175,55,0.2));
                padding: 1.5rem 2rem;
                z-index: 9999;
                display: flex;
                justify-content: center;
                box-shadow: 0 -10px 30px rgba(0,0,0,0.8);
            }
            .cookie-content {
                max-width: 1200px;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2rem;
                animation: fadeInUp 0.5s ease;
            }
            .cookie-content p { margin: 0; font-size: 0.9rem; color: #a0a0a0; line-height: 1.5; }
            .cookie-content a { color: #d4af37; text-decoration: underline; font-weight:500; }
            .cookie-buttons { display: flex; gap: 1rem; flex-shrink: 0; }
            
            @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
            
            @media (max-width: 768px) {
                .cookie-content { flex-direction: column; text-align: center; }
                .cookie-buttons { width: 100%; justify-content: center; }
            }
        `;
        document.head.appendChild(style);

        document.getElementById('acceptCookies').addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'all');
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(100%)';
            banner.style.transition = '0.3s ease';
            setTimeout(() => banner.remove(), 300);
        });
        document.getElementById('rejectCookies').addEventListener('click', () => {
            localStorage.setItem('cookie_consent', 'essential');
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(100%)';
            banner.style.transition = '0.3s ease';
            setTimeout(() => banner.remove(), 300);
        });
    }
}
