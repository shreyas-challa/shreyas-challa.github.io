// Authenticated encryption for active-box writeups.
//
// A writeup for an active box is AES-GCM encrypted with a key derived from the
// box's root hash via PBKDF2. Only the ciphertext is ever shipped to the
// browser while the box is active, so the plaintext (including any embedded
// screenshots) is never present in the network payload or bundle. A wrong root
// hash fails the GCM auth tag and throws — there is no partial/garbled output
// to scrape, and the operation is not reversible without the hash.
//
// This module uses only Web Crypto primitives, so the exact same code runs in
// the browser and in Node (see scripts/encrypt-box.mjs), guaranteeing that what
// the tool encrypts is what the app can decrypt.

const SUBTLE = globalThis.crypto?.subtle
const PBKDF2_ITERATIONS = 250000

const enc = new TextEncoder()
const dec = new TextDecoder()

function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToBytes(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(secret, salt) {
  const baseKey = await SUBTLE.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey'])
  return SUBTLE.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// Returns { ciphertext, iv, salt } — all base64. Random salt + iv per call.
export async function encryptContent(plaintext, secret) {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(secret, salt)
  const ciphertext = await SUBTLE.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return {
    ciphertext: bytesToBase64(ciphertext),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
  }
}

// Throws if the secret is wrong (GCM auth tag mismatch) or the payload is malformed.
export async function decryptContent({ ciphertext, iv, salt }, secret) {
  const key = await deriveKey(secret, base64ToBytes(salt))
  const plaintext = await SUBTLE.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ciphertext),
  )
  return dec.decode(plaintext)
}
