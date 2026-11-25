# SortLeaf — Paleta y contraste

Identidad v1 · 8 de noviembre de 2026.

Se verificaron **62 combinaciones de uso: 62 aprobadas y 0 fallidas**. Los colores de marca originales se conservan. Este informe comprueba la paleta; la accesibilidad de la futura página dependerá también de su contenido, estructura, estados y navegación.

## Criterio y cálculo

Para todo texto normal se exige **4,5:1**, incluso si un titular grande podría utilizar el umbral menor permitido por WCAG. Para bordes de controles y foco se exige **3:1** frente a sus superficies adyacentes. Referencias oficiales: [WCAG 2.2, contraste de texto](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) y [contraste no textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

Para cada canal sRGB `c` entre 0 y 1: `c / 12.92` si `c <= 0.04045`, o `((c + 0.055) / 1.055) ** 2.4` en otro caso. La luminancia es `L = 0.2126R + 0.7152G + 0.0722B`; el contraste es `(Lmayor + 0.05) / (Lmenor + 0.05)`. Se compara el valor sin redondear; las tablas muestran dos decimales.

Los resultados proceden de los valores leídos en `tokens.css`, resolviendo sus referencias `var()`. El detalle completo, los umbrales y las combinaciones rechazadas están en [contrast.json](contrast.json). Se calcularon colores opacos; transparencias, imágenes y degradados requieren revisar el color resultante.

## Paleta de marca

| Rol | Color | HEX | Uso |
| --- | --- | --- | --- |
| Primario | Bosque | `#215C45` | Botones principales, enlaces e identidad sobre fondo claro. |
| Secundario | Iris | `#6555A6` | Ayuda, interacción secundaria y foco. |
| Acento | Lima | `#D6F66B` | Énfasis puntual y superficies con texto tinta. |
| Neutro de texto | Tinta | `#152C26` | Texto principal y contenido sobre lima. |
| Neutro de fondo | Marfil | `#F7F8F2` | Fondo principal de lectura. |
| Neutro de superficie | Blanco | `#FFFFFF` | Superficies elevadas y texto sobre bosque/iris. |
| Texto secundario | Musgo | `#52665D` | Descripciones y microcopy legibles. |
| Borde funcional | Salvia | `#74867A` | Contornos de campos y controles. |
| Separador decorativo | Niebla | `#DCE4D8` | Divisiones no esenciales. |
| Éxito | Verde | `#236846` | Texto de éxito sobre `#EAF4EC`. |
| Error | Rojo arcilla | `#B6383C` | Texto de error sobre `#FCECEE`. |
| Información | Azul | `#4B5FAD` | Texto informativo sobre `#EEF0FA`. |

## Pares principales verificados

| Primer plano | Fondo | Contraste | Resultado |
| --- | --- | ---: | --- |
| Bosque `#215C45` | Marfil `#F7F8F2` | 7,33:1 | AA, texto normal |
| Blanco `#FFFFFF` | Bosque `#215C45` | 7,83:1 | AA, texto normal |
| Iris `#6555A6` | Marfil `#F7F8F2` | 5,78:1 | AA, texto normal |
| Blanco `#FFFFFF` | Iris `#6555A6` | 6,17:1 | AA, texto normal |
| Tinta `#152C26` | Lima `#D6F66B` | 12,15:1 | AA, texto normal |
| Musgo `#52665D` | Marfil `#F7F8F2` | 5,75:1 | AA, texto normal |
| Salvia `#74867A` | Marfil `#F7F8F2` | 3,62:1 | AA, borde funcional |
| Éxito `#236846` | `#EAF4EC` | 5,94:1 | AA, texto normal |
| Error `#B6383C` | `#FCECEE` | 5,08:1 | AA, texto normal |
| Información `#4B5FAD` | `#EEF0FA` | 5,22:1 | AA, texto normal |

También se verificaron texto principal, texto secundario, enlaces, iris, bordes y foco sobre las tres superficies claras: marfil, blanco y `#EDF2E8`. Los textos de estado pasan sobre su superficie correspondiente, marfil y blanco. Los botones principales pasan tanto en reposo como en hover.

## Tema oscuro

Se activa explícitamente con `data-sl-theme="dark"`. Fondo `#11251F`, superficie `#1B332B`, superficie suave `#234237`, texto marfil `#F7F8F2` y texto secundario `#B6C9BC`. El primario cambia a lima con texto tinta; el secundario y el foco usan iris claro `#C7B5F1`.

| Uso | Primer plano / fondo | Contraste | Resultado |
| --- | --- | ---: | --- |
| Texto secundario sobre la superficie más clara | `#B6C9BC` / `#234237` | 6,33:1 | AA, texto normal |
| Iris claro sobre la superficie más clara | `#C7B5F1` / `#234237` | 5,93:1 | AA, texto normal |
| Borde funcional sobre la superficie más clara | `#7A9184` / `#234237` | 3,26:1 | AA, borde funcional |
| Éxito | `#B8E3C4` / `#163D2D` | 8,52:1 | AA, texto normal |
| Error | `#FFBFC0` / `#4A2429` | 8,55:1 | AA, texto normal |
| Información | `#C5D0FF` / `#222D50` | 8,88:1 | AA, texto normal |

Los mismos pares funcionales del tema claro se verifican en las tres superficies oscuras. El cambio de tema no consiste en invertir todos los colores: conserva la jerarquía con pares específicos.

## Reglas de aplicación

- **Lima lleva texto tinta, nunca blanco.** Blanco sobre lima da 1,22:1; lima sobre marfil da 1,14:1. El acento funciona como superficie, decoración o marca sobre fondos oscuros, y no como texto sobre fondos claros.
- Los separadores sutiles son decorativos. Un campo cuyo límite sea necesario para reconocerlo utilizará `--sl-color-border-control`. Si una acción con fondo lima necesita un contorno distinguible sobre marfil, utilizará bosque como borde.
- Los estados incluirán texto y un icono o símbolo; nunca dependerán únicamente del color. Un resultado de clasificación no se marca como «éxito» si solo representa una predicción aún incierta.
- Los enlaces dentro de párrafos llevarán subrayado. El color por sí solo no distingue siempre un enlace del texto principal.
- Foco sugerido: `outline: 3px solid var(--sl-color-focus); outline-offset: 3px;`. Mantener un espacio visual del color de superficie entre el control y el anillo. Revisar overlays y contenedores que puedan recortarlo.
- La validación presupone las superficies indicadas. Sobre fotografías se utilizará una superficie opaca detrás del texto, o se comprobará la combinación concreta.

## Tipografía, ritmo y movimiento

Las variables definen Outfit para titulares y Manrope para lectura, con pesos 400/500/600/700. Cuerpo de 16px, texto secundario de 14px y 12px reservado para metadatos no esenciales, respetando siempre las preferencias del usuario mediante `rem`. Los títulos escalan de 24 a 64px; display de 40 a 64px con `clamp()`.

Espaciado basado en 4px; radios de 8, 12, 20 y 28px; contenedor máximo de 1200px; lectura de 68 caracteres; objetivos táctiles de 44px como mínimo. Las duraciones de 120/180/280ms pasan a cero con `prefers-reduced-motion`, y el desplazamiento decorativo se elimina. Los componentes deberán consumir estos tokens y no incorporar animaciones independientes que ignoren esa preferencia.

Breakpoints documentados: 480, 768, 1024 y 1440px, con diseño base de 360px. Las variables CSS de breakpoint son documentación: **no se pueden usar mediante `var()` dentro de una condición `@media` nativa**. Usar valores literales o transformarlos durante compilación.

La escala responsive, los objetivos táctiles y la navegación por teclado se comprobarán en la fase de desarrollo. Este paquete de identidad no modifica la aplicación actual.
