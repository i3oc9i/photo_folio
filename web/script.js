// Global state
let config = null;
let imageManifest = null;
let currentGallery = null;      // Current gallery ID
let galleryManifests = {};      // Cache for loaded manifests

// Get current layout config based on viewport
function getLayoutConfig() {
    const width = window.innerWidth;
    return config.breakpoints.find(bp => width >= bp.minWidth);
}

// Apply theme colors as CSS custom properties
function applyTheme() {
    const root = document.documentElement;
    const { colors, fonts, transitions } = config.theme;

    // Colors
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-background-alt', colors.backgroundAlt);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    root.style.setProperty('--color-text-dim', colors.textDim);
    root.style.setProperty('--color-text-dimmer', colors.textDimmer);
    root.style.setProperty('--color-text-dimmest', colors.textDimmest);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-border-light', colors.borderLight);
    root.style.setProperty('--color-panel-text', colors.panelText);
    root.style.setProperty('--color-overlay', colors.overlay);
    root.style.setProperty('--color-lightbox-bg', colors.lightboxBg);

    // Fonts
    root.style.setProperty('--font-heading', fonts.heading);
    root.style.setProperty('--font-body', fonts.body);

    // Transitions
    root.style.setProperty('--transition-splash', `${transitions.splash}s`);
    root.style.setProperty('--transition-gallery', `${transitions.gallery}s`);
    root.style.setProperty('--transition-panel', `${transitions.panel}s`);
    root.style.setProperty('--transition-hover', `${transitions.hover}s`);
    root.style.setProperty('--transition-lightbox', `${transitions.lightbox}s`);
}

// Populate site content from config
function populateSiteContent() {
    const { site, panels } = config;

    // Page title
    document.title = site.title;

    // Splash screen
    document.querySelector('.splash-name').textContent = site.name;
    document.querySelector('.splash-subtitle').textContent = site.subtitle;
    document.getElementById('splash-enter').textContent = site.enterButtonText;

    // Header logo
    document.querySelector('.logo-name').textContent = site.name;
    document.querySelector('.logo-subtitle').textContent = site.subtitle;

    // About panel
    const aboutPanel = document.getElementById('panel-about');
    const aboutContent = aboutPanel.querySelector('.panel-content');
    aboutContent.innerHTML = `
        <h2>${panels.about.title}</h2>
        ${panels.about.paragraphs.map(p => `<p>${p}</p>`).join('')}
        <div class="contact">
            <p>${panels.about.contact.label}: <a href="mailto:${panels.about.contact.email}">${panels.about.contact.email}</a></p>
        </div>
    `;

    // Credits panel
    const creditsPanel = document.getElementById('panel-credits');
    const creditsContent = creditsPanel.querySelector('.panel-content');
    creditsContent.innerHTML = `
        <h2>${panels.credits.title}</h2>
        ${panels.credits.paragraphs.map(p => `<p>${p}</p>`).join('')}
        <div class="credits-note">
            <p>&copy; ${panels.credits.copyright.year} ${panels.credits.copyright.name}. All rights reserved.</p>
        </div>
    `;
}

// Get gallery ID from URL hash
function getGalleryFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/gallery=([^&]+)/);
    if (match && config.galleries.items[match[1]]) {
        return match[1];
    }
    return null;
}

// Initialize gallery selector dropdown
function initGallerySelector() {
    const selector = document.getElementById('gallery-selector');
    const btn = document.getElementById('gallery-selector-btn');
    const dropdown = document.getElementById('gallery-dropdown');

    // Populate dropdown from config
    const sortedGalleries = Object.entries(config.galleries.items)
        .sort((a, b) => a[1].order - b[1].order);

    dropdown.innerHTML = sortedGalleries.map(([id, data]) =>
        `<li><button data-gallery="${id}">${data.displayName}</button></li>`
    ).join('');

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selector.classList.toggle('open');
    });

    // Handle selection
    dropdown.addEventListener('click', (e) => {
        const galleryBtn = e.target.closest('button[data-gallery]');
        if (galleryBtn) {
            const galleryId = galleryBtn.dataset.gallery;
            switchGallery(galleryId);
            selector.classList.remove('open');
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!selector.contains(e.target)) {
            selector.classList.remove('open');
        }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            selector.classList.remove('open');
        }
    });
}

// Update gallery selector label to show current gallery
function updateGallerySelectorLabel() {
    const label = document.querySelector('.gallery-selector-label');
    label.textContent = config.galleries.items[currentGallery].displayName;

    // Update active state in dropdown
    document.querySelectorAll('.gallery-dropdown button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gallery === currentGallery);
    });
}

