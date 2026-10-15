// browser-frames.js
// Marcos para ventana macOS/Windows, navegador genérico, Safari, Chrome y Terminal.
// Safari y Chrome se distinguen visualmente de la ventana macOS simple.

const BAR_HEIGHT = 48;

export function drawFrame(ctx, image, rect, frame, radius) {
  const { type, theme, title } = frame;
  if (type === 'none') {
    drawRoundedImage(ctx, image, rect, radius);
    return;
  }

  const outer = { x: rect.x, y: rect.y - BAR_HEIGHT, width: rect.width, height: rect.height + BAR_HEIGHT };
  const dark = theme === 'dark';
  const palette = getPalette(type, dark);

  ctx.save();
  roundedRectPath(ctx, outer.x, outer.y, outer.width, outer.height, radius);
  ctx.clip();
  ctx.fillStyle = palette.body;
  ctx.fillRect(outer.x, outer.y, outer.width, outer.height);
  ctx.fillStyle = palette.bar;
  ctx.fillRect(outer.x, outer.y, outer.width, BAR_HEIGHT);

  switch (type) {
    case 'macos':
      drawMacWindowBar(ctx, outer, palette, title);
      break;
    case 'windows':
      drawWindowsWindowBar(ctx, outer, palette, title);
      break;
    case 'linux':
      drawLinuxWindowBar(ctx, outer, palette, title);
      break;
    case 'safari':
      drawSafariBar(ctx, outer, palette, title);
      break;
    case 'chrome':
      drawChromeBar(ctx, outer, palette, title);
      break;
    case 'terminal':
      drawTerminalBar(ctx, outer, palette, title);
      break;
    default:
      drawGenericBrowserBar(ctx, outer, palette, title);
      break;
  }

  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function getPalette(type, dark) {
  if (type === 'terminal') return { bar: '#161b22', body: '#0d1117', text: '#7ee787', muted: '#8b949e' };
  if (type === 'linux') return dark
    ? { bar: '#242424', body: '#171717', text: '#f6f5f4', muted: '#c0bfbc', field: '#3d3846' }
    : { bar: '#f6f5f4', body: '#ffffff', text: '#242424', muted: '#5e5c64', field: '#deddda' };
  if (type === 'chrome') return dark
    ? { bar: '#202124', body: '#202124', text: '#e8eaed', muted: '#9aa0a6', field: '#303134' }
    : { bar: '#dee1e6', body: '#fff', text: '#202124', muted: '#5f6368', field: '#fff' };
  if (type === 'safari') return dark
    ? { bar: '#2c2d31', body: '#1d1e22', text: '#f5f5f7', muted: '#9b9da4', field: '#3a3b40' }
    : { bar: '#f2f3f5', body: '#fff', text: '#24262c', muted: '#72757e', field: '#fff' };
  return dark
    ? { bar: '#2b2d31', body: '#1e1f23', text: '#d8d9de', muted: '#9b9da4', field: '#3a3c42' }
    : { bar: '#e8e9ed', body: '#fff', text: '#4b4d57', muted: '#858995', field: '#fff' };
}

function drawMacWindowBar(ctx, outer, palette, title) {
  drawMacDots(ctx, outer.x + 16, outer.y + BAR_HEIGHT / 2);
  drawTitle(ctx, title, outer.x + outer.width / 2, outer.y + BAR_HEIGHT / 2, palette.text);
}

function drawWindowsWindowBar(ctx, outer, palette, title) {
  drawTitle(ctx, title, outer.x + outer.width / 2, outer.y + BAR_HEIGHT / 2, palette.text);
  drawWindowsControls(ctx, outer.x + outer.width - 16, outer.y + BAR_HEIGHT / 2, palette.text);
}

function drawLinuxWindowBar(ctx, outer, palette, title) {
  const centerY = outer.y + BAR_HEIGHT / 2;
  const isDark = palette.bar === '#242424';

  // Inspirado en GNOME: borde de acento, icono de aplicación y título centrado.
  ctx.fillStyle = isDark ? '#3584e4' : '#1c71d8';
  ctx.fillRect(outer.x, outer.y, outer.width, 3);

  ctx.fillStyle = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)';
  ctx.fillRect(outer.x, outer.y + BAR_HEIGHT - 1, outer.width, 1);

  ctx.fillStyle = '#ff7800';
  roundedRectPath(ctx, outer.x + 16, centerY - 9, 18, 18, 5);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◈', outer.x + 25, centerY + .5);

  drawTitle(ctx, title || 'Aplicación', outer.x + outer.width / 2, centerY, palette.text, 12);
  drawLinuxWindowControls(ctx, outer.x + outer.width - 20, centerY, palette.text, isDark);
}

