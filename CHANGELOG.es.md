# Registro de cambios

Todos los cambios relevantes de Screenshot Studio se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

<p align="center">
  <a href="./CHANGELOG.md">🇬🇧 English</a> &nbsp;|&nbsp; <a href="./CHANGELOG.es.md">🇪🇸 Español</a>
</p>

## [Sin publicar]

---

## [0.3.0] - 2026-10-22

### Añadido

- **Modal de compartir en redes sociales** — un botón Compartir en el panel de Exportación abre un modal con accesos directos a ocho plataformas: X/Twitter, LinkedIn, WhatsApp, Telegram, Facebook, Reddit, Pinterest e Instagram.
- Integración con la **Web Share API**: cuando el navegador o dispositivo lo soporta, el archivo de imagen se comparte directamente mediante la hoja de compartir nativa del sistema (Android, iOS, Chrome/Edge de escritorio).
- Los botones de plataforma descargan la imagen compuesta automáticamente y luego abren la red social en una nueva pestaña para que pueda adjuntarse de inmediato.
- Todos los iconos de plataformas usan SVGs oficiales de marca en línea (sin librerías externas de iconos).
- La disponibilidad del botón Compartir está sincronizada con la de Exportar: se desactiva hasta que se cargue una imagen.
- El modal es completamente accesible: `role="dialog"`, `aria-modal`, `aria-labelledby`, cierre con `Escape`, cierre al hacer clic en el overlay y foco devuelto al botón disparador al cerrar.
- **Anotaciones Accesibles** ahora incluye todos los tipos de herramienta del toolbar: añadidos los botones Agregar círculo, Agregar pincel y Agregar resaltador, cubriendo los 10 tipos de anotación.
- **Sincronización bidireccional** entre Anotaciones Accesibles y el toolbar: al hacer clic en un botón de anotación accesible se activa la herramienta correspondiente en el toolbar, y al seleccionar una herramienta del toolbar se resalta el botón correspondiente en Anotaciones Accesibles.
- Las coordenadas de las anotaciones accesibles se calculan dinámicamente a partir del padding actual y la altura de la barra del marco, de modo que siempre aparecen dentro del área de contenido de la imagen.

### Corregido

- Restaurado el pegado de imágenes con `Ctrl + V` / `Cmd + V`: los atajos de herramientas de una sola tecla ya no interceptan combinaciones nativas modificadas del portapapeles en la aplicación web, la extensión Chrome/Edge y el editor de VS Code.

---

## [0.2.0] - 2026-10-19

### Añadido

