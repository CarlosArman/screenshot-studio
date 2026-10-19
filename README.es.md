# 📸 Screenshot Studio

<p align="center">
  <img src="https://img.shields.io/badge/Versi%C3%B3n-0.2.0-blueviolet" alt="Versión" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Canvas-2D-087EA4" alt="Canvas" />
  <img src="https://img.shields.io/badge/Exportar-PNG%20JPEG%20WebP-green" alt="Exportar" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Arquitectura-Vanilla%20JS-blueviolet" alt="Arquitectura" />
  <img src="https://img.shields.io/badge/Dise%C3%B1o-Offline%20First-informational" alt="Diseño" />
  <img src="https://img.shields.io/badge/Plataformas-Web%20%7C%20Chrome%20%7C%20VS%20Code-blue" alt="Plataformas" />
  <img src="https://img.shields.io/badge/Accesibilidad-WCAG%202.2-success" alt="Accesibilidad" />
  <img src="https://img.shields.io/badge/Estado-Desarrollo%20Activo-yellow" alt="Estado" />
</p>

<p align="center"><b>🌐 Language / Idioma</b></p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a> &nbsp;|&nbsp; <a href="./README.es.md">🇪🇸 Español</a>
</p>

<p align="center">
  Crea capturas profesionales directamente desde tu navegador, con marcos, fondos, anotaciones y exportación local. Construido con <b>HTML</b>, <b>CSS3</b> y <b>JavaScript vanilla</b>, e incluye una <b>extensión Chrome/Edge</b> y una <b>extensión de VS Code</b> desde la misma base de código.
</p>

---

Screenshot Studio es un editor visual para transformar imágenes y capturas locales en composiciones profesionales con marcos de aplicaciones realistas, degradados, anotaciones, máscaras de privacidad y exportaciones de alta resolución — sin backend ni subida de archivos a servicios externos.

---

## 🎯 Por qué importa este proyecto

Este proyecto demuestra cómo construir una **herramienta de productividad frontend multiplataforma** usando solo HTML, CSS y JavaScript vanilla — sin frameworks, pasos de build ni backend — y distribuirla en **tres superficies de producto** desde una misma base de código.

Demuestra capacidades prácticas en:

- Renderizado avanzado con Canvas 2D y composición de imágenes en el navegador.
- Procesamiento local/offline-first con Object URLs y APIs del navegador.
- Desarrollo de extensiones de navegador mediante Chrome Manifest V3.
- Desarrollo de extensiones de VS Code mediante WebviewPanel y comandos de editor.
- Diseño de interfaz accesible: estados ARIA, navegación por teclado, gestión de foco y contraste orientado a WCAG.
- Diseño responsive con paneles contraíbles, temas claro/oscuro y soporte de movimiento reducido.

Esto convierte al repositorio en un ejemplo práctico de **ingeniería de producto frontend con enfoque de privacidad**.

---

## 🚀 Resumen del proyecto

Este repositorio contiene un editor de composiciones para capturas distribuido como:

- Una **aplicación web pública**.
- Una **extensión de navegador** para Chrome/Edge.
- Una **extensión de VS Code** con el editor completo para imágenes locales.

La solución combina:

- Importación local desde archivo, arrastrar y soltar y portapapeles.
- Captura de pantalla/ventana mediante APIs de display media.
- Marcos macOS, Windows, Linux/GNOME, navegador, Safari, Chrome, terminal y genérico.
- Controles de composición: fondo, padding, radio de esquina, sombra y escala.
- Anotaciones de texto, números, flechas, figuras, pincel, resaltador, pixelado y desenfoque de privacidad.
- Deshacer/rehacer, capas, propiedades accesibles y atajos de teclado.
- Eliminación de la imagen actual y limpieza global o individual de anotaciones.
- Guardado y carga de proyectos locales portables en JSON.
- Exportación PNG, JPEG y WebP con soporte de copia al portapapeles.
- Vista checkerboard para composiciones transparentes.

