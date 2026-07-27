const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')

const SIZE = 512

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

function createIcon() {
  const png = new PNG({ width: SIZE, height: SIZE })
  const cx = SIZE / 2
  const cy = SIZE / 2
  const R = SIZE * 0.42

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      const d = dist(x, y, cx, cy)

      // Anti-aliased circle
      const circleEdge = R - 2
      const circleAlpha = Math.min(1, Math.max(0, (R + 1 - d) / 3))

      if (circleAlpha <= 0) {
        png.data[i] = 0; png.data[i+1] = 0; png.data[i+2] = 0; png.data[i+3] = 0
        continue
      }

      // V shape: two strokes meeting at bottom center
      const vColor = [192, 202, 245] // fg color

      // Left stroke: from (-0.18, -0.22) to (0, 0.24) in normalized coords
      const lx1 = cx - R * 0.38, ly1 = cy - R * 0.52
      const lx2 = cx, ly2 = cy + R * 0.55
      const lDx = lx2 - lx1, lDy = ly2 - ly1
      const lLen = Math.sqrt(lDx * lDx + lDy * lDy)
      const lNx = -lDy / lLen, lNy = lDx / lLen
      const lT = Math.max(0, Math.min(1, ((x - lx1) * lDx + (y - ly1) * lDy) / (lLen * lLen)))
      const lPx = lx1 + lT * lDx, lPy = ly1 + lT * lDy
      const lDist = dist(x, y, lPx, lPy)

      // Right stroke: from (0.18, -0.22) to (0, 0.24) in normalized coords
      const rx1 = cx + R * 0.38, ry1 = cy - R * 0.52
      const rx2 = cx, ry2 = cy + R * 0.55
      const rDx = rx2 - rx1, rDy = ry2 - ry1
      const rLen = Math.sqrt(rDx * rDx + rDy * rDy)
      const rT = Math.max(0, Math.min(1, ((x - rx1) * rDx + (y - ry1) * rDy) / (rLen * rLen)))
      const rPx = rx1 + rT * rDx, rPy = ry1 + rT * rDy
      const rDist = dist(x, y, rPx, rPy)

      const strokeW = SIZE * 0.04
      const lAlpha = Math.min(1, Math.max(0, (strokeW + 1 - lDist) / 2))
      const rAlpha = Math.min(1, Math.max(0, (strokeW + 1 - rDist) / 2))
      const vAlpha = Math.min(1, lAlpha + rAlpha)

      if (d < circleEdge) {
        // Inside circle
        if (vAlpha > 0.1) {
          // V stroke — blend
          png.data[i] = vColor[0]
          png.data[i+1] = vColor[1]
          png.data[i+2] = vColor[2]
          png.data[i+3] = Math.round(255 * circleAlpha)
        } else {
          // Dark fill
          png.data[i] = 26
          png.data[i+1] = 27
          png.data[i+2] = 38
          png.data[i+3] = Math.round(255 * circleAlpha)
        }
      } else if (d < R + 1) {
        // Border — accent purple with AA
        png.data[i] = 122
        png.data[i+1] = 162
        png.data[i+2] = 247
        png.data[i+3] = Math.round(255 * circleAlpha)
      } else {
        png.data[i] = 0; png.data[i+1] = 0; png.data[i+2] = 0; png.data[i+3] = 0
      }
    }
  }

  return png
}

const icon = createIcon()
const pngBuf = PNG.sync.write(icon)

const outDir = path.join(__dirname, 'build')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon.png'), pngBuf)

// Generate multi-size ICO
function createIco(pngBufs) {
  const entries = []
  let offset = 6 + pngBufs.length * 16
  for (const { size, data } of pngBufs) {
    entries.push({
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      colors: 0, reserved: 0, planes: 1, bpp: 32,
      size: data.length, offset
    })
    offset += data.length
  }
  const header = Buffer.alloc(6 + entries.length * 16)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  entries.forEach((e, i) => {
    const b = 6 + i * 16
    header.writeUInt8(e.width, b)
    header.writeUInt8(e.height, b + 1)
    header.writeUInt8(e.colors, b + 2)
    header.writeUInt8(e.reserved, b + 3)
    header.writeUInt16LE(e.planes, b + 4)
    header.writeUInt16LE(e.bpp, b + 6)
    header.writeUInt32LE(e.size, b + 8)
    header.writeUInt32LE(e.offset, b + 12)
  })
  return Buffer.concat([header, ...pngBufs.map(e => e.data)])
}

const sizes = [16, 24, 32, 48, 64, 128, 256]
const pngBufs = []
for (const s of sizes) {
  const p = new PNG({ width: s, height: s })
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const sx = Math.min(SIZE - 1, Math.floor(x * SIZE / s))
      const sy = Math.min(SIZE - 1, Math.floor(y * SIZE / s))
      const si = (sy * SIZE + sx) * 4
      const di = (y * s + x) * 4
      p.data[di] = icon.data[si]
      p.data[di+1] = icon.data[si+1]
      p.data[di+2] = icon.data[si+2]
      p.data[di+3] = icon.data[si+3]
    }
  }
  pngBufs.push({ size: s, data: PNG.sync.write(p) })
}

const icoBuf = createIco(pngBufs)
fs.writeFileSync(path.join(outDir, 'icon.ico'), icoBuf)
console.log('icon.png:', pngBuf.length, 'bytes (512x512)')
console.log('icon.ico:', icoBuf.length, 'bytes (7 sizes)')
