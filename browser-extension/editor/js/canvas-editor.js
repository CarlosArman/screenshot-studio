// canvas-editor.js
// Renderiza la composición final. El scheduler limita el trabajo a un render
// por frame y descarta cargas de imagen que dejan de corresponder al estado.

import { store } from './store.js';
import { drawFrame, BAR_HEIGHT } from './browser-frames.js';
import { drawAnnotationsOnContext } from './annotations.js';
import { reportStatus } from './status.js';

const MAX_CANVAS_SIZE = 2400;
const MIN_ZOOM = 25;
const MAX_ZOOM = 250;
const ZOOM_STEP = 10;

let canvas;
let ctx;
let stageEl;
let loadedImage = null;
let imageSrcCache = null;
let zoom = 100;
let renderFrame = 0;
let renderVersion = 0;
let canvasWasScaled = false;
let canvasCoordinateScale = 1;
let imageRect = null;

// ── Pan con Espacio+drag ──────────────────────────────────────
let spaceHeld = false;
let panning = false;
let panScrollStart = null;

export function isSpaceHeld() { return spaceHeld; }

export function initCanvasEditor() {
  canvas = document.getElementById('mainCanvas');
  ctx = canvas.getContext('2d');
  stageEl = document.getElementById('canvasStage');

  store.subscribe(() => scheduleRender());
  scheduleRender();

  initWheelZoom();
  initPan();
}

function initWheelZoom() {
  const canvasArea = document.getElementById('canvasArea');
  if (!canvasArea) return;
  canvasArea.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom(zoom + delta);
  }, { passive: false });
}

function initPan() {
  const canvasArea = document.getElementById('canvasArea');
  if (!canvasArea) return;

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;
    const activeTag = document.activeElement?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA') return;
    event.preventDefault();
    if (!spaceHeld) {
      spaceHeld = true;
      if (canvas) canvas.style.cursor = 'grab';
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.code !== 'Space') return;
    spaceHeld = false;
    if (!panning && canvas) canvas.style.cursor = 'default';
  });

  // Captura en fase de captura para interceptar antes que annotations.js
  canvas && canvas.addEventListener('pointerdown', (event) => {
    if (!spaceHeld) return;
    event.preventDefault();
    event.stopPropagation();
    panning = true;
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture(event.pointerId);
    panScrollStart = {
      x: event.clientX + canvasArea.scrollLeft,
      y: event.clientY + canvasArea.scrollTop
    };
  }, true);

  canvas && canvas.addEventListener('pointermove', (event) => {
    if (!panning) return;
    canvasArea.scrollLeft = panScrollStart.x - event.clientX;
    canvasArea.scrollTop = panScrollStart.y - event.clientY;
  }, true);

  window.addEventListener('pointerup', () => {
    if (!panning) return;
    panning = false;
    if (canvas) canvas.style.cursor = spaceHeld ? 'grab' : 'default';
  });
}

export function scheduleRender() {
  renderVersion += 1;
  if (renderFrame) return;

  renderFrame = window.requestAnimationFrame(() => {
    renderFrame = 0;
    const version = renderVersion;
    void render(version).catch((error) => {
      console.error('No se pudo renderizar el lienzo:', error);
      reportStatus('No se pudo actualizar la vista de edición.', 'error');
    });
  });
}

export function setZoom(nextZoom) {
  zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(nextZoom)));
  applyZoom();
  return zoom;
}

export function changeZoom(delta) {
  return setZoom(zoom + delta);
}

export function resetZoom() {
  return setZoom(100);
}

export function getZoom() {
  return zoom;
}

function applyZoom() {
  if (!stageEl) return;
  stageEl.style.transform = `scale(${zoom / 100})`;
  updateZoomOutput();
}

function updateZoomOutput() {
  const output = document.getElementById('zoomValue');
  if (output) output.value = `${zoom}%`;
}

async function ensureImageLoaded(image) {
  if (!image?.src) {
    loadedImage = null;
    imageSrcCache = null;
    return null;
  }
  if (imageSrcCache === image.src && loadedImage) return loadedImage;

  const img = new Image();
  img.decoding = 'async';
  img.src = image.src;
  await img.decode();
  loadedImage = img;
  imageSrcCache = image.src;
  return img;
}

