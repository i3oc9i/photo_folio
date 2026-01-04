// Photo configuration
const ASSETS_PATH = 'assets/';
const MANIFEST_FILE = 'images.json';
const PHOTO_SIZE = 22; // vw for desktop (longest edge)
const PHOTO_SIZE_MOBILE = 42; // vw for mobile (longest edge)

// Global state
let imageManifest = null;

// Splash screen
function initSplash() {
    const splash = document.getElementById('splash');
    const enterBtn = document.getElementById('splash-enter');
    const gallery = document.getElementById('gallery');

    enterBtn.addEventListener('click', () => {
        splash.classList.add('hidden');

        // Reveal gallery with dealing effect
        setTimeout(() => {
            gallery.classList.add('revealed');
        }, 200);

        splash.addEventListener('transitionend', () => {
            splash.style.display = 'none';
        }, { once: true });
    });
}

// Load manifest and initialize
async function init() {
    initSplash();

    try {
        const response = await fetch(ASSETS_PATH + MANIFEST_FILE);
        imageManifest = await response.json();
        createGallery();
        initPanels();
        initLightbox();
        window.addEventListener('resize', handleResize);
    } catch (error) {
        console.error('Failed to load image manifest:', error);
    }
}

// Fisher-Yates shuffle
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Random number in range
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Create photo elements using organic grid layout
// Organic grid: base grid positioning with random offsets for natural "scattered on table" feel
function createGallery() {
    const gallery = document.getElementById('gallery');
    const images = shuffle(imageManifest.images);

    // Calculate gallery dimensions for positioning
    const viewportWidth = window.innerWidth;

    images.forEach((imageData, index) => {
        const photoWrapper = document.createElement('div');
        photoWrapper.className = 'photo';

        // Get size based on device
        const isMobile = viewportWidth < 768;
        const size = isMobile ? PHOTO_SIZE_MOBILE : PHOTO_SIZE;

        // Organic grid: minimal overlap with natural feel
        const columns = isMobile ? 2 : 4;
        const colWidth = isMobile ? 50 : 25;
        // Row height = photo size, overlap only from random offset
        const rowHeight = size;

        const col = index % columns;
        const row = Math.floor(index / columns);

        // Base grid position - center photos in their cells
        const baseLeft = col * colWidth + (colWidth - size) / 2;
        const baseTop = 12 + row * rowHeight; // 12vw top margin for header clearance

        // Small random offset creates minimal overlap
        const offsetX = random(-1, 1);
        const offsetY = random(-1, 1);

        const left = Math.max(1, Math.min(baseLeft + offsetX, 99 - size));
        const top = baseTop + offsetY;

        // Very subtle rotation
        const rotation = random(-1, 1);

        // Alternating z-index for layering
        const zIndex = (index % 3) + 1;

        // Store data for later use
        photoWrapper.dataset.size = size;
        photoWrapper.dataset.imageId = imageData.id;
        photoWrapper.dataset.orientation = imageData.orientation;

        // Random start rotation for dealing effect
        const startRotation = random(-30, 30);
        const transitionDelay = index * 0.03; // Staggered delay

        // Apply styles
        photoWrapper.style.cssText = `
            top: ${top}vh;
            left: ${left}vw;
            --start-rotation: ${startRotation}deg;
            --end-rotation: ${rotation}deg;
            z-index: ${zIndex};
            transition-delay: ${transitionDelay}s;
        `;

        // Create picture element with responsive sources
        const picture = document.createElement('picture');

        // Mobile source (thumb)
        const sourceMobile = document.createElement('source');
        sourceMobile.media = '(max-width: 768px)';
        sourceMobile.dataset.srcset = `${ASSETS_PATH}thumb/${imageData.id}.webp`;
        sourceMobile.type = 'image/webp';

        // Desktop source (medium)
        const sourceDesktop = document.createElement('source');
        sourceDesktop.dataset.srcset = `${ASSETS_PATH}medium/${imageData.id}.webp`;
        sourceDesktop.type = 'image/webp';

        // Fallback img
        const img = document.createElement('img');
        img.dataset.src = `${ASSETS_PATH}medium/${imageData.id}.webp`;
        img.alt = `Fine art photograph by Ivano Coltellacci`;
        img.loading = 'lazy';

        picture.appendChild(sourceMobile);
        picture.appendChild(sourceDesktop);
        picture.appendChild(img);
        photoWrapper.appendChild(picture);
        gallery.appendChild(photoWrapper);
    });

    // Initialize lazy loading
    initLazyLoading();

    // Update gallery height
    updateGalleryHeight();
}

