/**
 * Generates og-image.jpg and twitter-image.jpg in /public.
 * Run once: node scripts/generate-og-images.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const svgOg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#08080c"/>
  <rect x="0" y="0" width="1200" height="4" fill="#8b5cf6"/>
  <text x="600" y="280" font-family="Arial,sans-serif" font-size="72" font-weight="bold"
        fill="white" text-anchor="middle">NG Hip Hop</text>
  <text x="600" y="370" font-family="Arial,sans-serif" font-size="32"
        fill="#8b5cf6" text-anchor="middle">Built From Bars. Raised By Beats.</text>
  <text x="600" y="440" font-family="Arial,sans-serif" font-size="22"
        fill="rgba(255,255,255,0.5)" text-anchor="middle">ng-hiphop.com</text>
</svg>`;

const svgTwitter = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600">
  <rect width="1200" height="600" fill="#08080c"/>
  <rect x="0" y="0" width="1200" height="4" fill="#8b5cf6"/>
  <text x="600" y="265" font-family="Arial,sans-serif" font-size="72" font-weight="bold"
        fill="white" text-anchor="middle">NG Hip Hop</text>
  <text x="600" y="350" font-family="Arial,sans-serif" font-size="32"
        fill="#8b5cf6" text-anchor="middle">Built From Bars. Raised By Beats.</text>
  <text x="600" y="415" font-family="Arial,sans-serif" font-size="22"
        fill="rgba(255,255,255,0.5)" text-anchor="middle">ng-hiphop.com</text>
</svg>`;

await sharp(Buffer.from(svgOg)).jpeg({ quality: 90 }).toFile(path.join(publicDir, 'og-image.jpg'));
console.log('✓ public/og-image.jpg');

await sharp(Buffer.from(svgTwitter)).jpeg({ quality: 90 }).toFile(path.join(publicDir, 'twitter-image.jpg'));
console.log('✓ public/twitter-image.jpg');
