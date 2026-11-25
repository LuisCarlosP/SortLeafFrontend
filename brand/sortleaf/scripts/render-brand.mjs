/** Raster derivatives for preview and favicon export; SVGs remain the masters. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sharpArgument = process.argv.indexOf('--sharp');
const sharpModule = sharpArgument >= 0
  ? pathToFileURL(resolve(process.argv[sharpArgument + 1])).href
  : 'sharp';
const { default: sharp } = await import(sharpModule);

for (const name of ['sortleaf-brand-board', 'logo-size-check']) {
  await sharp(await readFile(resolve(root, 'previews', `${name}.svg`)))
    .png().toFile(resolve(root, 'previews', `${name}.png`));
}
const favicon = await readFile(resolve(root, 'logos', 'favicon.svg'));
for (const size of [16, 32, 48, 192, 512]) {
  await sharp(favicon).resize(size, size).png()
    .toFile(resolve(root, 'logos', `favicon-${size}.png`));
}
await sharp(await readFile(resolve(root, 'logos', 'apple-touch-icon.svg')))
  .png().toFile(resolve(root, 'logos', 'apple-touch-icon.png'));

// PNG-compressed ICO directory, supported by modern Windows/browser clients.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((size) => readFile(resolve(root, 'logos', `favicon-${size}.png`))));
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (let index = 0; index < sizes.length; index += 1) {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index];
  directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(pngs[index].length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += pngs[index].length;
}
await writeFile(resolve(root, 'logos', 'favicon.ico'), Buffer.concat([directory, ...pngs]));
console.log('PNG previews, Apple touch icon and favicon exports rebuilt.');
