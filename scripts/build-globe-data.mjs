// Precomputes the land dots used by the footprint globe.
// Run with `npm run globe` — output is committed so the browser never
// ships the (heavy) world geometry.
import { writeFileSync } from 'node:fs';
import { getMapJSON } from 'dotted-map';

const R = 6378137;
const map = JSON.parse(getMapJSON({ height: 96, grid: 'vertical', projection: { name: 'equirectangular' } }));
const toDeg = (m) => (m / R) * (180 / Math.PI);

const dots = [];
for (const { x, y } of Object.values(map.points)) {
  const lng = toDeg((x * map.X_RANGE) / map.width + map.X_MIN);
  const lat = toDeg(map.Y_MAX - (y * map.Y_RANGE) / map.height);
  if (lat < -58) continue; // skip Antarctica
  // Thin rows towards the poles so the sphere has an even density.
  const stride = Math.max(1, Math.round(1 / Math.cos((lat * Math.PI) / 180)));
  if (Math.round(x) % stride !== 0) continue;
  dots.push(+lat.toFixed(2), +lng.toFixed(2));
}

writeFileSync(new URL('../src/data/globe-dots.json', import.meta.url), JSON.stringify(dots));
console.log(`globe: ${dots.length / 2} dots`);
