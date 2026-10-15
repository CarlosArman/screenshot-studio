// app.js
// Punto de entrada de Screenshot Studio. Conecta interfaz, estado, renderizado,
// importación, anotaciones, historial y exportación sin frameworks ni backend.

import { store, nextId } from './store.js';
import { history } from './history.js';
import { changeZoom, initCanvasEditor, resetZoom, ZOOM_STEP } from './canvas-editor.js';
import { initAnnotations, setTool } from './annotations.js';
import { initImageImport } from './image-import.js';
import { initScreenCapture } from './screen-capture.js';
import { initCropControls } from './crop.js';
import { downloadExport, copyExport, syncExportAvailability } from './export.js';

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
  arrow: 'Flecha: arrastra sobre la captura para dibujar una flecha.',
  rect: 'Rectángulo: arrastra sobre la captura para marcar una zona.',
  ellipse: 'Círculo: arrastra sobre la captura para resaltar una zona.',
  pen: 'Pincel: arrastra sobre la captura para dibujar libremente.',
  highlighter: 'Resaltador: arrastra sobre la captura para destacar contenido.',
  blur: 'Privacidad: arrastra sobre la captura para ocultar información.'
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
  document.getElementById('deleteBtn').addEventListener('click', () => {
    const selected = store.getSelected();
    if (!selected) {
      updateToolHint('select');
      document.getElementById('toolHint').value = 'Eliminar: primero selecciona una anotación (texto, flecha, figura o número).';
      return;
    }
    store.removeAnnotation(selected.id);
    document.getElementById('toolHint').value = 'Anotación eliminada. Selecciona otra anotación para editarla o moverla.';
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

const BACKGROUND_PRESETS = {
  aurora: ['#7c3aed', '#22d3ee'],
  sunset: ['#f43f5e', '#f59e0b'],
  ocean: ['#0f766e', '#2563eb'],
  berry: ['#86198f', '#ec4899'],
  midnight: ['#0f172a', '#312e81'],
  lime: ['#84cc16', '#14b8a6']
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
  const base = { id: nextId(), type, color: '#ef4444' };
  const origin = { x: 80, y: 80 };
  const size = { width: 180, height: 100 };

  if (type === 'text') return { ...base, ...origin, text: 'Texto', fontSize: 24 };
  if (type === 'number') {
    const count = store.getState().annotations.filter((annotation) => annotation.type === 'number').length + 1;
    return { ...base, ...origin, value: String(count), radius: 18 };
  }
  if (type === 'arrow') return { ...base, ...origin, x2: 260, y2: 160, strokeWidth: 4 };
  if (type === 'blur') return { ...base, ...origin, ...size, strokeWidth: 4 };
  return { ...base, ...origin, ...size, strokeWidth: 4 };
}

function initAccessibleAnnotationControls() {
  document.querySelectorAll('[data-add-annotation]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!store.getState().image) {
        document.getElementById('appStatus').value = 'Carga una imagen antes de crear una anotación.';
        return;
      }
      store.addAnnotation(createAccessibleAnnotation(button.dataset.addAnnotation));
      document.getElementById('appStatus').value = 'Anotación creada. Edita sus propiedades y posición en el panel Propiedades.';
    });
  });
}

