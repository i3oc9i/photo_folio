# Product Requirements Document (PRD)

## Photography Portfolio Application

**Version:** 1.0
**Status:** Production Ready

---

## 1. Overview

### 1.1 Problem Statement

Photographers need a way to showcase their work online that:
- Presents images with artistic integrity
- Loads quickly on any device
- Works offline after initial visit
- Requires no ongoing hosting costs or dependencies
- Can be customized without coding knowledge

### 1.2 Solution

A self-hosted photography portfolio that transforms a folder of images into an optimized, gallery-based website with artistic layouts, instant navigation, and offline support.

### 1.3 Target Users

| User | Needs |
|------|-------|
| **Fine Art Photographers** | Artistic presentation with scattered/organic layouts |
| **Commercial Photographers** | Clean grid layouts, professional appearance |
| **Self-Hosters** | Full control, no third-party dependencies |
| **Non-Technical Users** | Configuration via JSON files, no code changes |

---

## 2. User Stories

### 2.1 Gallery Management

**US-1: Create Galleries**
> As a photographer, I want to organize my photos into separate galleries so that visitors can browse by theme or project.

**Acceptance Criteria:**
- Each folder of photos becomes a separate gallery
- Galleries have customizable display names
- Galleries can be reordered in the navigation menu
- New galleries are automatically discovered

**US-2: Choose Gallery Layout**
> As a photographer, I want to choose different visual styles for each gallery so that I can match the presentation to the content.

**Acceptance Criteria:**
- Each gallery can use a different layout style
- Organic layout: photos scattered like cards on a table
- Masonry layout: clean Pinterest-style grid
- Layout choice persists across sessions

**US-3: Set Default Gallery**
> As a photographer, I want to set which gallery visitors see first so that I can feature my best work.

**Acceptance Criteria:**
- One gallery designated as default
- Default gallery loads on initial visit
- Direct links to other galleries still work

### 2.2 Visitor Experience

**US-4: Browse Gallery**
> As a visitor, I want to scroll through photos in a gallery so that I can discover the photographer's work.

**Acceptance Criteria:**
- Photos display in a responsive grid
- Layout adapts to screen size (mobile to 4K)
- Smooth scrolling experience
- Photos load progressively as I scroll

**US-5: View Photo Full-Screen**
> As a visitor, I want to view a photo in full-screen so that I can appreciate the details.

**Acceptance Criteria:**
- Click/tap photo opens lightbox viewer
- Full-resolution image displayed
- Navigate between photos with arrows/keyboard
- Press Escape or click outside to close
- Navigation loops (last → first)

**US-6: Switch Galleries**
> As a visitor, I want to switch between galleries so that I can explore different collections.

**Acceptance Criteria:**
- Gallery selector in navigation
- Instant switching (no page reload)
- URL updates to enable sharing/bookmarking
- Browser back/forward buttons work

**US-7: Learn About Photographer**
> As a visitor, I want to read about the photographer and find their contact info so that I can learn more or get in touch.

**Acceptance Criteria:**
- About panel with bio text
- Social media links (Instagram, Twitter, Facebook, LinkedIn, YouTube, Pinterest, Behance)
- Contact email
- Credits/copyright information

**US-8: Return to Top**
> As a visitor, I want to quickly return to the top of the gallery so that I can start browsing again.

**Acceptance Criteria:**
- Scroll-to-top button appears after scrolling
- Click returns to top smoothly
- Clicking logo also returns to top

**US-9: View Offline**
> As a visitor, I want to view previously seen photos offline so that I can browse without internet.

**Acceptance Criteria:**
- Previously viewed photos available offline
- Gallery navigation works offline
- Clear indication if new content unavailable

**US-10: Share Specific Gallery**
> As a visitor, I want to share a link to a specific gallery so that others can see what I'm viewing.

**Acceptance Criteria:**
- URL contains gallery identifier
- Shared links open correct gallery directly
- Works with all galleries

### 2.3 Customization

**US-11: Customize Branding**
> As a photographer, I want to customize the site branding so that it reflects my identity.

**Acceptance Criteria:**
- Configurable site title
- Configurable artist name
- Configurable subtitle/tagline
- Configurable enter button text

**US-12: Customize Theme**
> As a photographer, I want to customize colors and fonts so that the site matches my aesthetic.

**Acceptance Criteria:**
- Configurable background color
- Configurable text colors
- Configurable fonts (heading and body)
- Configurable animation timings

