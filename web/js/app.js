// app.js
// Punto de entrada de Screenshot Studio. Conecta interfaz, estado, renderizado,
// importación, anotaciones, historial y exportación sin frameworks ni backend.

import { store, nextId, loadAutoSave } from './store.js';
import { history } from './history.js';
import { changeZoom, initCanvasEditor, resetZoom, ZOOM_STEP } from './canvas-editor.js';
import { initAnnotations, setTool } from './annotations.js';
import { initImageImport } from './image-import.js';
import { initScreenCapture } from './screen-capture.js';
import { initCropControls } from './crop.js';
import { initProjectControls } from './projects.js';
import { downloadExport, copyExport, syncExportAvailability } from './export.js';
import { initShareControls, syncShareAvailability } from './share.js';
import { BAR_HEIGHT } from './browser-frames.js';

// Buffer interno para copiar/pegar anotaciones (no usa el portapapeles del SO)
let annotationClipboard = null;

function selectAll(selector) {
  return [...document.querySelectorAll(selector)];
}

function setActiveChip(container, active) {
  container.querySelectorAll('button').forEach((button) => {
    const isActive = button === active;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

const TOOL_HINTS = {
  select: 'Seleccionar: haz clic en una anotación existente para editarla o arrástrala para moverla.',
  text: 'Texto: haz clic sobre la captura para agregar un texto editable.',
  number: 'Número: haz clic sobre la captura para colocar un indicador numerado.',
  emoji: 'Emoji: haz clic sobre la captura para insertar un emoji editable.',
  arrow: 'Flecha: arrastra sobre la captura para dibujar una flecha.',
  rect: 'Rectángulo: arrastra sobre la captura para marcar una zona.',
  ellipse: 'Círculo: arrastra sobre la captura para resaltar una zona.',
  pen: 'Pincel: arrastra sobre la captura para dibujar libremente.',
  highlighter: 'Resaltador: arrastra sobre la captura para destacar contenido.',
  pixelate: 'Pixelar: arrastra sobre la captura para ocultar información mediante bloques irreversibles.',
  blur: 'Desenfocar: arrastra sobre la captura para ocultar información de forma irreversible.'
};

function updateToolHint(tool) {
  document.getElementById('toolHint').value = TOOL_HINTS[tool];
}

function initTheme() {
  const selector = document.getElementById('appTheme');
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem('screenshot-studio-theme') || 'system';

  const applyTheme = (preference) => {
    let resolvedTheme = preference;
    if (preference === 'system') {
      resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
    }

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = preference;
    document.querySelector('meta[name="theme-color"]').content = resolvedTheme === 'dark' ? '#090b12' : '#edf2ff';
    selector.value = preference;
  };

  applyTheme(savedTheme);
  selector.addEventListener('change', () => {
    localStorage.setItem('screenshot-studio-theme', selector.value);
    applyTheme(selector.value);
  });

  mediaQuery.addEventListener('change', () => {
    if (document.documentElement.dataset.themePreference === 'system') applyTheme('system');
  });
}

function getNextOptionIndex(key, currentIndex, optionCount) {
  if (key === 'Home') return 0;
  if (key === 'End') return optionCount - 1;
  const direction = key === 'ArrowRight' ? 1 : -1;
  return (currentIndex + direction + optionCount) % optionCount;
}

function initToolbar() {
  const toolbar = document.getElementById('toolSelector');
  const tools = selectAll('.tool-btn');

  tools.forEach((button, index) => {
    button.addEventListener('click', () => {
      setActiveChip(toolbar, button);
      setTool(button.dataset.tool);
      updateToolHint(button.dataset.tool);
      syncAccessibleAnnotationButtons(button.dataset.tool);
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = getNextOptionIndex(event.key, index, tools.length);
      tools[nextIndex].focus();
      tools[nextIndex].click();
    });
  });

  document.getElementById('undoBtn').addEventListener('click', () => history.undo());
  document.getElementById('redoBtn').addEventListener('click', () => history.redo());
  document.getElementById('deleteAllBtn').addEventListener('click', () => {
    if (!store.getState().annotations.length) return;
    store.update({ annotations: [], selectedId: null }, { commit: true });
    document.getElementById('toolHint').value = 'Todas las anotaciones fueron eliminadas.';
  });
  document.getElementById('removeImageBtn').addEventListener('click', () => {
    if (!store.getState().image) return;
    store.update({ image: null, annotations: [], selectedId: null }, { commit: true });
    document.getElementById('toolHint').value = 'Imagen eliminada. Agrega una nueva captura para continuar.';
  });
  document.getElementById('exportBtn').addEventListener('click', downloadExport);
}

function initSingleSelectKeyboardNavigation(container, selector) {
  const options = [...container.querySelectorAll(selector)];
  options.forEach((option, index) => {
    option.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = getNextOptionIndex(event.key, index, options.length);
      options[nextIndex].focus();
      options[nextIndex].click();
    });
  });
}

function initFrameControls() {
  const frameSelector = document.getElementById('frameSelector');
  initSingleSelectKeyboardNavigation(frameSelector, '[data-frame]');
  frameSelector.addEventListener('click', (event) => {
    const button = event.target.closest('[data-frame]');
    if (!button) return;
    history.beginGesture();
    store.updateFrame({ type: button.dataset.frame });
    history.commitGesture();
    setActiveChip(frameSelector, button);
  });

  const theme = document.getElementById('frameTheme');
  theme.addEventListener('change', () => {
    history.beginGesture();
    store.updateFrame({ theme: theme.value });
    history.commitGesture();
  });

  const title = document.getElementById('frameTitle');
  title.addEventListener('focus', () => history.beginGesture());
  title.addEventListener('input', () => store.updateFrame({ title: title.value }));
  title.addEventListener('change', () => history.commitGesture());
}

// Mapa de tipo de anotación accesible ↔ herramienta del toolbar
const ANNOTATION_TOOL_MAP = {
  text: 'text',
  number: 'number',
  emoji: 'emoji',
  rect: 'rect',
  arrow: 'arrow',
  ellipse: 'ellipse',
  pen: 'pen',
  highlighter: 'highlighter',
  pixelate: 'pixelate',
  blur: 'blur'
};

function syncAccessibleAnnotationButtons(activeTool) {
  document.querySelectorAll('[data-add-annotation]').forEach((button) => {
    const isActive = ANNOTATION_TOOL_MAP[button.dataset.addAnnotation] === activeTool;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

const BACKGROUND_PRESETS = {
  aurora: ['#7c3aed', '#22d3ee'],
  sunset: ['#f43f5e', '#f59e0b'],
  ocean: ['#0f766e', '#2563eb'],
  berry: ['#86198f', '#ec4899'],
  midnight: ['#0f172a', '#312e81'],
  lime: ['#84cc16', '#14b8a6']
};

const SOCIAL_PRESETS = {
  x: { width: 1600, height: 900 },
  linkedin: { width: 1200, height: 627 },
  instagram: { width: 1080, height: 1080 },
  instagramPortrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 }
};

function initBackgroundControls() {
  const bgSelector = document.getElementById('backgroundSelector');
  initSingleSelectKeyboardNavigation(bgSelector, '[data-bg]');
  bgSelector.addEventListener('click', (event) => {
    const button = event.target.closest('[data-bg]');
    if (!button) return;
    history.beginGesture();
    store.updateBackground({ type: button.dataset.bg });
    history.commitGesture();
    setActiveChip(bgSelector, button);
  });

  document.getElementById('backgroundPresets').addEventListener('click', (event) => {
    const button = event.target.closest('[data-preset]');
    if (!button) return;
    const [color1, color2] = BACKGROUND_PRESETS[button.dataset.preset];
    history.beginGesture();
    store.updateBackground({ type: 'gradient', color1, color2 });
    history.commitGesture();
  });

  ['bgColor1', 'bgColor2'].forEach((id) => {
    const field = document.getElementById(id);
    field.addEventListener('pointerdown', () => history.beginGesture());
    field.addEventListener('input', () => {
      store.updateBackground({ [id === 'bgColor1' ? 'color1' : 'color2']: field.value });
    });
    field.addEventListener('change', () => history.commitGesture());
  });
}

function createAccessibleAnnotation(type) {
  const { composition, frame } = store.getState();
  const padding = composition.padding || 0;
  const barHeight = frame.type === 'none' ? 0 : BAR_HEIGHT;
  const base = { id: nextId(), type, color: '#ef4444' };
  const origin = { x: padding + 16, y: padding + barHeight + 16 };
  const size = { width: 180, height: 100 };

  if (type === 'text') return { ...base, ...origin, text: 'Texto', fontSize: 24 };
  if (type === 'emoji') return { id: nextId(), type: 'emoji', ...origin, emoji: '😀', fontSize: 48 };
  if (type === 'number') {
    const count = store.getState().annotations.filter((annotation) => annotation.type === 'number').length + 1;
    return { ...base, ...origin, value: String(count), radius: 18 };
  }
  if (type === 'arrow') return { ...base, ...origin, x2: origin.x + 180, y2: origin.y + 80, strokeWidth: 4 };
  if (type === 'pen' || type === 'highlighter') {
    const points = [
      { x: origin.x, y: origin.y },
      { x: origin.x + 90, y: origin.y + 40 },
      { x: origin.x + 180, y: origin.y }
    ];
    return {
      ...base,
      type,
      points,
      bounds: { x: origin.x, y: origin.y, width: 180, height: 40 },
      strokeWidth: type === 'highlighter' ? 22 : 4
    };
  }
  if (type === 'pixelate') return { ...base, ...origin, ...size, strength: 12 };
  if (type === 'blur') return { ...base, ...origin, ...size, strength: 14 };
  return { ...base, ...origin, ...size, strokeWidth: 4 };
}

function initAccessibleAnnotationControls() {
  // Los botones de Anotaciones accesibles son selectores de herramienta alternativos.
  // Al hacer clic, activan la herramienta correspondiente en el toolbar
  // (y viceversa, gracias a syncAccessibleAnnotationButtons).
  // La anotación se crea al clicar sobre el canvas con la herramienta activa.
  document.querySelectorAll('[data-add-annotation]').forEach((button) => {
    button.addEventListener('click', () => {
      const toolName = ANNOTATION_TOOL_MAP[button.dataset.addAnnotation];
      if (toolName) {
        const toolButton = document.querySelector(`.tool-btn[data-tool="${toolName}"]`);
        if (toolButton) toolButton.click();
      }
    });
  });
}

function initCompositionControls() {
  const presetSelector = document.getElementById('socialPreset');
  presetSelector.addEventListener('change', () => {
    const preset = SOCIAL_PRESETS[presetSelector.value];
    history.beginGesture();
    store.updateComposition(preset
      ? { preset: presetSelector.value, outputWidth: preset.width, outputHeight: preset.height }
      : { preset: 'free', outputWidth: null, outputHeight: null });
    history.commitGesture();
  });

  const config = [
    ['paddingRange', 'padding'],
    ['radiusRange', 'radius'],
    ['shadowRange', 'shadow'],
    ['scaleRange', 'scale']
  ];

  config.forEach(([id, property]) => {
    const field = document.getElementById(id);
    field.addEventListener('pointerdown', () => history.beginGesture());
    field.addEventListener('input', () => {
      store.updateComposition({ [property]: Number(field.value), preset: 'free', outputWidth: null, outputHeight: null });
    });
    field.addEventListener('change', () => history.commitGesture());
  });
}

function initExportControls() {
  document.getElementById('downloadBtn').addEventListener('click', downloadExport);
  document.getElementById('copyBtn').addEventListener('click', copyExport);
  document.getElementById('exportQuality').addEventListener('input', (event) => {
    document.getElementById('exportQualityValue').value = `${event.target.value}%`;
  });
}

function initZoomControls() {
  document.getElementById('zoomInBtn').addEventListener('click', () => changeZoom(ZOOM_STEP));
  document.getElementById('zoomOutBtn').addEventListener('click', () => changeZoom(-ZOOM_STEP));
  document.getElementById('zoomResetBtn').addEventListener('click', resetZoom);
}

function annotationLabel(annotation) {
  const labels = {
    text: 'Texto',
    number: `Número ${annotation.value}`,
    emoji: `Emoji ${annotation.emoji || '😀'}`,
    arrow: 'Flecha',
    rect: 'Rectángulo',
    ellipse: 'Círculo',
    pen: 'Pincel',
    highlighter: 'Resaltador',
    pixelate: 'Pixelado',
    blur: 'Desenfoque'
  };
  return labels[annotation.type] || annotation.type;
}

function renderLayers(state) {
  const list = document.getElementById('layersList');
  list.replaceChildren();

  const reversed = [...state.annotations].reverse();
  reversed.forEach((annotation, reversedIndex) => {
    // reversed[0] = último en la pila (arriba visualmente); +1 = subir en pila
    const originalIndex = state.annotations.length - 1 - reversedIndex;
    const item = document.createElement('li');
    const button = document.createElement('button');
    const isSelected = annotation.id === state.selectedId;

    item.className = isSelected ? 'selected' : '';
    button.type = 'button';
    button.className = 'layer-button';
    button.textContent = annotationLabel(annotation);
    button.setAttribute('aria-pressed', String(isSelected));
    button.addEventListener('click', () => store.select(annotation.id));

    // Botones de reorden
    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'layer-order-btn';
    upBtn.textContent = '↑';
    upBtn.title = 'Subir capa';
    upBtn.setAttribute('aria-label', 'Subir capa');
    upBtn.disabled = originalIndex === state.annotations.length - 1;
    upBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      store.moveAnnotation(annotation.id, 1);
    });

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'layer-order-btn';
    downBtn.textContent = '↓';
    downBtn.title = 'Bajar capa';
    downBtn.setAttribute('aria-label', 'Bajar capa');
    downBtn.disabled = originalIndex === 0;
    downBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      store.moveAnnotation(annotation.id, -1);
    });

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'layer-remove-btn';
    removeButton.textContent = '×';
    removeButton.title = `Eliminar ${annotationLabel(annotation)}`;
    removeButton.setAttribute('aria-label', removeButton.title);
    removeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      store.removeAnnotation(annotation.id);
      document.getElementById('toolHint').value = 'Anotación eliminada.';
    });

    item.append(button, upBtn, downBtn, removeButton);
    list.appendChild(item);
  });

  if (!state.annotations.length) {
    const item = document.createElement('li');
    item.textContent = 'Sin anotaciones';
    list.appendChild(item);
  }
}

