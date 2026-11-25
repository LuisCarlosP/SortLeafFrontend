"""Build the SortLeaf Open Graph image from the approved vector identity.

Requires fonttools, Node.js and sharp. Optional --fonttools-path and --sharp
arguments support isolated tool installations without adding app dependencies.
"""
import argparse
from pathlib import Path
import re
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--fonttools-path')
parser.add_argument('--sharp', default='sharp', help='Module name or absolute entry point')
parser.add_argument('--node', default='node')
args = parser.parse_args()
if args.fonttools_path:
    sys.path.insert(0, args.fonttools_path)

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parent.parent
PROJECT = ROOT.parent.parent
PAPER, INK, FOREST, LIME, MUTED = '#F7F8F2', '#152C26', '#215C45', '#D6F66B', '#52665D'
FONTS = {name: TTFont(ROOT / 'fonts' / f'{name}-variable.ttf') for name in ('outfit', 'manrope')}


def outlines(text, x, y, size, family='outfit', weight=500, fill=INK):
    """Use the local OFL fonts as outlines for deterministic SVG rendering."""
    font = FONTS[family]
    glyphs = font.getGlyphSet(location={'wght': weight})
    cmap = font.getBestCmap()
    scale = size / font['head'].unitsPerEm
    cursor = 0
    paths = []
    for character in text:
        glyph = glyphs[cmap[ord(character)]]
        pen = SVGPathPen(glyphs)
        glyph.draw(pen)
        if pen.getCommands():
            paths.append(f'<path transform="translate({cursor} 0)" d="{pen.getCommands()}"/>')
        cursor += glyph.width
    return f'<g fill="{fill}" transform="translate({x} {y}) scale({scale} {-scale})">{"".join(paths)}</g>'


def symbol(filename, x, y, scale):
    source = (ROOT / 'logos' / filename).read_text(encoding='utf-8')
    content = re.sub(r'^<svg[^>]*>|</svg>\s*$|<title.*?</title>|<desc.*?</desc>', '', source, flags=re.S)
    return f'<g transform="translate({x} {y}) scale({scale})">{content}</g>'


svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="og-title og-description">
<title id="og-title">SortLeaf — Cada residuo, un siguiente paso.</title>
<desc id="og-description">Tu guía gratuita para separar y reciclar. Identidad original de SortLeaf en verde bosque, marfil y lima.</desc>
<rect width="1200" height="630" fill="{PAPER}"/>
<path d="M891 0H1200V630H853V120Q853 0 891 0Z" fill="{FOREST}"/>
<path d="M853 547H1200" stroke="#387055" stroke-width="1"/>
{symbol('sortleaf-horizontal.svg', 56, 52, .85)}
{outlines('Cada residuo,', 64, 290, 78)}
<path d="M66 398Q310 376 701 397" fill="none" stroke="{LIME}" stroke-width="17"/>
{outlines('un siguiente paso.', 64, 380, 78)}
{outlines('Tu guía gratuita para separar y reciclar.', 66, 466, 25, 'manrope', 500, MUTED)}
<path d="M64 547H789" stroke="#D7E0D7" stroke-width="1"/>
{outlines('Separar mejor empieza con una foto.', 66, 584, 18, 'manrope', 500, MUTED)}
{symbol('sortleaf-icon-reversed.svg', 858, 155, 10.6)}
</svg>'''

vector_path = ROOT / 'previews' / 'og-sortleaf.svg'
png_path = PROJECT / 'public' / 'images' / 'sortleaf' / 'og-sortleaf.png'
vector_path.parent.mkdir(parents=True, exist_ok=True)
png_path.parent.mkdir(parents=True, exist_ok=True)
vector_path.write_text(svg, encoding='utf-8')

render = '''
import { pathToFileURL } from 'node:url';
import { isAbsolute } from 'node:path';
const [modulePath, source, destination] = process.argv.slice(1);
const {default: sharp} = await import(isAbsolute(modulePath) ? pathToFileURL(modulePath).href : modulePath);
await sharp(source).png({compressionLevel: 9}).toFile(destination);
'''
subprocess.run([args.node, '--input-type=module', '-e', render, args.sharp, str(vector_path), str(png_path)], check=True)
print(f'Built {png_path} (1200 x 630).')
