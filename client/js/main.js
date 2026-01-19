/**
 * Main JavaScript - MP RECORDS
 * Entry point for the client application
 */

document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initHeader();
    initMembersPreview();
    initLightbox();
    initScrollAnimations();
    initSmoothScroll();
    initScrollIndicator();
});

/**
 * Load settings from API and initialize features
 */
async function initSettings() {
    try {
        const response = await fetch('/api/ustawienia');
        const settings = await response.json();
        
        if (settings.particlesEnabled !== false) {
            initParticles();
        }
        
        if (settings.customCursorEnabled !== false) {
            initCustomCursor();
        }
        
        if (settings.miniPlayerEnabled !== false) {
            initMiniPlayer();
        }
        
        // Marquee banner - sprawdź czy włączony i czy strona jest na liście
        const currentPath = window.location.pathname;
        const marqueePages = settings.marqueePages && settings.marqueePages.length > 0 
            ? settings.marqueePages 
            : ['/', '/wydania', '/sklep', '/media', '/czlonkowie'];
        
        const shouldShowMarquee = settings.marqueeEnabled && marqueePages.some(page => {
            if (page === '/') return currentPath === '/' || currentPath === '/index.html';
            return currentPath.startsWith(page);
        });
        
        if (shouldShowMarquee) {
            initMarquee(settings.marqueeText);
        }
        
        // Rotating headline - strona główna
        if (currentPath === '/' || currentPath === '/index.html') {
            if (settings.headlineEnabled && settings.headlinePhrases && settings.headlinePhrases.length > 0) {
                initRotatingHeadline(settings.headlinePhrases, settings.headlineInterval || 3000);
            }
        } else {
            // Podstrony - sprawdź pageHeadlines
            const pageKey = currentPath.replace('/', '').replace('.html', '');
            const pageHeadline = settings.pageHeadlines?.[pageKey];
            
            if (pageHeadline?.enabled && pageHeadline?.phrases?.length > 0) {
                initRotatingPageHeadline(pageHeadline.phrases, pageHeadline.interval || 3000);
            }
        }
    } catch (error) {
        // Default: enable all features
        initParticles();
        initCustomCursor();
        initMiniPlayer();
    }
}

/**
 * Marquee banner
 */
function initMarquee(text) {
    const banner = document.getElementById('marqueeBanner');
    const text1 = document.getElementById('marqueeText1');
    const text2 = document.getElementById('marqueeText2');
    
    if (!banner || !text1 || !text2) return;
    
    const marqueeContent = text + ' &nbsp;&nbsp;•&nbsp;&nbsp; ' + text + ' &nbsp;&nbsp;•&nbsp;&nbsp; ' + text + ' &nbsp;&nbsp;•&nbsp;&nbsp; ' + text + ' &nbsp;&nbsp;•&nbsp;&nbsp; ';
    text1.innerHTML = marqueeContent;
    text2.innerHTML = marqueeContent;
    
    banner.style.display = 'block';
    document.body.classList.add('has-marquee');
    
    // Obsługa scroll - najpierw banner, potem header
    const header = document.querySelector('.header');
    const handleMarqueeScroll = () => {
        // Banner zmienia się pierwszy (przy 50px)
        if (window.scrollY > 50) {
            banner.classList.remove('scrolled');
        } else {
            banner.classList.add('scrolled');
        }
        
        // Header zmienia się później (przy 100px)
        if (header) {
            if (window.scrollY > 100) {
                header.classList.remove('scrolled');
            } else {
                header.classList.add('scrolled');
            }
        }
    };
    
    window.addEventListener('scroll', handleMarqueeScroll);
    handleMarqueeScroll(); // Sprawdź stan początkowy
}

/**
 * Rotating headline
 */
function initRotatingHeadline(phrases, interval) {
    const headline = document.getElementById('heroHeadline');
    if (!headline || phrases.length === 0) return;
    
    let currentIndex = 0;
    
    setInterval(() => {
        headline.classList.add('fade-out');
        
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % phrases.length;
            headline.textContent = phrases[currentIndex];
            headline.classList.remove('fade-out');
            headline.classList.add('fade-in');
            
            setTimeout(() => {
                headline.classList.remove('fade-in');
            }, 300);
        }, 300);
    }, interval);
}

