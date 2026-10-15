// bridge-vscode.js
// Recibe la imagen local desde la extensión de VS Code y la carga en el
// mismo store utilizado por las versiones web y Chrome/Edge.

import { store } from './js/store.js';
import { reportStatus } from './js/status.js';

window.addEventListener('message', async (event) => {
  const message = event.data;
  if (message?.type !== 'load-image' || !message.image?.src) return;

  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = message.image.src;
    await image.decode();

    store.setImage({
      src: message.image.src,
      width: image.naturalWidth,
      height: image.naturalHeight,
      name: message.image.name || 'imagen-local'
    });
    reportStatus(`Imagen ${message.image.name || 'local'} cargada correctamente.`, 'success');
  } catch (error) {
    reportStatus(error.message || 'No se pudo cargar la imagen local.', 'error');
  }
});

window.acquireVsCodeApi?.().postMessage({ type: 'editor-ready' });
