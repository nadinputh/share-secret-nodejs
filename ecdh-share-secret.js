const crypto = require("crypto");
const { decrypt } = require("./decrypt");
const { encrypt } = require("./encrypt");

const alice = crypto.createECDH("secp256k1");
const bob = crypto.createECDH("secp256k1");

alice.generateKeys();
bob.generateKeys();

const alicePublicKey = alice.getPublicKey().toString("base64");
const bobPublicKey = bob.getPublicKey().toString("base64");

// console.log(alicePublicKey);
// console.log(bobPublicKey);

const aliceSecret = alice.computeSecret(bobPublicKey, "base64", "hex");
const bobSecret = bob.computeSecret(alicePublicKey, "base64", "hex");

//To verify both have generated the same secret
console.log(aliceSecret === bobSecret);
console.log("Shared Secret:", aliceSecret);
// The value of shared secret of Alice
// console.log(aliceSecret);
// The value of shared secret of Bob
// console.log(bobSecret);

const message = "Hello World!!!";
console.log("Message:", message);

const encrypted = encrypt(aliceSecret, message);
const decrypted = decrypt(bobSecret, encrypted);

console.log("Encrypted:", encrypted);
console.log("Decrypted:", decrypted);
