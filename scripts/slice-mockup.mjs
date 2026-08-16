import sharp from 'sharp';

const sections = [
  { name: 'nav-hero',    top: 0,    height: 420 },
  { name: 'latest-drop', top: 420,  height: 420 },
  { name: 'community',   top: 840,  height: 420 },
  { name: 'gallery',     top: 1260, height: 300 },
  { name: 'game',        top: 1560, height: 321 },
];

for (const sec of sections) {
  await sharp('public/images/mockup.png')
    .extract({ left: 0, top: sec.top, width: 836, height: sec.height })
    .toFile(`public/images/mockup-${sec.name}.png`);
  console.log('✓', sec.name);
}