function initCompositionControls() {
  const config = [
    ['paddingRange', 'padding'],
    ['radiusRange', 'radius'],
    ['shadowRange', 'shadow'],
    ['scaleRange', 'scale']
  ];

  config.forEach(([id, property]) => {
    const field = document.getElementById(id);
    field.addEventListener('pointerdown', () => history.beginGesture());
    field.addEventListener('input', () => store.updateComposition({ [property]: Number(field.value) }));
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
    arrow: 'Flecha',
    rect: 'Rectángulo',
    ellipse: 'Círculo',
    pen: 'Pincel',
    highlighter: 'Resaltador',
    blur: 'Privacidad'
  };
  return labels[annotation.type] || annotation.type;
}

function renderLayers(state) {
  const list = document.getElementById('layersList');
  list.replaceChildren();

  [...state.annotations].reverse().forEach((annotation) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    const isSelected = annotation.id === state.selectedId;

    item.className = isSelected ? 'selected' : '';
    button.type = 'button';
    button.className = 'layer-button';
    button.textContent = annotationLabel(annotation);
    button.setAttribute('aria-pressed', String(isSelected));
    button.addEventListener('click', () => store.select(annotation.id));
    item.appendChild(button);
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

function renderProperties(state) {
  const panel = document.getElementById('propertiesPanel');
  const selected = state.annotations.find((a) => a.id === state.selectedId);

  if (!selected) {
    panel.dataset.selectedId = '';
    panel.className = 'properties-empty';
    panel.textContent = 'Selecciona un elemento para editar sus propiedades.';
    return;
  }

  if (panel.dataset.selectedId === selected.id && panel.contains(document.activeElement)) {
    return;
  }

  panel.dataset.selectedId = selected.id;
  panel.className = '';
  panel.replaceChildren();

  if ('x' in selected && 'y' in selected) {
    const position = document.createElement('div');
    position.className = 'position-controls';
    [['X', selected.x], ['Y', selected.y]].forEach(([label, current]) => {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = Math.round(current);
      input.step = '1';
      input.setAttribute('aria-label', `Posición ${label}`);
      input.addEventListener('focus', () => history.beginGesture());
      input.addEventListener('change', () => {
        const property = label.toLowerCase();
        const nextValue = Number(input.value);
        const delta = nextValue - selected[property];
        let patch = { [property]: nextValue };
        if (selected.type === 'arrow') {
          if (property === 'x') {
            patch = { x: nextValue, x2: selected.x2 + delta };
          } else {
            patch = { y: nextValue, y2: selected.y2 + delta };
          }
        }
        store.updateAnnotation(selected.id, patch, { commit: true });
      });
      position.appendChild(createControl(label, input));
    });
    panel.appendChild(position);
  }

  const color = document.createElement('input');
  color.type = 'color';
  color.value = selected.color || '#ef4444';
  color.addEventListener('input', () => store.updateAnnotation(selected.id, { color: color.value }));
  panel.appendChild(createControl('Color', color));

  if ('strokeWidth' in selected) {
    const stroke = document.createElement('input');
    stroke.type = 'range';
    stroke.min = '1';
    stroke.max = '30';
    stroke.value = selected.strokeWidth;
    stroke.addEventListener('pointerdown', () => history.beginGesture());
    stroke.addEventListener('input', () => store.updateAnnotation(selected.id, { strokeWidth: Number(stroke.value) }));
    stroke.addEventListener('change', () => history.commitGesture());
    panel.appendChild(createControl('Grosor', stroke));
  }

  if (selected.type === 'text') {
    const text = document.createElement('input');
    text.type = 'text';
    text.value = selected.text;
    text.addEventListener('focus', () => history.beginGesture());
    text.addEventListener('input', () => store.updateAnnotation(selected.id, { text: text.value }));
    text.addEventListener('change', () => history.commitGesture());
    panel.appendChild(createControl('Texto', text));

    const fontSize = document.createElement('input');
    fontSize.type = 'range';
    fontSize.min = '12';
    fontSize.max = '96';
    fontSize.value = selected.fontSize || 24;
    fontSize.addEventListener('pointerdown', () => history.beginGesture());
    fontSize.addEventListener('input', () => store.updateAnnotation(selected.id, { fontSize: Number(fontSize.value) }));
    fontSize.addEventListener('change', () => history.commitGesture());
    panel.appendChild(createControl('Tamaño', fontSize));
  }

  if (selected.type === 'number') {
    const value = document.createElement('input');
    value.type = 'text';
    value.value = selected.value;
    value.maxLength = 3;
    value.addEventListener('change', () => store.updateAnnotation(selected.id, { value: value.value }, { commit: true }));
    panel.appendChild(createControl('Número', value));
  }
}

function syncControlValues(state) {
  const deleteButton = document.getElementById('deleteBtn');
  deleteButton.disabled = !state.selectedId;
  deleteButton.title = state.selectedId ? 'Eliminar anotación seleccionada (Supr)' : 'Selecciona una anotación para eliminarla';
  deleteButton.setAttribute('aria-label', deleteButton.title);

  document.getElementById('frameTheme').value = state.frame.theme;
  document.getElementById('frameTitle').value = state.frame.title;
  document.getElementById('bgColor1').value = state.background.color1;
  document.getElementById('bgColor2').value = state.background.color2;
  document.getElementById('paddingRange').value = state.composition.padding;
  document.getElementById('radiusRange').value = state.composition.radius;
  document.getElementById('shadowRange').value = state.composition.shadow;
  document.getElementById('scaleRange').value = state.composition.scale;
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
    if (editing) return;

    const tools = { v: 'select', t: 'text', n: 'number', a: 'arrow', r: 'rect', o: 'ellipse', p: 'pen', h: 'highlighter', b: 'blur' };
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
  initTheme();
  initToolbar();
  initFrameControls();
  initBackgroundControls();
  initAccessibleAnnotationControls();
  initCompositionControls();
  initExportControls();
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
}

boot();
