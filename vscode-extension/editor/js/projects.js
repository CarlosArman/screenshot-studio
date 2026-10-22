// projects.js
// Guardado y carga de proyectos locales portables. El JSON incorpora la imagen
// como Data URL para que el archivo pueda abrirse sin depender de Object URLs.

import { history } from './history.js';
import { store } from './store.js';
import { reportStatus } from './status.js';

const PROJECT_VERSION = 1;
const PROJECT_MIME = 'application/json';
const MAX_PROJECT_BYTES = 25 * 1024 * 1024;

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo preparar la imagen del proyecto.'));
    reader.readAsDataURL(blob);
  });
}

async function makePortableImage(image) {
  if (!image?.src) return null;
  if (image.src.startsWith('data:')) return image;

  const response = await fetch(image.src);
  if (!response.ok) throw new Error('No se pudo incluir la imagen actual en el proyecto.');
  const src = await blobToDataUrl(await response.blob());
  return { ...image, src };
}

function getProjectFilename(image) {
  const baseName = (image?.name || 'proyecto').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-');
  return `${baseName || 'proyecto'}-screenshot-studio.json`;
}

function isProjectDocument(documentState) {
  return documentState
    && typeof documentState === 'object'
    && Array.isArray(documentState.annotations)
    && documentState.frame
    && documentState.background
    && documentState.composition;
}

async function validateImage(image) {
  if (!image) return null;
  if (typeof image.src !== 'string' || !image.src.startsWith('data:')) {
    throw new Error('La imagen del proyecto no es válida o no está incorporada.');
  }

  const preview = new Image();
  preview.decoding = 'async';
  preview.src = image.src;
  await preview.decode();

  if (preview.naturalWidth * preview.naturalHeight > 24_000_000) {
    throw new Error('La imagen del proyecto supera el límite de 24 megapíxeles.');
  }

  return {
    ...image,
    width: preview.naturalWidth,
    height: preview.naturalHeight
  };
}

async function saveProject() {
  try {
    const state = store.getState();
    const portableImage = await makePortableImage(state.image);
    const payload = {
      app: 'screenshot-studio',
      version: PROJECT_VERSION,
      savedAt: new Date().toISOString(),
      document: {
        ...structuredClone(state),
        image: portableImage
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: PROJECT_MIME });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), {
      href: url,
      download: getProjectFilename(state.image)
    });
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    reportStatus('Proyecto guardado localmente.', 'success');
  } catch (error) {
    reportStatus(error.message || 'No se pudo guardar el proyecto.', 'error');
  }
}

async function loadProjectFile(file) {
  if (!file) return;
  if (file.size > MAX_PROJECT_BYTES) {
    reportStatus('El proyecto supera el límite permitido de 25 MB.', 'error');
    return;
  }

  try {
    const payload = JSON.parse(await file.text());
    if (payload?.app !== 'screenshot-studio' || payload.version !== PROJECT_VERSION || !isProjectDocument(payload.document)) {
      throw new Error('El archivo no es un proyecto compatible de Screenshot Studio.');
    }

    const documentState = structuredClone(payload.document);
    documentState.image = await validateImage(documentState.image);
    documentState.selectedId = null;
    history.cancelGesture();
    store.setState(documentState);
    history.reset();
    reportStatus('Proyecto cargado correctamente.', 'success');
  } catch (error) {
    reportStatus(error.message || 'No se pudo abrir el proyecto.', 'error');
  }
}

export function initProjectControls() {
  const loadInput = document.getElementById('projectInput');
  document.getElementById('saveProjectBtn').addEventListener('click', () => void saveProject());
  document.getElementById('loadProjectBtn').addEventListener('click', () => loadInput.click());
  loadInput.addEventListener('change', () => {
    void loadProjectFile(loadInput.files?.[0]);
    loadInput.value = '';
  });
}
