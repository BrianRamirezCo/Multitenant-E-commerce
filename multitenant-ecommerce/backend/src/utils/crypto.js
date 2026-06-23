const crypto = require("crypto");

/**
 * Symmetric encryption for secrets at rest (e.g. tenant MercadoPago tokens).
 *
 * Uses AES-256-GCM (authenticated encryption). The key comes from the
 * ENCRYPTION_KEY env var, which must be 32 bytes encoded as base64 or hex
 * (generate with: `openssl rand -base64 32`).
 *
 * Encrypted values are stored as "v1:<iv>:<authTag>:<ciphertext>" (all base64),
 * so we can recognize and decrypt them, and tell them apart from legacy
 * plaintext values (which don't have the "v1:" prefix).
 */

const ALGO = "aes-256-gcm";
const PREFIX = "v1";

// Resolve the 32-byte key from the env var (base64 or hex). Cached after first use.
let cachedKey = null;
function getKey() {
  if (cachedKey) return cachedKey;
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: ENCRYPTION_KEY is not set. Cannot encrypt secrets at rest.",
      );
    }
    // Dev fallback: a fixed (insecure) key so the app runs locally. NEVER in prod.
    cachedKey = crypto
      .createHash("sha256")
      .update("dev-insecure-encryption-key")
      .digest();
    return cachedKey;
  }
  // Accept base64 or hex.
  let key = Buffer.from(raw, "base64");
  if (key.length !== 32) key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must decode to 32 bytes (use `openssl rand -base64 32`).",
    );
  }
  cachedKey = key;
  return cachedKey;
}

/** Returns true if a stored value is in our encrypted format. */
function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(`${PREFIX}:`);
}

/** Encrypts a plaintext string. Returns the "v1:..." encoded form. */
function encrypt(plaintext) {
  if (plaintext == null || plaintext === "") return plaintext;
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/**
 * Decrypts a "v1:..." value. If the value is NOT in encrypted format (legacy
 * plaintext stored before encryption was added), it's returned as-is, so old
 * tokens keep working until they're re-saved.
 */
function decrypt(value) {
  if (!isEncrypted(value)) return value; // legacy plaintext or null
  const [, ivB64, tagB64, dataB64] = value.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
}

module.exports = { encrypt, decrypt, isEncrypted };