// Lazy loading with Intersection Observer
function initLazyLoading() {
    const photos = document.querySelectorAll('.photo');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const photo = entry.target;
                const picture = photo.querySelector('picture');
                const sources = picture.querySelectorAll('source');
                const img = picture.querySelector('img');

                // Load sources
                sources.forEach(source => {
                    if (source.dataset.srcset) {
                        source.srcset = source.dataset.srcset;
                        source.removeAttribute('data-srcset');
                    }
                });

                // Load image
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');

                    img.onload = () => {
                        // Apply class based on orientation (CSS handles sizing)
                        const orientation = photo.dataset.orientation;
                        photo.classList.add(orientation); // 'landscape', 'portrait', or 'square'
                        photo.classList.add('loaded');
                    };

                    img.onerror = () => {
                        photo.style.display = 'none';
                    };
                }

                observer.unobserve(photo);
            }
        });
    }, {
        rootMargin: '200px 0px',
        threshold: 0
    });

    photos.forEach(photo => observer.observe(photo));
}

// Update gallery height based on organic grid layout
function updateGalleryHeight() {
    const photos = document.querySelectorAll('.photo');
    const isMobile = window.innerWidth < 768;
    const size = isMobile ? PHOTO_SIZE_MOBILE : PHOTO_SIZE;
    const columns = isMobile ? 2 : 4;
    const rowHeight = size; // in vw
    const totalRows = Math.ceil(photos.length / columns);

    const gallery = document.getElementById('gallery');
    // Use vw for consistency with photo sizing (12vw top offset + rows + bottom padding)
    gallery.style.minHeight = `${12 + totalRows * rowHeight + 10}vw`;
}

// Lightbox functionality
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const gallery = document.getElementById('gallery');

    let loadedImageIds = [];
    let currentId = '';

    // Get all loaded image IDs
    function updateLoadedImages() {
        loadedImageIds = Array.from(document.querySelectorAll('.photo.loaded'))
            .map(photo => photo.dataset.imageId)
            .filter(id => id);
    }

    // Show random photo (different from current)
    function showRandomPhoto() {
        if (loadedImageIds.length <= 1) return;
        let newId;
        do {
            newId = loadedImageIds[Math.floor(Math.random() * loadedImageIds.length)];
        } while (newId === currentId && loadedImageIds.length > 1);
        currentId = newId;
        lightboxImg.src = `${ASSETS_PATH}full/${currentId}.webp`;
    }

    // Open lightbox when clicking a photo
    gallery.addEventListener('click', (e) => {
        const photo = e.target.closest('.photo');
        if (photo && photo.classList.contains('loaded')) {
            updateLoadedImages();
            currentId = photo.dataset.imageId;
            lightboxImg.src = `${ASSETS_PATH}full/${currentId}.webp`;
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    });

    // Click on image shows random photo
    lightboxImg.addEventListener('click', showRandomPhoto);

    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);

    // Click outside image closes lightbox
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard: Escape closes, any other key shows random
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else {
            showRandomPhoto();
        }
    });
}

// Panel functionality
function initPanels() {
    const navLinks = document.querySelectorAll('.nav-link');
    const panels = document.querySelectorAll('.panel');
    const overlay = document.getElementById('overlay');
    const closeButtons = document.querySelectorAll('.panel-close');

    // Open panel
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const panelId = link.dataset.panel;
            const panel = document.getElementById(`panel-${panelId}`);

            if (panel) {
                panel.classList.add('open');
                overlay.classList.add('visible');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // Close panel
    function closeAllPanels() {
        panels.forEach(panel => panel.classList.remove('open'));
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllPanels);
    });

    overlay.addEventListener('click', closeAllPanels);

    // Close panel when mouse leaves
    panels.forEach(panel => {
        panel.addEventListener('mouseleave', () => {
            panel.classList.remove('open');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllPanels();
        }
    });
}

// Recalculate positions on resize (debounced)
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateGalleryHeight();
    }, 250);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
