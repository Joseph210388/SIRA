import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "crypto";

function key() {
  const raw = process.env.APP_DATA_KEY;
  if (!raw) {
    throw new Error("APP_DATA_KEY");
  }
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) {
    throw new Error("APP_DATA_KEY");
  }
  return decoded;
}

// nonce || ciphertext || tag. La clave no sale de esta máquina.
export function encryptString(plain: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), nonce);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, encrypted, tag]);
}

export function decryptString(payload: Buffer) {
  const nonce = payload.subarray(0, 12);
  const tag = payload.subarray(payload.length - 16);
  const data = payload.subarray(12, payload.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key(), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function asBuffer(value: unknown) {
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  throw new Error("ciphertext");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function randomId() {
  return randomUUID();
}