🌐 **Aplicación web en línea:** [carlosarman.github.io/screenshot-studio](https://carlosarman.github.io/screenshot-studio/)<br>
🔗 **Código de la aplicación web:** [`web/`](./web/)<br>
🔗 **Extensión navegador:** [`browser-extension/`](./browser-extension)  
🔗 **Extensión VS Code:** [`vscode-extension/`](./vscode-extension)  
🔗 **README en inglés:** [`README.md`](./README.md)  
🔗 **Changelog:** [`CHANGELOG.es.md`](./CHANGELOG.es.md) · [🇬🇧 English changelog](./CHANGELOG.md)

---

## 🧩 Funcionalidades principales

### 🖼️ Flujo local de imágenes

- Soporte PNG, JPEG y WebP.
- Importación desde selector, arrastrar y soltar o portapapeles.
- Validación de MIME, límite de 15 MB y 24 MP.
- Procesamiento local de imágenes en el navegador.

### ✂️ Recorte de imagen

- Marco de recorte visual: arrastra para moverlo, usa controladores en esquinas y bordes para redimensionarlo, y confirma con Aplicar o Cancelar.
- El recorte elimina las zonas no deseadas sin ampliar ni interpolar la selección, por lo que conserva la nitidez nativa.
- Permite restaurar la imagen original durante la sesión.
- Redimensionado de imagen por ancho y alto en píxeles, con bloqueo opcional de proporción y un límite de 24 megapíxeles.
- Al aplicar el recorte se eliminan las anotaciones existentes, ya que sus posiciones dejan de coincidir con la imagen recortada.

### 🎨 Controles de composición

- Fondos sólido, degradado y transparente.
- Presets Aurora, Sunset, Ocean, Berry, Midnight y Lime.
- Padding, radio, sombra y escala ajustables.
- Presets de exportación para X/Twitter (1600 × 900), LinkedIn (1200 × 627), Instagram cuadrado (1080 × 1080), Instagram vertical (1080 × 1350) y Stories/Reels (1080 × 1920).
- Cada preset centra y ajusta la captura dentro de un lienzo con dimensiones de salida exactas.
- Temas claro/oscuro para la aplicación y los marcos.

### 🪟 Marcos de aplicación

| Marco | Detalles |
| --- | --- |
| macOS | Controles circulares de ventana |
| Windows | Minimizar, maximizar y cerrar |
| Linux | Barra GNOME, icono de aplicación y controles centrados |
| Navegador | Chrome genérico |
| Safari | Controles centrados con estilo macOS |
| Chrome | Pestañas, omnibox, navegación, inicio, actualizar y ventana |
| Terminal | Barra de título monoespaciada |

### ✏️ Herramientas de anotación

- Selección y movimiento.
- Texto, emojis editables con selector visual y callouts numerados.
- Eliminación directa desde el botón × de cada capa.
- Flechas, rectángulos y elipses.
- Pincel y resaltador.
- Pixelado irreversible y desenfoque irreversible para ocultar regiones sensibles.
- Intensidad ajustable para ambos efectos de privacidad.
- Capas y propiedades editables.
- Controladores visuales para redimensionar y rotar anotaciones seleccionadas; las guías no se incluyen en la exportación.

### 💾 Proyectos locales

- Guarda el documento completo como un archivo JSON portátil: imagen incorporada, marco, fondo, composición y anotaciones.
- Abre un proyecto más tarde desde el mismo equipo, navegador, extensión Chrome/Edge o extensión de VS Code.
- La carga valida el formato del proyecto y reinicia el historial para comenzar una nueva sesión de edición.

### 📤 Exportación

- Botones secundarios con estilos uniformes en los paneles de imagen, proyecto, recorte, redimensionado, anotaciones y exportación.
- Tarjeta de exportación con espaciado adicional alrededor de los botones Descargar y Copiar.
- Formatos PNG, JPEG y WebP.
- Calidad de salida ajustable.
- Descarga local.
- Copia al portapapeles cuando el navegador lo permite.
- Transparencia preservada en el archivo exportado.

---

## 📦 Instalación y desarrollo local

### Requisitos

- Node.js u otro servidor HTTP estático.
- Navegador moderno con soporte de ES Modules.

> No abras el editor con `file://`. Los módulos ES de JavaScript requieren HTTP o HTTPS.

### Ejecutar con Node.js

```bash
npx serve web
```

### Despliegue en GitHub Pages

La aplicación web está publicada en [https://carlosarman.github.io/screenshot-studio/](https://carlosarman.github.io/screenshot-studio/).

Cada push a `main` despliega automáticamente el contenido de [`web/`](./web/) mediante [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml). El workflow es necesario porque GitHub Pages solo permite publicaciones desde la raíz del repositorio o desde `/docs`; no puede usar directamente `web/` como directorio de origen.

---

## ⌨️ Atajos de teclado

| Tecla | Acción |
| --- | --- |
| `V` | Seleccionar |
| `T` | Texto |
| `N` | Callout numerado |
| `E` | Agregar emoji |
| `A` | Flecha |
| `R` | Rectángulo |
| `O` | Elipse |
| `P` | Pincel |
| `H` | Resaltador |
| `X` | Pixelar información sensible |
| `B` | Desenfocar información sensible |
| `Ctrl/Cmd + Z` | Deshacer |
| `Ctrl/Cmd + Shift + Z` o `Ctrl/Cmd + Y` | Rehacer |
| `Supr` / `Backspace` | Eliminar anotación seleccionada |
| `Esc` | Cancelar selección o gesto activo |

---

## 🧭 Extensión de navegador

La extensión Manifest V3 captura la pestaña activa y abre automáticamente la imagen en el editor integrado de Screenshot Studio. Las capturas se mantienen locales y están listas para aplicar marcos, fondos, anotaciones y exportación.

1. Abre `chrome://extensions` o `edge://extensions`.
2. Activa **Developer mode**.
3. Selecciona **Load unpacked**.
4. Elige el directorio [`browser-extension/`](./browser-extension).
5. Abre Screenshot Studio sobre una página web normal y elige un modo de captura:
   - **Capturar área visible** guarda el viewport actual.
   - **Capturar una parte de la página** muestra un selector visual; arrastra para delimitar el área y pulsa `Esc` para cancelar.
   - **Capturar toda la página** recorre el documento con scroll y une los segmentos en una sola imagen.
6. El editor integrado se abrirá automáticamente con la captura cargada, lista para enmarcar, anotar o exportar.

> Recarga la extensión desde `chrome://extensions` o `edge://extensions` después de cambiar sus archivos. Chrome/Edge no permiten capturar páginas protegidas como `chrome://`/`edge://`, Chrome Web Store ni visores PDF nativos. Las capturas de página completa están limitadas a **24 megapíxeles** para evitar un uso excesivo de memoria: un canvas RGBA necesita aproximadamente 4 bytes por píxel, por lo que 24 MP requiere cerca de 96 MB solo para el lienzo final, además de las capturas temporales y el editor. El límite reduce cierres de pestaña, bloqueos y fallos del service worker en equipos con memoria limitada.

---

## 💻 Extensión de VS Code

La extensión de VS Code abre imágenes locales en el mismo editor completo de Screenshot Studio: marcos, fondos, recorte visual, anotaciones, historial, zoom y exportación local.

Registra el comando:

```text
Screenshot Studio: Abrir imagen en el editor
```

También está disponible en el menú contextual del explorador para archivos PNG, JPG, JPEG y WebP.

---

## ♿ Accesibilidad y privacidad

Screenshot Studio incorpora:

- Estados de foco visible.
- Navegación por teclado en herramientas y controles seleccionables.
- Estados `aria-pressed` y feedback mediante regiones live.
- Controles accesibles alternativos para crear anotaciones.
- Valores visibles en rangos.
- Soporte para `prefers-reduced-motion`.
- Paneles responsive con controles de contraer/expandir.
- Procesamiento de imágenes exclusivamente local.

> Revisa siempre el archivo exportado antes de compartir información extremadamente sensible.

---

## 🏗️ Estructura del proyecto

```text
screenshot-studio/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── web/
│   ├── index.html
│   ├── favicon.svg
│   ├── assets/
│   ├── js/
│   │   ├── app.js
│   │   ├── store.js
│   │   ├── history.js
│   │   ├── canvas-editor.js
│   │   ├── annotations.js
│   │   ├── browser-frames.js
│   │   ├── image-import.js
│   │   ├── screen-capture.js
│   │   ├── export.js
│   │   └── status.js
│   └── styles/
│       ├── main.css
│       └── light-theme.css
├── browser-extension/
├── vscode-extension/
├── README.md
├── README.es.md
├── CHANGELOG.md
└── FRONTEND_AUDIT.md
```

---

## 🧪 Roadmap

Próximas mejoras planificadas:

- [x] Pixelado y desenfoque irreversibles para anotaciones de privacidad.
- [x] Presets para redes sociales.
- [x] Recorte y redimensionado de imagen.
- [x] Manejadores de redimensionado y rotación de anotaciones.
- [x] Guardar/cargar proyectos locales.
- [ ] Pruebas automatizadas de canvas, accesibilidad y responsive.

---

## 📄 Licencia

Este proyecto se distribuye con fines de desarrollo y demostración. Añade una licencia explícita antes de publicar una versión distribuible.
