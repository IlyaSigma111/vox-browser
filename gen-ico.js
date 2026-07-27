// Convert icon.png to icon.ico (256x256 + 48x48 + 32x32 + 16x16)
const fs = require('fs')
const { execSync } = require('child_process')

// We'll create ICO manually from the PNG by embedding PNGs inside ICO format
const pngData = fs.readFileSync('build/icon.png')

function readPNGSize(buf) {
  // IHDR is at offset 16 (8 sig + 4 len + 4 type)
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  return { w, h }
}

// ICO format: header + directory entries + PNG data for each size
const sizes = [16, 32, 48, 256]
const images = []

for (const size of sizes) {
  // Use sharp-like resize via canvas-free approach: just embed the 256 PNG
  // For simplicity, embed the same 256px PNG for all entries
  // Windows will scale it
  images.push({ size, data: pngData })
}

const headerSize = 6
const dirEntrySize = 16
const dirSize = dirEntrySize * images.length
let dataOffset = headerSize + dirSize

const header = Buffer.alloc(headerSize)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: ICO
header.writeUInt16LE(images.length, 4) // image count

const dir = Buffer.alloc(dirSize)
const dataBuffers = []

for (let i = 0; i < images.length; i++) {
  const { size, data } = images[i]
  const off = dirEntrySize * i
  dir[off] = size > 255 ? 0 : size // width
  dir[off + 1] = size > 255 ? 0 : size // height
  dir[off + 2] = 0 // color palette
  dir[off + 3] = 0 // reserved
  dir.writeUInt16LE(1, off + 4) // color planes
  dir.writeUInt16LE(32, off + 6) // bits per pixel
  dir.writeUInt32LE(data.length, off + 8) // data size
  dir.writeUInt32LE(dataOffset, off + 12) // data offset
  dataBuffers.push(data)
  dataOffset += data.length
}

const ico = Buffer.concat([header, dir, ...dataBuffers])
fs.writeFileSync('build/icon.ico', ico)
console.log('ICO generated: build/icon.ico (' + ico.length + ' bytes)')