**US-13: Customize Layout Parameters**
> As a photographer, I want to fine-tune gallery layouts so that photos are presented exactly how I want.

**Acceptance Criteria:**
- Configurable margins (top, bottom, left, right)
- Configurable column counts per breakpoint
- Configurable photo sizes per breakpoint
- Organic: configurable rotation, offset, spacing
- Masonry: configurable gutter, scale variation

---

## 3. Functional Requirements

### 3.1 Splash Screen

| ID | Requirement |
|----|-------------|
| FR-1.1 | Display welcome overlay on initial visit |
| FR-1.2 | Show site title, artist name, and subtitle |
| FR-1.3 | Display enter button with configurable text |
| FR-1.4 | Fade out when enter button clicked |
| FR-1.5 | Block gallery reveal until dismissed |

### 3.2 Navigation

| ID | Requirement |
|----|-------------|
| FR-2.1 | Display header with artist name/logo |
| FR-2.2 | Provide gallery selector dropdown |
| FR-2.3 | Provide About panel trigger |
| FR-2.4 | Provide Credits panel trigger |
| FR-2.5 | Logo click scrolls to top |
| FR-2.6 | Logo click reshuffles gallery (after scroll) |
| FR-2.7 | Update URL hash on gallery change |
| FR-2.8 | Load gallery from URL hash on page load |
| FR-2.9 | Support browser back/forward navigation |

### 3.3 Gallery Display

| ID | Requirement |
|----|-------------|
| FR-3.1 | Display photos in responsive grid |
| FR-3.2 | Adapt columns based on screen width |
| FR-3.3 | Load first N photos immediately (eager) |
| FR-3.4 | Load remaining photos on scroll (lazy) |
| FR-3.5 | Animate photo reveal on gallery load |
| FR-3.6 | Clear and reload photos on gallery switch |
| FR-3.7 | Scroll to top on gallery switch |

### 3.4 Organic Layout

| ID | Requirement |
|----|-------------|
| FR-4.1 | Place photos using shortest-column-first algorithm |
| FR-4.2 | Apply random horizontal offset to each photo |
| FR-4.3 | Apply random rotation to each photo |
| FR-4.4 | Vary z-index for depth/overlap effect |
| FR-4.5 | Add vertical spacing between photos |
| FR-4.6 | Animate with "dealing" effect (rotation entrance) |

### 3.5 Masonry Layout

| ID | Requirement |
|----|-------------|
| FR-5.1 | Place photos using shortest-column-first algorithm |
| FR-5.2 | Align photos precisely to grid |
| FR-5.3 | Apply consistent gutter spacing |
| FR-5.4 | Optionally vary photo scale randomly |
| FR-5.5 | Animate with fade-up effect |

### 3.6 Lightbox

| ID | Requirement |
|----|-------------|
| FR-6.1 | Open on photo click |
| FR-6.2 | Display full-resolution image |
| FR-6.3 | Navigate with left/right arrow keys |
| FR-6.4 | Navigate with on-screen arrows |
| FR-6.5 | Advance on image click |
| FR-6.6 | Close on Escape key |
| FR-6.7 | Close on backdrop click |
| FR-6.8 | Loop navigation at boundaries |
| FR-6.9 | Only include loaded images in sequence |

### 3.7 Panels (About/Credits)

| ID | Requirement |
|----|-------------|
| FR-7.1 | Slide in from screen edge |
| FR-7.2 | Display dark overlay behind panel |
| FR-7.3 | Close on overlay click |
| FR-7.4 | Display configurable title |
| FR-7.5 | Display configurable paragraphs |
| FR-7.6 | Display social media icons with links |
| FR-7.7 | Display copyright notice |
| FR-7.8 | Auto-convert usernames to full URLs |

### 3.8 Responsive Behavior

| ID | Requirement |
|----|-------------|
| FR-8.1 | Define 6+ screen width breakpoints |
| FR-8.2 | Adjust column count per breakpoint |
| FR-8.3 | Adjust photo size per breakpoint |
| FR-8.4 | Use smaller images on mobile |
| FR-8.5 | Recalculate layout on window resize |

### 3.9 Image Processing

| ID | Requirement |
|----|-------------|
| FR-9.1 | Accept JPG, PNG, WebP, TIFF, BMP input |
| FR-9.2 | Generate three sizes per image |
| FR-9.3 | Preserve aspect ratio |
| FR-9.4 | Output optimized web format |
| FR-9.5 | Skip unchanged files (incremental) |
| FR-9.6 | Process files in parallel |
| FR-9.7 | Generate manifest file per gallery |
| FR-9.8 | Auto-discover new galleries |
| FR-9.9 | Auto-update configuration |
| FR-9.10 | Remove orphaned output files |

