# SortLeaf — Verificación de Fase 1

8 de noviembre de 2026 · Propuesta v1.

## Comprobaciones realizadas

- [x] Concepto, tres adjetivos, promesa, tagline y descriptor documentados.
- [x] Marca horizontal, símbolo, monocromática, inversa y aplicación sobre fondo oscuro.
- [x] 12 documentos SVG analizados como XML: 10 activos y 2 láminas. Todos tienen `viewBox`, título accesible e IDs únicos dentro de cada archivo.
- [x] Nombre y texto de las láminas convertidos a contornos. Ningún SVG contiene scripts, fuentes remotas, imágenes enlazadas ni objetos HTML.
- [x] Lámina principal y muestra de tamaños renderizadas a PNG e inspeccionadas visualmente. Sin recortes observados.
- [x] Símbolo inspeccionado a 16, 24, 32, 48 y 64px sobre superficies claras y oscuras. A 16px conserva la silueta y el canal central.
- [x] Dimensiones PNG verificadas: favicon 16/32/48/192/512px e icono Apple 180px.
- [x] Favicon ICO abierto correctamente; contiene tres entradas de 16, 32 y 48px.
- [x] 62 pares de contraste recalculados de forma independiente desde `tokens.css`: los colores coinciden con `contrast.json`, todos los ratios superan el umbral aplicable y coinciden con el informe.
- [x] Texto normal definido en la paleta ≥4,5:1; bordes/foco ≥3:1. Pares claros y oscuros. Combinaciones no permitidas documentadas.
- [x] Dos familias OFL, TTF originales y WOFF2 locales con `font-display: swap`.
- [x] Caracteres españoles y rangos variables comprobados; hashes y fuentes originales documentados.
- [x] Avisos OFL e ISC/MIT conservados. Inventario de recursos y herramientas completado.
- [x] Enlaces locales de la documentación revisados.
- [x] Revisión visual adicional independiente: sin bloqueos; se unificó «Marfil» y se documentó cómo evitar colisiones de IDs al usar SVG inline.

## Alcance

La verificación cubre la identidad y sus activos. La revisión WCAG de una página completa requiere comprobar estructura, interacción, contenido y estados reales, además de colores. Responsive a 360/768/1024/1440px, teclado, lector de pantalla, formularios, SEO, rendimiento y Lighthouse se comprobarán durante el desarrollo del rediseño.

Los recursos se encuentran aislados en `brand/sortleaf/`; no se han importado en la aplicación. No se ejecutó una compilación de la aplicación porque esta entrega no modifica su código ni sus dependencias.

Pendiente: aprobación de la dirección visual antes de avanzar a la Fase 2.