function createControl(label, element) {
  const row = document.createElement('label');
  row.className = 'field-row';
  const text = document.createElement('span');
  text.textContent = label;
  row.append(text, element);
  return row;
}

function appendRangeControl(panel, label, annotation, property, min, max, fallback) {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.value = annotation[property] || fallback;
  input.addEventListener('pointerdown', () => history.beginGesture());
  input.addEventListener('input', () => store.updateAnnotation(annotation.id, { [property]: Number(input.value) }));
  input.addEventListener('change', () => history.commitGesture());
  panel.appendChild(createControl(label, input));
}

function appendPositionControls(panel, annotation) {
  if (!('x' in annotation && 'y' in annotation)) return;
  const position = document.createElement('div');
  position.className = 'position-controls';
  [['X', annotation.x], ['Y', annotation.y]].forEach(([label, current]) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = Math.round(current);
    input.step = '1';
    input.setAttribute('aria-label', `Posición ${label}`);
    input.addEventListener('focus', () => history.beginGesture());
    input.addEventListener('change', () => updateAnnotationPosition(annotation, label.toLowerCase(), Number(input.value)));
    position.appendChild(createControl(label, input));
  });
  panel.appendChild(position);
}

function updateAnnotationPosition(annotation, property, nextValue) {
  const delta = nextValue - annotation[property];
  let patch = { [property]: nextValue };

  if (annotation.type === 'arrow') {
    patch = property === 'x'
      ? { x: nextValue, x2: annotation.x2 + delta }
      : { y: nextValue, y2: annotation.y2 + delta };
  }

  store.updateAnnotation(annotation.id, patch, { commit: true });
}

