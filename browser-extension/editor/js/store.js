// store.js
// Estado central del documento + patrón observer simple.
// El documento es serializable a JSON para poder implementar
// deshacer/rehacer basado en snapshots y para guardar proyectos.

let idCounter = 1;
export function nextId() {
  return `el_${idCounter++}_${Date.now().toString(36)}`;
}

// ── Auto-guardado en localStorage ────────────────────────────
const AUTO_SAVE_KEY = 'screenshot-studio-autosave';
const AUTO_SAVE_DELAY = 1500;
let autoSaveTimer = null;

function scheduleAutoSave(state) {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    try {
      const { image, ...rest } = state;
      // Si la imagen ya es una Data URL (ej: cargada desde proyecto) se guarda
      // completa. Las Object URLs (blob:) no sobreviven entre sesiones, así que
      // solo guardamos los metadatos para restaurarlos con una nueva importación.
      const portableImage = image?.src?.startsWith('data:') ? image : null;
      const payload = {
        version: 1,
        savedAt: new Date().toISOString(),
        document: { ...rest, image: portableImage }
      };
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(payload));
    } catch {
      // QuotaExceededError u otros — se ignora silenciosamente
    }
  }, AUTO_SAVE_DELAY);
}

/** Devuelve el documento auto-guardado o null si no existe / es inválido. */
export function loadAutoSave() {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (payload?.version !== 1 || !payload?.document) return null;
    return payload.document;
  } catch {
    return null;
  }
}

/** Borra el auto-guardado actual (p.ej. al cargar un proyecto explícito). */
export function clearAutoSave() {
  try { localStorage.removeItem(AUTO_SAVE_KEY); } catch { /* ignorar */ }
}

export function createDefaultDocument() {
  return {
    image: null, // { src, width, height }
    frame: {
      type: 'macos', // 'none' | 'macos' | 'windows' | 'browser'
      theme: 'light', // 'light' | 'dark'
      title: 'miapp.com'
    },
    background: {
      type: 'gradient', // 'solid' | 'gradient' | 'transparent'
      color1: '#6366f1',
      color2: '#06b6d4'
    },
    composition: {
      padding: 64,
      radius: 12,
      shadow: 40,
      scale: 100,
      preset: 'free',
      outputWidth: null,
      outputHeight: null
    },
    annotations: [], // lista de capas de anotación
    selectedId: null
  };
}

class Store {
  constructor() {
    this.state = createDefaultDocument();
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  /** Reemplaza el estado completo (usado por history.js) */
  setState(newState, opts = {}) {
    this.state = newState;
    this.notify(opts);
  }

  /** Actualiza el estado mediante un mutador superficial (merge) */
  update(patch, opts = {}) {
    this.state = { ...this.state, ...patch };
    this.notify(opts);
  }

  updateComposition(patch) {
    this.state = { ...this.state, composition: { ...this.state.composition, ...patch } };
    this.notify();
  }

  updateFrame(patch) {
    this.state = { ...this.state, frame: { ...this.state.frame, ...patch } };
    this.notify();
  }

  updateBackground(patch) {
    this.state = { ...this.state, background: { ...this.state.background, ...patch } };
    this.notify();
  }

  setImage(image) {
    this.state = { ...this.state, image };
    this.notify({ commit: true });
  }

  addAnnotation(annotation) {
    this.state = {
      ...this.state,
      annotations: [...this.state.annotations, annotation],
      selectedId: annotation.id
    };
    this.notify({ commit: true });
  }

  updateAnnotation(id, patch, opts = {}) {
    this.state = {
      ...this.state,
      annotations: this.state.annotations.map((a) => (a.id === id ? { ...a, ...patch } : a))
    };
    this.notify(opts);
  }

  removeAnnotation(id) {
    this.state = {
      ...this.state,
      annotations: this.state.annotations.filter((a) => a.id !== id),
      selectedId: this.state.selectedId === id ? null : this.state.selectedId
    };
    this.notify({ commit: true });
  }

  removeSelected() {
    if (!this.state.selectedId) return;
    this.removeAnnotation(this.state.selectedId);
  }

  /** Mueve una anotación una posición hacia arriba (+1) o abajo (-1) en la pila. */
  moveAnnotation(id, direction) {
    const annotations = [...this.state.annotations];
    const index = annotations.findIndex((a) => a.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= annotations.length) return;
    [annotations[index], annotations[target]] = [annotations[target], annotations[index]];
    this.state = { ...this.state, annotations };
    this.notify({ commit: true });
  }

  select(id) {
    this.state = { ...this.state, selectedId: id };
    this.notify({ silent: true });
  }

  getSelected() {
    return this.state.annotations.find((a) => a.id === this.state.selectedId) || null;
  }

  notify(opts = {}) {
    for (const fn of this.listeners) fn(this.state, opts);
    if (!opts.silent) scheduleAutoSave(this.state);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Clona el documento para historial sin duplicar la cadena binaria de la imagen. */
  snapshot() {
    const { image, ...documentState } = this.state;
    return { ...structuredClone(documentState), image };
  }
}

export const store = new Store();
