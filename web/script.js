// Global state
let config = null;
let imageManifest = null;
let currentGallery = null;      // Current gallery ID
let galleryManifests = {};      // Cache for loaded manifests

// Photo element pool for DOM reuse
let photoPool = [];              // Array of {element, inUse: boolean}
let photoPoolByImageId = {};     // Map imageId -> pool entry

// Lightbox cache
let loadedImageIds = new Set();  // Track loaded images for lightbox

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

    // Clear pool lookups for old gallery (elements kept for potential reuse)
    photoPoolByImageId = {};
    loadedImageIds.clear();

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

    // Clear loaded image cache for lightbox
    loadedImageIds.clear();

    // Recreate gallery with pooled elements
    createGallery();

    // Use double-rAF instead of forced reflow
    // This ensures styles are applied before triggering animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                gallery.classList.add('revealed');
            }, 300);
        });
    });
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

// Update image sources on a photo element
function updatePhotoSources(element, imageId) {
    const basePath = `${config.assets.path}${currentGallery}/`;
    const sources = element.querySelectorAll('source');
    const img = element.querySelector('img');

    // Reset to lazy state
    sources[0].removeAttribute('srcset');
    sources[0].dataset.srcset = `${basePath}thumb/${imageId}.webp`;

    sources[1].removeAttribute('srcset');
    sources[1].dataset.srcset = `${basePath}medium/${imageId}.webp`;

    img.removeAttribute('src');
    img.dataset.src = `${basePath}medium/${imageId}.webp`;
}

// Create a new photo element
function createPhotoElement(imageData) {
    const photoWrapper = document.createElement('div');
    photoWrapper.className = 'photo';
    photoWrapper.dataset.imageId = imageData.id;
    photoWrapper.dataset.orientation = imageData.orientation;

    const picture = document.createElement('picture');

    // Mobile source (thumb)
    const sourceMobile = document.createElement('source');
    sourceMobile.media = `(max-width: ${config.mobileBreakpoint}px)`;
    sourceMobile.type = 'image/webp';

    // Desktop source (medium)
    const sourceDesktop = document.createElement('source');
    sourceDesktop.type = 'image/webp';

    // Fallback img
    const img = document.createElement('img');
    img.alt = config.site.altTextTemplate;
    img.loading = 'lazy';

    picture.appendChild(sourceMobile);
    picture.appendChild(sourceDesktop);
    picture.appendChild(img);
    photoWrapper.appendChild(picture);

    // Set image paths
    updatePhotoSources(photoWrapper, imageData.id);

    return photoWrapper;
}

// Reconfigure a pooled element for a new image
function reconfigurePhotoElement(element, imageData) {
    element.dataset.imageId = imageData.id;
    element.dataset.orientation = imageData.orientation;

    // Remove loaded state to reset
    element.classList.remove('loaded', 'landscape', 'portrait', 'square');

    // Update sources
    updatePhotoSources(element, imageData.id);
}

// Get or create a photo element from the pool
function getOrCreatePhotoElement(imageData) {
    const imageId = imageData.id;

    // Check if we have an existing element for this image
    if (photoPoolByImageId[imageId]) {
        const poolEntry = photoPoolByImageId[imageId];
        poolEntry.inUse = true;
        return poolEntry.element;
    }

    // Check for unused element in pool
    const unused = photoPool.find(p => !p.inUse);
    if (unused) {
        // Reconfigure existing element for new image
        reconfigurePhotoElement(unused.element, imageData);
        unused.inUse = true;
        delete photoPoolByImageId[unused.element.dataset.imageId];
        photoPoolByImageId[imageId] = unused;
        return unused.element;
    }

    // Create new element (only if pool exhausted)
    const element = createPhotoElement(imageData);
    const poolEntry = { element, inUse: true };
    photoPool.push(poolEntry);
    photoPoolByImageId[imageId] = poolEntry;
    return element;
}