function appendColorControl(panel, annotation) {
  if (annotation.type === 'emoji') return;
  const color = document.createElement('input');
  color.type = 'color';
  color.value = annotation.color || '#ef4444';
  color.addEventListener('input', () => store.updateAnnotation(annotation.id, { color: color.value }));
  panel.appendChild(createControl('Color', color));

  // Relleno (rect y ellipse)
  if (annotation.type === 'rect' || annotation.type === 'ellipse') {
    const fillWrapper = document.createElement('div');
    fillWrapper.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const fill = document.createElement('input');
    fill.type = 'color';
    fill.value = annotation.fill && annotation.fill !== 'transparent' ? annotation.fill : '#000000';
    fill.addEventListener('input', () => store.updateAnnotation(annotation.id, { fill: fill.value }));
    const none = document.createElement('button');
    none.type = 'button';
    none.className = 'secondary-btn';
    none.style.cssText = 'min-height:28px;padding:3px 8px;font-size:11px;flex:0 0 auto;';
    none.textContent = 'Sin relleno';
    none.addEventListener('click', () => {
      fill.value = '#000000';
      store.updateAnnotation(annotation.id, { fill: 'transparent' }, { commit: true });
    });
    fillWrapper.append(fill, none);
    panel.appendChild(createControl('Relleno', fillWrapper));
  }
}

