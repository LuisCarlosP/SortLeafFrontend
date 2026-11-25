# SortLeaf — Recursos y licencias

Revisión: 9 de noviembre de 2026. Este inventario documenta los recursos del rediseño de la landing. El uso gratuito de la aplicación no modifica la licencia de su código.

## Recursos del rediseño

| Recurso | Autor | Fuente | Licencia exacta | ¿Requiere atribución? |
| --- | --- | --- | --- | --- |
| Símbolo, marca SortLeaf, variantes, favicon y composiciones propias | Diseño elaborado para SortLeaf | [Paquete de identidad](brand/sortleaf/README.md) | Activos originales del proyecto; se conserva la licencia del repositorio. | Sin atribución externa adicional. |
| Outfit, fuente de titulares y base de los contornos del logo | The Outfit Project Authors | [Google Fonts / Outfit](https://github.com/google/fonts/tree/main/ofl/outfit) | SIL Open Font License 1.1 | No visible; conservar copyright y OFL al redistribuir las fuentes. |
| Manrope, fuente de lectura e interfaz | The Manrope Project Authors | [Google Fonts / Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | SIL Open Font License 1.1 | No visible; conservar copyright y OFL al redistribuir las fuentes. |
| Iconos Lucide utilizados en la landing | Lucide Icons and Contributors; Cole Bemis para los iconos derivados de Feather | [Licencia oficial](https://lucide.dev/license), [archivo del proyecto](https://github.com/lucide-icons/lucide/blob/main/LICENSE) | ISC y avisos MIT para el subconjunto derivado de Feather | No visible; conservar los avisos de copyright y permiso completos al distribuirlos. |
| Fotografías de portada y apoyo, con derivados WebP/AVIF | charlesdeluvio y cottonbro studio | [Botella de plástico](https://unsplash.com/photos/clear-plastic-bottle-on-white-table-edBR3b2JAuA) y [botellas de vidrio](https://www.pexels.com/photo/close-up-shot-of-empty-glass-bottles-7191423/) | [Unsplash License](https://unsplash.com/license) y [Pexels License](https://www.pexels.com/legal-pages/license/), respectivamente. | Los créditos se muestran en la página de recursos. |

Detalles del logo, TTF, WOFF2 y hashes: [licencias de identidad](brand/sortleaf/LICENSES.md) y [procedencia de fuentes](brand/sortleaf/fonts/README.md).

Avisos originales conservados:

- [Outfit OFL](brand/sortleaf/licenses/OFL-Outfit.txt).
- [Manrope OFL](brand/sortleaf/licenses/OFL-Manrope.txt).
- [Lucide ISC y Feather MIT](brand/sortleaf/licenses/Lucide-LICENSE.txt).

No se sustituye una licencia de fotografía por la licencia del código. Las modificaciones de tamaño, recorte y compresión no cambian la procedencia del original. Las atribuciones opcionales de los autores pueden mostrarse en la página de recursos como reconocimiento.

## Código y dependencias existentes

El código conserva [LICENSE](LICENSE), con copyright de Luis Carlos Picado Rojas y todos los derechos reservados. La incorporación de fuentes o iconos con licencias abiertas no relicencia el proyecto completo ni concede permisos adicionales sobre él.

Las dependencias de la aplicación conservan sus licencias respectivas dentro de sus paquetes. Este archivo es un inventario editorial de los recursos del rediseño, no una afirmación de que todas las dependencias existentes compartan la misma licencia.

## Laboratorio de visión local — 17 de noviembre de 2026

| Recurso | Versión / procedencia | Licencia |
| --- | --- | --- |
| Transformers.js | Hugging Face, 3.8.1 | Apache-2.0; aviso completo en `public/licenses/vision/Transformers-LICENSE.txt`. |
| ONNX Runtime Web | Microsoft, 1.22.0-dev.20250409-89f8206ba4, versión fijada por Transformers.js y el lockfile | MIT; conservar avisos de distribución. |
| SmolVLM 256M Instruct | [HuggingFaceTB](https://huggingface.co/HuggingFaceTB/SmolVLM-256M-Instruct), revisión `d039ab0d4b9311b617e8ffec1d06c8464364aeb3` | Apache-2.0, según la ficha del modelo. |
| SmolVLM 500M Instruct | [HuggingFaceTB](https://huggingface.co/HuggingFaceTB/SmolVLM-500M-Instruct), revisión `753c1752602b5e739af7a7fa6947a635051897a3` | Apache-2.0, según la ficha del modelo. |

Los pesos se descargan desde Hugging Face al pulsar «Cargar». No se incluyen en este repositorio ni se sirven desde Render. Las fotografías utilizadas en las pruebas técnicas son las dos imágenes del sitio ya inventariadas arriba; no constituyen un dataset anotado de evaluación.

Los avisos de ONNX se conservan en `public/licenses/vision/ONNX-Runtime-LICENSE.txt` y `ONNX-Runtime-ThirdPartyNotices.txt`, obtenidos de la etiqueta pública `v1.22.0` mediante el espejo jsDelivr. La compilación instalada es la prerelease indicada arriba; sus cabeceras declaran la misma licencia MIT. El archivo general de avisos incluye componentes de otras plataformas de ONNX, no solo el navegador.