### 3.10 Offline Support

| ID | Requirement |
|----|-------------|
| FR-10.1 | Cache viewed images for offline access |
| FR-10.2 | Cache application assets |
| FR-10.3 | Serve cached content when offline |
| FR-10.4 | Update cache when online |

---

## 4. Configuration Schema

### 4.1 Content Configuration

| Field | Type | Description |
|-------|------|-------------|
| `site.title` | string | Browser tab title |
| `site.name` | string | Artist name in header |
| `site.subtitle` | string | Tagline on splash |
| `site.enterButtonText` | string | Splash button text |
| `site.altTextTemplate` | string | Image alt text pattern |
| `galleries.default` | string | Default gallery ID |
| `galleries.defaultLayout` | string | Fallback layout type |
| `galleries.items[].displayName` | string | Gallery menu label |
| `galleries.items[].order` | number | Menu sort order |
| `galleries.items[].layout` | string | Layout type |
| `panels.about.title` | string | About panel heading |
| `panels.about.paragraphs` | string[] | Bio text paragraphs |
| `panels.about.contact.email` | string | Contact email |
| `panels.about.contact.instagram` | string | Instagram handle |
| `panels.about.contact.twitter` | string | Twitter handle |
| `panels.about.contact.facebook` | string | Facebook page |
| `panels.about.contact.linkedin` | string | LinkedIn profile |
| `panels.about.contact.youtube` | string | YouTube channel |
| `panels.about.contact.pinterest` | string | Pinterest profile |
| `panels.about.contact.behance` | string | Behance profile |
| `panels.credits.title` | string | Credits panel heading |
| `panels.credits.paragraphs` | string[] | Credits text |
| `panels.credits.copyright.year` | number | Copyright year |
| `panels.credits.copyright.name` | string | Copyright holder |

### 4.2 Theme Configuration

| Field | Type | Description |
|-------|------|-------------|
| `gallery.eagerLoadCount` | number | Photos to load immediately |
| `gallery.topMargin` | number | Top margin (vw) |
| `gallery.bottomMargin` | number | Bottom margin (vw) |
| `gallery.leftMargin` | number | Left margin (vw) |
| `gallery.rightMargin` | number | Right margin (vw) |
| `gallery.lazyLoadMargin` | number | Lazy load trigger distance (px) |
| `gallery.layouts.organic.*` | object | Organic layout params |
| `gallery.layouts.masonry.*` | object | Masonry layout params |
| `breakpoints[]` | array | Responsive breakpoint configs |
| `mobileBreakpoint` | number | Mobile cutoff width (px) |
| `theme.colors.*` | object | Color definitions |
| `theme.fonts.*` | object | Font definitions |
| `theme.transitions.*` | object | Animation timings |

---

## 5. Output Specifications

### 5.1 Image Sizes

| Size | Max Dimension | Purpose |
|------|---------------|---------|
| thumb | 400px | Mobile gallery view |
| medium | 800px | Desktop gallery view |
| full | 1600px | Lightbox viewer |

### 5.2 Gallery Manifest

Each gallery produces a manifest containing:
- List of images with IDs
- Orientation (landscape/portrait/square)
- Original dimensions
- Generation timestamp

### 5.3 Social Media Links

| Platform | Input | Output URL |
|----------|-------|------------|
| Instagram | @handle | instagram.com/handle |
| Twitter | @handle | x.com/handle |
| Facebook | page | facebook.com/page |
| LinkedIn | user | linkedin.com/in/user |
| YouTube | @channel | youtube.com/@channel |
| Pinterest | user | pinterest.com/user |
| Behance | user | behance.net/user |

---

## 6. Default Breakpoints

| Min Width | Columns | Photo Size |
|-----------|---------|------------|
| 1600px | 7 | 13vw |
| 1440px | 6 | 15vw |
| 1280px | 5 | 18vw |
| 1024px | 4 | 22vw |
| 768px | 3 | 30vw |
| <768px | 2 | 42vw |

---

## 7. Animation Behaviors

| Element | Behavior |
|---------|----------|
| Splash | Fades out on enter |
| Gallery (Organic) | Photos deal in with rotation |
| Gallery (Masonry) | Photos fade up |
| Panel | Slides in from edge |
| Lightbox | Fades in/out |
| Photo hover | Subtle scale increase |

---

*End of PRD*
