# Changelog

All notable changes to Screenshot Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

<p align="center">
  <a href="./CHANGELOG.md">🇬🇧 English</a> &nbsp;|&nbsp; <a href="./CHANGELOG.es.md">🇪🇸 Español</a>
</p>

## [Unreleased]

---

## [0.4.0] - 2026-10-22

### Added

- **Annotation opacity** — new slider in the Properties panel to control the transparency of any annotation (except pixelate and blur).
- **Shape fill** — fill color picker and "No fill" button for rectangles and ellipses in the Properties panel.
- **Move annotations with arrow keys** — `←↑→↓` move the selected annotation 1 px; `Shift+arrow` moves 10 px. Does not interfere with text fields.
- **Duplicate annotation (`Ctrl/Cmd + D`)** — clones the selected annotation with a 16 px offset and selects it automatically.
- **Copy and paste annotations (`Ctrl/Cmd + C` / `Ctrl/Cmd + V`)** — internal buffer independent of the system clipboard: copy saves the selected annotation; paste creates a clone with a +16 px offset. System clipboard image paste continues to work normally.
- **Reorder layers** — each layer in the Layers panel includes ↑ and ↓ buttons to move the annotation up or down in the rendering stack.
- **Mouse wheel zoom** — `Ctrl/Cmd + scroll` zooms the canvas in or out without touching the zoom buttons.
- **Space+drag pan** — holding `Space` changes the cursor to a hand; dragging scrolls the editing area. Compatible with the active tool (no annotations are created during pan).
- **Export scale** — new selector in the Export panel: 1× (normal), 1.5×, and 2× HiDPI. The multiplier is applied to the final canvas before generating the file.
- **Auto-save to `localStorage`** — document state is serialized automatically after each change (1.5 s debounce) and restored on app open. Images loaded as Data URLs are saved fully; Object URLs only persist within the same session.
- **Installable PWA** — `manifest.webmanifest` and service worker (`sw.js`) with a cache-first strategy. The web app can be installed from Chrome/Edge/Safari and works offline.
- **MIT License** — `LICENSE` file added to the repository.
- **Distribution packages** — `extensions/` folder containing ready-to-install files: `screenshot-studio-chrome-0.4.0.zip` (Chrome/Edge extension) and `screenshot-studio-vscode-0.4.0.vsix` (VS Code extension).

### Fixed

- **Precise text hit-test** — click area for text annotations now uses `ctx.measureText` instead of a string-length estimate, fixing selection of multi-line text and CJK/emoji characters.
- **Dead code removed** — unused `drawSelection` (annotations.js) and `darkenColor` (browser-frames.js) functions have been deleted.
- **Accessible Annotations behavior** — panel buttons now activate the corresponding toolbar tool (with bidirectional sync) instead of instantly creating the annotation; the annotation is placed by clicking on the image, just like the toolbar buttons.
- **Share modal in light mode** — modal card, share button, platform buttons, and info note now adapt to the light theme with proper contrast and readability.

### Changed

- Keyboard shortcuts: `Ctrl+D` for duplicate and arrow keys for moving; `Space` now activates pan mode and is consumed when not editing a text field.
- `annotations.js`, `canvas-editor.js`, `browser-frames.js`, `store.js`, `export.js`, `app.js` and `light-theme.css` synchronized across all three product surfaces (web, Chrome/Edge extension, VS Code extension).
- Version bumped to **0.4.0** in `browser-extension/manifest.json` and `vscode-extension/package.json`.

---

## [0.3.0] - 2026-10-22

### Added

- **Social sharing modal** — a Share button in the Export panel opens a modal with eight platform shortcuts: X/Twitter, LinkedIn, WhatsApp, Telegram, Facebook, Reddit, Pinterest, and Instagram.
- **Web Share API** integration: when supported by the browser or device, the image file is shared directly via the native system sharing sheet (Android, iOS, desktop Chrome/Edge).
- Platform buttons automatically download the composed image first, then open the corresponding social network in a new tab so the file can be attached immediately.
- All platform icons use official brand SVGs inline (no external icon libraries required).
- Share availability is synchronized with Export availability: the button is disabled until an image is loaded.
- The modal is fully accessible: `role="dialog"`, `aria-modal`, `aria-labelledby`, `Escape` key dismissal, overlay-click dismissal, and focus returned to the trigger button on close.
- **Accessible Annotations** now include all toolbar tool types: added Ellipse (circle), Pen, and Highlighter buttons to the panel, covering all 10 annotation tools.
- **Bidirectional sync** between Accessible Annotations and the toolbar: clicking an accessible annotation button activates the corresponding toolbar tool, and selecting a toolbar tool highlights the corresponding accessible annotation button.
- Accessible annotation coordinates now adapt dynamically to the current padding and frame bar height so annotations always appear within the image content area.

