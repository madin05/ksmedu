// js/landing.js

function initLandingHeroSlideshow() {
    const hero = document.querySelector('.landing-hero');
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll('.landing-hero-slide'));
    const dots = Array.from(hero.querySelectorAll('#landingHeroDots button'));
    const previous = document.getElementById('landingHeroPrev');
    const next = document.getElementById('landingHeroNext');
    if (slides.length <= 1) return;

    let activeIndex = 0;
    let autoplayInterval = null;
    let touchStartX = 0;

    const showSlide = (index) => {
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === activeIndex));
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === activeIndex);
            dot.setAttribute('aria-current', dotIndex === activeIndex ? 'true' : 'false');
        });
    };

    const stopAutoplay = () => {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    };

    const startAutoplay = () => {
        stopAutoplay();
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        autoplayInterval = setInterval(() => showSlide(activeIndex + 1), 4000);
    };

    previous?.addEventListener('click', () => { showSlide(activeIndex - 1); startAutoplay(); });
    next?.addEventListener('click', () => { showSlide(activeIndex + 1); startAutoplay(); });
    dots.forEach((dot) => dot.addEventListener('click', () => {
        showSlide(Number(dot.dataset.index));
        startAutoplay();
    }));
    hero.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); showSlide(activeIndex - 1); startAutoplay(); }
        if (event.key === 'ArrowRight') { event.preventDefault(); showSlide(activeIndex + 1); startAutoplay(); }
    });
    hero.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
    hero.addEventListener('touchend', (event) => {
        const distance = event.changedTouches[0].screenX - touchStartX;
        if (Math.abs(distance) > 50) showSlide(activeIndex + (distance < 0 ? 1 : -1));
        startAutoplay();
    }, { passive: true });

    showSlide(0);
    startAutoplay();
}

