/**
 * One-off asset optimizer: converts the large decorative PNG backgrounds to WebP.
 * Run: node scripts/optimize-bg-images.mjs
 */
import sharp from 'sharp';
import { stat, unlink } from 'node:fs/promises';
import path from 'node:path';

const IMAGES = [
  'public/images/latestdrop section.png',
  'public/images/community voice section.png',
  'public/images/gallery section.png',
  'public/images/texture.png',
];

const root = process.cwd();

for (const rel of IMAGES) {
  const src = path.join(root, rel);
  const dest = src.replace(/\.png$/i, '.webp');
  const info = await sharp(src).webp({ quality: 72 }).toFile(dest);
  const before = (await stat(src)).size;
  console.log(`${path.basename(rel)}: ${(before / 1024).toFixed(0)} KB -> ${(info.size / 1024).toFixed(0)} KB webp`);
  await unlink(src);
  console.log(`  deleted original ${path.basename(rel)}`);
}
