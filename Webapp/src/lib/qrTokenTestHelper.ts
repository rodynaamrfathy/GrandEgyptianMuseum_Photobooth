import { createHmac, createCipheriv, randomBytes } from "crypto";

const IV_SIZE = 16; // AES block size
const MASTER_KEY_MIN = 32;

/**
 * Test-only helper: encrypts a plaintext imageId into a kiosk-compatible
 * QR token using AES-256-CBC + HMAC-SHA256 (encrypt-then-MAC), matching
 * the C# SecureIdCodec exactly:
 *   payload = [16B IV][ciphertext][32B HMAC-SHA256(IV || ciphertext)]
 *   Base64URL encoded, no padding.
 *
 * Not exported from production code. Only used in `__tests__/qrToken.test.ts`.
 */
export function encryptToken(plaintext: string, masterKey: Buffer): string {
  if (!Buffer.isBuffer(masterKey) || masterKey.length < MASTER_KEY_MIN) {
    throw new Error(`master key must be at least ${MASTER_KEY_MIN} bytes`);
  }
  const encKey = createHmac("sha256", masterKey).update("enc").digest();
  const macKey = createHmac("sha256", masterKey).update("mac").digest();

  const iv = randomBytes(IV_SIZE);
  const cipher = createCipheriv("aes-256-cbc", encKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  const mac = createHmac("sha256", macKey)
    .update(Buffer.concat([iv, ciphertext]))
    .digest();

  const payload = Buffer.concat([iv, ciphertext, mac]);
  return payload.toString("base64url");
}
