// Generates placeholder PNG icons with zero dependencies (no ImageMagick/Pillow
// required) by writing raw PNG bytes directly. Good enough to scaffold with —
// swap these for real branded icons later via https://maskable.app or
// https://realfavicongenerator.net.
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BG = [59, 31, 38]; // #3b1f26 (--accent-contrast) — dark backdrop so the mark pops
const FG = [229, 133, 156]; // #e5859c (--accent / Red from the brand palette)

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

// Draws a filled square background with a centered circle "mark" in the
// accent color. `padding` (0-0.5) controls how much margin surrounds the
// circle — maskable icons need extra padding so the mark survives being
// cropped to a shape.
function drawPixels(size, padding) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - size * padding;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const inCircle = dx * dx + dy * dy <= radius * radius;
      const [r, g, b] = inCircle ? FG : BG;
      const offset = (y * size + x) * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

function encodePng(size, padding) {
  const pixels = drawPixels(size, padding);

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

const targets = [
  { file: 'icon-192.png', size: 192, padding: 0.18 },
  { file: 'icon-512.png', size: 512, padding: 0.18 },
  { file: 'icon-maskable-512.png', size: 512, padding: 0.3 }, // extra padding = safe zone
  { file: 'apple-touch-icon.png', size: 180, padding: 0.18 }, // iOS ignores alpha; ours is opaque anyway
];

for (const { file, size, padding } of targets) {
  fs.writeFileSync(path.join(outDir, file), encodePng(size, padding));
  console.log(`wrote public/icons/${file} (${size}x${size})`);
}
