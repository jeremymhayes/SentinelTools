/**
 * Client-side hashing. SHA-256 and SHA-1 via Web Crypto; MD5 via a small
 * local implementation because Web Crypto does not expose it. MD5 is
 * provided for comparing against legacy published checksums only — it is
 * cryptographically broken and labeled as such in the UI.
 */

export interface FileHashes {
  sha256: string
  sha1: string
  md5: string
}

function toHex(bytes: Uint8Array): string {
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return hex
}

async function subtleDigest(
  algorithm: 'SHA-256' | 'SHA-1',
  data: ArrayBuffer
): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, data)
  return toHex(new Uint8Array(digest))
}

export async function hashFile(file: File): Promise<FileHashes> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const [sha256, sha1] = await Promise.all([
    subtleDigest('SHA-256', buffer),
    subtleDigest('SHA-1', buffer),
  ])
  return { sha256, sha1, md5: md5Hex(bytes) }
}

/* ---------------- MD5 (RFC 1321) ---------------- */

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const MD5_K = new Uint32Array(64)
for (let i = 0; i < 64; i++) {
  MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32)
}

function rotl(x: number, c: number): number {
  return (x << c) | (x >>> (32 - c))
}

export function md5Hex(input: Uint8Array): string {
  // padding: 0x80 then zeros, then 64-bit little-endian bit length
  const bitLength = input.length * 8
  const paddedLength = (((input.length + 8) >> 6) + 1) << 6
  const padded = new Uint8Array(paddedLength)
  padded.set(input)
  padded[input.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(paddedLength - 8, bitLength >>> 0, true)
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 2 ** 32), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const m = new Uint32Array(16)
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) m[i] = view.getUint32(offset + i * 4, true)

    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let i = 0; i < 64; i++) {
      let f: number
      let g: number
      if (i < 16) {
        f = (b & c) | (~b & d)
        g = i
      } else if (i < 32) {
        f = (d & b) | (~d & c)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        f = b ^ c ^ d
        g = (3 * i + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * i) % 16
      }
      const temp = d
      d = c
      c = b
      b = (b + rotl((a + f + MD5_K[i] + m[g]) >>> 0, MD5_S[i])) >>> 0
      a = temp
    }

    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  const out = new Uint8Array(16)
  const outView = new DataView(out.buffer)
  outView.setUint32(0, a0, true)
  outView.setUint32(4, b0, true)
  outView.setUint32(8, c0, true)
  outView.setUint32(12, d0, true)
  return toHex(out)
}