// Switch to a different gallery
async function switchGallery(galleryId) {
    if (!config.galleries.items[galleryId]) return;
    if (galleryId === currentGallery) return;

    // Update URL hash
    window.location.hash = `gallery=${galleryId}`;

    // Load manifest if not cached
    if (!galleryManifests[galleryId]) {
        const manifestUrl = `${config.assets.path}${galleryId}/${config.assets.manifestFile}`;
        const response = await fetch(manifestUrl);
        galleryManifests[galleryId] = await response.json();
    }

    // Update current state
    currentGallery = galleryId;
    imageManifest = galleryManifests[galleryId];

    // Update UI
    updateGallerySelectorLabel();
    reshuffleGallery();
}

// Handle URL hash changes (browser back/forward)
function handleHashChange() {
    const hashGallery = getGalleryFromHash();
    if (hashGallery && hashGallery !== currentGallery) {
        switchGallery(hashGallery);
    }
}

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

    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Remove revealed class to reset animation state
    gallery.classList.remove('revealed');
    gallery.innerHTML = '';

    // Recreate gallery
    createGallery();

    // Force browser reflow to reset animation state
    void gallery.offsetHeight;

    // Trigger dealing animation (longer pause before effect)
    setTimeout(() => {
        gallery.classList.add('revealed');
    }, 500);
}

