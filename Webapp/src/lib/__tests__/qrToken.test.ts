import { decryptToken, assertValidKey, InvalidTokenError } from "../qrToken";
import { encryptToken } from "../qrTokenTestHelper";
import { createDecipheriv, createHmac, randomBytes } from "crypto";

const VALID_KEY = Buffer.alloc(32, 7); // any ≥32 bytes

describe("qrToken", () => {
  describe("decryptToken", () => {
    it("decrypts a valid token to the original imageId", () => {
      const token = encryptToken("image_kiosk01_Galaxia_1694000000000", VALID_KEY);
      expect(decryptToken(token, VALID_KEY)).toBe("image_kiosk01_Galaxia_1694000000000");
    });

    it("rejects when the ciphertext is modified", () => {
      const token = encryptToken("image_123", VALID_KEY);
      const buf = Buffer.from(token, "base64url");
      // Flip a byte somewhere in the ciphertext region (after IV[16], before MAC[-32])
      buf[20] ^= 0xff;
      const tampered = buf.toString("base64url");
      expect(() => decryptToken(tampered, VALID_KEY)).toThrow(InvalidTokenError);
    });

    it("rejects when the HMAC is modified", () => {
      const token = encryptToken("image_123", VALID_KEY);
      const buf = Buffer.from(token, "base64url");
      buf[buf.length - 1] ^= 0x01;
      const tampered = buf.toString("base64url");
      expect(() => decryptToken(tampered, VALID_KEY)).toThrow(InvalidTokenError);
    });

    it("rejects when the IV is modified", () => {
      const token = encryptToken("image_123", VALID_KEY);
      const buf = Buffer.from(token, "base64url");
      buf[0] ^= 0x01;
      const tampered = buf.toString("base64url");
      expect(() => decryptToken(tampered, VALID_KEY)).toThrow(InvalidTokenError);
    });

    it("rejects garbage / random token", () => {
      const garbage = randomBytes(60).toString("base64url");
      expect(() => decryptToken(garbage, VALID_KEY)).toThrow(InvalidTokenError);
    });

    it("rejects malformed Base64URL", () => {
      expect(() => decryptToken("!!!not-base64!!!", VALID_KEY)).toThrow(InvalidTokenError);
    });

    it("rejects payload that is too short", () => {
      const tooShort = Buffer.alloc(20).toString("base64url"); // < IV(16) + MAC(32)
      expect(() => decryptToken(tooShort, VALID_KEY)).toThrow(InvalidTokenError);
    });

    it("rejects invalid key length", () => {
      const token = encryptToken("image_123", VALID_KEY);
      const shortKey = Buffer.alloc(16, 7);
      expect(() => decryptToken(token, shortKey)).toThrow(InvalidTokenError);
      const notBuffer = "not-a-buffer" as unknown as Buffer;
      expect(() => decryptToken(token, notBuffer)).toThrow(InvalidTokenError);
    });

    it("rejects empty token", () => {
      expect(() => decryptToken("", VALID_KEY)).toThrow(InvalidTokenError);
    });

    it("never leaks the underlying crypto error message", () => {
      const token = encryptToken("image_123", VALID_KEY);
      const buf = Buffer.from(token, "base64url");
      buf[buf.length - 1] ^= 0x01;
      try {
        decryptToken(buf.toString("base64url"), VALID_KEY);
        fail("expected throw");
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidTokenError);
        expect((e as Error).message).not.toMatch(/unsupported|bad decrypt|auth/i);
      }
    });

    it("rejects when the wrong key is supplied", () => {
      const token = encryptToken("image_123", VALID_KEY);
      const otherKey = Buffer.alloc(32, 9);
      expect(() => decryptToken(token, otherKey)).toThrow(InvalidTokenError);
    });
  });

  describe("encryptToken contract parity with the C# SecureIdCodec", () => {
    it("produces a payload of [16B IV][ciphertext][32B HMAC] in Base64URL", () => {
      const plaintext = "image_123";
      const token = encryptToken(plaintext, VALID_KEY);
      const buf = Buffer.from(token, "base64url");
      expect(buf.length).toBeGreaterThan(16 + 32);

      const iv = buf.subarray(0, 16);
      const mac = buf.subarray(buf.length - 32);
      const ct = buf.subarray(16, buf.length - 32);

      // Derive sub-keys exactly the way decryptToken does.
      const encKey = createHmac("sha256", VALID_KEY).update("enc").digest();
      const macKey = createHmac("sha256", VALID_KEY).update("mac").digest();

      const expectedMac = createHmac("sha256", macKey)
        .update(Buffer.concat([iv, ct]))
        .digest();
      expect(mac.equals(expectedMac)).toBe(true);

      const decipher = createDecipheriv("aes-256-cbc", encKey, iv);
      const out = Buffer.concat([decipher.update(ct), decipher.final()]);
      expect(out.toString("utf8")).toBe(plaintext);
    });

    it("round-trips arbitrary imageId values", () => {
      for (const id of ["k1_f1_1", "KioskA_FilterB_1694000000000", "x_y_9999999999999"]) {
        expect(decryptToken(encryptToken(id, VALID_KEY), VALID_KEY)).toBe(id);
      }
    });

    it("accepts keys larger than 32 bytes (matches C# ArgumentException ≥ 32)", () => {
      const bigKey = Buffer.alloc(64, 5);
      const token = encryptToken("image_123", bigKey);
      expect(decryptToken(token, bigKey)).toBe("image_123");
    });
  });

  describe("assertValidKey", () => {
    it("returns a Buffer when the Base64 decodes to ≥ 32 bytes", () => {
      const b64 = Buffer.alloc(32, 1).toString("base64");
      const key = assertValidKey(b64);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it("accepts keys larger than 32 bytes", () => {
      const b64 = Buffer.alloc(64, 1).toString("base64");
      const key = assertValidKey(b64);
      expect(key.length).toBe(64);
    });

    it("throws when missing", () => {
      expect(() => assertValidKey("")).toThrow(InvalidTokenError);
    });

    it("throws when the decoded length is < 32", () => {
      expect(() => assertValidKey(Buffer.alloc(16, 1).toString("base64"))).toThrow(
        InvalidTokenError
      );
    });
  });
});
