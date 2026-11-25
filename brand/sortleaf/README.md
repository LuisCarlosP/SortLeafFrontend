# SortLeaf — Paquete de identidad, Fase 1

Propuesta v1 para revisión visual. Se mantiene el producto gratuito. Estos archivos preparan el rediseño completo y no están importados en la aplicación actual.

## Revisar primero

1. [Lámina visual PNG](previews/sortleaf-brand-board.png).
2. [Guía completa](BRAND-GUIDE.md).
3. [Símbolo a tamaños reales](previews/logo-size-check.png).
4. [Paleta y contraste](CONTRAST.md).

## Estructura

```text
brand/sortleaf/
  BRAND-GUIDE.md       Concepto, logo, paleta, tipo, reglas y voz
  CONTRAST.md          Resultados y reglas de contraste
  contrast.json        Pares, colores, ratios y umbrales
  tokens.css           Variables CSS claras/oscuras, tipo y ritmo
  LICENSES.md          Recursos, procedencia y obligaciones
  VALIDATION.md        Comprobaciones realizadas y alcance pendiente
  logos/              SVG maestros; favicon PNG/ICO; icono Apple
  fonts/              Outfit y Manrope locales, CSS y procedencia
  licenses/           Textos originales OFL e ISC/MIT
  previews/           Láminas SVG vectoriales y PNG
  scripts/            Generadores reproducibles de los activos
```

Los SVG se pueden abrir directamente en un navegador o editor vectorial. El nombre del logo está convertido a contornos y no depende de las fuentes del equipo. Los PNG son para revisar; los SVG son los maestros para integrar.

## Uso posterior en el frontend

Cuando se aprueben identidad y contenido, importar `fonts/fonts.css` y `tokens.css` desde el código del frontend, manteniendo las rutas de los WOFF2, o copiar los recursos a una carpeta pública adaptando sus URLs. No servir los TTF en producción: están para edición y generación.

Los componentes consumirán variables semánticas, por ejemplo `--sl-color-primary`, `--sl-color-on-primary` y `--sl-color-text`. `data-sl-theme="dark"` cambia los valores semánticos. Las variables de movimiento solo funcionan si los componentes las utilizan.

Preservar los textos de licencia al distribuir las fuentes y los futuros iconos. `LICENSES.md` cubre esta fase; se ampliará con los recursos seleccionados posteriormente.

## Regenerar los gráficos

Para trabajar solo con los activos entregados no hace falta instalar nada. Para reconstruirlos se necesitan Python con fontTools y Node con sharp. Se usaron fontTools 4.68.0 y sharp 0.35.5. Estas herramientas no son dependencias de la aplicación.

Desde la raíz del frontend:

```powershell
python brand/sortleaf/scripts/build-brand.py
node brand/sortleaf/scripts/render-brand.mjs
```

Si las bibliotecas están fuera del entorno estándar:

```powershell
python brand/sortleaf/scripts/build-brand.py --fonttools-path RUTA_A_PAQUETES_PYTHON
node brand/sortleaf/scripts/render-brand.mjs --sharp RUTA_AL_MODULO_ENTRYPOINT_DE_SHARP
```

El primer comando regenera SVG; el segundo PNG e ICO. Los comandos sobrescriben solamente los derivados de marca que generan. Si se cambia la paleta en `tokens.css`, actualizar el generador visual y recalcular `contrast.json`/`CONTRAST.md` antes de presentar otra versión.

La aprobación de esta fase da paso a estrategia y contenido. La maquetación, integración de componentes, pruebas responsive, SEO y Lighthouse corresponden a la fase de desarrollo.
