// image-import.js
// Importación local con validación de formato, peso y dimensiones para proteger
// memoria e interacción. Los objetos URL evitan duplicar el binario en Base64.

import { store } from './store.js';
import { reportStatus } from './status.js';

const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 24_000_000;
let activeObjectUrl = null;

export function initImageImport() {
  const input = document.getElementById('fileInput');
  const dropAreas = [document.getElementById('canvasImport')].filter(Boolean);

  input.addEventListener('change', () => {
    if (input.files?.[0]) void loadFile(input.files[0]);
    input.value = '';
  });

  dropAreas.forEach((dropArea) => {
    ['dragenter', 'dragover'].forEach((name) => {
      dropArea.addEventListener(name, (event) => {
        event.preventDefault();
        dropArea.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((name) => {
      dropArea.addEventListener(name, (event) => {
        event.preventDefault();
        dropArea.classList.remove('dragover');
      });
    });

    dropArea.addEventListener('drop', (event) => {
      const file = [...event.dataTransfer.files].find((item) => ACCEPTED_TYPES.has(item.type));
      if (file) {
        void loadFile(file);
      } else {
        reportStatus('Suelta una imagen PNG, JPEG o WebP válida.', 'error');
      }
    });
  });

  const canvasImport = document.getElementById('canvasImport');
  store.subscribe((state) => {
    canvasImport?.classList.toggle('is-hidden', Boolean(state.image));
  });

  window.addEventListener('paste', (event) => {
    const item = [...event.clipboardData.items].find((entry) => ACCEPTED_TYPES.has(entry.type));
    if (item) {
      event.preventDefault();
      void loadFile(item.getAsFile());
    }
  });
}

export async function loadFile(file) {
  if (!file || !ACCEPTED_TYPES.has(file.type)) {
    reportStatus('Selecciona una imagen PNG, JPEG o WebP válida.', 'error');
    return;
  }

  if (file.size > MAX_FILE_BYTES) {
    reportStatus('La imagen supera el límite permitido de 15 MB.', 'error');
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';

  try {
    image.src = objectUrl;
    await image.decode();

    if (image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
      throw new Error('La imagen supera el límite de 24 megapíxeles.');
    }

    if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = objectUrl;

    store.setImage({
      src: objectUrl,
      width: image.naturalWidth,
      height: image.naturalHeight,
      name: file.name || 'captura'
    });
    reportStatus(`Imagen ${file.name || 'local'} cargada correctamente.`, 'success');
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    reportStatus(error.message || 'No se pudo abrir la imagen seleccionada.', 'error');
  }
}
