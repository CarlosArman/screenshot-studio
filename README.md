# 📸 Screenshot Studio

<p align="center">
  <img src="https://img.shields.io/badge/Version-0.4.1-blueviolet" alt="Version" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Canvas-2D-087EA4" alt="Canvas" />
  <img src="https://img.shields.io/badge/Export-PNG%20JPEG%20WebP-green" alt="Export" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Vanilla%20JS-blueviolet" alt="Architecture" />
  <img src="https://img.shields.io/badge/Design-Offline%20First-informational" alt="Design" />
  <img src="https://img.shields.io/badge/Platforms-Web%20%7C%20Chrome%20%7C%20VS%20Code-blue" alt="Platforms" />
  <img src="https://img.shields.io/badge/Accessibility-WCAG%202.2-success" alt="Accessibility" />
  <img src="https://img.shields.io/badge/Status-Active%20Development-yellow" alt="Status" />
</p>

<p align="center"><b>🌐 Language / Idioma</b></p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a> &nbsp;|&nbsp; <a href="./README.es.md">🇪🇸 Español</a>
</p>

<p align="center">
  Create polished screenshots directly in your browser, with frames, backgrounds, annotations, and local export. Built with <b>HTML</b>, <b>CSS3</b>, and <b>vanilla JavaScript</b>, including a <b>Chrome/Edge extension</b> and a <b>VS Code extension</b> from the same codebase.
</p>

---

Screenshot Studio is a visual editor for transforming local images and screenshots into polished compositions with realistic application frames, gradients, annotations, privacy masks, and high-resolution exports — all without requiring a backend or uploading files to an external service.

---

## 🎯 Why This Project Matters

This project demonstrates how to build a **multi-platform frontend productivity tool** using only HTML, CSS, and vanilla JavaScript — without frameworks, build steps, or a backend — and package it into **three distribution surfaces** from a single codebase.

It demonstrates practical capabilities in:

- Advanced Canvas 2D rendering and browser-side image composition.
- Local/offline-first image processing using Object URLs and browser APIs.
- Browser extension development with Chrome Manifest V3.
- VS Code extension development with WebviewPanel and editor commands.
- Accessible UI design: ARIA states, keyboard navigation, focus management, and WCAG-oriented contrast.
- Responsive workspace design with collapsible side panels, dark/light themes, and reduced-motion support.

This makes the repository a practical example of **frontend product engineering with a privacy-first workflow**.

---

## 🚀 Project Overview

This repository includes a screenshot composition editor distributed as:

- A **public web application**.
- A **browser extension** for Chrome/Edge-style browsers.
- A **VS Code extension** with the full editor for local images.

The solution combines:

- Local image import from files, drag and drop, and clipboard paste.
- Screenshot/window capture through browser display media APIs.
- Realistic macOS, Windows, Linux/GNOME, browser, Safari, Chrome, terminal, and generic frames.
- Composition controls: background, padding, corner radius, shadow, and scale.
- Text, callout, arrow, shape, pen, highlighter, privacy pixelation, and privacy blur annotations.
- Undo/redo, layers, accessible property controls, and keyboard shortcuts.
- Current-image removal plus global or individual annotation clearing.
- Portable local project saving and loading in JSON.
- PNG, JPEG, and WebP export with clipboard copy support.
- Checkerboard preview for transparent compositions.