document.addEventListener("DOMContentLoaded", function () {
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Change Navigation styles on scroll
    const header = document.querySelector('.landing-header');
    if (header) {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const landingNavMenu = document.getElementById('landingNavMenu');
    
    if (mobileMenuBtn && landingNavMenu) {
        const closeMobileMenu = () => {
            landingNavMenu.classList.remove('active');
            document.body.classList.remove('menu-open');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenuBtn.innerHTML = '<i data-feather="menu"></i>';
            if (typeof feather !== 'undefined') feather.replace();
        };

        landingNavMenu.addEventListener('click', (e) => {
            const mobileNavAnchor = e.target.closest('a');
            if (mobileNavAnchor) {
                closeMobileMenu();
            }
            e.stopPropagation();
        });

        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            landingNavMenu.classList.toggle('active');
            const isOpen = landingNavMenu.classList.contains('active');
            document.body.classList.toggle('menu-open', isOpen);
            mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            
            // Toggle between menu and x icon
            mobileMenuBtn.innerHTML = isOpen ? '<i data-feather="x"></i>' : '<i data-feather="menu"></i>';
            if (typeof feather !== 'undefined') feather.replace();
        });

        // Close menu if user clicks outside
        document.addEventListener('click', () => {
            if (landingNavMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });

    }

    // Language Switcher Dropdowns (Header & Footer)
    const langBtnDesktop = document.getElementById('langBtnDesktop');
    const langDropdownDesktop = document.getElementById('langDropdownDesktop');
    
    if (langBtnDesktop && langDropdownDesktop) {
        langBtnDesktop.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdownDesktop.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            langDropdownDesktop.classList.remove('show');
        });
    }

    const langBtnFooter = document.getElementById('langBtnFooter');
    const langDropdownFooter = document.getElementById('langDropdownFooter');
    
    if (langBtnFooter && langDropdownFooter) {
        langBtnFooter.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdownFooter.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            langDropdownFooter.classList.remove('show');
        });
    }

    // Custom Search Filter Dropdown
    const filterTrigger = document.getElementById('filterTrigger');
    const filterDropdownMenu = document.getElementById('filterDropdownMenu');
    const searchFilter = document.getElementById('searchFilter');
    const filterCurrent = document.getElementById('filterCurrent');
    
    if (filterTrigger && filterDropdownMenu && searchFilter && filterCurrent) {
        filterTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdownMenu.classList.toggle('show');
        });

        filterDropdownMenu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', function () {
                const val = this.getAttribute('data-value');
                const txt = this.textContent;
                
                // Update hidden input value
                searchFilter.value = val;
                
                // Update visible text
                filterCurrent.textContent = txt;
                
                // Toggle active class
                filterDropdownMenu.querySelectorAll('li').forEach(el => el.classList.remove('active'));
                this.classList.add('active');
                
                // Close dropdown
                filterDropdownMenu.classList.remove('show');
            });
        });

        document.addEventListener('click', () => {
            filterDropdownMenu.classList.remove('show');
        });
    }

    // Search Form Action Router
    const searchForm = document.getElementById('searchForm');
    
    if (searchForm && searchFilter) {
        searchForm.addEventListener('submit', function (e) {
            const filterValue = searchFilter.value;
            if (filterValue === 'articles') {
                searchForm.action = 'user/opinions_user.php';
            } else {
                searchForm.action = 'user/journals_user.php';
            }
        });
    }

    // Guidelines Mobile Autoplay with Pause-on-Touch/Scroll Interaction
    const guidelinesGrid = document.querySelector('.guidelines-grid');
    if (guidelinesGrid) {
        let isUserInteracting = false;
        let autoplayInterval = null;
        let activeIndex = 0;
        let interactionTimeout = null;

        const startAutoplay = () => {
            if (autoplayInterval) clearInterval(autoplayInterval);
            autoplayInterval = setInterval(() => {
                if (isUserInteracting) return;
                
                const cards = guidelinesGrid.querySelectorAll('.guidelines-card');
                if (cards.length === 0) return;
                
                activeIndex = (activeIndex + 1) % cards.length;
                const targetCard = cards[activeIndex];
                
                guidelinesGrid.scrollTo({
                    left: targetCard.offsetLeft - guidelinesGrid.offsetLeft - 20, // offset for visual padding alignment
                    behavior: 'smooth'
                });
            }, 3000);
        };

        const stopAutoplay = () => {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        };

        const handleUserInteraction = () => {
            isUserInteracting = true;
            stopAutoplay();
            
            // Resume autoplay after 5 seconds of no interactions
            clearTimeout(interactionTimeout);
            interactionTimeout = setTimeout(() => {
                isUserInteracting = false;
                
                // Recalculate closest index based on current manual scroll location
                const cards = guidelinesGrid.querySelectorAll('.guidelines-card');
                if (cards.length > 0) {
                    const scrollLeft = guidelinesGrid.scrollLeft;
                    let closestIndex = 0;
                    let minDiff = Infinity;
                    cards.forEach((card, index) => {
                        const diff = Math.abs(card.offsetLeft - guidelinesGrid.offsetLeft - scrollLeft - 20);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestIndex = index;
                        }
                    });
                    activeIndex = closestIndex;
                }
                
                startAutoplay();
            }, 5000);
        };

        // Bind events for touch screens and scroll detection
        guidelinesGrid.addEventListener('touchstart', handleUserInteraction, { passive: true });
        guidelinesGrid.addEventListener('touchmove', handleUserInteraction, { passive: true });
        guidelinesGrid.addEventListener('scroll', function() {
            if (!isUserInteracting) {
                handleUserInteraction();
            }
        }, { passive: true });

        // Start horizontal autoplay initially if on mobile device
        if (window.innerWidth <= 768) {
            startAutoplay();
        }

        // React to viewport resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                startAutoplay();
            } else {
                stopAutoplay();
            }
        });
    }

    initLandingHeroSlideshow();
});

// Helper function to switch languages via URL parameter
function changeLanguage(lang) {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.location.href = url.toString();
}
