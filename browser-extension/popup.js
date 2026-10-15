const captureButtons = [...document.querySelectorAll('[data-capture]')];
const openAppButton = document.getElementById('openAppBtn');
const statusOutput = document.getElementById('captureStatus');

function setStatus(message) {
  statusOutput.value = message;
}

function setBusy(isBusy) {
  captureButtons.forEach((button) => {
    button.disabled = isBusy;
    button.toggleAttribute('aria-busy', isBusy);
  });
}

function labelForMode(mode) {
  const labels = {
    'capture-visible-tab': 'Capturando área visible…',
    'capture-selection': 'Elige el área en la página…',
    'capture-full-page': 'Capturando página completa…'
  };
  return labels[mode] || 'Capturando…';
}

openAppButton.addEventListener('click', async () => {
  openAppButton.disabled = true;
  setStatus('Abriendo Screenshot Studio…');

  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL('editor/index.html'), active: true });
  } catch (error) {
    setStatus(error.message || 'No se pudo abrir Screenshot Studio.');
    openAppButton.disabled = false;
  }
});

captureButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const mode = button.dataset.capture;
    setBusy(true);
    setStatus(labelForMode(mode));

    try {
      const result = await chrome.runtime.sendMessage({ type: mode });
      if (!result?.ok) {
        throw new Error(result?.error || 'No se pudo completar la captura.');
      }

      setStatus('Captura abierta en Screenshot Studio.');
    } catch (error) {
      setStatus(error.message || 'No se pudo completar la captura.');
      setBusy(false);
    }
  });
});
