import sharp from 'sharp';

const tiles = ['nav-hero', 'latest-drop', 'community', 'gallery', 'game'];

for (const tile of tiles) {
  const img = sharp(`public/images/mockup-${tile}.png`);
  const { width, height } = await img.metadata();
  
  // Sample a grid of pixels to understand the color layout
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  
  // Sample 5x5 grid
  const samples = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = Math.floor((col / 4) * (width - 1));
      const y = Math.floor((row / 4) * (height - 1));
      const idx = (y * width + x) * 3;
      samples.push(`(${x},${y}): rgb(${data[idx]},${data[idx+1]},${data[idx+2]})`);
    }
  }
  
  console.log(`\n=== ${tile} (${width}x${height}) ===`);
  samples.forEach(s => console.log(' ', s));
}