function computeLayout(image, state) {
  const { composition, frame } = state;
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const barHeight = frame.type === 'none' ? 0 : BAR_HEIGHT;
  const padding = composition.padding;
  const presetWidth = Number(composition.outputWidth);
  const presetHeight = Number(composition.outputHeight);
  const hasOutputPreset = Number.isFinite(presetWidth) && presetWidth > 0
    && Number.isFinite(presetHeight) && presetHeight > 0;
  const requestedScale = (composition.scale || 100) / 100;

  let contentWidth = imageWidth * requestedScale;
  let contentHeight = imageHeight * requestedScale;
  let logicalWidth = contentWidth + padding * 2;
  let logicalHeight = contentHeight + barHeight + padding * 2;

  if (hasOutputPreset) {
    logicalWidth = presetWidth;
    logicalHeight = presetHeight;
    const availableWidth = Math.max(1, logicalWidth - padding * 2);
    const availableHeight = Math.max(1, logicalHeight - padding * 2 - barHeight);
    const fitScale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
    const contentScale = Math.min(requestedScale, fitScale);
    contentWidth = imageWidth * contentScale;
    contentHeight = imageHeight * contentScale;
  }

  const outputScale = Math.min(1, MAX_CANVAS_SIZE / Math.max(logicalWidth, logicalHeight));
  const rect = {
    x: hasOutputPreset ? (logicalWidth - contentWidth) / 2 : padding,
    y: hasOutputPreset ? (logicalHeight - contentHeight + barHeight) / 2 : padding + barHeight,
    width: contentWidth,
    height: contentHeight
  };

  return {
    logicalWidth,
    logicalHeight,
    canvasWidth: Math.max(1, Math.round(logicalWidth * outputScale)),
    canvasHeight: Math.max(1, Math.round(logicalHeight * outputScale)),
    outputScale,
    barHeight,
    rect
  };
}

function drawBackground(width, height, background) {
  if (background.type === 'transparent') {
    ctx.clearRect(0, 0, width, height);
    return;
  }
  if (background.type === 'gradient') {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, background.color1);
    gradient.addColorStop(1, background.color2);
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = background.color1;
  }
  ctx.fillRect(0, 0, width, height);
}

function drawShadow(rect, barHeight, shadowAmount, radius) {
  if (shadowAmount <= 0) return;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = shadowAmount;
  ctx.shadowOffsetY = shadowAmount / 3;
  ctx.fillStyle = 'rgba(0,0,0,0.001)';
  const y = rect.y - barHeight;
  const height = rect.height + barHeight;
  const corner = Math.min(radius, rect.width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(rect.x + corner, y);
  ctx.arcTo(rect.x + rect.width, y, rect.x + rect.width, y + height, corner);
  ctx.arcTo(rect.x + rect.width, y + height, rect.x, y + height, corner);
  ctx.arcTo(rect.x, y + height, rect.x, y, corner);
  ctx.arcTo(rect.x, y, rect.x + rect.width, y, corner);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export async function render(version = renderVersion) {
  const state = store.getState();
  const image = await ensureImageLoaded(state.image);

  if (version !== renderVersion) {
    scheduleRender();
    return;
  }

  if (!image) {
    canvas.width = 960;
    canvas.height = 540;

    const placeholderBackground = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    placeholderBackground.addColorStop(0, '#2b3549');
    placeholderBackground.addColorStop(1, '#202837');
    ctx.fillStyle = placeholderBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const placeholderGlow = ctx.createRadialGradient(canvas.width / 2, 0, 0, canvas.width / 2, 0, canvas.width * 0.62);
    placeholderGlow.addColorStop(0, 'rgba(119, 102, 255, 0.32)');
    placeholderGlow.addColorStop(1, 'rgba(119, 102, 255, 0)');
    ctx.fillStyle = placeholderGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    imageRect = null;
    fitStage(canvas.width, canvas.height);
    return;
  }

  const layout = computeLayout(image, state);
  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;
  canvasCoordinateScale = layout.outputScale;
  imageRect = {
    x: layout.rect.x * layout.outputScale,
    y: layout.rect.y * layout.outputScale,
    width: layout.rect.width * layout.outputScale,
    height: layout.rect.height * layout.outputScale,
    sourceWidth: image.naturalWidth || image.width,
    sourceHeight: image.naturalHeight || image.height
  };
  ctx.save();
  ctx.scale(layout.outputScale, layout.outputScale);
  drawBackground(layout.logicalWidth, layout.logicalHeight, state.background);
  drawShadow(layout.rect, layout.barHeight, state.composition.shadow, state.composition.radius);
  drawFrame(ctx, image, layout.rect, state.frame, state.composition.radius);
  drawAnnotationsOnContext(ctx, state.annotations);
  ctx.restore();

  if (canvasWasScaled !== (layout.outputScale < 1)) {
    canvasWasScaled = layout.outputScale < 1;
    reportStatus(canvasWasScaled
      ? 'La vista y exportación se redujeron proporcionalmente para conservar la composición.'
      : 'La composición se muestra a su resolución configurada.', 'info');
  }
  fitStage(layout.canvasWidth, layout.canvasHeight);
}

function fitStage(width, height) {
  stageEl.style.width = `${width}px`;
  stageEl.style.height = `${height}px`;
  applyZoom();
}

export function getCanvas() {
  return canvas;
}

export function getContext() {
  return ctx;
}

export function getCanvasCoordinateScale() {
  return canvasCoordinateScale;
}

export function getStageElement() {
  return stageEl;
}

export function getImageRect() {
  return imageRect && { ...imageRect };
}

export { ZOOM_STEP };
