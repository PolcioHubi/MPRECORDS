/**
 * Carousel Component - MP RECORDS
 * Handles the releases carousel functionality
 */

class Carousel {
    constructor(options = {}) {
        this.track = document.getElementById('carouselTrack');
        this.prevBtn = document.getElementById('carouselPrev');
        this.nextBtn = document.getElementById('carouselNext');
        this.dotsContainer = document.getElementById('carouselDots');
        
        if (!this.track) return;
        
        this.currentIndex = 0;
        this.itemsPerView = options.itemsPerView || this.calculateItemsPerView();
        this.items = [];
        this.autoplayInterval = null;
        this.autoplayDelay = options.autoplayDelay || 5000;
        
        this.init();
    }
    
    calculateItemsPerView() {
        const width = window.innerWidth;
        if (width < 480) return 1;
        if (width < 768) return 2;
        if (width < 1024) return 3;
        return 4;
    }
    
    async init() {
        await this.loadReleases();
        this.setupEventListeners();
        this.updateButtons();
        this.createDots();
        this.startAutoplay();
    }
    
    async loadReleases() {
        try {
            const response = await WydaniaAPI.getAll();
            this.items = response.data || [];
            this.render();
        } catch (error) {
            console.error('Error loading releases:', error);
            this.renderPlaceholder();
        }
    }
    
    render() {
        if (this.items.length === 0) {
            this.renderPlaceholder();
            return;
        }
        
        this.track.innerHTML = this.items.map(item => `
            <div class="carousel-item" data-spotify="${item.spotifyLink || ''}">
                <div class="carousel-item-image">
                    ${this.renderBadge(item.wyroznienie)}
                    <img src="${item.okladka || '/assets/image/placeholder.png'}" 
                         alt="${item.nazwa}"
                         loading="lazy">
                    <div class="carousel-item-overlay">
                        <div class="spotify-hover-icon">
                            <svg viewBox="0 0 24 24" width="40" height="40">
                                <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="carousel-item-info">
                    <h3 class="carousel-item-title">${item.nazwa}</h3>
                    <p class="carousel-item-artist">${item.autorzy || 'MP RECORDS'}</p>
                    <span class="carousel-item-year">${item.rok || ''}</span>
                </div>
            </div>
        `).join('');
        
        // Add click listeners for items - open Spotify
        this.track.querySelectorAll('.carousel-item').forEach(item => {
            item.addEventListener('click', () => {
                const spotifyUrl = item.dataset.spotify;
                if (spotifyUrl) {
                    this.openSpotify(spotifyUrl);
                }
            });
        });
    }
    
    openSpotify(url) {
        // Show loader if exists
        const loader = document.getElementById('spotifyLoader');
        if (loader) {
            loader.classList.add('active');
            setTimeout(() => {
                window.open(url, '_blank');
                setTimeout(() => loader.classList.remove('active'), 500);
            }, 1500);
        } else {
            window.open(url, '_blank');
        }
    }
    
    renderBadge(wyroznienie) {
        if (!wyroznienie || wyroznienie === 'brak') return '';
        
        const badges = {
            'nowosc': '<span class="card-badge nowosc">NOWOŚĆ</span>',
            'hot': '<span class="card-badge hot">HOT</span>',
            'polecane': '<span class="card-badge polecane">POLECANE</span>'
        };
        return badges[wyroznienie] || '';
    }
    
    renderPlaceholder() {
        this.track.innerHTML = `
            <div class="carousel-item">
                <div class="carousel-item-image">
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: var(--color-bg-secondary);">
                        <p style="color: var(--color-text-secondary); font-size: 0.875rem;">Brak wydań</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prev());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.next());
        }
        
        // Touch/swipe support
        let startX = 0;
        let isDragging = false;
        
        this.track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            this.stopAutoplay();
        });
        
        this.track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
        });
        
        this.track.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
            
            isDragging = false;
            this.startAutoplay();
        });
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.itemsPerView = this.calculateItemsPerView();
            this.goTo(this.currentIndex);
            this.updateButtons();
        });
        
        // Pause autoplay on hover
        this.track.addEventListener('mouseenter', () => this.stopAutoplay());
        this.track.addEventListener('mouseleave', () => this.startAutoplay());
    }
    
    getMaxIndex() {
        return Math.max(0, this.items.length - this.itemsPerView);
    }
    
    prev() {
        if (this.currentIndex > 0) {
            this.goTo(this.currentIndex - 1);
        }
    }
    
    next() {
        if (this.currentIndex < this.getMaxIndex()) {
            this.goTo(this.currentIndex + 1);
        } else {
            // Loop back to start
            this.goTo(0);
        }
    }
    
    goTo(index) {
        this.currentIndex = Math.max(0, Math.min(index, this.getMaxIndex()));
        
        const itemWidth = this.track.querySelector('.carousel-item')?.offsetWidth || 280;
        const gap = 16; // gap between items
        const offset = this.currentIndex * (itemWidth + gap);
        
        this.track.style.transform = `translateX(-${offset}px)`;
        
        this.updateButtons();
        this.updateDots();
    }
    
    updateButtons() {
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentIndex === 0;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentIndex >= this.getMaxIndex();
        }
    }
    
    createDots() {
        if (!this.dotsContainer) return;
        
        const numDots = this.getMaxIndex() + 1;
        
        this.dotsContainer.innerHTML = Array.from({ length: numDots }, (_, i) => `
            <button class="carousel-dot ${i === 0 ? 'active' : ''}" 
                    data-index="${i}"
                    aria-label="Slide ${i + 1}"></button>
        `).join('');
        
        this.dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                this.goTo(parseInt(dot.dataset.index));
            });
        });
    }
    
    updateDots() {
        if (!this.dotsContainer) return;
        
        this.dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }
    
    startAutoplay() {
        this.stopAutoplay();
        this.autoplayInterval = setInterval(() => {
            this.next();
        }, this.autoplayDelay);
    }
    
    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('carouselTrack')) {
        window.carousel = new Carousel();
    }
});
