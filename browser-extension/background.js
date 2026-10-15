const MAX_CAPTURE_PIXELS = 24_000_000;
const SCROLL_SETTLE_DELAY_MS = 180;
// Chrome permite como máximo dos llamadas a captureVisibleTab por segundo.
const MIN_CAPTURE_INTERVAL_MS = 600;
let lastVisibleCaptureAt = 0;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((response) => response.blob());
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(reader.error || new Error('No se pudo codificar la captura.')));
    reader.readAsDataURL(blob);
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No se encontró una pestaña activa para capturar.');
  return tab;
}

function getPageMetrics() {
  const root = document.documentElement;
  const body = document.body;
  const pageWidth = Math.max(
    root.scrollWidth,
    root.offsetWidth,
    body?.scrollWidth || 0,
    body?.offsetWidth || 0
  );
  const pageHeight = Math.max(
    root.scrollHeight,
    root.offsetHeight,
    body?.scrollHeight || 0,
    body?.offsetHeight || 0
  );

  return {
    pageWidth,
    pageHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  };
}

function scrollToPosition(position) {
  window.scrollTo(0, position);
}

function createSelectionOverlay() {
  return new Promise((resolve) => {
    const existing = document.getElementById('__screenshot_studio_selection_overlay__');
    existing?.remove();

    const overlay = document.createElement('div');
    const selection = document.createElement('div');
    const help = document.createElement('div');
    const style = document.createElement('style');

    overlay.id = '__screenshot_studio_selection_overlay__';
    help.textContent = 'Arrastra para seleccionar un área · Esc para cancelar';
    style.textContent = `
      #__screenshot_studio_selection_overlay__ {
        position: fixed; inset: 0; z-index: 2147483647; cursor: crosshair;
        background: rgba(9, 11, 18, .26); user-select: none;
      }
      #__screenshot_studio_selection_overlay__ .ss-selection {
        position: fixed; display: none; border: 2px solid #22d3ee;
        background: rgba(34, 211, 238, .14); box-shadow: 0 0 0 9999px rgba(9, 11, 18, .36);
      }
      #__screenshot_studio_selection_overlay__ .ss-selection-help {
        position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
        padding: 9px 13px; border-radius: 8px; background: #090b12; color: #f4f6fc;
        font: 600 13px/1.2 system-ui, sans-serif; box-shadow: 0 8px 30px rgba(0,0,0,.3);
      }
    `;

    overlay.className = 'ss-selection-overlay';
    selection.className = 'ss-selection';
    help.className = 'ss-selection-help';
    overlay.append(selection, help);
    document.documentElement.append(style, overlay);

    let startX = 0;
    let startY = 0;
    let isSelecting = false;

    const cleanup = (value) => {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
      style.remove();
      resolve(value);
    };

    const getBox = (endX, endY) => ({
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY)
    });

    const renderSelection = (box) => {
      selection.style.display = 'block';
      selection.style.left = `${box.x}px`;
      selection.style.top = `${box.y}px`;
      selection.style.width = `${box.width}px`;
      selection.style.height = `${box.height}px`;
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cleanup(null);
      }
    };

    overlay.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      startX = event.clientX;
      startY = event.clientY;
      isSelecting = true;
      overlay.setPointerCapture(event.pointerId);
      renderSelection({ x: startX, y: startY, width: 0, height: 0 });
    });

    overlay.addEventListener('pointermove', (event) => {
      if (!isSelecting) return;
      renderSelection(getBox(event.clientX, event.clientY));
    });

    overlay.addEventListener('pointerup', (event) => {
      if (!isSelecting) return;
      isSelecting = false;
      const box = getBox(event.clientX, event.clientY);
      cleanup(box.width >= 4 && box.height >= 4 ? box : null);
    });

    document.addEventListener('keydown', onKeyDown, true);
  });
}

