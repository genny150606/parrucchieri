/* ═══════════════════════════════════════════
   R&S PARRUCCHIERI — Main JavaScript
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollAnimations();
    initFaqAccordion();
    initForms();
    loadContactInfo();
});

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
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

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