### Fixed

- Restored image pasting with `Ctrl + V` / `Cmd + V` by preventing single-key tool shortcuts from intercepting modified native clipboard shortcuts in the web app, Chrome/Edge extension, and VS Code editor.

---

## [0.2.0] - 2026-10-19

### Added

- Public GitHub Pages site at [carlosarman.github.io/screenshot-studio](https://carlosarman.github.io/screenshot-studio/).
- GitHub Actions workflow that deploys the contents of `web/` to GitHub Pages when changes are pushed to `main`.
- Visual image-editor-style crop controls with a draggable frame, corner and edge handles, outside mask, Apply/Cancel actions, and original-image restoration during the current session.
- Bundled and synchronized Screenshot Studio editor for the browser and VS Code extensions, providing frames, backgrounds, visual crop, annotations, history, and local export.
- Browser extension capture modes for the visible area, a user-selected page area, and the entire scrollable page.
- Visual page-area selector with `Esc` cancellation support.
- Extension icons for Chrome/Edge (16, 32, 48, and 128 px) and VS Code (128 px), generated from the project brand icon.
- Dedicated privacy tools to pixelate (`X`) and blur (`B`) sensitive regions, available in the web app and bundled Chrome/Edge and VS Code editors.
- Accessible controls to add pixelation or blur annotations and adjust the strength of each effect.
- Composition presets for X/Twitter (1600 × 900), LinkedIn (1200 × 627), Instagram square (1080 × 1080), Instagram portrait (1080 × 1350), and Stories/Reels (1080 × 1920), available in the web app and bundled Chrome/Edge and VS Code editors.
- Presets create an exact-size output canvas and center the proportionally fitted screenshot within it.
- Editable emoji tool, available from the annotation toolbar, the `E` shortcut, and accessible controls; includes a predefined emoji picker and size controls in Properties.
- Contextual deletion actions through the × button on each annotation layer.
- Refreshed annotation tool iconography to improve visual distinction between tools.
- Image resizing by pixel width and height, with aspect-ratio locking, high-quality smoothing, and 24 megapixel limit validation.
- Visual resize and rotation handles for selected annotations, with undo/redo history and guides excluded from exports.
- Portable local project saving and loading in JSON, including an embedded image and complete composition and annotation state.
- Current-image removal plus global annotation clearing, alongside individual per-layer deletion.

### Fixed

- The export card now preserves bottom and side spacing around the Download and Copy buttons, even when it is the last panel section.
- Full-page capture now respects Chrome's two-calls-per-second `captureVisibleTab` quota, with a delay and safe retry for rolling-window limits.
- Visual selection guides are no longer drawn on the canvas, so they cannot appear in downloaded or copied images.

### Changed

- Shared editor styles, including export spacing, are synchronized across the web app, Chrome/Edge extension, and VS Code extension.
- Browser extension captures are passed through local extension storage to the bundled editor instead of opening the raw image data URL in a separate tab.
- Improved browser-extension popup labels, status feedback, semantic grouping, and accessible focus behavior.
- Full-page capture restores the page's original scroll position after stitching captured segments.
- Privacy effects are rasterized during final composition; exports contain only pixelated or blurred pixels, with no recoverable mask or sharp region.
- Secondary button styles are unified across image, project, crop, resize, annotation, and export panels.

### Planned

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

[Unreleased]: https://github.com/CarlosArman/screenshot-studio/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/CarlosArman/screenshot-studio/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/CarlosArman/screenshot-studio/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/CarlosArman/screenshot-studio/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/CarlosArman/screenshot-studio/releases/tag/v0.1.0
