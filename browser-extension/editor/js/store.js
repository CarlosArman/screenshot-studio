// store.js
// Estado central del documento + patrón observer simple.
// El documento es serializable a JSON para poder implementar
// deshacer/rehacer basado en snapshots y para guardar proyectos.

let idCounter = 1;
export function nextId() {
  return `el_${idCounter++}_${Date.now().toString(36)}`;
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
      scale: 100
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

  select(id) {
    this.state = { ...this.state, selectedId: id };
    this.notify({ silent: true });
  }

  getSelected() {
    return this.state.annotations.find((a) => a.id === this.state.selectedId) || null;
  }

  notify(opts = {}) {
    for (const fn of this.listeners) fn(this.state, opts);
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
