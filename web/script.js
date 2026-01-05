// Photo configuration
const ASSETS_PATH = 'assets/';
const MANIFEST_FILE = 'images.json';
const EAGER_LOAD_COUNT = 12; // First batch to load immediately

// Responsive breakpoints and sizes (7 to 2 columns)
const BREAKPOINTS = [
    { minWidth: 1600, columns: 7, photoSize: 13 },  // 7 columns
    { minWidth: 1440, columns: 6, photoSize: 15 },  // 6 columns
    { minWidth: 1280, columns: 5, photoSize: 18 },  // 5 columns
    { minWidth: 1024, columns: 4, photoSize: 22 },  // 4 columns
    { minWidth: 768, columns: 3, photoSize: 30 },   // 3 columns
    { minWidth: 0, columns: 2, photoSize: 42 }      // 2 columns
];

// Get current layout config based on viewport
function getLayoutConfig() {
    const width = window.innerWidth;
    return BREAKPOINTS.find(bp => width >= bp.minWidth);
}

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

// Reshuffle gallery (called when clicking logo)
function reshuffleGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    createGallery();
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

        // Logo click reshuffles gallery
        document.querySelector('.logo').addEventListener('click', (e) => {
            e.preventDefault();
            reshuffleGallery();
        });
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

    // Get responsive layout config
    const config = getLayoutConfig();
    const { columns, photoSize: size } = config;
    const colWidth = 100 / columns;
    const rowHeight = size;

    images.forEach((imageData, index) => {
        const photoWrapper = document.createElement('div');
        photoWrapper.className = 'photo';

        const col = index % columns;
        const row = Math.floor(index / columns);

        // Base grid position - center photos in their cells
        const baseLeft = col * colWidth + (colWidth - size) / 2;
        const baseTop = 12 + row * rowHeight; // 12vw top margin for header clearance

        // Random offset creates overlap for denser feel (store for reposition)
        const offsetX = random(-3, 3);
        const offsetY = random(-3, 3);

        const left = Math.max(1, Math.min(baseLeft + offsetX, 99 - size));
        const top = baseTop + offsetY;

        // Very subtle rotation
        const rotation = random(-1, 1);

        // Store offsets for responsive repositioning
        photoWrapper.dataset.offsetX = offsetX;
        photoWrapper.dataset.offsetY = offsetY;

        // Alternating z-index for layering
        const zIndex = (index % 3) + 1;

        // Store data for later use
        photoWrapper.dataset.size = size;
        photoWrapper.dataset.imageId = imageData.id;
        photoWrapper.dataset.orientation = imageData.orientation;

        // Random start rotation for dealing effect
        const startRotation = random(-30, 30);
        const transitionDelay = index * 0.03; // Staggered delay

        // Apply styles (use vw for both top and left for consistency)
        photoWrapper.style.cssText = `
            top: ${top}vw;
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

    // Set footer text
    const footer = document.getElementById('gallery-footer');
    if (footer) {
        footer.querySelector('.footer-text').textContent = `${images.length} photographs`;
    }
}

// Load a single photo's image
function loadPhoto(photo) {
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
}

// Lazy loading with Intersection Observer + eager first batch
function initLazyLoading() {
    const photos = document.querySelectorAll('.photo');

    // Eager load first batch immediately
    photos.forEach((photo, index) => {
        if (index < EAGER_LOAD_COUNT) {
            loadPhoto(photo);
        }
    });

    // Lazy load the rest with Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadPhoto(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '800px 0px',
        threshold: 0
    });

    // Only observe photos after the eager batch
    photos.forEach((photo, index) => {
        if (index >= EAGER_LOAD_COUNT) {
            observer.observe(photo);
        }
    });
}

// Update gallery height based on organic grid layout
function updateGalleryHeight() {
    const photos = document.querySelectorAll('.photo');
    const config = getLayoutConfig();
    const { columns, photoSize: size } = config;
    const totalRows = Math.ceil(photos.length / columns);

    const gallery = document.getElementById('gallery');
    // Use vw for consistency with photo sizing (12vw top offset + rows)
    gallery.style.minHeight = `${12 + totalRows * size}vw`;
}

// Lightbox functionality with random sequence navigation
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const gallery = document.getElementById('gallery');

    let sequence = [];      // Shuffled array of image IDs for this session
    let sequenceIndex = 0;  // Current position in sequence

    // Generate random sequence starting with given photo
    function generateSequence(startId) {
        // Get all loaded image IDs
        const loadedIds = Array.from(document.querySelectorAll('.photo.loaded'))
            .map(photo => photo.dataset.imageId)
            .filter(id => id);

        // Shuffle using Fisher-Yates
        sequence = [...loadedIds];
        for (let i = sequence.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }

        // Move startId to beginning
        const startIndex = sequence.indexOf(startId);
        if (startIndex > 0) {
            sequence.splice(startIndex, 1);
            sequence.unshift(startId);
        }

        sequenceIndex = 0;
    }

    // Show image at current sequence index
    function showCurrent() {
        if (sequence.length === 0) return;
        lightboxImg.src = `${ASSETS_PATH}full/${sequence[sequenceIndex]}.webp`;
    }

    // Navigate to next photo in sequence
    function showNext() {
        if (sequence.length === 0) return;
        sequenceIndex = (sequenceIndex + 1) % sequence.length;
        showCurrent();
    }

    // Navigate to previous photo in sequence
    function showPrev() {
        if (sequence.length === 0) return;
        sequenceIndex = (sequenceIndex - 1 + sequence.length) % sequence.length;
        showCurrent();
    }

    // Open lightbox when clicking a photo
    gallery.addEventListener('click', (e) => {
        const photo = e.target.closest('.photo');
        if (photo && photo.classList.contains('loaded')) {
            generateSequence(photo.dataset.imageId);
            showCurrent();
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    });

    // Click on image shows next photo
    lightboxImg.addEventListener('click', showNext);

    // Close lightbox and discard sequence
    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        sequence = [];
        sequenceIndex = 0;
    }

    lightboxClose.addEventListener('click', closeLightbox);

    // Click outside image closes lightbox
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            showNext();
        } else if (e.key === 'ArrowLeft') {
            showPrev();
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

// Reposition photos based on current viewport
function repositionPhotos() {
    const photos = document.querySelectorAll('.photo');
    const config = getLayoutConfig();
    const { columns, photoSize: size } = config;
    const colWidth = 100 / columns;
    const rowHeight = size;

    photos.forEach((photo, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);

        const baseLeft = col * colWidth + (colWidth - size) / 2;
        const baseTop = 12 + row * rowHeight;

        const offsetX = parseFloat(photo.dataset.offsetX) || 0;
        const offsetY = parseFloat(photo.dataset.offsetY) || 0;

        const left = Math.max(1, Math.min(baseLeft + offsetX, 99 - size));
        const top = baseTop + offsetY;

        photo.style.top = `${top}vw`;
        photo.style.left = `${left}vw`;
    });

    updateGalleryHeight();
}

// Track current layout to detect breakpoint crossing
let currentLayout = getLayoutConfig();

// Recalculate positions on resize
let resizeTimeout;
function handleResize() {
    const newLayout = getLayoutConfig();

    // Reposition immediately when crossing breakpoints
    if (newLayout.columns !== currentLayout.columns) {
        currentLayout = newLayout;
        repositionPhotos();
    }

    // Debounce gallery height updates
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateGalleryHeight();
    }, 100);
}

// Register Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed:', err));
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    init();
    registerServiceWorker();
});
