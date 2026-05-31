// Encrypt a writeup for an active box.
//
// Usage:
//   node scripts/encrypt-box.mjs <plaintext.json> <root-hash>
//
// <plaintext.json>  Path to the TipTap doc JSON for the writeup. Embed any
//                   screenshots as base64 data URIs in image nodes so they get
//                   encrypted along with the text (never served from a public
//                   URL while the box is active).
// <root-hash>       The box's root hash — the secret a visitor must enter to
//                   unlock. It is NOT stored anywhere; only the ciphertext is.
//
// Prints { ciphertext, iv, salt } JSON to stdout. Paste that into the box's
// `encrypted` field in src/data/boxes.js. Reuses src/lib/crypto.js so the
// output is guaranteed decryptable by the app.

import { readFile } from 'node:fs/promises'
import { encryptContent } from '../src/lib/crypto.js'

const [, , plaintextPath, rootHash] = process.argv

if (!plaintextPath || !rootHash) {
  console.error('Usage: node scripts/encrypt-box.mjs <plaintext.json> <root-hash>')
  process.exit(1)
}

const plaintext = await readFile(plaintextPath, 'utf8')
// Validate it parses as JSON so we never encrypt a malformed doc.
JSON.parse(plaintext)

const encrypted = await encryptContent(plaintext, rootHash)
process.stdout.write(JSON.stringify(encrypted, null, 2) + '\n')
