<!--
Concise, repo-specific instructions for AI coding agents working on this Node.js demo repo.
Follow the project's patterns and keep edits non-breaking. See examples below.
-->

# Copilot / AI Agent Instructions — share-secret-nodejs

Summary

- This repo is a small Node.js set of crypto demo scripts (CommonJS) that show
  Diffie–Hellman (modp), ECDH (secp256k1) shared-secret derivation, AES-256-GCM
  symmetric encryption/decryption, and RSA signature/verification.

Quick pointers (what to run)

- npm start — runs `nodemon app.js`. `app.js` currently requires `./sign-verify`.
- node <file>.js — run demo files directly, e.g. `node ecdh-share-secret.js` or
  `node encrypt.js` to run a specific example.

Project conventions and important patterns

- CommonJS modules (require/module.exports); keep exports backward-compatible.
- Example files that show intended usage and data shape:
  - `encrypt.js` / `decrypt.js` — encrypt(keyHex, content) -> base64 payload; decrypt(keyHex, payloadBase64) -> utf8 string.
  - `ecdh-share-secret.js` — uses crypto.createECDH('secp256k1'), generates keys and calls computeSecret(otherPublicKey, 'base64', 'hex') to produce a hex secret.
  - `share-secret.js` — uses crypto.getDiffieHellman('modp15') as a classical DH demo; the produced secret can be very large (not suitable as-is for AES-256 key material without KDF).
  - `sign-verify.js` — generates an RSA keypair with generateKeyPairSync and uses crypto.sign/crypto.verify. Signature is printed as base64.

Encryption payload format (critical — preserve when editing)

- `encrypt(keyHex, content)` does the following:
  1. IV = 16 random bytes
  2. AES-256-GCM with key = Buffer.from(keyHex, 'hex')
  3. Payload built as: IV (16 bytes) + ciphertext + authTag (16 bytes), all hex-concatenated, then base64-encoded.
- `decrypt` reverses this by extracting:
  - iv = first 32 hex chars
  - authTag = last 32 hex chars
  - encrypted = the bytes between them
- Any change to this format must update both `encrypt.js` and `decrypt.js` together and preserve backward compatibility.

Key/secret expectations and gotchas

- The code expects the ECDH-derived secret as a hex string representing 32 bytes (64 hex chars) suitable for AES-256.
- The `share-secret.js` example using `modp15` produces a very large hex secret; do NOT assume it is safely usable directly as an AES-256 key — use a KDF if you intend to derive a 32-byte key from it.
- `package.json` lists a dependency named `crypto` — note that Node.js has a built-in `crypto` module. That npm package is unnecessary and can be a source of confusion. Do not replace built-in usages without testing on the target Node version.

Developer workflows, tests and debugging

- There are no automated tests or linters. Keep changes small and run example scripts to smoke-test.
- Useful quick checks:
  - Run a demo: `node ecdh-share-secret.js` and confirm it prints "true" for shared secret equality.
  - Run `node encrypt.js` to perform an end-to-end encrypt/decrypt with ECDH secret.
  - `npm start` runs `nodemon app.js` for iterative development; `app.js` toggles which demo runs via commented require lines.

When changing crypto primitives

- Preserve input/output formats. If deriving a symmetric key from an ECDH secret, explicitly use a KDF (e.g., HKDF) and document the parameters (hash, salt, info). Add tests/examples that show both sides deriving the same key.
- Avoid changing the AES mode (aes-256-gcm) without updating both encrypt/decrypt and adding migration notes.

Files to inspect when implementing changes

- `app.js` — demo entry-point; controls which example runs.
- `ecdh-share-secret.js` — ECDH example (secp256k1) used by encrypt/decrypt pipeline.
- `share-secret.js` — classic Diffie–Hellman modp example.
- `encrypt.js` / `decrypt.js` — encryption/decryption contract and payload format.
- `sign-verify.js` — RSA signature demo.
- `public-encrypted.js` — (if present) public-key encrypted demo — check for compatibility with other code.

Editing guidance for AI agents

- Prefer non-breaking, minimal changes: keep CommonJS exports and current payload formats.
- Add logging and small, isolated unit-style scripts under a `test/` folder if adding verification code.
- When adding new dependencies, prefer well-known crypto libraries (e.g., node:crypto builtin, or `crypto`-related libs only if necessary) and update `package.json` accordingly.
- Document any change that affects wire formats or secrets in this file and add a runnable example in `app.js`.

If anything here is unclear or you'd like me to expand examples (KDF snippet, test harness, or a migration plan to remove the npm "crypto" dependency), tell me which area to expand and I will update this doc.