🌐 **Live web app:** [carlosarman.github.io/screenshot-studio](https://carlosarman.github.io/screenshot-studio/)<br>
🔗 **Web app source:** [`web/`](./web/)<br>
🔗 **Browser extension:** [`browser-extension/`](./browser-extension)  
🔗 **VS Code extension:** [`vscode-extension/`](./vscode-extension)  
🔗 **Spanish README:** [`README.es.md`](./README.es.md)  
🔗 **Changelog:** [`CHANGELOG.md`](./CHANGELOG.md) · [🇪🇸 Spanish changelog](./CHANGELOG.es.md)

---

## 🧩 Core Features

### 🖼️ Local image workflow

- Supports PNG, JPEG, and WebP.
- Import from file picker, drag and drop, or clipboard paste.
- Validates supported MIME types, a 15 MB file limit, and a 24 MP image limit.
- Keeps image processing local to the browser.

### ✂️ Image cropping

- A visual crop frame with drag-to-move, corner and edge resize handles, an outside mask, and Apply/Cancel controls.
- Cropping removes unwanted areas without enlarging or interpolating the selected pixels, preserving native sharpness.
- Restores the original image during the current session when needed.
- Resizes images by pixel width and height, with optional aspect-ratio locking and a 24 megapixel limit.
- Applying a crop removes existing annotations because their coordinates no longer match the cropped image.

### 🎨 Composition controls

- Solid, gradient, and transparent backgrounds.
- Aurora, Sunset, Ocean, Berry, Midnight, and Lime presets.
- Adjustable padding, corner radius, drop shadow, and scale.
- Export presets for X/Twitter (1600 × 900), LinkedIn (1200 × 627), Instagram square (1080 × 1080), Instagram portrait (1080 × 1350), and Stories/Reels (1080 × 1920).
- Each preset centers and fits the screenshot within an exact output canvas.
- Dark/light application theme and frame theme controls.

### 🪟 Application frames

| Frame | Details |
| --- | --- |
| macOS | Native-style colored window controls |
| Windows | Standard minimize, maximize, and close controls |
| Linux | GNOME-inspired title bar, app icon, and centered controls |
| Browser | Generic browser chrome |
| Safari | Centered search controls and macOS styling |
| Chrome | Tabs, omnibox, navigation, home, refresh, and window controls |
| Terminal | Monospace terminal title bar |

### ✏️ Annotation tools

- Selection and movement.
- Text, editable emojis with a visual picker, and numbered callouts.
- Direct deletion from the × button on each layer.
- Arrows, rectangles, ellipses, freehand pen, and highlighter.
- Irreversible pixelation and blur for sensitive regions.
- Adjustable strength for both privacy effects.
- Annotation layers and editable properties.
- Visual resize and rotation handles for selected annotations; selection guides never appear in exports.
- **Accessible Annotations** panel covers all 10 tool types with bidirectional toolbar sync: clicking an accessible annotation button activates the corresponding toolbar tool and vice versa.

### 💾 Local projects

- Save the full document as a portable JSON file: embedded image, frame, background, composition, and annotations.
- Reopen a project later from the same machine, browser, Chrome/Edge extension, or VS Code extension.
- Loading validates the project format and resets history for a new editing session.

### 📤 Export & Share

- Uniform secondary button styling across image, project, crop, resize, annotation, and export panels.
- Export card with additional spacing around the Download and Copy buttons.
- PNG, JPEG, and WebP formats.
- Adjustable output quality.
- Local download.
- Clipboard copy when supported by the browser.
- Transparency is preserved in the exported image.
- **Share modal** with eight social platform shortcuts: X/Twitter, LinkedIn, WhatsApp, Telegram, Facebook, Reddit, Pinterest, and Instagram.
- **Web Share API** integration — on supported browsers and devices the composed image is shared as a file directly via the native system sheet.
- Platform buttons download the image automatically before opening the social network so it can be attached immediately.

---

## 📦 Installation & Local Development

### Requirements

- Node.js or another static HTTP server.
- A modern browser with ES Modules support.

> Do not open the editor through `file://`. JavaScript ES Modules require an HTTP or HTTPS context.

### Run with Node.js

```bash
npx serve web
```

### GitHub Pages deployment

The live web app is published at [https://carlosarman.github.io/screenshot-studio/](https://carlosarman.github.io/screenshot-studio/).

Pushes to `main` automatically deploy the contents of [`web/`](./web/) through [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml). The workflow is required because GitHub Pages only supports branch-based publishing from the repository root or `/docs`; it cannot directly use `web/` as its source directory.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `V` | Select |
| `T` | Text |
| `N` | Numbered callout |
| `E` | Add emoji |
| `A` | Arrow |
| `R` | Rectangle |
| `O` | Ellipse |
| `P` | Pen |
| `H` | Highlighter |
| `X` | Pixelate sensitive information |
| `B` | Blur sensitive information |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + D` | Duplicate selected annotation |
| `←` `↑` `→` `↓` | Move annotation 1 px |
| `Shift + ←↑→↓` | Move annotation 10 px |
| `Delete` / `Backspace` | Delete selected annotation |
| `Esc` | Cancel the active selection or gesture |
| `Space + drag` | Pan the editing area |
| `Ctrl/Cmd + scroll` | Zoom with the mouse wheel |

---

## 🧭 Browser Extension

The Manifest V3 browser extension captures the active tab and automatically opens the image in the bundled Screenshot Studio editor. Captures remain local and can immediately receive frames, backgrounds, annotations, and exports.

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select the [`browser-extension/`](./browser-extension) directory.
5. Open Screenshot Studio on a regular web page and select a capture mode:
   - **Capture visible area** captures the current viewport.
   - **Capture part of the page** displays a visual selector; drag to select an area and press `Esc` to cancel.
   - **Capture entire page** scrolls through the document and stitches the segments into one image.
6. The bundled editor opens automatically with the captured image loaded and ready for framing, annotation, or export.

> Reload the extension from `chrome://extensions` or `edge://extensions` after changing its files. Chrome/Edge cannot capture protected pages such as `chrome://`/`edge://`, the Chrome Web Store, or native PDF viewers. Full-page captures are limited to **24 megapixels** to avoid excessive memory use: an RGBA canvas requires roughly 4 bytes per pixel, so 24 MP uses about 96 MB for the final canvas alone, in addition to temporary captures and the editor. The limit reduces tab crashes, UI freezes, and service-worker failures on memory-constrained devices.

---

## 💻 VS Code Extension

The VS Code extension opens local images in the same full Screenshot Studio editor: frames, backgrounds, visual crop, annotations, history, zoom, and local export.

It registers the following command:

```text
Screenshot Studio: Open image in editor
```

It is also available in the Explorer context menu for PNG, JPG, JPEG, and WebP files.

---

## ♿ Accessibility & Privacy

Screenshot Studio includes:

- Focus-visible styles.
- Keyboard navigation for tools and selectable controls.
- `aria-pressed` states and live status feedback.
- Accessible annotation creation controls.
- Range value outputs.
- `prefers-reduced-motion` support.
- Responsive panels with collapse/expand controls.
- Local-only image processing.

> Review exported files before sharing information that is extremely sensitive.

---

## 🏗️ Project Structure

```text
screenshot-studio/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── web/
│   ├── index.html
│   ├── favicon.svg
│   ├── assets/
│   ├── js/
│   │   ├── app.js
│   │   ├── store.js
│   │   ├── history.js
│   │   ├── canvas-editor.js
│   │   ├── annotations.js
│   │   ├── browser-frames.js
│   │   ├── image-import.js
│   │   ├── screen-capture.js
│   │   ├── export.js
│   │   ├── share.js
│   │   └── status.js
│   └── styles/
│       ├── main.css
│       └── light-theme.css
├── browser-extension/
├── vscode-extension/
├── README.md
├── README.es.md
├── CHANGELOG.md
└── FRONTEND_AUDIT.md
```

---

## 🧪 Roadmap

Next planned improvements:

- [x] Irreversible pixelation and blur for privacy annotations.
- [x] Social-media composition presets.
- [x] Image crop and resize tools.
- [x] Annotation resize and rotation handles.
- [x] Local project save/load.
- [x] Social sharing modal with Web Share API and platform shortcuts.
- [x] Accessible Annotations covering all tool types with bidirectional toolbar sync.
- [x] Annotation opacity and shape fill controls in the Properties panel.
- [x] Arrow-key annotation movement and Ctrl+D duplicate.
- [x] Copy and paste annotations (Ctrl+C / Ctrl+V, internal buffer).
- [x] Reorder layers with up/down buttons in the Layers panel.
- [x] Mouse wheel zoom and Space+drag pan.
- [x] 2× HiDPI export scale.
- [x] Auto-save to localStorage with session restoration.
- [x] Installable PWA (manifest + service worker, works offline).
- [x] MIT License.
- [x] Correct Accessible Annotations behavior (tool selector with bidirectional sync).
- [x] Share modal adapted to light theme.
- [x] Distribution packages generated in `extensions/` (Chrome/Edge ZIP and VS Code VSIX).
- [ ] Automated canvas, accessibility, and responsive tests.

---

## 📄 License

This project is distributed under the **MIT License**. See the [`LICENSE`](./LICENSE) file for details.
