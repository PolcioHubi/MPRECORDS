/**
 * Navigation Component - MP RECORDS
 * Handles navigation behavior and mobile menu
 */

class Navigation {
    constructor() {
        this.nav = document.getElementById('mainNav');
        this.navLinks = document.querySelector('.nav-links');
        this.navToggle = null;
        
        if (!this.nav) return;
        
        this.lastScrollY = 0;
        this.scrollThreshold = 100;
        
        this.init();
    }
    
    init() {
        this.createMobileToggle();
        this.setupScrollListener();
        this.setupActiveLink();
    }
    
    createMobileToggle() {
        // Create toggle button for mobile
        this.navToggle = document.createElement('button');
        this.navToggle.className = 'nav-toggle';
        this.navToggle.setAttribute('aria-label', 'Menu');
        this.navToggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        
        // Insert before nav-links
        const navContainer = this.nav.querySelector('.nav-container');
        if (navContainer && this.navLinks) {
            navContainer.appendChild(this.navToggle);
        }
        
        // Toggle menu on click
        this.navToggle.addEventListener('click', () => this.toggleMenu());
        
        // Close menu on link click
        if (this.navLinks) {
            this.navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });
        }
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        const isActive = this.navToggle.classList.toggle('active');
        this.navLinks?.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isActive ? 'hidden' : '';
    }
    
    closeMenu() {
        this.navToggle?.classList.remove('active');
        this.navLinks?.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    setupScrollListener() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    handleScroll() {
        const scrollY = window.scrollY;
        
        // Add scrolled class for background
        if (scrollY > this.scrollThreshold) {
            this.nav.classList.add('scrolled');
        } else {
            this.nav.classList.remove('scrolled');
        }
        
        this.lastScrollY = scrollY;
    }
    
    setupActiveLink() {
        const currentPath = window.location.pathname;
        
        this.navLinks?.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath === href || (href !== '/' && currentPath.startsWith(href))) {
                link.classList.add('active');
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.navigation = new Navigation();
});
