// share.js
// Funcionalidad de compartir imagen en redes sociales y plataformas populares.
// Prioriza la Web Share API nativa para compartir el archivo directamente;
// ofrece accesos directos a plataformas populares como alternativa.

import { getCanvas } from './canvas-editor.js';
import { store } from './store.js';
import { reportStatus } from './status.js';

const SHARE_TEXT = '¡Mira esta imagen que creé con Screenshot Studio! 🚀';
const APP_URL = 'https://screenshot-studio.app';

function canvasToBlob(canvas, mime = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen.'))),
      mime,
      quality
    );
  });
}

async function getImageBlob() {
  const canvas = getCanvas();
  if (!canvas) return null;
  try {
    return await canvasToBlob(canvas);
  } catch {
    return null;
  }
}

async function downloadImageBlob() {
  const canvas = getCanvas();
  if (!canvas) return;
  try {
    const blob = await canvasToBlob(canvas);
    const objectUrl = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), {
      href: objectUrl,
      download: 'screenshot-studio.png'
    });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  } catch {
    // continúa sin descarga
  }
}

export async function shareNative() {
  if (!navigator.share) return false;

  const blob = await getImageBlob();
  if (!blob) return false;

  const file = new File([blob], 'screenshot-studio.png', { type: 'image/png' });

  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Screenshot Studio',
        text: SHARE_TEXT
      });
    } else {
      await navigator.share({ title: 'Screenshot Studio', text: SHARE_TEXT, url: APP_URL });
    }
    reportStatus('Imagen compartida correctamente.', 'success');
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      reportStatus('No se pudo compartir la imagen.', 'error');
    }
    return false;
  }
}

function openInNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function shareTo(platform) {
  const text = encodeURIComponent(SHARE_TEXT);
  const url = encodeURIComponent(APP_URL);

  const platforms = {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${text}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`
  };

  if (platforms[platform]) openInNewTab(platforms[platform]);
}

function closeShareModal() {
  const modal = document.getElementById('shareModal');
  if (!modal) return;
  modal.classList.remove('share-modal-visible');
  modal.setAttribute('aria-hidden', 'true');
  // Devuelve foco al botón que abrió el modal
  document.getElementById('shareBtn')?.focus();
}

function openShareModal() {
  const modal = document.getElementById('shareModal');
  if (!modal) return;
  modal.classList.add('share-modal-visible');
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('.share-modal-card')?.focus();
}

export function initShareControls() {
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (!store.getState().image) {
        reportStatus('Carga una imagen antes de compartir.', 'error');
        return;
      }
      openShareModal();
    });
  }

  const modal = document.getElementById('shareModal');
  if (!modal) return;

  // Cerrar al hacer clic en el overlay
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeShareModal();
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('share-modal-visible')) {
      closeShareModal();
    }
  });

  // Botón de cerrar
  modal.querySelector('.share-modal-close')?.addEventListener('click', closeShareModal);

  // Compartir nativo (Web Share API)
  const nativeShareBtn = modal.querySelector('[data-share="native"]');
  if (nativeShareBtn) {
    if (!navigator.share) {
      nativeShareBtn.hidden = true;
    }
    nativeShareBtn.addEventListener('click', async () => {
      closeShareModal();
      await shareNative();
    });
  }

  // Botones de plataformas: descarga la imagen y luego abre la red social
  modal.querySelectorAll('[data-share-platform]').forEach((button) => {
    button.addEventListener('click', async () => {
      await downloadImageBlob();
      shareTo(button.dataset.sharePlatform);
      closeShareModal();
      reportStatus('Imagen descargada. Adjúntala en la red social que se acaba de abrir.', 'success');
    });
  });
}

export function syncShareAvailability(hasImage) {
  const btn = document.getElementById('shareBtn');
  if (!btn) return;
  btn.disabled = !hasImage;
  btn.setAttribute('aria-disabled', String(!hasImage));
}