function appendEmojiControls(panel, annotation) {
  if (annotation.type !== 'emoji') return;
  const emoji = document.createElement('select');
  ['😀', '😍', '😂', '🔥', '🚀', '✅', '💡', '🎉', '⚠️', '💬', '👋', '❤️'].forEach((value) => emoji.add(new Option(value, value)));
  emoji.value = annotation.emoji || '😀';
  emoji.setAttribute('aria-label', 'Emoji');
  emoji.addEventListener('change', () => store.updateAnnotation(annotation.id, { emoji: emoji.value }, { commit: true }));
  panel.appendChild(createControl('Emoji', emoji));
  appendRangeControl(panel, 'Tamaño', annotation, 'fontSize', 20, 160, 48);
}

function appendTextControls(panel, annotation) {
  if (annotation.type !== 'text') return;
  const text = document.createElement('input');
  text.type = 'text';
  text.value = annotation.text;
  text.addEventListener('focus', () => history.beginGesture());
  text.addEventListener('input', () => store.updateAnnotation(annotation.id, { text: text.value }));
  text.addEventListener('change', () => history.commitGesture());
  panel.appendChild(createControl('Texto', text));
  appendRangeControl(panel, 'Tamaño', annotation, 'fontSize', 12, 96, 24);
}

function appendNumberControl(panel, annotation) {
  if (annotation.type !== 'number') return;
  const value = document.createElement('input');
  value.type = 'text';
  value.value = annotation.value;
  value.maxLength = 3;
  value.addEventListener('change', () => store.updateAnnotation(annotation.id, { value: value.value }, { commit: true }));
  panel.appendChild(createControl('Número', value));
}

