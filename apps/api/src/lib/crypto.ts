import crypto from "crypto";

const resolveSecret = () =>
  process.env.APP_ENCRYPTION_KEY || process.env.JWT_SECRET || "voidlab-dev-encryption-secret";

const encryptionKey = crypto.createHash("sha256").update(resolveSecret()).digest();

export const encryptSecret = (value: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decryptSecret = (value?: string | null) => {
  if (!value) return "";

  const payload = Buffer.from(value, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

export const toCodeChallenge = (verifier: string) =>
  crypto.createHash("sha256").update(verifier).digest("base64url");
