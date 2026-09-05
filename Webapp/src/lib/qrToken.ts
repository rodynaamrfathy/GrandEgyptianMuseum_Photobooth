import { createDecipheriv, createHmac, timingSafeEqual } from "crypto";

/**
 * Thrown when a QR token is malformed, tampered with, uses an invalid key,
 * or otherwise fails to decrypt. Callers should treat every instance as an
 * invalid token and never expose the underlying crypto error to the user.
 */
export class InvalidTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTokenError";
  }
}

const IV_SIZE = 16; // AES block size
const MAC_SIZE = 32; // HMAC-SHA256 output
const MASTER_KEY_MIN = 32;

/**
 * Convert Base64URL → Buffer (handles missing padding).
 * Matches the kiosk's Base64UrlEncode: alphabet swap `-→+`, `_→/`,
 * `=` padding stripped.
 */
function base64UrlToBytes(input: string): Buffer {
  const standard = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (standard.length % 4)) % 4;
  return Buffer.from(standard + "=".repeat(padLength), "base64");
}

/**
 * Derive independent encryption + MAC sub-keys from a single master key
 * via HMAC-SHA256 expansion (matches the C# `DeriveKeys` exactly).
 */
function deriveKeys(masterKey: Buffer): { encKey: Buffer; macKey: Buffer } {
  const encKey = createHmac("sha256", masterKey).update("enc").digest();
  const macKey = createHmac("sha256", masterKey).update("mac").digest();
  return { encKey, macKey };
}

/**
 * Decrypt a kiosk QR token.
 *
 * Contract (matches the C# SecureIdCodec):
 *   - masterKey: ≥ 32 raw bytes
 *   - payload layout: Base64URL( [16B IV][ciphertext][32B HMAC-SHA256] )
 *   - HMAC-SHA256 covers IV ‖ ciphertext (encrypt-then-MAC)
 *   - AES-256-CBC + PKCS7
 *
 * Throws {@link InvalidTokenError} for any failure. Never log the key,
 * the token, or the plaintext.
 */
export function decryptToken(token: string, masterKey: Buffer): string {
  if (!Buffer.isBuffer(masterKey) || masterKey.length < MASTER_KEY_MIN) {
    throw new InvalidTokenError(`master key must be at least ${MASTER_KEY_MIN} bytes`);
  }
  if (typeof token !== "string" || token.length === 0) {
    throw new InvalidTokenError("Token is empty");
  }

  let payload: Buffer;
  try {
    payload = base64UrlToBytes(token);
  } catch {
    throw new InvalidTokenError("Malformed Base64URL");
  }

  if (payload.length < IV_SIZE + MAC_SIZE) {
    throw new InvalidTokenError("Payload too short");
  }

  const cipherLen = payload.length - IV_SIZE - MAC_SIZE;
  const iv = payload.subarray(0, IV_SIZE);
  const ciphertext = payload.subarray(IV_SIZE, IV_SIZE + cipherLen);
  const mac = payload.subarray(IV_SIZE + cipherLen);

  const { encKey, macKey } = deriveKeys(masterKey);

  // Verify MAC first — covers IV + ciphertext, so a tampered IV or
  // ciphertext both fail here.
  const expectedMac = createHmac("sha256", macKey)
    .update(Buffer.concat([iv, ciphertext]))
    .digest();
  if (
    mac.length !== expectedMac.length ||
    !timingSafeEqual(Buffer.from(mac), Buffer.from(expectedMac))
  ) {
    throw new InvalidTokenError("Token is invalid");
  }

  let plainBuf: Buffer;
  try {
    const decipher = createDecipheriv("aes-256-cbc", encKey, iv);
    plainBuf = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new InvalidTokenError("Decryption failed");
  }
  return plainBuf.toString("utf8");
}

/**
 * Validate that the Base64-encoded master key decodes to ≥ 32 bytes.
 * Throws {@link InvalidTokenError} if not.
 */
export function assertValidKey(base64Key: string): Buffer {
  if (typeof base64Key !== "string" || base64Key.length === 0) {
    throw new InvalidTokenError("QR_TOKEN_KEY is not configured");
  }
  const key = Buffer.from(base64Key, "base64");
  if (key.length < MASTER_KEY_MIN) {
    throw new InvalidTokenError(
      `QR_TOKEN_KEY must decode to at least ${MASTER_KEY_MIN} bytes (got ${key.length})`
    );
  }
  return key;
}
