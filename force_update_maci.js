// Force update MACI address - thay NEW_MACI_ADDRESS bằng địa chỉ thật
const NEW_MACI_ADDRESS = "0xE1A01C2f2c144619264d7E63f1de116c4707Bb48"; // Địa chỉ MACI mới
const NEW_START_BLOCK = 224135100; // Block number từ console log

console.log("=== Force updating MACI localStorage ===");
console.log("Old MACI address:", localStorage.getItem("maciAddress"));

// Update localStorage
localStorage.setItem("maciAddress", NEW_MACI_ADDRESS);
localStorage.setItem("maciStartBlock", NEW_START_BLOCK.toString());

// Clear old signup data
localStorage.removeItem("maci_privKey");
localStorage.removeItem("maci_pubKey");
localStorage.removeItem("maci_pubKeyX");
localStorage.removeItem("maci_pubKeyY");
localStorage.removeItem("maci_stateIndex");
localStorage.removeItem("maci_pollStateIndex");
localStorage.removeItem("maci_voiceCredits");

console.log("✅ Updated MACI address to:", localStorage.getItem("maciAddress"));
console.log(
  "✅ Updated start block to:",
  localStorage.getItem("maciStartBlock")
);
console.log("✅ Cleared old signup data");
console.log("Now refresh the page and try again!");
