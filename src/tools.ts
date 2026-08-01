// Pure text/number tools backing the Feature Store palette commands.

export function evalMath(expr: string): string | null {
  const e = expr.replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**').replace(/%/g, '/100')
  if (!/^[\d\s+\-*/().%e]+$/.test(e)) return null
  try {
    const r = Function(`"use strict";return (${e})`)()
    if (typeof r !== 'number' || !isFinite(r)) return null
    return String(Math.round(r * 1e8) / 1e8)
  } catch { return null }
}

const UNIT_GROUPS: Record<string, Record<string, number>> = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, nm: 1852 },
  mass: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.0283495231, t: 1000, st: 6.35029318 },
  volume: { l: 1, ml: 0.001, m3: 1000, gal: 3.78541, qt: 0.946353, pt: 0.473176, cup: 0.236588, floz: 0.0295735 },
  speed: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444, 'ft/s': 0.3048 },
  data: { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 },
}

export function convertUnits(q: string): string | null {
  // e.g. "units 5km in mi" | "units 30c in f"
  const m = q.match(/^units\s+([\d.]+)\s*([a-zA-Z%]+)\s+(?:in|to|->|→)\s+([a-zA-Z%]+)$/i)
  if (m) {
    const val = parseFloat(m[1])
    const from = m[2].toLowerCase()
    const to = m[3].toLowerCase()
    const temp: Record<string, number> = { c: 1, f: 2, k: 3 }
    if (temp[from] && temp[to]) {
      let c: number
      if (from === 'c') c = val
      else if (from === 'f') c = (val - 32) * 5 / 9
      else c = val - 273.15
      const out = to === 'c' ? c : to === 'f' ? c * 9 / 5 + 32 : c + 273.15
      return `${m[1]} ${from} = ${Math.round(out * 100) / 100} ${to}`
    }
    for (const g of Object.keys(UNIT_GROUPS)) {
      const table = UNIT_GROUPS[g]
      if (table[from] && table[to]) {
        const out = val * table[from] / table[to]
        return `${m[1]} ${from} = ${Math.round(out * 10000) / 10000} ${to}`
      }
    }
    return null
  }
  return null
}

export function convertBase(q: string): string | null {
  // :hex 255 | :bin 13 | :oct 8 | :dec ff
  const m = q.match(/^:(hex|bin|oct|dec)\s+([0-9a-fA-Fx]+)$/)
  if (!m) return null
  const [base, radix] = m[1] === 'hex' ? ['hex', 16] : m[1] === 'bin' ? ['bin', 2] : m[1] === 'oct' ? ['oct', 8] : ['dec', 10]
  let s = m[2]
  if (radix !== 10 && /^0x/i.test(s)) s = s.slice(2)
  const dec = parseInt(s, radix)
  if (isNaN(dec)) return null
  return `${m[1]} ${m[2]} = ${dec} (dec) · 0x${dec.toString(16)} · 0b${dec.toString(2)} · 0o${dec.toString(8)}`
}

