// crop.js
// Recorte visual: marco movible/redimensionable sobre la imagen, con máscara
// exterior y controladores en esquinas y bordes. El resultado se genera 1:1.

import { store } from './store.js';
import { getImageRect, getStageElement } from './canvas-editor.js';
import { reportStatus } from './status.js';

const MIN_CROP_SIZE = 24;

let cropBox = null;
let gesture = null;
let cropOverlay;
let cropFrame;
let isCropping = false;

function createOverlay() {
  const layer = document.getElementById('overlayLayer');
  cropOverlay = document.createElement('div');
  cropOverlay.className = 'crop-overlay';
  cropOverlay.hidden = true;
  cropOverlay.setAttribute('aria-label', 'Área de recorte. Arrastra el centro para mover y los controladores para ajustar.');

  cropFrame = document.createElement('div');
  cropFrame.className = 'crop-frame';

  [
    ['nw', 'esquina superior izquierda'],
    ['n', 'borde superior'],
    ['ne', 'esquina superior derecha'],
    ['e', 'borde derecho'],
    ['se', 'esquina inferior derecha'],
    ['s', 'borde inferior'],
    ['sw', 'esquina inferior izquierda'],
    ['w', 'borde izquierdo']
  ].forEach(([handle, label]) => {
    const control = document.createElement('span');
    control.className = `crop-handle crop-handle-${handle}`;
    control.dataset.handle = handle;
    control.setAttribute('aria-label', label);
    cropFrame.appendChild(control);
  });

  cropOverlay.appendChild(cropFrame);
  layer.appendChild(cropOverlay);

  cropOverlay.addEventListener('pointerdown', onPointerDown);
  cropOverlay.addEventListener('pointermove', onPointerMove);
  cropOverlay.addEventListener('pointerup', endGesture);
  cropOverlay.addEventListener('pointercancel', endGesture);
}

function getImageBox() {
  const rect = getImageRect();
  if (!rect) return null;

  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  };
}

function clampBox(box, imageBox) {
  const width = Math.max(MIN_CROP_SIZE, Math.min(box.width, imageBox.width));
  const height = Math.max(MIN_CROP_SIZE, Math.min(box.height, imageBox.height));
  const x = Math.min(Math.max(box.x, imageBox.x), imageBox.right - width);
  const y = Math.min(Math.max(box.y, imageBox.y), imageBox.bottom - height);
  return { x, y, width, height };
}

function renderOverlay() {
  const imageBox = getImageBox();
  if (!imageBox || !cropBox) return;

  cropBox = clampBox(cropBox, imageBox);
  cropOverlay.style.left = `${imageBox.x}px`;
  cropOverlay.style.top = `${imageBox.y}px`;
  cropOverlay.style.width = `${imageBox.width}px`;
  cropOverlay.style.height = `${imageBox.height}px`;

  cropFrame.style.left = `${cropBox.x - imageBox.x}px`;
  cropFrame.style.top = `${cropBox.y - imageBox.y}px`;
  cropFrame.style.width = `${cropBox.width}px`;
  cropFrame.style.height = `${cropBox.height}px`;
}

function pointFromEvent(event) {
  const stage = getStageElement();
  const rect = stage.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (stage.offsetWidth / rect.width),
    y: (event.clientY - rect.top) * (stage.offsetHeight / rect.height)
  };
}

function getHandleAt(event) {
  return event.target.closest('[data-handle]')?.dataset.handle || 'move';
}

function onPointerDown(event) {
  if (!isCropping || !cropBox) return;
  event.preventDefault();

  const point = pointFromEvent(event);
  gesture = {
    handle: getHandleAt(event),
    origin: point,
    box: { ...cropBox }
  };
  cropOverlay.setPointerCapture(event.pointerId);
}

function resizeFromWest(box, dx, handle) {
  if (!handle.includes('w')) return;
  box.x += dx;
  box.width -= dx;
}

function resizeFromNorth(box, dy, handle) {
  if (!handle.includes('n')) return;
  box.y += dy;
  box.height -= dy;
}

function enforceMinimumSize(box, original, handle) {
  if (box.width < MIN_CROP_SIZE) {
    if (handle.includes('w')) box.x = original.x + original.width - MIN_CROP_SIZE;
    box.width = MIN_CROP_SIZE;
  }
  if (box.height < MIN_CROP_SIZE) {
    if (handle.includes('n')) box.y = original.y + original.height - MIN_CROP_SIZE;
    box.height = MIN_CROP_SIZE;
  }
}

