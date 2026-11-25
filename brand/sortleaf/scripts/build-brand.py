"""Rebuild SortLeaf's vector masters. Requires fonttools; does not edit the app."""
from pathlib import Path
from html import escape
import argparse
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--fonttools-path', help='Optional directory containing fontTools')
args = parser.parse_args()
if args.fonttools_path:
    sys.path.insert(0, args.fonttools_path)

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parent.parent
LOGOS = ROOT / 'logos'
PREVIEWS = ROOT / 'previews'
LOGOS.mkdir(exist_ok=True)
PREVIEWS.mkdir(exist_ok=True)
INK, FOREST, PAPER, LIME, IRIS = '#152C26', '#215C45', '#F7F8F2', '#D6F66B', '#6555A6'
MUTED = '#52665D'
FONTS = {name: TTFont(ROOT / 'fonts' / f'{name}-variable.ttf') for name in ('outfit', 'manrope')}


def text_path(text, x, y, size, fill=INK, family='manrope', weight=500, tracking=0):
    """Vector outlines with intentional optical tracking; no font dependency in SVGs."""
    font = FONTS[family]
    glyphs = font.getGlyphSet(location={'wght': weight})
    cmap = font.getBestCmap()
    scale = size / font['head'].unitsPerEm
    cursor = 0
    paths = []
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        pen = SVGPathPen(glyphs)
        glyph.draw(pen)
        data = pen.getCommands()
        if data:
            paths.append(f'<path transform="translate({cursor:.3f} 0)" d="{data}"/>')
        cursor += glyph.width + tracking / scale
    return f'<g fill="{fill}" transform="translate({x} {y}) scale({scale:.6f} {-scale:.6f})">{"".join(paths)}</g>'


def mark(x, y, size, fill=FOREST, ident='mark'):
    # A single botanical silhouette, divided by an S-shaped transparent channel.
    # The channel is 3.2 units wide (1.6 px at 16 px); no decorative fine strokes.
    return f'''<g transform="translate({x} {y}) scale({size / 32})">
      <defs><mask id="{ident}" x="0" y="0" width="32" height="32" maskUnits="userSpaceOnUse" style="mask-type:luminance">
        <rect width="32" height="32" fill="white"/>
        <path d="M1 22H14C26 22 6 10 18 10H31" fill="none" stroke="black" stroke-width="3.2"/>
      </mask></defs>
      <path d="M4 28V16C4 9.373 9.373 4 16 4H28V16C28 22.627 22.627 28 16 28Z" fill="{fill}" mask="url(#{ident})"/>
    </g>'''


def wordmark(x, y, scale=1, fill=INK):
    return f'<g transform="translate({x} {y}) scale({scale})">' + text_path('SortLeaf', 0, 58, 64, fill, 'outfit', 600, -0.8) + '</g>'


def lockup(x=0, y=0, scale=1, icon=FOREST, word=INK, ident='lockup'):
    return f'<g transform="translate({x} {y}) scale({scale})">' + mark(0, 0, 72, icon, ident) + wordmark(87, 0, 1, word) + '</g>'


