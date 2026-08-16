import sharp from 'sharp';

const tiles = [
  { name: 'nav-hero',    file: 'public/images/mockup-nav-hero.png' },
  { name: 'latest-drop', file: 'public/images/mockup-latest-drop.png' },
  { name: 'community',   file: 'public/images/mockup-community.png' },
  { name: 'gallery',     file: 'public/images/mockup-gallery.png' },
  { name: 'game',        file: 'public/images/mockup-game.png' },
];

for (const t of tiles) {
  const { data, info } = await sharp(t.file).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;

  const bright = [];
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = (r + g + b) / 3;
      if (lum > 130) bright.push({ x, y, r, g, b, lum: Math.round(lum) });
    }
  }

  bright.sort((a, b) => b.lum - a.lum);
  console.log(`\n=== ${t.name} (${w}x${h}) — top bright pixels ===`);
  bright.slice(0, 20).forEach(p =>
    console.log(`  (${p.x},${p.y}) rgb(${p.r},${p.g},${p.b}) lum=${p.lum}`)
  );
}
