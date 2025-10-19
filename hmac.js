const crypto = require("crypto");

const WEBHOOK_SECRET = "shh-its-a-very-secure-secret-key-123456";

/**
 * Generates the HMAC-SHA256 signature for a webhook payload.
 * @param {string} payload The raw JSON body string.
 * @returns {{timestamp: number, signature: string}}
 */
function generateSignature(payload) {
  // 1. Get current timestamp (in milliseconds)
  const timestamp = Date.now();

  // 2. Prepare the string for signing: "timestamp.payload"
  const signedString = `${timestamp}.${payload}`;

  // 3. Calculate the HMAC-SHA256 signature
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(signedString);
  const signature = hmac.digest("hex");

  // 4. Return both for inclusion in HTTP headers
  return {
    timestamp: timestamp,
    signature: signature,
  };
}

// --- Example Usage ---
const payloadObject = {
  eventType: "order.completed",
  orderId: "TXN-987654",
  amount: 19.99,
};

// IMPORTANT: The payload MUST be the raw string, not the object.
const rawPayloadString = JSON.stringify(payloadObject);

const { timestamp, signature } = generateSignature(rawPayloadString);

console.log("--- Sender Output (System B) ---");
console.log(`Raw Payload: ${rawPayloadString}`);
console.log(`Timestamp: ${timestamp}`);
console.log(`Signature (Sent in X-Signature header): ${signature}`);

// The sender would then send this via HTTP POST:
// Header: X-Webhook-Timestamp: ${timestamp}
// Header: X-Webhook-Signature: ${signature}
// Body: ${rawPayloadString}

const TIME_TOLERANCE_MS = 300000; // 5 minutes in milliseconds

/**
 * Validates the incoming webhook request's timestamp and signature.
 * @param {string} receivedSignature The signature from the X-Webhook-Signature header.
 * @param {number} receivedTimestamp The timestamp from the X-Webhook-Timestamp header.
 * @param {string} rawPayload The raw request body string.
 * @returns {boolean} True if the signature and timestamp are valid, false otherwise.
 */
function validateSignature(receivedSignature, receivedTimestamp, rawPayload) {
  // 1. Check for Replay Attack (Timestamp Validation)
  const now = Date.now();
  const age = Math.abs(now - receivedTimestamp);

  if (age > TIME_TOLERANCE_MS) {
    console.error(
      `[FAILURE] Replay Attack Detected. Timestamp is outside the ${
        TIME_TOLERANCE_MS / 60000
      } minute tolerance.`
    );
    return false;
  }

  // 2. Recalculate Signature
  const signedString = `${receivedTimestamp}.${rawPayload}`;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(signedString);
  const calculatedSignature = hmac.digest("hex");

  // 3. Secure Comparison (Timing Attack Mitigation)
  // crypto.timingSafeEqual is essential to prevent timing attacks.
  // It requires both inputs to be Buffer objects.
  const receivedSigBuffer = Buffer.from(receivedSignature, "hex");
  const calculatedSigBuffer = Buffer.from(calculatedSignature, "hex");

  if (receivedSigBuffer.length !== calculatedSigBuffer.length) {
    console.error("[FAILURE] Signature length mismatch.");
    return false;
  }

  const isValid = crypto.timingSafeEqual(
    receivedSigBuffer,
    calculatedSigBuffer
  );

  if (isValid) {
    console.log(
      "[SUCCESS] Signature is valid. Request is authentic and untampered."
    );
    return true;
  } else {
    console.error(
      `[FAILURE] Signature mismatch. Received: ${receivedSignature}, Calculated: ${calculatedSignature}`
    );
    return false;
  }
}

// --- Example Usage with the Sender's Output ---
const { timestamp: generatedTimestamp, signature: generatedSignature } =
  generateSignature(rawPayloadString);

console.log("\n--- Receiver Test Case 1: Valid Request ---");
// Use the generated, correct values
validateSignature(generatedSignature, generatedTimestamp, rawPayloadString);

console.log("\n--- Receiver Test Case 2: Tampered Payload ---");
const tamperedPayload = rawPayloadString.replace("19.99", "999.99");
validateSignature(generatedSignature, generatedTimestamp, tamperedPayload);

console.log("\n--- Receiver Test Case 3: Replay Attack (Old Timestamp) ---");
const veryOldTimestamp = generatedTimestamp - TIME_TOLERANCE_MS * 2; // Outside the 5-minute window
validateSignature(generatedSignature, veryOldTimestamp, rawPayloadString);