function resizeCropBox(original, handle, dx, dy) {
  const next = { ...original };
  resizeFromWest(next, dx, handle);
  resizeFromNorth(next, dy, handle);
  if (handle.includes('e')) next.width += dx;
  if (handle.includes('s')) next.height += dy;
  enforceMinimumSize(next, original, handle);
  return next;
}

function onPointerMove(event) {
  if (!gesture || !cropBox) return;
  const imageBox = getImageBox();
  if (!imageBox) return;

  const point = pointFromEvent(event);
  const dx = point.x - gesture.origin.x;
  const dy = point.y - gesture.origin.y;
  const { handle, box } = gesture;
  const next = handle === 'move'
    ? { ...box, x: box.x + dx, y: box.y + dy }
    : resizeCropBox(box, handle, dx, dy);

  cropBox = clampBox(next, imageBox);
  renderOverlay();
}

function endGesture() {
  gesture = null;
}

function cropInSourcePixels(image, imageBox) {
  const scaleX = image.width / imageBox.width;
  const scaleY = image.height / imageBox.height;

  return {
    x: Math.round((cropBox.x - imageBox.x) * scaleX),
    y: Math.round((cropBox.y - imageBox.y) * scaleY),
    width: Math.max(1, Math.round(cropBox.width * scaleX)),
    height: Math.max(1, Math.round(cropBox.height * scaleY))
  };
}

function renderCrop(image, crop) {
  return new Promise((resolve, reject) => {
    const source = new Image();
    source.decoding = 'async';
    source.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = crop.width;
      canvas.height = crop.height;
      canvas.getContext('2d').drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      resolve(canvas.toDataURL('image/png'));
    };
    source.onerror = () => reject(new Error('No se pudo procesar la imagen para el recorte.'));
    source.src = image.src;
  });
}

function setCropping(active) {
  isCropping = active;
  cropOverlay.hidden = !active;
  document.getElementById('startCropBtn').hidden = active;
  document.getElementById('cropActions').hidden = !active;
  document.getElementById('resetCropBtn').hidden = active;
  getStageElement().classList.toggle('is-cropping', active);
}

function startCrop() {
  const imageBox = getImageBox();
  if (!store.getState().image || !imageBox) {
    reportStatus('Carga una imagen antes de iniciar el recorte.', 'error');
    return;
  }

  cropBox = { ...imageBox };
  setCropping(true);
  renderOverlay();
  reportStatus('Arrastra el centro para mover el recorte o sus controladores para cambiar el tamaño.', 'info');
}

function cancelCrop() {
  gesture = null;
  cropBox = null;
  setCropping(false);
  reportStatus('Recorte cancelado.', 'info');
}

async function applyCrop() {
  const image = store.getState().image;
  const imageBox = getImageBox();
  if (!image || !imageBox || !cropBox) return;

  const crop = cropInSourcePixels(image, imageBox);
  const button = document.getElementById('applyCropBtn');
  button.disabled = true;
  button.textContent = 'Recortando…';

  try {
    const src = await renderCrop(image, crop);
    store.update({
      image: {
        src,
        width: crop.width,
        height: crop.height,
        name: image.name || 'captura-recortada.png',
        original: image.original || {
          src: image.src,
          width: image.width,
          height: image.height,
          name: image.name || 'captura.png'
        }
      },
      annotations: [],
      selectedId: null
    }, { commit: true });
    cancelCrop();
    reportStatus('Recorte aplicado a resolución nativa. Se eliminaron las anotaciones existentes.', 'success');
  } catch (error) {
    reportStatus(error.message || 'No se pudo aplicar el recorte.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Aplicar';
  }
}

function resetCrop() {
  const image = store.getState().image;
  if (!image?.original) return;

  store.update({
    image: { ...image.original },
    annotations: [],
    selectedId: null
  }, { commit: true });
  reportStatus('Se restauró la imagen original a resolución nativa.', 'success');
}

export function initCropControls() {
  createOverlay();

  document.getElementById('startCropBtn').addEventListener('click', startCrop);
  document.getElementById('applyCropBtn').addEventListener('click', () => void applyCrop());
  document.getElementById('cancelCropBtn').addEventListener('click', cancelCrop);
  document.getElementById('resetCropBtn').addEventListener('click', resetCrop);

  store.subscribe((state) => {
    const hasImage = Boolean(state.image);
    document.getElementById('startCropBtn').disabled = !hasImage;
    document.getElementById('resetCropBtn').disabled = !state.image?.original;
    if (isCropping) requestAnimationFrame(renderOverlay);
  });
}
