const crypto = require("crypto");

const encrypt = (key, content) => {
  const IV = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    IV
  );

  let encrypted = cipher.update(content, "utf8", "hex");

  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  const payload = IV.toString("hex") + encrypted + authTag;

  return Buffer.from(payload, "hex").toString("base64");
};

module.exports = { encrypt };
