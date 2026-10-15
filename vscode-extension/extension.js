const vscode = require('vscode');
const fs = require('node:fs/promises');
const path = require('node:path');

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MIME_BY_EXTENSION = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp']
]);

function getImageMimeType(uri) {
  return MIME_BY_EXTENSION.get(path.extname(uri.fsPath).toLowerCase());
}

async function readImageAsDataUrl(uri) {
  const mime = getImageMimeType(uri);
  if (!mime) throw new Error('Formato no permitido. Usa PNG, JPEG o WebP.');

  const stats = await fs.stat(uri.fsPath);
  if (stats.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen supera el límite permitido de 15 MB.');
  }

  const bytes = await fs.readFile(uri.fsPath);
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

function asWebviewResource(webview, editorRoot, relativePath) {
  return webview.asWebviewUri(vscode.Uri.joinPath(editorRoot, relativePath)).toString();
}

async function getWebviewHtml(webview, editorRoot) {
  const indexUri = vscode.Uri.joinPath(editorRoot, 'index.html');
  let html = await fs.readFile(indexUri.fsPath, 'utf8');

  html = html.replaceAll('./favicon.svg', asWebviewResource(webview, editorRoot, 'favicon.svg'));
  html = html.replaceAll('./styles/main.css', asWebviewResource(webview, editorRoot, 'styles/main.css'));
  html = html.replaceAll('./styles/light-theme.css', asWebviewResource(webview, editorRoot, 'styles/light-theme.css'));
  html = html.replaceAll('./js/app.js', asWebviewResource(webview, editorRoot, 'js/app.js'));
  html = html.replaceAll('./bridge-vscode.js', asWebviewResource(webview, editorRoot, 'bridge-vscode.js'));

  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} data: blob:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src ${webview.cspSource}`,
    "font-src 'none'",
    "connect-src 'none'"
  ].join('; ');

  return html.replace('<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
}

function activate(context) {
  const command = vscode.commands.registerCommand('screenshotStudio.openImage', async (resource) => {
    const uri = resource instanceof vscode.Uri
      ? resource
      : (await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: { Images: ['png', 'jpg', 'jpeg', 'webp'] }
        }))?.[0];

    if (!uri) return;

    try {
      const dataUrl = await readImageAsDataUrl(uri);
      const extensionRoot = context.extensionUri;
      const editorRoot = vscode.Uri.joinPath(extensionRoot, 'editor');
      const panel = vscode.window.createWebviewPanel(
        'screenshotStudio',
        `Screenshot Studio — ${path.basename(uri.fsPath)}`,
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [editorRoot]
        }
      );

      panel.webview.html = await getWebviewHtml(panel.webview, editorRoot);
      panel.webview.onDidReceiveMessage((message) => {
        if (message?.type !== 'editor-ready') return;

        panel.webview.postMessage({
          type: 'load-image',
          image: {
            src: dataUrl,
            name: path.basename(uri.fsPath)
          }
        });
      }, undefined, context.subscriptions);
    } catch (error) {
      vscode.window.showErrorMessage(`Screenshot Studio: ${error.message || 'No se pudo abrir la imagen.'}`);
    }
  });

  context.subscriptions.push(command);
}

function deactivate() {
  return undefined;
}

module.exports = { activate, deactivate };