async function captureVisibleTab(windowId) {
  const elapsed = Date.now() - lastVisibleCaptureAt;
  if (elapsed < MIN_CAPTURE_INTERVAL_MS) {
    await wait(MIN_CAPTURE_INTERVAL_MS - elapsed);
  }

  lastVisibleCaptureAt = Date.now();

  try {
    return await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
  } catch (error) {
    if (!error.message?.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND')) throw error;

    // La cuota de Chrome se calcula en una ventana deslizante; reintentar una vez
    // absorbe una captura previa realizada justo antes de iniciar la página completa.
    await wait(1_100);
    lastVisibleCaptureAt = Date.now();
    return chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
  }
}

async function captureSelectedArea(tab) {
  const [{ result: selection }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: createSelectionOverlay
  });

  if (!selection) throw new Error('La selección fue cancelada.');

  const metrics = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => ({ devicePixelRatio: window.devicePixelRatio || 1 })
  });
  const scale = metrics[0].result.devicePixelRatio;
  const bitmap = await createImageBitmap(await dataUrlToBlob(await captureVisibleTab(tab.windowId)));
  const canvas = new OffscreenCanvas(
    Math.round(selection.width * scale),
    Math.round(selection.height * scale)
  );

  canvas.getContext('2d').drawImage(
    bitmap,
    Math.round(selection.x * scale),
    Math.round(selection.y * scale),
    Math.round(selection.width * scale),
    Math.round(selection.height * scale),
    0,
    0,
    canvas.width,
    canvas.height
  );

  return blobToDataUrl(await canvas.convertToBlob({ type: 'image/png' }));
}

async function captureFullPage(tab) {
  const [{ result: metrics }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getPageMetrics
  });

  const { pageWidth, pageHeight, viewportHeight, devicePixelRatio, scrollX, scrollY } = metrics;
  if (pageWidth * devicePixelRatio * pageHeight * devicePixelRatio > MAX_CAPTURE_PIXELS) {
    throw new Error('La página completa supera el límite de 24 megapíxeles para una captura segura.');
  }

  const positions = [];
  const maxScrollY = Math.max(0, pageHeight - viewportHeight);
  for (let position = 0; position < maxScrollY; position += viewportHeight) {
    positions.push(position);
  }
  if (!positions.includes(maxScrollY)) positions.push(maxScrollY);

  const canvas = new OffscreenCanvas(
    Math.round(pageWidth * devicePixelRatio),
    Math.round(pageHeight * devicePixelRatio)
  );
  const context = canvas.getContext('2d');

  async function captureSegment(index) {
    if (index >= positions.length) return;

    const position = positions[index];
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrollToPosition,
      args: [position]
    });
    await wait(SCROLL_SETTLE_DELAY_MS);

    const bitmap = await createImageBitmap(await dataUrlToBlob(await captureVisibleTab(tab.windowId)));
    const sourceHeight = Math.min(bitmap.height, canvas.height - Math.round(position * devicePixelRatio));

    context.drawImage(
      bitmap,
      0,
      0,
      bitmap.width,
      sourceHeight,
      0,
      Math.round(position * devicePixelRatio),
      bitmap.width,
      sourceHeight
    );
    bitmap.close();

    return captureSegment(index + 1);
  }

  try {
    await captureSegment(0);
  } finally {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (x, y) => window.scrollTo(x, y),
      args: [scrollX, scrollY]
    });
  }

  return blobToDataUrl(await canvas.convertToBlob({ type: 'image/png' }));
}

async function saveAndOpenEditor(dataUrl, name) {
  await chrome.storage.local.set({ pendingCapture: { dataUrl, name } });
  await chrome.tabs.create({ url: chrome.runtime.getURL('editor/index.html'), active: true });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type?.startsWith('capture-')) return;

  (async () => {
    const tab = await getActiveTab();
    let dataUrl;
    let name;

    if (message.type === 'capture-visible-tab') {
      dataUrl = await captureVisibleTab(tab.windowId);
      name = 'captura-pestana-visible.png';
    } else if (message.type === 'capture-selection') {
      dataUrl = await captureSelectedArea(tab);
      name = 'captura-area-seleccionada.png';
    } else if (message.type === 'capture-full-page') {
      dataUrl = await captureFullPage(tab);
      name = 'captura-pagina-completa.png';
    } else {
      throw new Error('Modo de captura no reconocido.');
    }

    await saveAndOpenEditor(dataUrl, name);
    sendResponse({ ok: true });
  })().catch((error) => {
    sendResponse({ ok: false, error: error.message || 'No se pudo completar la captura.' });
  });

  return true;
});