/**
 * Rotating headline for subpages (page-hero-title)
 */
function initRotatingPageHeadline(phrases, interval) {
    const headline = document.querySelector('.page-hero-title');
    if (!headline || phrases.length === 0) return;
    
    // Dodaj style dla animacji jeśli ich nie ma
    headline.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    let currentIndex = 0;
    
    setInterval(() => {
        headline.style.opacity = '0';
        headline.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % phrases.length;
            headline.textContent = phrases[currentIndex];
            headline.style.opacity = '1';
            headline.style.transform = 'scale(1)';
        }, 300);
    }, interval);
}

/**
 * Custom cursor effect
 */
function initCustomCursor() {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    
    if (!dot || !ring) return;
    
    // Enable custom cursor
    document.body.classList.add('custom-cursor');
    
    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Smooth cursor animation
    function animateCursor() {
        // Dot follows mouse directly
        dotX += (mouseX - dotX) * 0.5;
        dotY += (mouseY - dotY) * 0.5;
        dot.style.left = `${dotX}px`;
        dot.style.top = `${dotY}px`;
        
        // Ring follows with delay
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.left = `${ringX}px`;
        ring.style.top = `${ringY}px`;
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    
    // Click effect
    document.addEventListener('mousedown', () => {
        dot.classList.add('clicking');
        ring.classList.add('clicking');
    });
    
    document.addEventListener('mouseup', () => {
        dot.classList.remove('clicking');
        ring.classList.remove('clicking');
    });
    
    // Hover effect on interactive elements
    const hoverElements = document.querySelectorAll('a, button, .carousel-card, .member-card, input, textarea, select');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.classList.add('hovering');
            ring.classList.add('hovering');
        });
        el.addEventListener('mouseleave', () => {
            dot.classList.remove('hovering');
            ring.classList.remove('hovering');
        });
    });
    
    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        dot.style.opacity = '0';
        ring.style.opacity = '0';
    });
    
    document.addEventListener('mouseenter', () => {
        dot.style.opacity = '1';
        ring.style.opacity = '0.6';
    });
}

/**
 * Particles animation
 */
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5 - 0.3; // Slight upward drift
            this.opacity = Math.random() * 0.5 + 0.2;
            this.hue = Math.random() * 30 + 260; // Purple range (260-290)
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            // Fade out as particles rise
            if (this.y < canvas.height * 0.3) {
                this.opacity -= 0.002;
            }
            
            // Reset if out of bounds or faded
            if (this.x < 0 || this.x > canvas.width || 
                this.y < 0 || this.y > canvas.height ||
                this.opacity <= 0) {
                this.reset();
                this.y = canvas.height + 10;
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.opacity})`;
            ctx.fill();
            
            // Glow effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = `hsla(${this.hue}, 80%, 50%, ${this.opacity * 0.5})`;
        }
    }
    
    // Create particles
    const particleCount = Math.min(80, Math.floor(canvas.width * canvas.height / 15000));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(124, 58, 237, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}

/**
 * Mini music player
 */
function initMiniPlayer() {
    const player = document.getElementById('miniPlayer');
    const audio = document.getElementById('audioPlayer');
    if (!player || !audio) return;
    
    const playBtn = document.getElementById('playerPlayBtn');
    const playIcon = playBtn?.querySelector('.play-icon');
    const pauseIcon = playBtn?.querySelector('.pause-icon');
    const closeBtn = document.getElementById('playerClose');
    const progressBar = document.getElementById('playerBar');
    const progressFill = document.getElementById('playerBarFill');
    const currentTimeEl = document.getElementById('playerCurrentTime');
    const durationEl = document.getElementById('playerDuration');
    const volumeSlider = document.getElementById('playerVolume');
    const coverEl = document.getElementById('playerCover');
    const titleEl = document.getElementById('playerTitle');
    const artistEl = document.getElementById('playerArtist');
    
    let isPlaying = false;
    
    // Expose globally for carousel to use
    window.MiniPlayer = {
        play(track) {
            if (!track.previewAudio) return;
            
            audio.src = track.previewAudio;
            coverEl.src = track.okladka || '/assets/image/placeholder.png';
            titleEl.textContent = track.nazwa;
            artistEl.textContent = track.autorzy?.join(', ') || 'MP RECORDS';
            
            player.classList.add('active');
            document.body.classList.add('player-active');
            
            audio.play().then(() => {
                isPlaying = true;
                updatePlayButton();
            }).catch(console.error);
        },
        
        toggle() {
            if (isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
            isPlaying = !isPlaying;
            updatePlayButton();
        },
        
        close() {
            audio.pause();
            audio.currentTime = 0;
            isPlaying = false;
            updatePlayButton();
            player.classList.remove('active');
            document.body.classList.remove('player-active');
        }
    };
    
    function updatePlayButton() {
        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Event listeners
    playBtn?.addEventListener('click', () => window.MiniPlayer.toggle());
    closeBtn?.addEventListener('click', () => window.MiniPlayer.close());
    
    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100 || 0;
        progressFill.style.width = `${progress}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
    });
    
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });
    
    audio.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayButton();
        audio.currentTime = 0;
    });
    
    progressBar?.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pos * audio.duration;
    });
    
    volumeSlider?.addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });
    
    audio.volume = 0.7;
}

