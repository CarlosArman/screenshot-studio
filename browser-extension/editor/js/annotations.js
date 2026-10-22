// annotations.js
// Anotaciones editables basadas en coordenadas del lienzo final.
// Se dibujan en Canvas para la exportación y se gestionan desde eventos
// de puntero sobre el canvas para no depender de librerías externas.

import { store, nextId } from './store.js';
import { history } from './history.js';
import { getCanvas, getCanvasCoordinateScale } from './canvas-editor.js';

let currentTool = 'select';
let drawing = null;
let moving = null;
let selectionOverlay;
let selectionBox;
let transformGesture = null;

const DEFAULT_COLOR = '#ef4444';
const TRANSFORMABLE_TYPES = new Set(['text', 'emoji', 'number', 'arrow', 'rect', 'ellipse', 'pen', 'highlighter']);
const MIN_ANNOTATION_SIZE = 12;

export function initAnnotations() {
  const canvas = getCanvas();
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', () => {
    if (!moving && !drawing && currentTool === 'select') canvas.style.cursor = 'default';
  });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', cancelPointerGesture);
  createSelectionOverlay();

  store.subscribe((state) => {
    renderSelectionOverlay(state.annotations.find((annotation) => annotation.id === state.selectedId));
  });
}

export function setTool(tool) {
  currentTool = tool;
  const canvas = getCanvas();
  canvas.style.cursor = tool === 'select' ? 'default' : 'crosshair';
}

export function drawAnnotationsOnContext(ctx, annotations) {
  // Los efectos se aplican al bitmap de la composición antes de las
  // anotaciones decorativas. Al exportar, el resultado solo contiene los
  // píxeles ya transformados, no una máscara reversible ni datos originales.
  annotations
    .filter((annotation) => annotation.type === 'pixelate' || annotation.type === 'blur')
    .forEach((annotation) => drawPrivacyRegion(ctx, annotation));

  annotations
    .filter((annotation) => annotation.type !== 'pixelate' && annotation.type !== 'blur')
    .forEach((annotation) => drawAnnotation(ctx, annotation));

  // La selección se gestiona en el panel de capas y propiedades. No se dibuja
  // sobre el canvas para evitar que sus guías formen parte de una exportación.
}

