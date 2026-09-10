// Generates placeholder PNG icons with zero dependencies (no ImageMagick/Pillow
// required) by writing raw PNG bytes directly. Good enough to scaffold with —
// swap these for real branded icons later via https://maskable.app or
// https://realfavicongenerator.net.
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { phaseSegments, DEFAULT_SETTINGS } from '../src/cycle/phaseEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BG = [59, 31, 38]; // #3b1f26 (--accent-contrast) — dark backdrop so the wheel pops

// Same four hues as the phase badges/progress bar in src/styles.css.
const PHASE_COLORS = {
  menstrual: [229, 133, 156], // #e5859c (Red)
  follicular: [255, 164, 137], // #ffa489 (Vermillion)
  ovulatory: [255, 178, 185], // #ffb2b9 (Coral Pink)
  luteal: [255, 182, 217], // #ffb6d9 (Pink)
};

// Wedge sizes come straight from phaseSegments() — the same function the
// dashboard's progress bar uses — so the icon always reflects the real
// day-length proportions of each phase rather than a hand-picked split.
function buildWedges() {
  const segments = phaseSegments(DEFAULT_SETTINGS);
  let cumulative = 0;

  return segments.map(({ phase, startDay, endDay }) => {
    const lengthDays = endDay - startDay + 1;
    cumulative += lengthDays / DEFAULT_SETTINGS.avgCycleLength;
    return { color: PHASE_COLORS[phase], end: cumulative };
  });
}

// Angle from center, 0 at 12 o'clock, increasing clockwise, normalized to
// [0, 1) — matches how a pie chart is conventionally read.
function wedgeColorAt(dx, dy, wedges) {
  let angle = Math.atan2(dx, -dy);
  if (angle < 0) angle += Math.PI * 2;
  const fraction = angle / (Math.PI * 2);

  for (const wedge of wedges) {
    if (fraction < wedge.end) return wedge.color;
  }
  return wedges[wedges.length - 1].color; // floating-point edge case at fraction ~= 1
}

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());

  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Draws a filled square background with a centered "wheel" mark, colored by
// phase-proportional wedges. `padding` (0-0.5) controls how much margin
// surrounds the circle — maskable icons need extra padding so the mark
// survives being cropped to a shape.
function drawPixels(size, padding, wedges) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - size * padding;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const inCircle = dx * dx + dy * dy <= radius * radius;
      const [r, g, b] = inCircle ? wedgeColorAt(dx, dy, wedges) : BG;
      const offset = (y * size + x) * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

function encodePng(size, padding, wedges) {
  const pixels = drawPixels(size, padding, wedges);

  // Each scanline needs a leading filter-type byte (0 = "none").
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const wedges = buildWedges();

const targets = [
  { file: 'icon-192.png', size: 192, padding: 0.18 },
  { file: 'icon-512.png', size: 512, padding: 0.18 },
  { file: 'icon-maskable-512.png', size: 512, padding: 0.3 }, // extra padding = safe zone
  { file: 'apple-touch-icon.png', size: 180, padding: 0.18 }, // iOS ignores alpha; ours is opaque anyway
];

for (const { file, size, padding } of targets) {
  fs.writeFileSync(path.join(outDir, file), encodePng(size, padding, wedges));
  console.log(`wrote public/icons/${file} (${size}x${size})`);
}
