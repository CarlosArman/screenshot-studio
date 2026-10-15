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

const DEFAULT_COLOR = '#ef4444';

export function initAnnotations() {
  const canvas = getCanvas();
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', () => {
    if (!moving && !drawing && currentTool === 'select') canvas.style.cursor = 'default';
  });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', cancelPointerGesture);
}

export function setTool(tool) {
  currentTool = tool;
  const canvas = getCanvas();
  canvas.style.cursor = tool === 'select' ? 'default' : 'crosshair';
}

export function drawAnnotationsOnContext(ctx, annotations) {
  // Las máscaras de privacidad deben procesar los píxeles de la composición
  // antes de dibujar anotaciones decorativas que podrían quedar encima.
  annotations
    .filter((annotation) => annotation.type === 'blur')
    .forEach((annotation) => drawPixelatedRegion(ctx, annotation));

  annotations
    .filter((annotation) => annotation.type !== 'blur')
    .forEach((annotation) => drawAnnotation(ctx, annotation));

  const selected = store.getSelected();
  if (selected) drawSelection(ctx, selected);
}

function drawAnnotation(ctx, a) {
  ctx.save();
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

function drawPixelatedRegion(ctx, annotation, pixelSize = 12) {
  const canvas = ctx.canvas;
  const coordinateScale = ctx.getTransform().a || 1;
  const x = Math.max(0, Math.floor(annotation.x));
  const y = Math.max(0, Math.floor(annotation.y));
  const right = Math.min(canvas.width / coordinateScale, Math.ceil(annotation.x + annotation.width));
  const bottom = Math.min(canvas.height / coordinateScale, Math.ceil(annotation.y + annotation.height));
  const width = right - x;
  const height = bottom - y;

  if (width < 1 || height < 1) return;

  const sourceX = Math.floor(x * coordinateScale);
  const sourceY = Math.floor(y * coordinateScale);
  const sourceWidth = Math.ceil(width * coordinateScale);
  const sourceHeight = Math.ceil(height * coordinateScale);
  const source = document.createElement('canvas');
  source.width = sourceWidth;
  source.height = sourceHeight;
  const sourceCtx = source.getContext('2d', { alpha: false });
  sourceCtx.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

  const reduced = document.createElement('canvas');
  reduced.width = Math.max(1, Math.ceil(sourceWidth / pixelSize));
  reduced.height = Math.max(1, Math.ceil(sourceHeight / pixelSize));
  const reducedCtx = reduced.getContext('2d', { alpha: false });
  reducedCtx.imageSmoothingEnabled = false;
  reducedCtx.drawImage(source, 0, 0, reduced.width, reduced.height);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(reduced, 0, 0, reduced.width, reduced.height, x, y, width, height);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
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
  if (!moving && !drawing) return;
  moving = null;
  drawing = null;
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
  if (tool === 'rect' || tool === 'ellipse' || tool === 'blur') {
    return { id, type: tool, x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(w), height: Math.abs(h), color: DEFAULT_COLOR, strokeWidth: 4 };
  }
  return null;
}

function findAnnotationAt(p) {
  const annotations = [...store.getState().annotations].reverse();
  return annotations.find((a) => {
    if (a.type === 'number') return Math.hypot(p.x - a.x, p.y - a.y) <= (a.radius || 18) + 6;
    if (a.type === 'text') return p.x >= a.x && p.x <= a.x + a.text.length * (a.fontSize || 24) && p.y >= a.y && p.y <= a.y + (a.fontSize || 24) * 1.4;
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
  if (a.type === 'arrow') return { x: Math.min(a.x, a.x2), y: Math.min(a.y, a.y2), width: Math.abs(a.x2 - a.x), height: Math.abs(a.y2 - a.y) };
  if (a.type === 'pen' || a.type === 'highlighter') {
    return a.bounds || getPointsBounds(a.points || []);
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
