const STATUS_DURATION = 5000;
let clearTimer;

export function reportStatus(message, type = 'info') {
  const status = document.getElementById('appStatus');
  if (!status) return;

  window.clearTimeout(clearTimer);
  status.dataset.type = type;
  status.textContent = message;

  clearTimer = window.setTimeout(() => {
    status.textContent = '';
    delete status.dataset.type;
  }, STATUS_DURATION);
}
