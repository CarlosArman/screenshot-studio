// screen-capture.js
// Captura un único frame con consentimiento explícito y valida dimensiones
// para no crear una composición que agote memoria.

import { store } from './store.js';
import { reportStatus } from './status.js';

const MAX_CAPTURE_PIXELS = 24_000_000;

export function initScreenCapture() {
  const button = document.getElementById('captureScreenBtn');
  button.addEventListener('click', async () => {
    const previousLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Selecciona una pantalla…';

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false,
        preferCurrentTab: false,
        selfBrowserSurface: 'include'
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      if (video.videoWidth * video.videoHeight > MAX_CAPTURE_PIXELS) {
        throw new Error('La captura supera el límite de 24 megapíxeles.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

      video.pause();
      video.srcObject = null;
      stream.getTracks().forEach((activeTrack) => activeTrack.stop());

      store.setImage({
        src: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
        name: 'captura-de-pantalla.png'
      });
      reportStatus('Captura cargada correctamente.', 'success');
    } catch (error) {
      if (error.name === 'AbortError') {
        reportStatus('La captura fue cancelada.', 'info');
      } else {
        reportStatus(error.message || 'No se pudo crear la captura. Revisa permisos y compatibilidad.', 'error');
      }
    } finally {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  });
}
