// Encrypt the /playbook page's data.
//
// Usage:
//   node scripts/encrypt-playbook.mjs <plaintext.json> <passphrase>
//
// <plaintext.json>  scripts/playbook-plaintext.json (built by
//                   build-playbook-json.py) — never committed, never shipped.
// <passphrase>      The shared passphrase teammates enter on /playbook to
//                    decrypt it client-side. Not stored anywhere; only the
//                    ciphertext is committed.
//
// Writes src/data/playbook-encrypted.json ({ ciphertext, iv, salt }, all
// base64). Reuses src/lib/crypto.js so the output is guaranteed decryptable
// by the app's Web Crypto call.

import { readFile, writeFile } from 'node:fs/promises'
import { encryptContent } from '../src/lib/crypto.js'

const [, , plaintextPath, passphrase] = process.argv

if (!plaintextPath || !passphrase) {
  console.error('Usage: node scripts/encrypt-playbook.mjs <plaintext.json> <passphrase>')
  process.exit(1)
}

const plaintext = await readFile(plaintextPath, 'utf8')
JSON.parse(plaintext) // validate

const encrypted = await encryptContent(plaintext, passphrase)
const outPath = new URL('../src/data/playbook-encrypted.json', import.meta.url)
await writeFile(outPath, JSON.stringify(encrypted, null, 2) + '\n')
console.log(`wrote ${outPath.pathname.replace(/^\/([A-Za-z]):/, '$1:')}`)
