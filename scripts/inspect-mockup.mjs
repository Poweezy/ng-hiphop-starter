import sharp from 'sharp';

const tiles = ['nav-hero', 'latest-drop', 'community', 'gallery', 'game'];

for (const tile of tiles) {
  // Resize to 400px wide for inspection, convert to JPEG for smaller size
  const buf = await sharp(`public/images/mockup-${tile}.png`)
    .resize(400)
    .jpeg({ quality: 60 })
    .toBuffer();
  console.log(`\n=== ${tile} ===`);
  console.log(`data:image/jpeg;base64,${buf.toString('base64').slice(0, 200)}...`);
  console.log(`(${buf.length} bytes)`);
}