/**
 * Scroll indicator - smooth scroll down on click
 */
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (!scrollIndicator) return;
    
    scrollIndicator.addEventListener('click', () => {
        const transitionSection = document.querySelector('.transition-section');
        if (transitionSection) {
            transitionSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    scrollIndicator.style.cursor = 'pointer';
}

/**
 * Header scroll effect
 */
function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const handleScroll = () => {
        // Na górze = scrolled (przezroczysty), po scrollu = bez scrolled (ciemny)
        if (window.scrollY > 80) {
            header.classList.remove('scrolled');
        } else {
            header.classList.add('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}

/**
 * Members Carousel on homepage
 */
async function initMembersPreview() {
    const track = document.getElementById('membersTrack');
    const prevBtn = document.getElementById('membersPrev');
    const nextBtn = document.getElementById('membersNext');
    const dotsContainer = document.getElementById('membersDots');
    
    if (!track) return;
    
    let currentIndex = 0;
    let members = [];
    
    function calculateItemsPerView() {
        const width = window.innerWidth;
        if (width < 480) return 1;
        if (width < 768) return 2;
        if (width < 1024) return 3;
        return 4;
    }
    
    function getItemWidth() {
        const width = window.innerWidth;
        if (width < 480) return 280;
        if (width < 768) return 260;
        return 280;
    }
    
    function getGap() {
        return 16;
    }
    
    function render() {
        if (members.length === 0) {
            track.innerHTML = `
                <div class="carousel-item" style="flex: 0 0 100%; text-align: center; padding: 60px 20px;">
                    <p class="minecraft" style="color: var(--purple-light); margin-bottom: 16px;">BRAK ARTYSTÓW</p>
                    <p style="color: var(--gray);">Dodaj artystów w panelu admina</p>
                </div>
            `;
            return;
        }
        
        track.innerHTML = members.map(member => `
            <div class="carousel-item member-carousel-item" data-id="${member._id}">
                <div class="carousel-item-image member-image-wrapper">
                    <img src="${member.zdjecie || '/assets/image/placeholder-member.jpg'}" 
                         alt="${member.pseudonim}"
                         loading="lazy">
                    <div class="carousel-item-overlay">
                        <div class="member-hover-icon">👤</div>
                    </div>
                </div>
                <div class="carousel-item-info">
                    <h3 class="carousel-item-title">${member.pseudonim}</h3>
                    <p class="carousel-item-artist">${member.rola || 'ARTYSTA'}</p>
                </div>
            </div>
        `).join('');
        
        // Add click listeners
        track.querySelectorAll('.member-carousel-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = '/czlonkowie';
            });
        });
    }
    
    function createDots() {
        if (!dotsContainer || members.length === 0) return;
        
        const itemsPerView = calculateItemsPerView();
        const totalDots = Math.max(1, Math.ceil(members.length / itemsPerView));
        
        dotsContainer.innerHTML = Array.from({ length: totalDots }, (_, i) => 
            `<button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
        ).join('');
        
        dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                goToSlide(index * itemsPerView);
            });
        });
    }
    
    function updateDots() {
        if (!dotsContainer) return;
        const itemsPerView = calculateItemsPerView();
        const activeDot = Math.floor(currentIndex / itemsPerView);
        
        dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === activeDot);
        });
    }
    
    function updateButtons() {
        const itemsPerView = calculateItemsPerView();
        const maxIndex = Math.max(0, members.length - itemsPerView);
        
        if (prevBtn) prevBtn.disabled = currentIndex <= 0;
        if (nextBtn) nextBtn.disabled = currentIndex >= maxIndex;
    }
    
    function goToSlide(index) {
        const itemsPerView = calculateItemsPerView();
        const maxIndex = Math.max(0, members.length - itemsPerView);
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        
        const itemWidth = getItemWidth();
        const gap = getGap();
        const offset = currentIndex * (itemWidth + gap);
        
        track.style.transform = `translateX(-${offset}px)`;
        updateButtons();
        updateDots();
    }
    
    function next() {
        goToSlide(currentIndex + 1);
    }
    
    function prev() {
        goToSlide(currentIndex - 1);
    }
    
    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);
    
    // Load data
    try {
        const response = await CzlonkowieAPI.getAll();
        members = response.data || [];
        render();
        createDots();
        updateButtons();
    } catch (error) {
        console.error('Error loading members:', error);
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        createDots();
        goToSlide(currentIndex);
    });
}

/**
 * Lightbox functionality
 */
function initLightbox() {
    const lightbox = document.querySelector('.lightbox');
    const lightboxImg = lightbox?.querySelector('.lightbox-img');
    const closeBtn = lightbox?.querySelector('.lightbox-close');
    const backdrop = lightbox?.querySelector('.lightbox-backdrop');
    const prevBtn = lightbox?.querySelector('.lightbox-prev');
    const nextBtn = lightbox?.querySelector('.lightbox-next');
    
    const cards = document.querySelectorAll('.carousel-card');
    
    if (!lightbox || cards.length === 0) return;
    
    const images = [];
    cards.forEach(card => {
        const img = card.querySelector('.card-image img');
        if (img) images.push(img.src);
    });
    
    let currentIndex = 0;
    
    function openLightbox(index) {
        currentIndex = index;
        lightboxImg.src = images[currentIndex];
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        updateImage();
    }
    
    function showPrev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateImage();
    }
    
    function updateImage() {
        lightboxImg.style.opacity = '0';
        lightboxImg.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            lightboxImg.src = images[currentIndex];
            lightboxImg.style.opacity = '1';
            lightboxImg.style.transform = 'scale(1)';
        }, 150);
    }
    
    cards.forEach((card, index) => {
        card.addEventListener('click', () => openLightbox(index));
    });
    
    closeBtn?.addEventListener('click', closeLightbox);
    backdrop?.addEventListener('click', closeLightbox);
    nextBtn?.addEventListener('click', showNext);
    prevBtn?.addEventListener('click', showPrev);
    
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });
}

/**
 * Scroll animations
 */
function initScrollAnimations() {
    const cards = document.querySelectorAll('.carousel-card');
    
    if (cards.length === 0) return;
    
    cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });
    
    cards.forEach(card => observer.observe(card));
    
    // Also animate sections
    document.querySelectorAll('.gallery, .members-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    sectionObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        sectionObserver.observe(section);
    });
}

/**
 * Parallax effect
 */
function initParallax() {
    const transitionBg = document.querySelector('.transition-bg');
    const heroVideo = document.querySelector('.hero-video');
    
    let ticking = false;
    
    const updateParallax = () => {
        const scrolled = window.scrollY;
        
        if (transitionBg) {
            const rate = scrolled * 0.3;
            transitionBg.style.transform = `scale(1.1) translateY(${rate * 0.5}px)`;
        }
        
        if (heroVideo) {
            const heroHeight = document.querySelector('.hero')?.offsetHeight || 0;
            if (scrolled < heroHeight) {
                heroVideo.style.transform = `translate(-50%, calc(-50% + ${scrolled * 0.3}px))`;
            }
        }
        
        ticking = false;
    };
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const header = document.querySelector('.header');
                const headerHeight = header?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Utility: Format date in Polish
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Utility: Format price in PLN
 */
function formatPrice(price) {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN'
    }).format(price);
}

/**
 * Utility: Truncate text
 */
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Export utilities for use in other scripts
window.MPUtils = {
    formatDate,
    formatPrice,
    truncateText
};