// Load config and manifest, then initialize
async function init() {
    try {
        // Load config first
        const configResponse = await fetch('config.json');
        config = await configResponse.json();

        // Apply theme and populate content
        applyTheme();
        populateSiteContent();

        initSplash();
        initGallerySelector();

        // Determine initial gallery from hash or config default
        const hashGallery = getGalleryFromHash();
        const initialGallery = hashGallery || config.galleries.default ||
            Object.keys(config.galleries.items)[0];

        // Load initial gallery manifest
        const manifestUrl = `${config.assets.path}${initialGallery}/${config.assets.manifestFile}`;
        const manifestResponse = await fetch(manifestUrl);
        galleryManifests[initialGallery] = await manifestResponse.json();

        // Set current gallery state
        currentGallery = initialGallery;
        imageManifest = galleryManifests[initialGallery];

        // Update URL hash if not already set
        if (!hashGallery) {
            window.location.hash = `gallery=${initialGallery}`;
        }

        // Update selector label
        updateGallerySelectorLabel();

        createGallery();
        initPanels();
        initLightbox();
        window.addEventListener('resize', handleResize);
        window.addEventListener('hashchange', handleHashChange);

        // Logo click reshuffles gallery
        document.querySelector('.logo').addEventListener('click', (e) => {
            e.preventDefault();
            reshuffleGallery();
        });
    } catch (error) {
        console.error('Failed to initialize:', error);
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
function createGallery() {
    const gallery = document.getElementById('gallery');
    const images = shuffle(imageManifest.images);
    const { gallery: galleryConfig, site } = config;

    // Get responsive layout config
    const layoutConfig = getLayoutConfig();
    const { columns, photoSize: size } = layoutConfig;
    const colWidth = 100 / columns;
    const rowHeight = size;

    images.forEach((imageData, index) => {
        const photoWrapper = document.createElement('div');
        photoWrapper.className = 'photo';

        const col = index % columns;
        const row = Math.floor(index / columns);

        // Base grid position - center photos in their cells
        const baseLeft = col * colWidth + (colWidth - size) / 2;
        const baseTop = galleryConfig.topMargin + row * rowHeight;

        // Random offset creates overlap for denser feel
        const offsetX = random(galleryConfig.randomOffset.min, galleryConfig.randomOffset.max);
        const offsetY = random(galleryConfig.randomOffset.min, galleryConfig.randomOffset.max);

        const left = Math.max(1, Math.min(baseLeft + offsetX, 99 - size));
        const top = baseTop + offsetY;

        // Very subtle rotation
        const rotation = random(galleryConfig.rotation.min, galleryConfig.rotation.max);

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
        const startRotation = random(galleryConfig.dealingRotation.min, galleryConfig.dealingRotation.max);
        const transitionDelay = index * galleryConfig.dealingDelay;

        // Apply styles
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

        // Gallery-specific base path
        const basePath = `${config.assets.path}${currentGallery}/`;

        // Mobile source (thumb)
        const sourceMobile = document.createElement('source');
        sourceMobile.media = `(max-width: ${config.mobileBreakpoint}px)`;
        sourceMobile.dataset.srcset = `${basePath}thumb/${imageData.id}.webp`;
        sourceMobile.type = 'image/webp';

        // Desktop source (medium)
        const sourceDesktop = document.createElement('source');
        sourceDesktop.dataset.srcset = `${basePath}medium/${imageData.id}.webp`;
        sourceDesktop.type = 'image/webp';

        // Fallback img
        const img = document.createElement('img');
        img.dataset.src = `${basePath}medium/${imageData.id}.webp`;
        img.alt = site.altTextTemplate;
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
            const orientation = photo.dataset.orientation;
            photo.classList.add(orientation);
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
    const eagerCount = config.gallery.eagerLoadCount;

    // Eager load first batch immediately
    photos.forEach((photo, index) => {
        if (index < eagerCount) {
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
        rootMargin: `${config.gallery.lazyLoadMargin}px 0px`,
        threshold: 0
    });

    // Only observe photos after the eager batch
    photos.forEach((photo, index) => {
        if (index >= eagerCount) {
            observer.observe(photo);
        }
    });
}

// Update gallery height based on organic grid layout
function updateGalleryHeight() {
    const photos = document.querySelectorAll('.photo');
    const layoutConfig = getLayoutConfig();
    const { columns, photoSize: size } = layoutConfig;
    const totalRows = Math.ceil(photos.length / columns);

    const gallery = document.getElementById('gallery');
    gallery.style.minHeight = `${config.gallery.topMargin + totalRows * size}vw`;
}

// Lightbox functionality with random sequence navigation
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const gallery = document.getElementById('gallery');

    let sequence = [];
    let sequenceIndex = 0;

    function generateSequence(startId) {
        const loadedIds = Array.from(document.querySelectorAll('.photo.loaded'))
            .map(photo => photo.dataset.imageId)
            .filter(id => id);

        sequence = [...loadedIds];
        for (let i = sequence.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }

        const startIndex = sequence.indexOf(startId);
        if (startIndex > 0) {
            sequence.splice(startIndex, 1);
            sequence.unshift(startId);
        }

        sequenceIndex = 0;
    }

    function showCurrent() {
        if (sequence.length === 0) return;
        lightboxImg.src = `${config.assets.path}${currentGallery}/full/${sequence[sequenceIndex]}.webp`;
    }

    function showNext() {
        if (sequence.length === 0) return;
        sequenceIndex = (sequenceIndex + 1) % sequence.length;
        showCurrent();
    }

    function showPrev() {
        if (sequence.length === 0) return;
        sequenceIndex = (sequenceIndex - 1 + sequence.length) % sequence.length;
        showCurrent();
    }

    gallery.addEventListener('click', (e) => {
        const photo = e.target.closest('.photo');
        if (photo && photo.classList.contains('loaded')) {
            generateSequence(photo.dataset.imageId);
            showCurrent();
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    });

    lightboxImg.addEventListener('click', showNext);

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        sequence = [];
        sequenceIndex = 0;
    }

    lightboxClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

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

    function closeAllPanels() {
        panels.forEach(panel => panel.classList.remove('open'));
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
    }

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllPanels);
    });

    overlay.addEventListener('click', closeAllPanels);

    panels.forEach(panel => {
        panel.addEventListener('mouseleave', () => {
            panel.classList.remove('open');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllPanels();
        }
    });
}

// Reposition photos based on current viewport
function repositionPhotos() {
    const photos = document.querySelectorAll('.photo');
    const layoutConfig = getLayoutConfig();
    const { columns, photoSize: size } = layoutConfig;
    const colWidth = 100 / columns;
    const rowHeight = size;

    photos.forEach((photo, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);

        const baseLeft = col * colWidth + (colWidth - size) / 2;
        const baseTop = config.gallery.topMargin + row * rowHeight;

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
let currentLayout = null;

// Recalculate positions on resize
let resizeTimeout;
function handleResize() {
    const newLayout = getLayoutConfig();

    if (!currentLayout || newLayout.columns !== currentLayout.columns) {
        currentLayout = newLayout;
        repositionPhotos();
    }

    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateGalleryHeight();
    }, 100);
}

// Scroll to top button
function initScrollTop() {
    const scrollBtn = document.getElementById('scroll-top');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    // Scroll to top on click
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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
    initScrollTop();
    registerServiceWorker();
});