function drawLinuxWindowControls(ctx, x, y, color, isDark) {
  const buttonSize = 22;
  const gap = 3;
  const closeX = x - buttonSize;
  const maximizeX = closeX - buttonSize - gap;
  const minimizeX = maximizeX - buttonSize - gap;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.lineCap = 'round';

  // Cada glifo se alinea respecto al centro vertical de la barra.
  // Minimizar
  ctx.beginPath();
  ctx.moveTo(minimizeX + 7, y);
  ctx.lineTo(minimizeX + 15, y);
  ctx.stroke();

  // Maximizar
  ctx.strokeRect(maximizeX + 7, y - 4, 8, 8);

  // Cerrar
  ctx.fillStyle = isDark ? '#c01c28' : '#e01b24';
  roundedRectPath(ctx, closeX + 2, y - 10, 18, 20, 5);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(closeX + 8, y - 4);
  ctx.lineTo(closeX + 14, y + 4);
  ctx.moveTo(closeX + 14, y - 4);
  ctx.lineTo(closeX + 8, y + 4);
  ctx.stroke();

  ctx.restore();
}

function drawGenericBrowserBar(ctx, outer, palette, title) {
  ctx.fillStyle = palette.field;
  roundedRectPath(ctx, outer.x + 58, outer.y + 11, Math.max(120, outer.width - 116), 26, 13);
  ctx.fill();
  drawSmallDot(ctx, outer.x + 74, outer.y + 24, '#22c55e');
  drawTitle(ctx, title || 'sitio-web.com', outer.x + outer.width / 2, outer.y + 24, palette.muted, 11);
  drawBrowserButtons(ctx, outer.x + 20, outer.y + 24, palette.muted);
}

function drawSafariBar(ctx, outer, palette, title) {
  // Todos los controles se alinean con el centro del buscador.
  const searchCenterY = outer.y + 22;

  drawMacDots(ctx, outer.x + 14, searchCenterY);
  drawBrowserButtons(ctx, outer.x + 83, searchCenterY, palette.muted);

  ctx.fillStyle = palette.field;
  roundedRectPath(ctx, outer.x + 132, outer.y + 8, Math.max(115, outer.width - 190), 28, 8);
  ctx.fill();
  drawSmallDot(ctx, outer.x + 149, searchCenterY, '#0ea5e9');
  drawTitle(ctx, title || 'safari.app', outer.x + outer.width / 2 + 12, searchCenterY, palette.muted, 11);

  ctx.strokeStyle = palette.muted;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(outer.x + outer.width - 22, searchCenterY, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawChromeBar(ctx, outer, palette, title) {
  // Pestaña superior + omnibox + controles de ventana estilo Chrome/Windows.
  const controlsX = outer.x + outer.width - 14;
  const tabWidth = Math.min(180, Math.max(105, outer.width * .34));

  drawChromeWindowControls(ctx, controlsX, outer.y + 14, palette.text, palette.bar);

  ctx.fillStyle = palette.field;
  roundedTopRect(ctx, outer.x + 12, outer.y + 5, tabWidth, 20, 7);
  ctx.fill();

  drawSmallDot(ctx, outer.x + 27, outer.y + 15, '#4285f4');
  ctx.fillStyle = palette.text;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title || 'Nueva pestaña', outer.x + 38, outer.y + 15);

  drawChromeNavigationControls(ctx, outer.x + 23, outer.y + 36, palette.muted);

  // Deja una separación clara entre Inicio y la barra de dirección.
  ctx.fillStyle = palette.field;
  roundedRectPath(ctx, outer.x + 87, outer.y + 29, Math.max(76, outer.width - 164), 14, 7);
  ctx.fill();
  drawSmallDot(ctx, outer.x + 102, outer.y + 36, '#22c55e');
  ctx.fillStyle = palette.muted;
  ctx.font = '9px sans-serif';
  ctx.fillText(title || 'chrome://newtab', outer.x + 114, outer.y + 36);
}

function drawChromeNavigationControls(ctx, x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.35;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Atrás
  ctx.beginPath();
  ctx.moveTo(x + 7, y - 5);
  ctx.lineTo(x + 2, y);
  ctx.lineTo(x + 7, y + 5);
  ctx.stroke();

  // Actualizar
  ctx.beginPath();
  ctx.arc(x + 25, y, 5, Math.PI * .2, Math.PI * 1.75);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 29, y - 5);
  ctx.lineTo(x + 30, y - 1);
  ctx.lineTo(x + 26, y - 2);
  ctx.stroke();

  // Inicio
  ctx.beginPath();
  ctx.moveTo(x + 41, y - 1);
  ctx.lineTo(x + 47, y - 6);
  ctx.lineTo(x + 53, y - 1);
  ctx.lineTo(x + 53, y + 5);
  ctx.lineTo(x + 42, y + 5);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 46, y + 5);
  ctx.lineTo(x + 46, y + 1);
  ctx.lineTo(x + 49, y + 1);
  ctx.lineTo(x + 49, y + 5);
  ctx.stroke();

  ctx.restore();
}

