# Registro de cambios

Todos los cambios relevantes de Screenshot Studio se documentarán en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) y este proyecto sigue [Versionado Semántico](https://semver.org/lang/es/).

<p align="center">
  <a href="./CHANGELOG.md">🇬🇧 English</a> &nbsp;|&nbsp; <a href="./CHANGELOG.es.md">🇪🇸 Español</a>
</p>

## [Sin publicar]

### Añadido

- Recorte visual estilo editor de imágenes, con marco arrastrable, controladores de esquinas y bordes, máscara exterior, aplicar/cancelar y restauración de la imagen original durante la sesión.
- Editor de Screenshot Studio integrado y sincronizado para las extensiones de navegador y VS Code, con marcos, fondos, recorte visual, anotaciones, historial y exportación local.
- Modos de captura de extensión para el área visible, una parte seleccionada de la página y toda la página desplazable.
- Selector visual de área de página con soporte para cancelar mediante `Esc`.
- Iconos de extensión para Chrome/Edge (16, 32, 48 y 128 px) y VS Code (128 px), generados a partir del icono de marca del proyecto.

### Corregido

- La tarjeta de exportación ahora preserva el espacio inferior y lateral alrededor de los botones Descargar y Copiar, incluso al ser la última sección del panel.
- Restaurado el puente de la extensión hacia el editor empaquetado, para que las capturas de los tres modos se carguen en el lienzo automáticamente.
- Las capturas de área visible y área seleccionada ahora apuntan explícitamente a la ventana de la pestaña activa, evitando que la extensión capture una ventana equivocada o no pueda obtener la imagen.
- La captura de página completa ahora respeta la cuota de Chrome de dos llamadas por segundo a `captureVisibleTab`, con una espera y un reintento seguro ante límites de ventana deslizante.

### Cambiado

- Los estilos compartidos del editor, incluido el espaciado de exportación, se sincronizan en la aplicación web, la extensión Chrome/Edge y la extensión de VS Code.
- Las capturas de la extensión de navegador se transfieren mediante almacenamiento local al editor integrado, en vez de abrir la URL de datos de imagen cruda en una pestaña separada.
- Mejora de etiquetas, feedback de estado, agrupación semántica y comportamiento de foco accesible en el popup de la extensión.
- La captura de página completa restaura la posición de scroll original después de unir los segmentos capturados.

### Planificado

- Pixelado o desenfoque irreversible para regiones de privacidad.
- Presets de composición para redes sociales.
- Recorte, redimensionado y rotación de imagen/anotaciones.
- Soporte para guardar y cargar proyectos locales.
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

[Sin publicar]: https://github.com/CarlosArman/screenshot-studio/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/CarlosArman/screenshot-studio/releases/tag/v0.1.0
