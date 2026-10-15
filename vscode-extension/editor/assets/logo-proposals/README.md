# Screenshot Studio — Sistema de Marca

## Propuesta seleccionada: Precision Spark

Marco de captura abierto con destello de cuatro puntas. Opción premium, abstracta y con identidad propia.

---

## Paleta de colores

| Token | HEX | Uso |
|---|---|---|
| Studio Violet | `#7766FF` | Gradiente principal, acento |
| Capture Cyan | `#22D3EE` | Gradiente secundario, foco, halo |
| Ink | `#090B12` | Fondo oscuro, texto de contraste |
| Ice White | `#F4F6FC` | Texto/iconos sobre badge |
| Muted Violet | `#A89FFF` | "Studio" en wordmark dark |
| Slate | `#526178` | Tagline light |
| Night Slate | `#7878A8` | Tagline dark |

**Gradiente principal:** `linear-gradient(135deg, #7766FF, #22D3EE)`

---

## Inventario de archivos

| Archivo | Dimensiones | Uso |
|---|---|---|
| `03-precision-spark.svg` | 920 × 240 | Imagotipo horizontal (fondos claros) |
| `03-precision-spark-dark.svg` | 760 × 140 | Imagotipo horizontal (fondos oscuros) |
| `03-precision-spark-icon.svg` | 240 × 240 | Isotipo — Favicon, avatar, extensión |
| `03-precision-spark-mono.svg` | 240 × 240 | Monocromo — Bordado, serigrafía, PDF |
| `03-precision-spark-stacked.svg` | 420 × 460 | Apilado — Redes sociales, tarjetas |
| `03-precision-spark-glow.svg` | 240 × 240 | Glow — Slides, banners (solo marketing) |

> ⚠️ La versión glow no debe usarse en producto, documentación técnica ni favicons.

---

## Tamaños mínimos recomendados

| Variante | Tamaño mínimo |
|---|---|
| Imagotipo horizontal | 200 px de ancho |
| Isotipo | 24 × 24 px |
| Apilado | 120 × 130 px |

---

## Fondos compatibles

| Variante | Fondos compatibles |
|---|---|
| Horizontal (`.svg`) | Blancos, grises claros, beige, neutros |
| Horizontal dark (`-dark.svg`) | Oscuros, navy, negros, grafito |
| Isotipo | Cualquier fondo (el badge es autosuficiente) |
| Monocromo | Únicamente oscuros o blancos puros |

---

## Normas de uso

- No deformar, rotar ni aplicar efectos no incluidos.
- No cambiar los colores del degradado ni del badge.
- No colocar el logo sobre fondos con contraste insuficiente.
- No usar la versión glow en interfaces de producto.
- Usar siempre versiones vectoriales (`-icon.svg`) como fuente principal.
- Para favicon de 16 × 16 px, convertir el isotipo a PNG mediante navegador o librería SVG.
- En PDF y presentaciones impresas, usar la variante monocromática.

---

## Tipografía del wordmark

**Familia:** Manrope (o Inter como fallback)
**"Screenshot":** `font-weight: 750`, `letter-spacing: -2.5`
**" Studio":** `font-weight: 500`, color `#5148C9` (light) o `#A89FFF` (dark)

> Nota: En la web el wordmark está en HTML puro dentro de `div.brand`. Para uso en otros contextos, convertir el texto a paths en Figma o Illustrator.
