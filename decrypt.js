const crypto = require("crypto");

const decrypt = (key, payload) => {
  payload = Buffer.from(payload, "base64").toString("hex");
  const iv = payload.substr(0, 32);
  const encrypted = payload.substr(32, payload.length - 32 - 32);
  const authTag = payload.substr(payload.length - 32, 32);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

module.exports = { decrypt };
