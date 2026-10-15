// bridge.js
// Puente entre la extensión y el editor empaquetado. Recupera la captura
// pendiente, la convierte en un Object URL local y la carga en el store.

import { store } from './js/store.js';
import { reportStatus } from './js/status.js';

async function loadPendingCapture() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

  try {
    const { pendingCapture: capture } = await chrome.storage.local.get('pendingCapture');
    if (!capture?.dataUrl) return;

    const response = await fetch(capture.dataUrl);
    if (!response.ok) throw new Error('No se pudo leer la captura recibida.');

    const imageBlob = await response.blob();
    const objectUrl = URL.createObjectURL(imageBlob);
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();

    store.setImage({
      src: objectUrl,
      width: image.naturalWidth,
      height: image.naturalHeight,
      name: capture.name || 'captura-de-pantalla.png'
    });

    await chrome.storage.local.remove('pendingCapture');
    reportStatus('Captura cargada correctamente en el editor.', 'success');
  } catch (error) {
    console.error('No se pudo cargar la captura de la extensión:', error);
    reportStatus(error.message || 'No se pudo cargar la captura recibida.', 'error');
  }
}

await loadPendingCapture();