function appendPrivacyControl(panel, annotation) {
  if (!['pixelate', 'blur'].includes(annotation.type)) return;
  const isPixelate = annotation.type === 'pixelate';
  appendRangeControl(panel, isPixelate ? 'Tamaño de píxel' : 'Intensidad', annotation, 'strength', isPixelate ? 4 : 2, 40, isPixelate ? 12 : 14);
}

function renderProperties(state) {
  const panel = document.getElementById('propertiesPanel');
  const selected = state.annotations.find((annotation) => annotation.id === state.selectedId);
  if (!selected) {
    panel.dataset.selectedId = '';
    panel.className = 'properties-empty';
    panel.textContent = 'Selecciona un elemento para editar sus propiedades.';
    return;
  }
  if (panel.dataset.selectedId === selected.id && panel.contains(document.activeElement)) return;

  panel.dataset.selectedId = selected.id;
  panel.className = '';
  panel.replaceChildren();
  appendPositionControls(panel, selected);
  appendColorControl(panel, selected);
  if (['arrow', 'rect', 'ellipse', 'pen', 'highlighter'].includes(selected.type)) {
    appendRangeControl(panel, 'Grosor', selected, 'strokeWidth', 1, 30, selected.type === 'highlighter' ? 22 : 4);
  }
  appendEmojiControls(panel, selected);
  appendTextControls(panel, selected);
  appendNumberControl(panel, selected);
  appendPrivacyControl(panel, selected);
  // Opacidad disponible para todos los tipos excepto efectos de privacidad
  if (!['pixelate', 'blur'].includes(selected.type)) {
    appendRangeControl(panel, 'Opacidad', selected, 'opacity', 0, 1, selected.opacity ?? 1);
  }
}

