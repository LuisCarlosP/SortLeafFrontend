# SortLeaf — Procedencia y licencias de Fase 1

Revisión: 8 de noviembre de 2026. Este inventario cubre el paquete de identidad, no reemplaza la licencia del código existente ni una auditoría de todas sus dependencias.

## Recursos incluidos

| Recurso | Autor | Fuente | Licencia / condición | ¿Requiere atribución? |
| --- | --- | --- | --- | --- |
| Símbolo SortLeaf, composiciones, guía y tokens | Diseño original elaborado para este proyecto | [Generador local](scripts/build-brand.py) y archivos de este paquete | Activos originales del proyecto; sin recurso gráfico externo ni coste de licencia adicional. Se conserva la licencia del repositorio. | No hay proveedor gráfico externo que atribuir. |
| Tipografía Outfit y contornos del nombre en el logotipo | The Outfit Project Authors | [Google Fonts / Outfit](https://github.com/google/fonts/tree/main/ofl/outfit) | SIL Open Font License 1.1. El logotipo generado con la fuente no queda sujeto a OFL. | No visible. Conservar copyright y OFL al distribuir archivos de fuente. |
| Tipografía Manrope | The Manrope Project Authors | [Google Fonts / Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | SIL Open Font License 1.1. Uso comercial sin pago. | No visible. Conservar copyright y OFL al distribuir archivos de fuente. |
| WOFF2 de ambas familias | Autores anteriores; distribución Google Fonts | [API oficial](https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Outfit:wght@100..900&display=swap); [URLs y SHA-256 por archivo](fonts/README.md) | Misma OFL-1.1; archivos sin modificar. | Misma conservación de avisos. |
| PNG, favicon ICO e icono Apple | Derivados de los SVG propios | [Generador de exportaciones](scripts/render-brand.mjs) | Mismas condiciones que los activos originales. | No hay atribución externa adicional. |

Textos originales conservados: [Outfit OFL](licenses/OFL-Outfit.txt) y [Manrope OFL](licenses/OFL-Manrope.txt). Las fuentes pueden utilizarse en un producto gratuito o comercial; no pueden venderse solas. No se está modificando ni renombrando ninguna fuente.

## Selección para fases posteriores

| Recurso | Autor | Fuente | Licencia | ¿Requiere atribución? |
| --- | --- | --- | --- | --- |
| Lucide, biblioteca propuesta de iconos (no incorporada aún) | Lucide Contributors; Cole Bemis para iconos derivados de Feather | [Licencia oficial](https://lucide.dev/license) y [archivo original](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | ISC; avisos MIT adicionales según el subconjunto. No describir toda la biblioteca simplemente como MIT. | No visible. Conservar los avisos incluidos en [Lucide-LICENSE.txt](licenses/Lucide-LICENSE.txt). |

No se utilizaron fotografías de stock, ilustraciones de terceros ni imágenes generadas en esta fase. Cada recurso futuro tendrá su propia fila con autor, URL y licencia exacta.

## Herramientas de producción

No se distribuyen sus binarios ni se añaden al frontend. Se mencionan para reproducir los activos:

| Herramienta | Fuente | Licencia | Uso |
| --- | --- | --- | --- |
| fontTools | [Repositorio oficial](https://github.com/fonttools/fonttools) | MIT | Convertir glifos a contornos SVG. |
| sharp | [Repositorio oficial](https://github.com/lovell/sharp) | Apache-2.0 | Rasterizar las vistas previas y generar derivados PNG. |

Las condiciones de las herramientas se aplican a su distribución; no convierten los gráficos producidos en recursos con atribución visible obligatoria.