function drawAnnotation(ctx, a) {
  ctx.save();
  const annotationBox = getAnnotationBox(a);
  if (a.rotation && annotationBox) {
    const centerX = annotationBox.x + annotationBox.width / 2;
    const centerY = annotationBox.y + annotationBox.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(a.rotation);
    ctx.translate(-centerX, -centerY);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = a.color || DEFAULT_COLOR;
  ctx.fillStyle = a.fill || 'transparent';
  ctx.lineWidth = a.strokeWidth || 4;
  ctx.globalAlpha = a.opacity ?? 1;

  if (a.type === 'rect') {
    ctx.strokeRect(a.x, a.y, a.width, a.height);
  }

  if (a.type === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(a.x + a.width / 2, a.y + a.height / 2, Math.abs(a.width / 2), Math.abs(a.height / 2), 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (a.type === 'arrow') {
    const angle = Math.atan2(a.y2 - a.y, a.x2 - a.x);
    const head = Math.max(10, a.strokeWidth * 3);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x2, a.y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a.x2, a.y2);
    ctx.lineTo(a.x2 - head * Math.cos(angle - Math.PI / 6), a.y2 - head * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(a.x2, a.y2);
    ctx.lineTo(a.x2 - head * Math.cos(angle + Math.PI / 6), a.y2 - head * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  if (a.type === 'text') {
    ctx.fillStyle = a.color || DEFAULT_COLOR;
    ctx.font = `${a.fontSize || 24}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textBaseline = 'top';
    a.text.split('\n').forEach((line, index) => ctx.fillText(line, a.x, a.y + index * (a.fontSize || 24) * 1.25));
  }

  if (a.type === 'emoji') {
    const size = a.fontSize || 48;
    ctx.fillStyle = '#ffffff';
    ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(a.emoji || '😀', a.x, a.y);
  }

  if (a.type === 'number') {
    const radius = a.radius || 18;
    ctx.fillStyle = a.color || DEFAULT_COLOR;
    ctx.beginPath();
    ctx.arc(a.x, a.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${radius}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(a.value || '1', a.x, a.y + 1);
  }

  if (a.type === 'pen' || a.type === 'highlighter') {
    ctx.strokeStyle = a.color || DEFAULT_COLOR;
    ctx.lineWidth = a.strokeWidth || (a.type === 'highlighter' ? 20 : 4);
    ctx.globalAlpha = a.type === 'highlighter' ? 0.3 : (a.opacity ?? 1);
    const points = a.points || [];
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawPrivacyRegion(ctx, annotation) {
  const canvas = ctx.canvas;
  const coordinateScale = ctx.getTransform().a || 1;
  const x = Math.max(0, Math.floor(annotation.x));
  const y = Math.max(0, Math.floor(annotation.y));
  const right = Math.min(canvas.width / coordinateScale, Math.ceil(annotation.x + annotation.width));
  const bottom = Math.min(canvas.height / coordinateScale, Math.ceil(annotation.y + annotation.height));
  const width = right - x;
  const height = bottom - y;

  if (width < 1 || height < 1) return;

  const blurRadius = annotation.type === 'blur' ? Math.max(2, Number(annotation.strength) || 12) : 0;
  // Se copia un margen alrededor de un desenfoque para que los bordes de la
  // región también queden ocultos; copiar solo el rectángulo deja una franja
  // nítida por la transparencia generada por el filtro.
  const bleed = Math.ceil(blurRadius * 2);
  const sourceX = Math.max(0, Math.floor((x - bleed) * coordinateScale));
  const sourceY = Math.max(0, Math.floor((y - bleed) * coordinateScale));
  const sourceRight = Math.min(canvas.width, Math.ceil((x + width + bleed) * coordinateScale));
  const sourceBottom = Math.min(canvas.height, Math.ceil((y + height + bleed) * coordinateScale));
  const sourceWidth = sourceRight - sourceX;
  const sourceHeight = sourceBottom - sourceY;
  const source = document.createElement('canvas');
  source.width = sourceWidth;
  source.height = sourceHeight;
  const sourceCtx = source.getContext('2d', { alpha: true });
  sourceCtx.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  if (annotation.type === 'pixelate') {
    const pixelSize = Math.max(4, Number(annotation.strength) || 12);
    const reduced = document.createElement('canvas');
    reduced.width = Math.max(1, Math.ceil(sourceWidth / pixelSize));
    reduced.height = Math.max(1, Math.ceil(sourceHeight / pixelSize));
    const reducedCtx = reduced.getContext('2d', { alpha: true });
    reducedCtx.imageSmoothingEnabled = false;
    reducedCtx.drawImage(source, 0, 0, reduced.width, reduced.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(reduced, 0, 0, reduced.width, reduced.height, x, y, width, height);
  } else {
    // El filtro se aplica sobre una copia aislada y se compone de nuevo en el
    // canvas. Por ello el archivo exportado no conserva la región nítida.
    ctx.filter = `blur(${blurRadius}px)`;
    ctx.drawImage(
      source,
      sourceX / coordinateScale,
      sourceY / coordinateScale,
      sourceWidth / coordinateScale,
      sourceHeight / coordinateScale
    );
  }
  ctx.restore();
}

function createSelectionOverlay() {
  const layer = document.getElementById('overlayLayer');
  selectionOverlay = document.createElement('div');
  selectionOverlay.className = 'annotation-selection-overlay';
  selectionOverlay.hidden = true;

  selectionBox = document.createElement('div');
  selectionBox.className = 'annotation-selection-box';
  selectionBox.innerHTML = `
    <span class="annotation-rotate-handle" data-transform="rotate" aria-label="Rotar anotación">↻</span>
    <span class="annotation-resize-handle annotation-resize-nw" data-transform="nw" aria-label="Redimensionar desde esquina superior izquierda"></span>
    <span class="annotation-resize-handle annotation-resize-n" data-transform="n" aria-label="Redimensionar desde borde superior"></span>
    <span class="annotation-resize-handle annotation-resize-ne" data-transform="ne" aria-label="Redimensionar desde esquina superior derecha"></span>
    <span class="annotation-resize-handle annotation-resize-e" data-transform="e" aria-label="Redimensionar desde borde derecho"></span>
    <span class="annotation-resize-handle annotation-resize-se" data-transform="se" aria-label="Redimensionar desde esquina inferior derecha"></span>
    <span class="annotation-resize-handle annotation-resize-s" data-transform="s" aria-label="Redimensionar desde borde inferior"></span>
    <span class="annotation-resize-handle annotation-resize-sw" data-transform="sw" aria-label="Redimensionar desde esquina inferior izquierda"></span>
    <span class="annotation-resize-handle annotation-resize-w" data-transform="w" aria-label="Redimensionar desde borde izquierdo"></span>`;
  selectionOverlay.appendChild(selectionBox);
  layer.appendChild(selectionOverlay);

  selectionBox.addEventListener('pointerdown', beginTransform);
  selectionBox.addEventListener('pointermove', updateTransform);
  selectionBox.addEventListener('pointerup', endTransform);
  selectionBox.addEventListener('pointercancel', endTransform);
}

function renderSelectionOverlay(annotation) {
  if (!selectionOverlay) return;
  if (!annotation || !TRANSFORMABLE_TYPES.has(annotation.type)) {
    selectionOverlay.hidden = true;
    return;
  }

  const box = getAnnotationBox(annotation);
  if (!box) {
    selectionOverlay.hidden = true;
    return;
  }

  const scale = getCanvasCoordinateScale();
  selectionOverlay.hidden = false;
  selectionOverlay.style.left = `${box.x * scale}px`;
  selectionOverlay.style.top = `${box.y * scale}px`;
  selectionOverlay.style.width = `${Math.max(1, box.width * scale)}px`;
  selectionOverlay.style.height = `${Math.max(1, box.height * scale)}px`;
  selectionOverlay.style.transform = `rotate(${annotation.rotation || 0}rad)`;
}

function pointFromOverlayEvent(event) {
  const stage = getCanvas().parentElement;
  const box = stage.getBoundingClientRect();
  const scale = getCanvasCoordinateScale();
  return {
    x: ((event.clientX - box.left) * (stage.offsetWidth / box.width)) / scale,
    y: ((event.clientY - box.top) * (stage.offsetHeight / box.height)) / scale
  };
}

function beginTransform(event) {
  const selected = store.getSelected();
  const action = event.target.closest('[data-transform]')?.dataset.transform;
  if (!selected || !action || !TRANSFORMABLE_TYPES.has(selected.type)) return;

  event.preventDefault();
  event.stopPropagation();
  const box = getAnnotationBox(selected);
  transformGesture = { action, annotation: structuredClone(selected), box, center: { x: box.x + box.width / 2, y: box.y + box.height / 2 } };
  history.beginGesture();
  selectionBox.setPointerCapture(event.pointerId);
}

function updateTransform(event) {
  if (!transformGesture) return;
  const point = pointFromOverlayEvent(event);
  const { action, annotation, center } = transformGesture;
  const patch = action === 'rotate'
    ? { rotation: Math.atan2(point.y - center.y, point.x - center.x) + Math.PI / 2 }
    : resizeAnnotation(annotation, transformGesture.box, action, point);
  store.updateAnnotation(annotation.id, patch, { silent: true });
}

function endTransform() {
  if (!transformGesture) return;
  transformGesture = null;
  history.commitGesture();
}

function resizeAnnotation(annotation, box, handle, point) {
  const nextBox = resizeBox(box, handle, point);
  const scaleX = nextBox.width / Math.max(1, box.width);
  const scaleY = nextBox.height / Math.max(1, box.height);
  const scalePoint = (item) => ({
    x: nextBox.x + (item.x - box.x) * scaleX,
    y: nextBox.y + (item.y - box.y) * scaleY
  });

  if (annotation.type === 'rect' || annotation.type === 'ellipse') {
    return { x: nextBox.x, y: nextBox.y, width: nextBox.width, height: nextBox.height };
  }
  if (annotation.type === 'text' || annotation.type === 'emoji') {
    return { x: nextBox.x, y: nextBox.y, fontSize: Math.max(MIN_ANNOTATION_SIZE, Math.round((annotation.fontSize || 24) * Math.min(scaleX, scaleY))) };
  }
  if (annotation.type === 'number') {
    const center = scalePoint({ x: annotation.x, y: annotation.y });
    return { ...center, radius: Math.max(8, Math.round((annotation.radius || 18) * Math.min(scaleX, scaleY))) };
  }
  if (annotation.type === 'arrow') {
    return { ...scalePoint({ x: annotation.x, y: annotation.y }), ...Object.fromEntries(Object.entries(scalePoint({ x: annotation.x2, y: annotation.y2 })).map(([key, value]) => [`${key}2`, value])) };
  }
  if (annotation.type === 'pen' || annotation.type === 'highlighter') {
    const points = annotation.points.map(scalePoint);
    return { points, bounds: getPointsBounds(points), strokeWidth: Math.max(1, (annotation.strokeWidth || 4) * Math.min(scaleX, scaleY)) };
  }
  return {};
}

function resizeBox(box, handle, point) {
  let { x, y, width, height } = box;
  const right = x + width;
  const bottom = y + height;

  if (handle.includes('w')) {
    x = Math.min(point.x, right - MIN_ANNOTATION_SIZE);
    width = right - x;
  }
  if (handle.includes('e')) width = Math.max(MIN_ANNOTATION_SIZE, point.x - x);
  if (handle.includes('n')) {
    y = Math.min(point.y, bottom - MIN_ANNOTATION_SIZE);
    height = bottom - y;
  }
  if (handle.includes('s')) height = Math.max(MIN_ANNOTATION_SIZE, point.y - y);
  return { x, y, width, height };
}

function pointFromEvent(event) {
  const canvas = getCanvas();
  const box = canvas.getBoundingClientRect();
  const outputScale = getCanvasCoordinateScale();
  return {
    x: ((event.clientX - box.left) * (canvas.width / box.width)) / outputScale,
    y: ((event.clientY - box.top) * (canvas.height / box.height)) / outputScale
  };
}

function onPointerDown(event) {
  const canvas = getCanvas();
  if (!canvas || !store.getState().image) return;
  const p = pointFromEvent(event);
  canvas.setPointerCapture?.(event.pointerId);

  if (currentTool === 'select') {
    const selected = findAnnotationAt(p);
    store.select(selected?.id || null);
    if (selected) {
      history.beginGesture();
      moving = { id: selected.id, origin: p, annotation: structuredClone(selected) };
    }
    return;
  }

  if (currentTool === 'text') {
    // Se inserta un texto editable inmediatamente, sin depender de un prompt
    // que puede bloquearse en Webviews o navegadores embebidos.
    store.addAnnotation({
      id: nextId(), type: 'text', x: p.x, y: p.y, text: 'Texto', color: DEFAULT_COLOR, fontSize: 24
    });
    return;
  }

  if (currentTool === 'number') {
    const count = store.getState().annotations.filter((a) => a.type === 'number').length + 1;
    store.addAnnotation({
      id: nextId(), type: 'number', x: p.x, y: p.y, value: String(count), color: DEFAULT_COLOR, radius: 18
    });
    return;
  }

  if (currentTool === 'emoji') {
    store.addAnnotation({
      id: nextId(), type: 'emoji', x: p.x, y: p.y, emoji: '😀', fontSize: 48
    });
    return;
  }

  history.beginGesture();
  drawing = { tool: currentTool, start: p, points: [p] };
}

function onPointerMove(event) {
  const p = pointFromEvent(event);

  if (currentTool === 'select' && !moving && !drawing) {
    getCanvas().style.cursor = findAnnotationAt(p) ? 'grab' : 'default';
  }

  if (moving) {
    getCanvas().style.cursor = 'grabbing';
    const dx = p.x - moving.origin.x;
    const dy = p.y - moving.origin.y;
    const original = moving.annotation;
    const patch = shiftAnnotation(original, dx, dy);
    store.updateAnnotation(moving.id, patch, { silent: true });
    return;
  }

  if (!drawing) return;
  if (drawing.tool === 'pen' || drawing.tool === 'highlighter') {
    drawing.points.push(p);
  } else {
    drawing.end = p;
  }
  // Render temporal en el documento como anotación provisional.
  updateTemporary();
}

function cancelPointerGesture() {
  if (!moving && !drawing && !transformGesture) return;
  moving = null;
  drawing = null;
  transformGesture = null;
  removeTemporary();
  history.cancelGesture();
  getCanvas().style.cursor = currentTool === 'select' ? 'default' : 'crosshair';
}

function onPointerUp(event) {
  if (moving) {
    moving = null;
    getCanvas().style.cursor = 'grab';
    history.commitGesture();
    return;
  }
  if (!drawing) return;

  const temp = buildAnnotation(drawing);
  removeTemporary();
  if (temp) store.addAnnotation(temp);
  else history.commitGesture();
  drawing = null;
}

function updateTemporary() {
  const temporary = buildAnnotation(drawing, '__temporary__');
  const annotations = store.getState().annotations.filter((a) => a.id !== '__temporary__');
  store.update({ annotations: temporary ? [...annotations, temporary] : annotations }, { silent: true });
}

function removeTemporary() {
  if (store.getState().annotations.some((a) => a.id === '__temporary__')) {
    store.update({ annotations: store.getState().annotations.filter((a) => a.id !== '__temporary__') }, { silent: true });
  }
}

function buildAnnotation(draft, id = nextId()) {
  if (!draft) return null;
  const { tool, start } = draft;
  const end = draft.end || start;
  const w = end.x - start.x;
  const h = end.y - start.y;

  if (tool === 'pen' || tool === 'highlighter') {
    if (draft.points.length < 2) return null;
    const points = draft.points;
    return {
      id,
      type: tool,
      points,
      bounds: getPointsBounds(points),
      color: DEFAULT_COLOR,
      strokeWidth: tool === 'pen' ? 4 : 22
    };
  }

  if (Math.abs(w) < 3 && Math.abs(h) < 3) return null;
  if (tool === 'arrow') return { id, type: 'arrow', x: start.x, y: start.y, x2: end.x, y2: end.y, color: DEFAULT_COLOR, strokeWidth: 4 };
  if (tool === 'rect' || tool === 'ellipse' || tool === 'pixelate' || tool === 'blur') {
    return {
      id,
      type: tool,
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(w),
      height: Math.abs(h),
      ...(tool === 'rect' || tool === 'ellipse' ? { color: DEFAULT_COLOR, strokeWidth: 4 } : {}),
      strength: tool === 'pixelate' ? 12 : 14
    };
  }
  return null;
}

function findAnnotationAt(p) {
  const annotations = [...store.getState().annotations].reverse();
  return annotations.find((a) => {
    if (a.type === 'number') return Math.hypot(p.x - a.x, p.y - a.y) <= (a.radius || 18) + 6;
    if (a.type === 'text') return p.x >= a.x && p.x <= a.x + a.text.length * (a.fontSize || 24) && p.y >= a.y && p.y <= a.y + (a.fontSize || 24) * 1.4;
    if (a.type === 'emoji') {
      const size = a.fontSize || 48;
      return p.x >= a.x && p.x <= a.x + size && p.y >= a.y && p.y <= a.y + size;
    }
    const box = getAnnotationBox(a);
    return box && p.x >= box.x - 8 && p.x <= box.x + box.width + 8 && p.y >= box.y - 8 && p.y <= box.y + box.height + 8;
  });
}

function drawSelection(ctx, annotation) {
  let box = getAnnotationBox(annotation);

  if (annotation.type === 'number') {
    const radius = annotation.radius || 18;
    box = { x: annotation.x - radius, y: annotation.y - radius, width: radius * 2, height: radius * 2 };
  } else if (annotation.type === 'text') {
    const fontSize = annotation.fontSize || 24;
    box = { x: annotation.x, y: annotation.y, width: Math.max(50, annotation.text.length * fontSize * .62), height: fontSize * 1.3 };
  } else if (annotation.type === 'emoji') {
    const fontSize = annotation.fontSize || 48;
    box = { x: annotation.x, y: annotation.y, width: fontSize, height: fontSize };
  }

  if (!box) return;
  ctx.save();
  ctx.strokeStyle = '#5eead4';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(box.x - 6, box.y - 6, Math.max(12, box.width + 12), Math.max(12, box.height + 12));
  ctx.restore();
}

function getAnnotationBox(a) {
  if (a.type === 'arrow') return { x: Math.min(a.x, a.x2), y: Math.min(a.y, a.y2), width: Math.max(1, Math.abs(a.x2 - a.x)), height: Math.max(1, Math.abs(a.y2 - a.y)) };
  if (a.type === 'pen' || a.type === 'highlighter') return a.bounds || getPointsBounds(a.points || []);
  if (a.type === 'number') {
    const radius = a.radius || 18;
    return { x: a.x - radius, y: a.y - radius, width: radius * 2, height: radius * 2 };
  }
  if (a.type === 'text') {
    const size = a.fontSize || 24;
    return { x: a.x, y: a.y, width: Math.max(50, a.text.length * size * .62), height: size * 1.3 };
  }
  if (a.type === 'emoji') {
    const size = a.fontSize || 48;
    return { x: a.x, y: a.y, width: size, height: size };
  }
  if ('width' in a) return { x: a.x, y: a.y, width: a.width, height: a.height };
  return null;
}

function getPointsBounds(points) {
  if (!points.length) return null;
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  points.slice(1).forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function shiftAnnotation(a, dx, dy) {
  if (a.type === 'arrow') return { x: a.x + dx, y: a.y + dy, x2: a.x2 + dx, y2: a.y2 + dy };
  if (a.type === 'pen' || a.type === 'highlighter') {
    return {
      points: a.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      bounds: a.bounds && { x: a.bounds.x + dx, y: a.bounds.y + dy, width: a.bounds.width, height: a.bounds.height }
    };
  }
  return { x: a.x + dx, y: a.y + dy };
}
