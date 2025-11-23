import crypto from "crypto";
import fs from "fs";
import path from "path";
import url from "url";
import { Wallet, hashMessage, getBytes } from "ethers";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Read the public key
const publicKey = fs.readFileSync(path.join(__dirname, "public.key"), "utf8");

// The private key from Hardhat test account
const privateKey = process.argv[2] || "0xb63cae545dd7a2f8413dc1434af812c64caee040220223537ab92d880b848d6b";

async function generateAuthHeader() {
  try {
    const wallet = new Wallet(privateKey);

    // Sign the message "message"
    const signature = await wallet.signMessage("message");

    // Get the digest
    const digest = Buffer.from(getBytes(hashMessage("message"))).toString("hex");

    // Combine signature and digest
    const combined = `${signature}:${digest}`;

    // Encrypt with coordinator's public key
    const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(combined));
    const base64Encrypted = encrypted.toString("base64");

    // Create Bearer token
    const authHeader = `Bearer ${base64Encrypted}`;

    console.log("Authorization Header:");
    console.log(authHeader);
    console.log("\nUse this in Postman Headers:");
    console.log("Key: Authorization");
    console.log(`Value: ${authHeader}`);
  } catch (error) {
    console.error("Failed to generate auth header:", error.message);
  }
}

generateAuthHeader();
