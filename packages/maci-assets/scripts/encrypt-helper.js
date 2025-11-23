import crypto from "crypto";
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Read the public key
const publicKey = fs.readFileSync(path.join(__dirname, "public.key"), "utf8");

// The value to encrypt (session key address)
const valueToEncrypt = process.argv[2] || "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

try {
  const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(valueToEncrypt));
  const base64Encrypted = encrypted.toString("base64");

  console.log("Encrypted value:");
  console.log(base64Encrypted);
} catch (error) {
  console.error("Encryption failed:", error.message);
}
