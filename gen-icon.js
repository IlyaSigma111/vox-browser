const fs = require('fs')
const zlib = require('zlib')

// Generate a 256x256 white "V" icon on transparent background as PNG
function createPNG(width, height, pixels) {
  function crc32(buf) {
    let c = 0xFFFFFFFF
    const table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let v = n
      for (let k = 0; k < 8; k++) v = v & 1 ? 0xEDB88320 ^ (v >>> 1) : v >>> 1
      table[n] = v
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
    return (c ^ 0xFFFFFFFF) >>> 0
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const typeAndData = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(typeAndData))
    return Buffer.concat([len, typeAndData, crc])
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA

  // IDAT - raw pixels with filter byte 0 per row
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4
      const di = y * (1 + width * 4) + 1 + x * 4
      raw[di] = pixels[si]
      raw[di + 1] = pixels[si + 1]
      raw[di + 2] = pixels[si + 2]
      raw[di + 3] = pixels[si + 3]
    }
  }
  const compressed = zlib.deflateSync(raw)

  // IEND
  const iend = Buffer.alloc(0)

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ])
}

const SIZE = 256
const pixels = Buffer.alloc(SIZE * SIZE * 4)

// Draw "V" shape in white
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const idx = (y * SIZE + x) * 4
    // V shape: two diagonal lines meeting at bottom center
    const cx = SIZE / 2
    const cy = SIZE * 0.5
    const thickness = 28

    // Left stroke: from top-left to bottom-center
    const lx = cx - (SIZE * 0.35) * (1 - y / (SIZE * 0.85))
    const inLeft = Math.abs(x - lx) < thickness && y > SIZE * 0.1 && y < SIZE * 0.88

    // Right stroke: from top-right to bottom-center
    const rx = cx + (SIZE * 0.35) * (1 - y / (SIZE * 0.85))
    const inRight = Math.abs(x - rx) < thickness && y > SIZE * 0.1 && y < SIZE * 0.88

    // Bottom join
    const inBottom = Math.abs(x - cx) < thickness * 1.5 && y > SIZE * 0.78 && y < SIZE * 0.88

    if (inLeft || inRight || inBottom) {
      pixels[idx] = 255
      pixels[idx + 1] = 255
      pixels[idx + 2] = 255
      pixels[idx + 3] = 255
    } else {
      pixels[idx] = 0
      pixels[idx + 1] = 0
      pixels[idx + 2] = 0
      pixels[idx + 3] = 0
    }
  }
}

const png = createPNG(SIZE, SIZE, pixels)
fs.writeFileSync('build/icon.png', png)
console.log('Icon generated: build/icon.png (' + png.length + ' bytes)')
