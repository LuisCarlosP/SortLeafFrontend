# Fuentes de SortLeaf

Revisión y descarga: 8 de noviembre de 2026. Los archivos se descargaron sin modificar desde Google Fonts. No se añadieron dependencias al proyecto.

## Familias y uso

| Familia | Autor reconocido en la licencia | Rol | Pesos de uso | Rango del archivo variable |
| --- | --- | --- | --- | --- |
| Manrope | The Manrope Project Authors | Texto, controles, formularios y datos | 400, 500, 600, 700 | 200–800 |
| Outfit | The Outfit Project Authors | Titulares y logotipo | 500, 600; logotipo 600 | 100–900 |

Ambas familias utilizan SIL Open Font License 1.1 (OFL-1.1), permiten uso comercial sin pago y no requieren una mención visible en la interfaz. Al redistribuir los archivos tipográficos, se deben conservar los avisos de copyright y el texto OFL correspondiente. Las fuentes no se pueden vender solas. Los documentos y logotipos producidos con ellas no quedan sujetos a OFL por utilizar las fuentes.

Los avisos exactos se conservan en `../licenses/OFL-Manrope.txt` y `../licenses/OFL-Outfit.txt`.

## Archivos y procedencia

| Archivo | Tamaño | Fuente oficial |
| --- | ---: | --- |
| `manrope-variable.ttf` | 164700 bytes | https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf |
| `outfit-variable.ttf` | 110884 bytes | https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf |
| `manrope-latin-ext-variable.woff2` | 15160 bytes | https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggmxSuXd.woff2 |
| `manrope-latin-variable.woff2` | 24532 bytes | https://fonts.gstatic.com/s/manrope/v23/xn7gYHE41ni1AdIRggexSg.woff2 |
| `outfit-latin-ext-variable.woff2` | 14808 bytes | https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJuktqQ4E.woff2 |
| `outfit-latin-variable.woff2` | 32292 bytes | https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2 |

`google-fonts-original.css` conserva la respuesta original de la API oficial para estos rangos variables. Solo se descargaron los subconjuntos `latin` y `latin-ext` que necesita la interfaz en español/inglés. Los TTF completos quedan disponibles para edición y conversión del logotipo a contornos.

API consultada: https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Outfit:wght@100..900&display=swap

## Uso local

`fonts.css` declara ambas familias mediante WOFF2 locales, rangos Unicode y `font-display: swap`. La interfaz puede usar `font-family: 'Manrope', sans-serif` y los títulos `font-family: 'Outfit', sans-serif`. Cargar este CSS desde el paquete de marca no introduce solicitudes a Google.

Para el sitio final, copiar esta carpeta junto a sus licencias y conservar las rutas relativas, o adaptar explícitamente los `url()` si se cambia su ubicación. No hace falta cargar los TTF en la web. Los pesos no necesitan archivos separados.

## Verificación

Se inspeccionaron las tablas `cmap` y `fvar` de ambos TTF. Se confirmó que ambos contienen `áéíóúüñÁÉÍÓÚÜÑ¿¡` y que sus rangos variables corresponden a los declarados arriba.

SHA-256 de los archivos originales descargados:

```text
3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6  manrope-variable.ttf
fc7287273e66929776e2ba54f144fe699080bec29f61bf649d70d871468aeade  outfit-variable.ttf
2f7335119075b2079f1d882530bbc18728461612bf90743203d73a74a48f4d9b  manrope-latin-ext-variable.woff2
8c2def024c1bf31aacf3624ae3c4d701269b4ec3dc765c04830839f0d36b2d9e  manrope-latin-variable.woff2
0f53d1c03b3918d744a843b5039001ee31695ca1e255e3914188df81beb461e9  outfit-latin-ext-variable.woff2
6c18d579fd87c3776be068b762cbc83fde3acb543d49eabd3ade842eb987e887  outfit-latin-variable.woff2
```

## Fuentes primarias de licencias

- Manrope: https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt
- Outfit: https://github.com/google/fonts/blob/main/ofl/outfit/OFL.txt
- Lucide: https://lucide.dev/license y https://github.com/lucide-icons/lucide/blob/main/LICENSE

Lucide se propone para iconografía de interfaz, separado del símbolo original de SortLeaf. Su licencia principal es ISC. El archivo completo `../licenses/Lucide-LICENSE.txt` también conserva los avisos MIT aplicables a los iconos derivados de Feather. Mantener dichos avisos al distribuir iconos; no requiere atribución visual en la interfaz. En esta tarea no se han descargado iconos.
