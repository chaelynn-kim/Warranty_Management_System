import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function decodePng(buf) {
  if (buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('Not a PNG')
  let pos = 8
  let width = 0
  let height = 0
  let colorType = 0
  const idats = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      colorType = data[9]
      if (data[8] !== 8) throw new Error('Only 8-bit PNG supported')
    } else if (type === 'IDAT') {
      idats.push(data)
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }
  const inflated = zlib.inflateSync(Buffer.concat(idats))
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : 1
  const stride = width * bpp
  const rgba = Buffer.alloc(width * height * 4)
  let ip = 0
  const prev = Buffer.alloc(stride)
  const row = Buffer.alloc(stride)

  const paeth = (a, b, c) => {
    const p = a + b - c
    const pa = Math.abs(p - a)
    const pb = Math.abs(p - b)
    const pc = Math.abs(p - c)
    if (pa <= pb && pa <= pc) return a
    if (pb <= pc) return b
    return c
  }

  for (let y = 0; y < height; y++) {
    const filter = inflated[ip++]
    for (let i = 0; i < stride; i++) row[i] = inflated[ip++]
    for (let i = 0; i < stride; i++) {
      const left = i >= bpp ? row[i - bpp] : 0
      const up = prev[i]
      const upLeft = i >= bpp ? prev[i - bpp] : 0
      let v = row[i]
      if (filter === 1) v = (v + left) & 255
      else if (filter === 2) v = (v + up) & 255
      else if (filter === 3) v = (v + Math.floor((left + up) / 2)) & 255
      else if (filter === 4) v = (v + paeth(left, up, upLeft)) & 255
      else if (filter !== 0) throw new Error(`Unsupported filter ${filter}`)
      row[i] = v
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4
      if (colorType === 6) {
        const s = x * 4
        rgba[o] = row[s]
        rgba[o + 1] = row[s + 1]
        rgba[o + 2] = row[s + 2]
        rgba[o + 3] = row[s + 3]
      } else if (colorType === 2) {
        const s = x * 3
        rgba[o] = row[s]
        rgba[o + 1] = row[s + 1]
        rgba[o + 2] = row[s + 2]
        rgba[o + 3] = 255
      } else if (colorType === 0) {
        rgba[o] = rgba[o + 1] = rgba[o + 2] = row[x]
        rgba[o + 3] = 255
      } else if (colorType === 4) {
        const s = x * 2
        rgba[o] = rgba[o + 1] = rgba[o + 2] = row[s]
        rgba[o + 3] = row[s + 1]
      } else {
        throw new Error(`Unsupported colorType ${colorType}`)
      }
    }
    row.copy(prev)
  }
  return { width, height, rgba }
}

function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1)
    raw[start] = 0
    rgba.copy(raw, start + 1, y * stride, y * stride + stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** NeonTitleIcon(CSS mask)용: 어두운 획=불투명 검정, 밝은 배경=투명 */
function toMaskIcon(rgba) {
  const out = Buffer.alloc(rgba.length)
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i]
    const g = rgba[i + 1]
    const b = rgba[i + 2]
    const a = rgba[i + 3]
    const luminance = (r + g + b) / 3
    // 이미 투명한 픽셀 유지, 밝은 픽셀도 배경
    const ink = a > 10 && luminance < 200 ? Math.round(255 - luminance) : 0
    out[i] = 0
    out[i + 1] = 0
    out[i + 2] = 0
    out[i + 3] = ink
  }
  return out
}

const src = process.argv[2]
const dest = process.argv[3]
if (!src || !dest) {
  console.error('Usage: node scripts/fix-mask-icon.mjs <src.png> <dest.png>')
  process.exit(1)
}

const decoded = decodePng(fs.readFileSync(src))
const masked = toMaskIcon(decoded.rgba)
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.writeFileSync(dest, encodePng(decoded.width, decoded.height, masked))
console.log('wrote', dest, decoded.width + 'x' + decoded.height)
