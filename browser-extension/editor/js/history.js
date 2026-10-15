// history.js
// Historial por snapshots del documento. La imagen se conserva como referencia:
// no se clona el binario/Base64 en cada paso de deshacer.

import { store } from './store.js';

const MAX_HISTORY = 60;

function sameSnapshot(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

class History {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.lastSnapshot = store.snapshot();
    this.gestureStart = null;
    this.applying = false;

    store.subscribe((state, opts = {}) => {
      if (this.applying) return;
      if (opts.commit) this.commitCurrentChange();
      this.updateButtons();
    });

    this.updateButtons();
  }

  push(snapshot) {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
  }

  commitCurrentChange() {
    const current = store.snapshot();
    if (!sameSnapshot(this.lastSnapshot, current)) {
      this.push(this.lastSnapshot);
      this.lastSnapshot = current;
      this.redoStack = [];
    }
  }

  beginGesture() {
    if (!this.gestureStart) this.gestureStart = store.snapshot();
  }

  commitGesture() {
    if (!this.gestureStart) return;
    const current = store.snapshot();
    if (!sameSnapshot(this.gestureStart, current)) {
      this.push(this.gestureStart);
      this.lastSnapshot = current;
      this.redoStack = [];
    }
    this.gestureStart = null;
    this.updateButtons();
  }

  cancelGesture() {
    if (!this.gestureStart) return;
    const snapshot = this.gestureStart;
    this.gestureStart = null;
    this.applying = true;
    store.setState(snapshot, { silent: true });
    this.applying = false;
    this.lastSnapshot = store.snapshot();
    this.updateButtons();
  }

  undo() {
    this.cancelGesture();
    if (this.undoStack.length === 0) return;
    const prev = this.undoStack.pop();
    this.redoStack.push(store.snapshot());
    this.applying = true;
    store.setState(prev);
    this.applying = false;
    this.lastSnapshot = store.snapshot();
    this.updateButtons();
  }

  redo() {
    this.cancelGesture();
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop();
    this.undoStack.push(store.snapshot());
    this.applying = true;
    store.setState(next);
    this.applying = false;
    this.lastSnapshot = store.snapshot();
    this.updateButtons();
  }

  updateButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
  }
}

export const history = new History();