function drawChromeWindowControls(ctx, x, y, color, closeBackground) {
  const controlWidth = 16;
  const controlHeight = 20;
  const gap = 2;
  const startX = x - controlWidth * 3 - gap * 2;

  ctx.save();
  ctx.lineWidth = 1.15;
  ctx.strokeStyle = color;

  // Minimizar
  ctx.beginPath();
  ctx.moveTo(startX + 5, y + 3);
  ctx.lineTo(startX + 11, y + 3);
  ctx.stroke();

  // Maximizar / restaurar
  const maximizeX = startX + controlWidth + gap;
  ctx.strokeRect(maximizeX + 4, y - 3, 7, 7);

  // Cerrar: fondo rojo discreto + aspa blanca
  const closeX = maximizeX + controlWidth + gap;
  ctx.fillStyle = closeBackground === '#202124' ? '#c84545' : '#e86a6a';
  ctx.fillRect(closeX, y - 10, controlWidth, controlHeight);
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(closeX + 5, y - 3);
  ctx.lineTo(closeX + 11, y + 3);
  ctx.moveTo(closeX + 11, y - 3);
  ctx.lineTo(closeX + 5, y + 3);
  ctx.stroke();

  ctx.restore();
}

function drawTerminalBar(ctx, outer, palette, title) {
  drawMacDots(ctx, outer.x + 16, outer.y + BAR_HEIGHT / 2);
  ctx.fillStyle = palette.text;
  ctx.font = '12px ui-monospace, monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title || '~/screenshot-studio', outer.x + 88, outer.y + BAR_HEIGHT / 2);
}

function drawTitle(ctx, title, x, y, color, size = 13) {
  ctx.fillStyle = color;
  ctx.font = `${size}px -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title || 'miapp.com', x, y);
}

function drawMacDots(ctx, x, y) {
  ['#ff5f57', '#febc2e', '#28c840'].forEach((color, index) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x + index * 18, y, 5.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawWindowsControls(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 48, y); ctx.lineTo(x - 40, y);
  ctx.stroke();
  ctx.strokeRect(x - 28, y - 5, 10, 10);
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 5); ctx.lineTo(x - 2, y + 5);
  ctx.moveTo(x - 2, y - 5); ctx.lineTo(x - 12, y + 5);
  ctx.stroke();
}

function drawBrowserButtons(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x + 5, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + 5, y + 4);
  ctx.moveTo(x + 13, y - 4); ctx.lineTo(x + 18, y); ctx.lineTo(x + 13, y + 4);
  ctx.stroke();
}

function darkenColor(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.max(0, ((value >> shift) & 255) - Math.round(255 * amount));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function drawSmallDot(ctx, x, y, color) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoundedImage(ctx, image, rect, radius) {
  ctx.save();
  roundedRectPath(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.clip();
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function roundedTopRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export { roundedRectPath, BAR_HEIGHT };