// Compute all positions without touching DOM
function computeAllPositions(images) {
    const { gallery: galleryConfig } = config;
    const layoutConfig = getLayoutConfig();
    const { columns, photoSize: size } = layoutConfig;
    const colWidth = 100 / columns;
    const rowHeight = size;

    const positions = [];

    for (let index = 0; index < images.length; index++) {
        const col = index % columns;
        const row = Math.floor(index / columns);

        const baseLeft = col * colWidth + (colWidth - size) / 2;
        const baseTop = galleryConfig.topMargin + row * rowHeight;

        const offsetX = random(galleryConfig.randomOffset.min, galleryConfig.randomOffset.max);
        const offsetY = random(galleryConfig.randomOffset.min, galleryConfig.randomOffset.max);

        const left = Math.max(1, Math.min(baseLeft + offsetX, 99 - size));
        const top = baseTop + offsetY;

        const rotation = random(galleryConfig.rotation.min, galleryConfig.rotation.max);
        const startRotation = random(galleryConfig.dealingRotation.min, galleryConfig.dealingRotation.max);
        const zIndex = (index % 3) + 1;
        const transitionDelay = index * galleryConfig.dealingDelay;

        positions.push({
            left,
            top,
            offsetX,
            offsetY,
            rotation,
            startRotation,
            zIndex,
            transitionDelay,
            size
        });
    }

    return positions;
}

// Apply positions in batch via requestAnimationFrame
function applyPositionsBatch(elements, positions) {
    requestAnimationFrame(() => {
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const pos = positions[i];

            // Store offsets for resize handling
            el.dataset.offsetX = pos.offsetX;
            el.dataset.offsetY = pos.offsetY;
            el.dataset.size = pos.size;

            // Apply all styles at once
            el.style.cssText = `
                top: ${pos.top}vw;
                left: ${pos.left}vw;
                --start-rotation: ${pos.startRotation}deg;
                --end-rotation: ${pos.rotation}deg;
                z-index: ${pos.zIndex};
                transition-delay: ${pos.transitionDelay}s;
            `;
        }
    });
}

// Create photo elements using organic grid layout
function createGallery() {
    const gallery = document.getElementById('gallery');
    const images = shuffle(imageManifest.images);

    // Phase 1: Compute all positions in memory (no DOM access)
    const positions = computeAllPositions(images);

    // Phase 2: Mark all pool entries as unused
    photoPool.forEach(p => p.inUse = false);

    // Phase 3: Get or create elements
    const elements = [];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < images.length; i++) {
        const element = getOrCreatePhotoElement(images[i]);
        elements.push(element);

        // Only append if not already in DOM
        if (!element.parentNode) {
            fragment.appendChild(element);
        }
    }

    // Phase 4: Remove unused elements from DOM (but keep in pool)
    photoPool.forEach(p => {
        if (!p.inUse && p.element.parentNode) {
            p.element.parentNode.removeChild(p.element);
        }
    });

    // Phase 5: Append new elements in single operation
    gallery.appendChild(fragment);

    // Phase 6: Apply positions in batch
    applyPositionsBatch(elements, positions);

    // Phase 7: Initialize lazy loading
    initLazyLoading();

    // Phase 8: Update gallery height
    updateGalleryHeight();

    // Phase 9: Update footer
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
            const imageId = photo.dataset.imageId;
            photo.classList.add(orientation);
            photo.classList.add('loaded');

            // Cache loaded image ID for lightbox
            loadedImageIds.add(imageId);
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
        // Use cached set instead of DOM query
        sequence = [...loadedImageIds];

        // Fisher-Yates shuffle
        for (let i = sequence.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
        }

        // Move starting image to front
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

    // Read phase: compute all positions first
    const updates = [];
    photos.forEach((photo, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);

        const baseLeft = col * colWidth + (colWidth - size) / 2;
        const baseTop = config.gallery.topMargin + row * rowHeight;

        const offsetX = parseFloat(photo.dataset.offsetX) || 0;
        const offsetY = parseFloat(photo.dataset.offsetY) || 0;

        const left = Math.max(1, Math.min(baseLeft + offsetX, 99 - size));
        const top = baseTop + offsetY;

        updates.push({ photo, top, left });
    });

    // Write phase: apply all positions via rAF (avoids layout thrashing)
    requestAnimationFrame(() => {
        updates.forEach(({ photo, top, left }) => {
            photo.style.top = `${top}vw`;
            photo.style.left = `${left}vw`;
        });
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