- Sitio público en GitHub Pages: [carlosarman.github.io/screenshot-studio](https://carlosarman.github.io/screenshot-studio/).
- Workflow de GitHub Actions que despliega el contenido de `web/` en GitHub Pages al subir cambios a `main`.
- Recorte visual estilo editor de imágenes, con marco arrastrable, controladores de esquinas y bordes, máscara exterior, aplicar/cancelar y restauración de la imagen original durante la sesión.
- Editor de Screenshot Studio integrado y sincronizado para las extensiones de navegador y VS Code, con marcos, fondos, recorte visual, anotaciones, historial y exportación local.
- Modos de captura de extensión para el área visible, una parte seleccionada de la página y toda la página desplazable.
- Selector visual de área de página con soporte para cancelar mediante `Esc`.
- Iconos de extensión para Chrome/Edge (16, 32, 48 y 128 px) y VS Code (128 px), generados a partir del icono de marca del proyecto.
- Herramientas de privacidad independientes para pixelar (`X`) y desenfocar (`B`) regiones sensibles, disponibles en la aplicación web y en los editores integrados de Chrome/Edge y VS Code.
- Controles accesibles para crear anotaciones de pixelado o desenfoque y ajustar la intensidad de cada efecto.
- Presets de composición para X/Twitter (1600 × 900), LinkedIn (1200 × 627), Instagram cuadrado (1080 × 1080), Instagram vertical (1080 × 1350) y Stories/Reels (1080 × 1920), disponibles en la aplicación web y en los editores integrados de Chrome/Edge y VS Code.
- Los presets generan un lienzo de salida con dimensiones exactas y centran la captura ajustada proporcionalmente dentro de él.
- Herramienta de emojis editable, disponible en la barra de anotaciones, mediante el atajo `E` y desde los controles accesibles; incluye un selector de emojis predefinidos y ajuste de tamaño desde Propiedades.
- Acciones de eliminación contextuales mediante el botón × en cada capa de anotación.
- Iconografía de las herramientas de anotación renovada para distinguir mejor su función.
- Redimensionado de imagen por ancho y alto en píxeles, con bloqueo de proporción, suavizado de alta calidad y validación del límite de 24 megapíxeles.
- Controladores visuales para redimensionar y rotar anotaciones seleccionadas, con historial deshacer/rehacer y guías excluidas de las exportaciones.
- Guardado y carga de proyectos locales portables en JSON, con la imagen incorporada y el estado completo de composición y anotaciones.
- Acción para quitar la imagen actual y limpieza global de anotaciones, además de la eliminación individual por capa.

### Corregido

- La tarjeta de exportación ahora preserva el espacio inferior y lateral alrededor de los botones Descargar y Copiar, incluso al ser la última sección del panel.
- Restaurado el puente de la extensión hacia el editor empaquetado, para que las capturas de los tres modos se carguen en el lienzo automáticamente.
- Las capturas de área visible y área seleccionada ahora apuntan explícitamente a la ventana de la pestaña activa, evitando que la extensión capture una ventana equivocada o no pueda obtener la imagen.
- La captura de página completa ahora respeta la cuota de Chrome de dos llamadas por segundo a `captureVisibleTab`, con una espera y un reintento seguro ante límites de ventana deslizante.
- Las guías visuales de selección ya no se dibujan en el canvas, por lo que no aparecen en las imágenes descargadas ni copiadas.

### Cambiado

- Los estilos compartidos del editor, incluido el espaciado de exportación, se sincronizan en la aplicación web, la extensión Chrome/Edge y la extensión de VS Code.
- Las capturas de la extensión de navegador se transfieren mediante almacenamiento local al editor integrado, en vez de abrir la URL de datos de imagen cruda en una pestaña separada.
- Mejora de etiquetas, feedback de estado, agrupación semántica y comportamiento de foco accesible en el popup de la extensión.
- La captura de página completa restaura la posición de scroll original después de unir los segmentos capturados.
- Los efectos de privacidad se rasterizan durante la composición final; las exportaciones contienen solo píxeles pixelados o desenfocados, sin una máscara ni región nítida recuperable.
- Unificados los estilos de botones secundarios en los paneles de imagen, proyecto, recorte, redimensionado, anotaciones y exportación.

### Planificado

- Pruebas automatizadas de canvas, accesibilidad y diseño responsive.

---

## [0.1.0] - 2026-10-13

### Añadido

- Editor de imágenes estático construido con HTML, CSS y JavaScript nativo.
- Importación local de imágenes PNG, JPEG y WebP.
- Importación desde selector de archivos, arrastrar y soltar y portapapeles.
- Validación de tipo de archivo, límite de 15 MB y máximo de 24 megapíxeles.
- Área central de importación de imágenes con feedback visual al arrastrar.
- Captura de pantalla y ventana mediante `getDisplayMedia`.
- Fondos de composición sólidos, degradados y transparentes.
- Presets de fondo Aurora, Sunset, Ocean, Berry, Midnight y Lime.
- Controles de padding, radio de esquina, sombra y escala.
- Marcos macOS, Windows, Linux/GNOME, navegador genérico, Safari, Chrome y Terminal.
- Temas de marco claro y oscuro.
- Marco Chrome con controles atrás, actualizar, inicio, minimizar, maximizar y cerrar.
- Marco Linux inspirado en GNOME, con icono de aplicación y controles centrados.
- Anotaciones de texto, números, flechas, rectángulos, elipses, pincel, resaltador y privacidad.
- Panel de capas y controles de propiedades de anotación.
- Historial de deshacer y rehacer.
- Exportación PNG, JPEG y WebP.
- Copia de exportación al portapapeles cuando el navegador lo permite.
- Controles de zoom del canvas.
- Preferencias de tema sistema, claro y oscuro.
- Paneles laterales contraíbles con estado persistente.
- Extensión de navegador Manifest V3 para capturar la pestaña visible.
- Extensión de VS Code para abrir vistas previas de imágenes locales.
- Favicon y sistema de marca Precision Spark.
- Documentación README en inglés y español.

### Cambiado

- Renovación completa de la interfaz: paneles, chips, inputs, selects y botones secundarios.
- Jerarquía visual mejorada mediante divisores de sección y acentos de color.
- Reemplazo del placeholder negro del canvas por una superficie de marca azul pizarra.
- Patrón checkerboard gris para representar áreas transparentes del canvas.
- Tooltips de herramientas reposicionados debajo de la barra superior.
- Transiciones mejoradas al contraer y expandir paneles laterales.
- Comportamiento responsive para viewports compactos.
- Contraste mejorado en gradientes activos con texto blanco.
- Rediseño de marcos de canvas Chrome, Safari y Linux/GNOME.

### Accesibilidad

- Estados de selección mediante `aria-pressed`.
- Navegación por teclado en grupos de herramientas y opciones.
- Región `aria-live` para feedback de acciones.
- Estilos de foco visible para controles interactivos.
- Valores visibles para controles de rango.
- Controles alternativos accesibles para crear anotaciones.
- Soporte para `prefers-reduced-motion`.

### Seguridad

- Procesamiento local de imágenes sin backend.
- Uso de Object URLs para archivos importados.
- Límites de tamaño, tipo y dimensiones de imagen.
- Etiquetas de capas renderizadas mediante nodos DOM seguros.

---

[Sin publicar]: https://github.com/CarlosArman/screenshot-studio/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/CarlosArman/screenshot-studio/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/CarlosArman/screenshot-studio/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/CarlosArman/screenshot-studio/releases/tag/v0.1.0