export function genPassword(len: number): string {
  const sets = ['abcdefghjkmnpqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '!@#$%^&*-_+=?']
  let out = ''
  const all = sets.join('')
  for (let i = 0; i < len; i++) out += all[Math.floor(Math.random() * all.length)]
  sets.forEach(s => { if (!out.split('').some(c => s.includes(c))) out = out.slice(0, -1) + s[Math.floor(Math.random() * s.length)] })
  return out
}

export function genUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function parseColor(q: string): { hex: string; rgb: string; hsl: string } | null {
  const m = q.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  const rs = r / 255, gs = g / 255, bs = b / 255
  const mx = Math.max(rs, gs, bs), mn = Math.min(rs, gs, bs)
  const l = (mx + mn) / 2
  let hue = 0, sat = 0
  if (mx !== mn) {
    const d = mx - mn
    sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    if (mx === rs) hue = ((gs - bs) / d + (gs < bs ? 6 : 0)) * 60
    else if (mx === gs) hue = ((bs - rs) / d + 2) * 60
    else hue = ((rs - gs) / d + 4) * 60
  }
  return {
    hex: `#${h}`,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${Math.round(hue)}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%)`,
  }
}

const TRANS: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
}

export function translit(s: string, reverse = false): string {
  if (!reverse) return s.replace(/[а-яё]/gi, ch => {
    const low = ch.toLowerCase()
    const t = TRANS[low]
    if (!t) return ch
    return ch === low ? t : t.charAt(0).toUpperCase() + t.slice(1)
  })
  const map: Record<string, string> = { shch: 'щ', sh: 'ш', ch: 'ч', kh: 'х', ts: 'ц', yu: 'ю', ya: 'я', zh: 'ж', yo: 'ё' }
  let out = s.toLowerCase()
  for (const k of Object.keys(map).sort((a, b) => b.length - a.length)) out = out.split(k).join(map[k])
  return out
}

export function slugify(s: string): string {
  return translit(s).toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
}

export function caseConv(s: string, mode: string): string {
  if (mode === 'upper') return s.toUpperCase()
  if (mode === 'lower') return s.toLowerCase()
  if (mode === 'title') return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
  if (mode === 'camel') return s.trim().replace(/(?:^|[\s_-])(\w)/g, (_, c) => c.toUpperCase()).replace(/[\s_-]/g, '')
  if (mode === 'snake') return s.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (mode === 'kebab') return slugify(s)
  return s
}

// Compact MD5 (public-domain style impl, RFC 1321)
export function md5(input: string): string {
  function rotl(x: number, n: number) { return (x << n) | (x >>> (32 - n)) }
  const bytes: number[] = []
  for (let i = 0; i < input.length; i++) bytes.push(input.charCodeAt(i))
  const bitLen = bytes.length * 8
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  bytes.push(bitLen >>> 0 & 0xff, bitLen >>> 8 & 0xff, bitLen >>> 16 & 0xff, bitLen >>> 24 & 0xff, 0, 0, 0, 0)
  const K = new Array(64).fill(0).map((_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0)
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476
  for (let i = 0; i < bytes.length; i += 64) {
    const M = new Array(16).fill(0)
    for (let j = 0; j < 16; j++) M[j] = bytes[i + j * 4] | (bytes[i + j * 4 + 1] << 8) | (bytes[i + j * 4 + 2] << 16) | (bytes[i + j * 4 + 3] << 24)
    let A = a0, B = b0, C = c0, D = d0
    for (let j = 0; j < 64; j++) {
      let F: number, g: number
      if (j < 16) { F = (B & C) | (~B & D); g = j }
      else if (j < 32) { F = (D & B) | (~D & C); g = (5 * j + 1) % 16 }
      else if (j < 48) { F = B ^ C ^ D; g = (3 * j + 5) % 16 }
      else { F = C ^ (B | ~D); g = (7 * j) % 16 }
      const tmp = D
      D = C; C = B
      B = (B + rotl((A + F + K[j] + M[g]) >>> 0, [7, 12, 17, 22][j >> 4] | 0)) >>> 0
      A = tmp
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0
  }
  return [a0, b0, c0, d0].map(v => (v >>> 0).toString(16).padStart(8, '0')).join('')
}

export async function hashText(alg: 'md5' | 'sha1' | 'sha256', s: string): Promise<string> {
  if (alg === 'md5') return md5(s)
  try {
    const buf = await crypto.subtle.digest(alg === 'sha1' ? 'SHA-1' : 'SHA-256', new TextEncoder().encode(s))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  } catch { return '' }
}

export function toB64(s: string, decode: boolean): string {
  if (!decode) {
    try { return btoa(unescape(encodeURIComponent(s))) } catch { return btoa(s) }
  }
  try { return decodeURIComponent(escape(atob(s))) } catch { return atob(s) }
}

export function urlEnc(s: string, decode: boolean): string {
  return decode ? decodeURIComponent(s) : encodeURIComponent(s)
}

export function fmtJson(s: string): string | null {
  const t = s.trim()
  if (!t) return null
  try { return JSON.stringify(JSON.parse(t), null, 2) } catch { return null }
}

const EMOJI: Array<[string, string]> = [
  ['smile', '😀'], ['laugh', '😂'], ['joy', '🤣'], ['happy', '🙂'], ['wink', '😉'], ['love', '😍'],
  ['cool', '😎'], ['sad', '😢'], ['cry', '😭'], ['angry', '😡'], ['wow', '😮'], ['think', '🤔'],
  ['sleep', '😴'], ['yawn', '🥱'], ['fire', '🔥'], ['star', '⭐'], ['sparkle', '✨'], ['rocket', '🚀'],
  ['heart', '❤️'], ['broken heart', '💔'], ['thumbs up', '👍'], ['thumbs down', '👎'], ['clap', '👏'],
  ['wave', '👋'], ['ok', '👌'], ['yes', '✅'], ['no', '❌'], ['warning', '⚠️'], ['question', '❓'],
  ['idea', '💡'], ['book', '📖'], ['write', '✏️'], ['note', '📝'], ['folder', '📁'], ['file', '📄'],
  ['link', '🔗'], ['search', '🔍'], ['camera', '📷'], ['video', '🎥'], ['music', '🎵'], ['phone', '📱'],
  ['computer', '💻'], ['mouse', '🖱'], ['keyboard', '⌨️'], ['wifi', '📶'], ['battery', '🔋'], ['plug', '🔌'],
  ['clock', '🕐'], ['calendar', '📅'], ['money', '💰'], ['gift', '🎁'], ['crown', '👑'], ['key', '🔑'],
  ['lock', '🔒'], ['shield', '🛡️'], ['bomb', '💣'], ['game', '🎮'], ['sport', '⚽'], ['car', '🚗'],
  ['train', '🚆'], ['airplane', '✈️'], ['pizza', '🍕'], ['burger', '🍔'], ['coffee', '☕'], ['tea', '🍵'],
  ['beer', '🍺'], ['wine', '🍷'], ['apple', '🍎'], ['sun', '☀️'], ['moon', '🌙'], ['rain', '🌧'],
  ['snow', '❄️'], ['storm', '⛈'], ['rainbow', '🌈'], ['tree', '🌳'], ['flower', '🌸'], ['bug', '🐛'],
  ['cat', '🐱'], ['dog', '🐶'], ['frog', '🐸'], ['penguin', '🐧'], ['check', '✔️'], ['cross', '❌'],
  ['arrow', '➡️'], ['left arrow', '⬅️'], ['up', '⬆️'], ['down', '⬇️'], ['plus', '➕'], ['minus', '➖'],
]

export function emojiSearch(q: string): Array<[string, string]> {
  const lq = q.toLowerCase()
  if (!lq) return EMOJI.slice(0, 24)
  return EMOJI.filter(([k]) => k.toLowerCase().includes(lq)).slice(0, 12)
}
