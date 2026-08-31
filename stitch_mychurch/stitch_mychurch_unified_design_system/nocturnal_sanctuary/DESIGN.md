---
name: Nocturnal Sanctuary
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#e7c26c'
  on-secondary: '#3f2e00'
  secondary-container: '#6c5100'
  on-secondary-container: '#ebc56f'
  tertiary: '#00dce4'
  on-tertiary: '#003739'
  tertiary-container: '#00a1a7'
  on-tertiary-container: '#002f31'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#ffdf9a'
  secondary-fixed-dim: '#e7c26c'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5a4300'
  tertiary-fixed: '#5cf7ff'
  tertiary-fixed-dim: '#00dce4'
  on-tertiary-fixed: '#002021'
  on-tertiary-fixed-variant: '#004f52'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-2xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-xl:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Work Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  scripture-calligraphy:
    fontFamily: Noto Serif
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 40px
  body-base:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-bold:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  label-caps:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  display-2xl-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is built on the narrative of a **Nocturnal Sanctuary**—a digital environment that balances sacred reverence with high-tech sophistication. It is designed to serve a dual audience: congregants seeking spiritual engagement and administrators managing complex community workflows.

The visual style is a fusion of **Glassmorphism** and **Modern Corporate** aesthetics. It utilizes deep, "midnight" canvas layers to create infinite visual depth, over which semi-transparent "frosted glass" containers float. This creates a tactile, premium feel that is both meditative for users and precise for leaders. 

**Key Brand Pillars:**
- **Reverent Depth:** Using a midnight base to allow light-based accents to glow like celestial bodies.
- **Bilingual Precision:** First-class support for RTL (Persian) and LTR (English) layouts, ensuring clarity and respect for both scripts.
- **Luminous Interaction:** High-energy accents (Cyan and Gold) guide the eye to interactive elements and live states without causing fatigue.

## Colors

The palette is rooted in a dark-mode-first philosophy to optimize readability for scripture and high-density dashboards.

- **Primary (Sanctuary Blue):** Used for core actions, navigation, and administrative controls.
- **Secondary (Sacred Gold):** Representing holiness and divine warmth. Used for featured content, ceremony highlights, and premium accents.
- **Tertiary (Electric Cyan):** A high-energy accent reserved for real-time interactions, such as active karaoke lyrics and audio sync cursors.
- **Neutral/Background:** The "Midnight Canvas" (#00040F) acts as the foundation, while "Deep Slate" (#111217) provides card-level elevation.
- **Functional:** A "Live Pulse" Crimson is dedicated exclusively to active broadcasts and urgent destructive actions.

## Typography

The typography system is designed for bi-directional bilingualism. It pairs authoritative serif headers for "Sacred" content with neutral, highly legible sans-serifs for utility.

- **Sacred Titles:** Use **Playfair Display** for high-contrast, elegant headlines.
- **Scripture:** Use **Noto Serif** (or Noto Naskh for Persian) to provide a comfortable, bookish reading experience that respects traditional ligatures.
- **UI & Dashboard:** **Work Sans** provides a professional and grounded feel for forms, labels, and admin data.
- **Numerical Rule:** Use standard Latin digits for all metrics, timestamps, and verse numbers to ensure cross-browser consistency in bilingual layouts.

## Layout & Spacing

The layout utilizes a strict **4px/8px baseline rhythm** to maintain vertical harmony across dense data and airy reading views.

- **Grid:** A 12-column fluid grid for desktop dashboards.
- **Presentation Mode:** For sanctuary projectors, a 16:9 aspect ratio is enforced with a minimum **5% safe-zone margin** to prevent edge-clipping on physical screens.
- **Reflow:** On mobile, margins reduce to 16px. Section spacing should be generous (64px+) for devotional content to allow for "visual breathing room," while admin cards remain compact (16px padding).

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Tonal Layering** and **Glassmorphism**.

1.  **Level 0 (Canvas):** Pure `#00040F` — the void.
2.  **Level 1 (Surfaces):** `#111217` — used for static cards and containers.
3.  **Level 2 (Glass):** `rgba(15, 23, 42, 0.75)` with a **20px backdrop blur**. Used for floating navbars and modals.
4.  **Accents:** Instead of shadows, use **1px Hairline Borders** (`rgba(255, 255, 255, 0.1)`) to define edges. High-interactive elements may use a **Primary Glow**—a soft, colored outer-glow—to indicate focus or "Live" status.

## Shapes

The shape language is consistently **Rounded**, conveying friendliness and modern accessibility.

- **Standard Elements:** Buttons and inputs use a 0.5rem radius.
- **Containers:** Large cards and admin widgets use `rounded-xl` (1.5rem) to feel like modern mobile OS panels.
- **Specialty:** Use `rounded-full` for status badges, pills, and specific "Sacred Action" buttons to distinguish them from standard UI.

## Components

### Buttons
- **Sacred Action:** Gradient fill (Sacred Gold to Amber) with dark text. Apply a subtle 3D lift (`translateY(-2px)`) on hover.
- **Standard Action:** Sanctuary Blue fill.
- **Glass Button:** Semi-transparent with a 1px frosted border for secondary actions.

### Cards & Containers
- **Interactive Cards:** Incorporate a "spotlight" radial gradient that follows the cursor.
- **Admin Widgets:** High-density slate backgrounds with thin slate dividers.

### Input Fields
- Matte dark background (`bg-white/5`) with a 1px border that transitions to Electric Cyan on focus. High-contrast labels are required for accessibility.

### Special Components
- **Worship Karaoke:** Full-screen layout. Active words must radiate Electric Cyan with a `text-shadow` glow. Completed words fade to 65% opacity.
- **Scripture Reader:** Dual-pane layout for bilingual text. Include a "Projector Mode" toggle that switches to high-contrast white-on-black for visibility in large halls.
- **Prayer Wall:** Cards should feature a "pulse" animation on the "Amen/Intercede" button to provide tactile feedback.