function syncControlValues(state) {
  const deleteAllButton = document.getElementById('deleteAllBtn');
  const hasAnnotations = state.annotations.length > 0;
  deleteAllButton.disabled = !hasAnnotations;
  deleteAllButton.setAttribute('aria-disabled', String(!hasAnnotations));

  const removeImageButton = document.getElementById('removeImageBtn');
  removeImageButton.disabled = !state.image;
  removeImageButton.setAttribute('aria-disabled', String(!state.image));

  document.getElementById('frameTheme').value = state.frame.theme;
  document.getElementById('frameTitle').value = state.frame.title;
  document.getElementById('bgColor1').value = state.background.color1;
  document.getElementById('bgColor2').value = state.background.color2;
  document.getElementById('paddingRange').value = state.composition.padding;
  document.getElementById('radiusRange').value = state.composition.radius;
  document.getElementById('shadowRange').value = state.composition.shadow;
  document.getElementById('scaleRange').value = state.composition.scale;
  document.getElementById('socialPreset').value = state.composition.preset || 'free';
  document.getElementById('paddingValue').value = `${state.composition.padding} px`;
  document.getElementById('radiusValue').value = `${state.composition.radius} px`;
  document.getElementById('shadowValue').value = `${state.composition.shadow}%`;
  document.getElementById('scaleValue').value = `${state.composition.scale}%`;
  document.getElementById('exportQualityValue').value = `${document.getElementById('exportQuality').value}%`;

  document.querySelectorAll('[data-frame]').forEach((button) => {
    const isActive = button.dataset.frame === state.frame.type;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  document.querySelectorAll('[data-bg]').forEach((button) => {
    const isActive = button.dataset.bg === state.background.type;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  syncExportAvailability(Boolean(state.image));
  syncShareAvailability(Boolean(state.image));
}

function duplicateSelected() {
  const selected = store.getSelected();
  if (!selected) return;
  const clone = structuredClone(selected);
  clone.id = nextId();
  // Desplaza el duplicado para hacerlo visible
  const OFFSET = 16;
  if ('x' in clone) clone.x += OFFSET;
  if ('y' in clone) clone.y += OFFSET;
  if ('x2' in clone) { clone.x2 += OFFSET; clone.y2 += OFFSET; }
  if (clone.points) clone.points = clone.points.map((p) => ({ x: p.x + OFFSET, y: p.y + OFFSET }));
  if (clone.bounds) clone.bounds = { ...clone.bounds, x: clone.bounds.x + OFFSET, y: clone.bounds.y + OFFSET };
  store.addAnnotation(clone);
  document.getElementById('toolHint').value = 'Anotación duplicada.';
}

function moveSelected(dx, dy) {
  const selected = store.getSelected();
  if (!selected) return;
  history.beginGesture();
  const patch = {};
  if ('x' in selected) patch.x = selected.x + dx;
  if ('y' in selected) patch.y = selected.y + dy;
  if ('x2' in selected) { patch.x2 = selected.x2 + dx; patch.y2 = selected.y2 + dy; }
  if (selected.points) {
    patch.points = selected.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    if (selected.bounds) patch.bounds = { ...selected.bounds, x: selected.bounds.x + dx, y: selected.bounds.y + dy };
  }
  store.updateAnnotation(selected.id, patch);
  history.commitGesture();
}

function initKeyboardShortcuts() {
  window.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement?.tagName;
    const editing = activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA';

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? history.redo() : history.undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      history.redo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      if (!editing && store.getState().selectedId) {
        const selected = store.getSelected();
        if (selected) {
          annotationClipboard = structuredClone(selected);
          document.getElementById('toolHint').value = 'Anotación copiada. Usa Ctrl+V para pegarla.';
        }
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      if (!editing && annotationClipboard) {
        const clone = structuredClone(annotationClipboard);
        clone.id = nextId();
        const OFFSET = 16;
        if ('x' in clone) clone.x += OFFSET;
        if ('y' in clone) clone.y += OFFSET;
        if ('x2' in clone) { clone.x2 += OFFSET; clone.y2 += OFFSET; }
        if (clone.points) clone.points = clone.points.map((p) => ({ x: p.x + OFFSET, y: p.y + OFFSET }));
        if (clone.bounds) clone.bounds = { ...clone.bounds, x: clone.bounds.x + OFFSET, y: clone.bounds.y + OFFSET };
        store.addAnnotation(clone);
        document.getElementById('toolHint').value = 'Anotación pegada.';
        // No consumir el evento para que image-import.js siga recibiendo paste de imágenes
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      if (!editing) {
        event.preventDefault();
        duplicateSelected();
      }
      return;
    }
    if (event.ctrlKey || event.metaKey) return;
    if (!editing && event.key === 'Escape') {
      event.preventDefault();
      history.cancelGesture();
      store.select(null);
      document.querySelector('.tool-btn[data-tool="select"]')?.click();
      document.getElementById('toolHint').value = 'Selección cancelada. Haz clic en una anotación para editarla o arrástrala para moverla.';
      return;
    }
    if (!editing && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault();
      store.removeSelected();
      return;
    }
    // Mover anotación con teclas de flecha (1 px; 10 px con Shift)
    if (!editing && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      if (store.getState().selectedId) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        moveSelected(dx, dy);
      }
      return;
    }
    if (editing) return;

    const tools = {
      v: 'select', t: 'text', n: 'number', e: 'emoji', a: 'arrow', r: 'rect',
      o: 'ellipse', p: 'pen', h: 'highlighter', x: 'pixelate', b: 'blur'
    };
    const tool = tools[event.key.toLowerCase()];
    if (tool) {
      event.preventDefault();
      document.querySelector(`.tool-btn[data-tool="${tool}"]`)?.click();
    }
  });
}

function initPanelToggles() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupToggle(panelId, btnId, collapseKey, collapseChar, expandChar, isRight) {
    const panel = document.getElementById(panelId);
    const btn = document.getElementById(btnId);
    const collapsed = localStorage.getItem(collapseKey) === 'true';

    const apply = (collapse, animate) => {
      if (!animate || reducedMotion) panel.style.transition = 'none';
      panel.classList.toggle('collapsed', collapse);
      const panelSide = isRight ? 'derecho' : 'izquierdo';
      const actionLabel = collapse ? 'Expandir' : 'Contraer';

      btn.textContent = collapse ? expandChar : collapseChar;
      btn.setAttribute('aria-expanded', String(!collapse));
      btn.setAttribute('aria-label', `${actionLabel} panel ${panelSide}`);
      if (!animate || reducedMotion) requestAnimationFrame(() => { panel.style.transition = ''; });
    };

    apply(collapsed, false);
    btn.addEventListener('click', () => {
      const next = !panel.classList.contains('collapsed');
      localStorage.setItem(collapseKey, String(next));
      apply(next, true);
    });
  }

  setupToggle('panelLeft', 'toggleLeft', 'ss-panel-left-collapsed', '‹', '›', false);
  setupToggle('panelRight', 'toggleRight', 'ss-panel-right-collapsed', '›', '‹', true);
}

function boot() {
  initCanvasEditor();
  initAnnotations();
  initImageImport();
  initScreenCapture();
  initCropControls();
  initProjectControls();
  initTheme();
  initToolbar();
  initFrameControls();
  initBackgroundControls();
  initAccessibleAnnotationControls();
  initCompositionControls();
  initExportControls();
  initShareControls();
  initZoomControls();
  initKeyboardShortcuts();
  initPanelToggles();

  store.subscribe((state) => {
    renderLayers(state);
    renderProperties(state);
    syncControlValues(state);
  });

  const initialState = store.getState();
  renderLayers(initialState);
  renderProperties(initialState);
  syncControlValues(initialState);
  updateToolHint('select');

  // Restaurar sesión auto-guardada al iniciar
  const saved = loadAutoSave();
  if (saved) {
    const hasContent = saved.annotations?.length > 0
      || saved.frame?.type !== 'macos'
      || saved.background?.type !== 'gradient'
      || saved.image;
    if (hasContent) {
      store.update({ ...saved, selectedId: null }, { silent: true });
      const msg = saved.image
        ? 'Sesión anterior restaurada. Continúa donde lo dejaste.'
        : 'Configuración de sesión anterior restaurada. Vuelve a importar la imagen para continuar.';
      document.getElementById('toolHint').value = msg;
    }
  }
}

boot();