def svg(width, height, content, title, desc='', background=None):
    bg = f'<rect width="{width}" height="{height}" fill="{background}"/>' if background else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc>{bg}{content}</svg>'''


def save(folder, filename, width, height, content, title, desc='', background=None):
    (folder / filename).write_text(svg(width, height, content, title, desc, background), encoding='utf-8')


def rect(x, y, w, h, fill, radius=0, stroke=None):
    border = f' stroke="{stroke}" stroke-width="1"' if stroke else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}"{border}/>'


save(LOGOS, 'sortleaf-horizontal.svg', 356, 88, lockup(8, 8), 'SortLeaf', 'Hoja dividida por un recorrido en S y nombre SortLeaf. Fondo transparente.')
save(LOGOS, 'sortleaf-icon.svg', 32, 32, mark(0, 0, 32), 'SortLeaf', 'Símbolo de hoja dividida en dos partes. Fondo transparente.')
save(LOGOS, 'sortleaf-monochrome.svg', 356, 88, lockup(8, 8, icon=INK, word=INK), 'SortLeaf monocromático', 'Una sola tinta oscura, fondo transparente.')
save(LOGOS, 'sortleaf-reversed.svg', 356, 88, lockup(8, 8, icon=LIME, word=PAPER), 'SortLeaf inverso', 'Lima y marfil para colocar sobre superficies oscuras. Fondo transparente.')
save(LOGOS, 'sortleaf-on-dark.svg', 420, 152, lockup(40, 40, icon=LIME, word=PAPER), 'SortLeaf sobre fondo oscuro', 'Aplicación con fondo tinta incluido.', INK)
save(LOGOS, 'sortleaf-monochrome-white.svg', 356, 88, lockup(8, 8, icon='#FFFFFF', word='#FFFFFF'), 'SortLeaf monocromático blanco', 'Una sola tinta blanca, fondo transparente.')
save(LOGOS, 'sortleaf-icon-monochrome.svg', 32, 32, mark(0, 0, 32, INK), 'SortLeaf icono monocromático')
save(LOGOS, 'sortleaf-icon-reversed.svg', 32, 32, mark(0, 0, 32, LIME), 'SortLeaf icono inverso')
favicon = rect(0, 0, 32, 32, FOREST, 8) + mark(1, 1, 30, LIME, 'favicon')
save(LOGOS, 'favicon.svg', 32, 32, favicon, 'SortLeaf favicon', 'Marca lima sobre recuadro bosque; legible en pestañas claras y oscuras.')
app_icon = rect(0, 0, 180, 180, FOREST) + mark(18, 18, 144, LIME, 'apple')
save(LOGOS, 'apple-touch-icon.svg', 180, 180, app_icon, 'SortLeaf icono para inicio')

# A designed identity sheet, intentionally not a website mockup.
board = []
board += [text_path('SORTLEAF / IDENTIDAD DE MARCA', 80, 65, 16, FOREST, weight=700, tracking=1.2)]
board += [text_path('01 — PROPUESTA', 1290, 65, 16, MUTED, weight=600)]
board += [lockup(68, 130, 1.85, ident='hero-mark')]
board += [text_path('Cada residuo,', 80, 365, 72, INK, 'outfit', 500, -1.1)]
board += [text_path('un siguiente paso.', 80, 448, 72, INK, 'outfit', 500, -1.1)]
board += [text_path('Tu guía gratuita para separar y reciclar.', 84, 506, 26, MUTED, weight=500)]
board += [rect(1100, 130, 420, 420, FOREST, 36), mark(1175, 175, 270, LIME, 'large-mark')]
board += [text_path('CLARA · CERCANA · PRECISA', 1145, 511, 17, PAPER, weight=600, tracking=0.6)]
board += ['<path d="M80 601H1520" stroke="#DCE4D8"/>']
board += [text_path('UNA PALETA PARA ORIENTAR', 80, 646, 15, FOREST, weight=700, tracking=1.1)]
swatches = [('Bosque', FOREST, PAPER), ('Iris', IRIS, '#FFFFFF'), ('Lima', LIME, INK), ('Marfil', PAPER, INK), ('Tinta', INK, PAPER)]
for i, (label, color, fg) in enumerate(swatches):
    x = 80 + i * 292
    board += [rect(x, 676, 272, 160, color, 18, '#DCE4D8' if color == PAPER else None)]
    board += [text_path(label, x + 22, 725, 25, fg, 'outfit', 500)]
    board += [text_path(color, x + 22, 805, 18, fg, weight=600)]
board += [text_path('TIPOGRAFÍA', 80, 901, 15, FOREST, weight=700, tracking=1.1)]
board += [text_path('Claridad para actuar.', 80, 957, 42, INK, 'outfit', 500, -0.5)]
board += [text_path('Outfit / titulares y marca', 82, 1000, 21, MUTED, weight=500)]
board += [text_path('Fotografía un residuo. Aprende cómo separarlo.', 82, 1050, 21, INK, weight=500)]
board += [text_path('Manrope / lectura e interfaz', 82, 1086, 18, MUTED, weight=500)]
board += [rect(840, 882, 680, 228, INK, 24), lockup(906, 914, 1.35, LIME, PAPER, 'dark-board')]
board += [text_path('La misma identidad, también en oscuro.', 909, 1059, 20, PAPER, weight=500)]
board += ['<path d="M80 1154H1520" stroke="#DCE4D8"/>']
board += [lockup(76, 1180, 0.72, INK, INK, 'mono-board')]
board += [text_path('SÍMBOLO A TAMAÑO REAL', 890, 1205, 13, MUTED, weight=700, tracking=0.8)]
for i, size in enumerate((16, 24, 32, 48)):
    x = 1165 + i * 83
    board += [mark(x, 1185 + (48 - size) / 2, size, FOREST, f'small-{size}')]
    board += [text_path(f'{size}px', x, 1259, 14, MUTED, weight=500)]
board += [text_path('Fase 1 · Sistema visual propuesto para el rediseño completo', 80, 1303, 16, MUTED, weight=500)]
save(PREVIEWS, 'sortleaf-brand-board.svg', 1600, 1340, ''.join(board), 'SortLeaf: propuesta de identidad', 'Logo original, tagline, cinco colores principales, tipografías Outfit y Manrope, aplicación oscura, versión monocromática y símbolo a 16, 24, 32 y 48 píxeles.', PAPER)

# A separate native-size specimen makes the 16 px claim directly reviewable.
specimen = [text_path('SortLeaf · tamaños reales y variantes', 40, 48, 23, INK, 'outfit', 500)]
for row, (color, bg, label) in enumerate(((FOREST, PAPER, 'Símbolo / claro'), (LIME, INK, 'Símbolo / oscuro'))):
    y = 80 + row * 140
    specimen += [rect(24, y, 852, 122, bg, 16), text_path(label, 46, y + 40, 18, color)]
    for i, size in enumerate((16, 24, 32, 48, 64)):
        x = 290 + i * 110
        specimen += [mark(x, y + 20 + (64 - size) / 2, size, color, f'spec-{row}-{size}')]
        specimen += [text_path(f'{size}px', x, y + 106, 14, color)]
specimen += [lockup(40, 390, 1, ident='spec-lockup')]
specimen += [lockup(480, 390, 1, INK, INK, 'spec-mono')]
save(PREVIEWS, 'logo-size-check.svg', 900, 510, ''.join(specimen), 'Verificación de tamaños SortLeaf', 'Símbolo a tamaños reales de 16, 24, 32, 48 y 64 píxeles, en claro y oscuro.', '#FFFFFF')
print('SVG masters and identity boards rebuilt.')
