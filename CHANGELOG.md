# Changelog

All notable changes to Screenshot Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

<p align="center">
  <a href="./CHANGELOG.md">🇬🇧 English</a> &nbsp;|&nbsp; <a href="./CHANGELOG.es.md">🇪🇸 Español</a>
</p>

## [Unreleased]

### Added

- Public GitHub Pages site at [carlosarman.github.io/screenshot-studio](https://carlosarman.github.io/screenshot-studio/).
- GitHub Actions workflow that deploys the contents of `web/` to GitHub Pages when changes are pushed to `main`.
- Visual image-editor-style crop controls with a draggable frame, corner and edge handles, outside mask, Apply/Cancel actions, and original-image restoration during the current session.
- Bundled and synchronized Screenshot Studio editor for the browser and VS Code extensions, providing frames, backgrounds, visual crop, annotations, history, and local export.
- Browser extension capture modes for the visible area, a user-selected page area, and the entire scrollable page.
- Visual page-area selector with `Esc` cancellation support.
- Extension icons for Chrome/Edge (16, 32, 48, and 128 px) and VS Code (128 px), generated from the project brand icon.

### Fixed

- The export card now preserves bottom and side spacing around the Download and Copy buttons, even when it is the last panel section.
- Full-page capture now respects Chrome's two-calls-per-second `captureVisibleTab` quota, with a delay and safe retry for rolling-window limits.

### Changed

- Shared editor styles, including export spacing, are synchronized across the web app, Chrome/Edge extension, and VS Code extension.
- Browser extension captures are passed through local extension storage to the bundled editor instead of opening the raw image data URL in a separate tab.
- Improved browser-extension popup labels, status feedback, semantic grouping, and accessible focus behavior.
- Full-page capture restores the page's original scroll position after stitching captured segments.

### Planned

- Irreversible pixelation or blur for privacy regions.
- Social media composition presets.
- Image resizing and annotation rotation.
- Local project save and load support.
- Automated canvas, accessibility, and responsive design tests.

---

## [0.1.0] - 2026-10-13

### Added

- Static image editor built with native HTML, CSS, and JavaScript.
- Local PNG, JPEG, and WebP image import.
- File picker, drag-and-drop, and clipboard image import.
- File type validation, 15 MB size limit, and 24 megapixel maximum.
- Central image import area with visual drag feedback.
- Screen and window capture through `getDisplayMedia`.
- Solid, gradient, and transparent composition backgrounds.
- Aurora, Sunset, Ocean, Berry, Midnight, and Lime background presets.
- Padding, corner radius, shadow, and scale controls.
- macOS, Windows, Linux/GNOME, generic browser, Safari, Chrome, and terminal frames.
- Light and dark frame themes.
- Chrome frame with back, refresh, home, minimize, maximize, and close controls.
- GNOME-inspired Linux frame with application icon and centered window controls.
- Text, number, arrow, rectangle, ellipse, pen, highlighter, and privacy annotations.
- Layers panel and annotation property controls.
- Undo and redo history.
- PNG, JPEG, and WebP export.
- Clipboard export copy when browser support is available.
- Canvas zoom controls.
- System, light, and dark application theme preferences.
- Collapsible side panels with persisted state.
- Manifest V3 browser extension for visible-tab capture.
- VS Code extension for opening local image previews.
- Precision Spark favicon and brand system.
- English and Spanish README documentation.

### Changed

- Complete UI refresh for panels, chips, inputs, selects, and secondary buttons.
- Improved visual hierarchy through section dividers and color accents.
- Replaced the empty canvas black placeholder with a slate-blue branded surface.
- Added a gray checkerboard pattern to represent transparent canvas areas.
- Repositioned toolbar tooltips below the top toolbar.
- Improved side-panel collapse and expand transitions.
- Added responsive behavior for compact viewports.
- Improved contrast for active gradients with white text.
- Redesigned Chrome, Safari, and Linux/GNOME canvas frames.

### Accessibility

- Added selection states using `aria-pressed`.
- Added keyboard navigation for tool and option groups.
- Added an `aria-live` status region for action feedback.
- Added visible focus treatments for interactive controls.
- Added visible values for range controls.
- Added accessible alternative controls to create annotations.
- Added `prefers-reduced-motion` support.

### Security

- Local image processing without a backend.
- Object URL usage for imported files.
- File size, type, and pixel-dimension limits.
- Layer labels rendered through safe DOM nodes.

---

[Unreleased]: https://github.com/CarlosArman/screenshot-studio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/CarlosArman/screenshot-studio/releases/tag/v0.1.0
