// export.js
// Exporta la composición actual y comunica progreso/resultado por una región
// aria-live; no usa alertas bloqueantes.

import { getCanvas } from './canvas-editor.js';
import { store } from './store.js';
import { reportStatus } from './status.js';

function getMimeType(format) {
  return format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
}

function getExportOptions() {
  return {
    format: document.getElementById('exportFormat').value,
    quality: Number(document.getElementById('exportQuality').value) / 100,
    scale: Number(document.getElementById('exportScale')?.value || 1)
  };
}

/** Devuelve el canvas fuente para exportar, escalado si se solicita > 1×. */
function getExportCanvas(sourceCanvas, scale) {
  if (scale <= 1) return sourceCanvas;
  const off = document.createElement('canvas');
  off.width = Math.round(sourceCanvas.width * scale);
  off.height = Math.round(sourceCanvas.height * scale);
  const offCtx = off.getContext('2d');
  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = 'high';
  offCtx.drawImage(sourceCanvas, 0, 0, off.width, off.height);
  return off;
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo generar la imagen para exportar.'));
    }, mime, quality);
  });
}

function setExportBusy(busy) {
  ['downloadBtn', 'copyBtn', 'exportBtn'].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = busy || !store.getState().image;
  });
}

function requireImage() {
  if (store.getState().image) return true;
  reportStatus('Carga una imagen antes de exportar o copiar.', 'error');
  return false;
}

export async function downloadExport() {
  const canvas = getCanvas();
  if (!canvas || !requireImage()) return;

  setExportBusy(true);
  try {
    const { format, quality, scale } = getExportOptions();
    const exportCanvas = getExportCanvas(canvas, scale);
    const blob = await canvasToBlob(exportCanvas, getMimeType(format), quality);
    const objectUrl = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), {
      href: objectUrl,
      download: `screenshot-studio.${format === 'jpeg' ? 'jpg' : format}`
    });

    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    reportStatus('Descarga preparada correctamente.', 'success');
  } catch (error) {
    reportStatus(error.message || 'No se pudo exportar la imagen.', 'error');
  } finally {
    setExportBusy(false);
  }
}

export async function copyExport() {
  const canvas = getCanvas();
  if (!canvas || !requireImage()) return;

  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    reportStatus('Tu navegador no permite copiar imágenes aquí. Usa Descargar.', 'error');
    return;
  }

  setExportBusy(true);
  try {
    const blob = await canvasToBlob(canvas, 'image/png');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    reportStatus('Imagen copiada al portapapeles.', 'success');
  } catch {
    reportStatus('No se pudo copiar. Abre la app mediante HTTPS o localhost.', 'error');
  } finally {
    setExportBusy(false);
  }
}

export function syncExportAvailability(hasImage) {
  ['downloadBtn', 'copyBtn', 'exportBtn'].forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.disabled = !hasImage;
    button.setAttribute('aria-disabled', String(!hasImage));
  });
}
