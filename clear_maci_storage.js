// Script để xóa MACI localStorage cũ
console.log("Clearing old MACI data from localStorage...");

// Xóa tất cả MACI related data
localStorage.removeItem("maciAddress");
localStorage.removeItem("maciStartBlock");
localStorage.removeItem("maci_privKey");
localStorage.removeItem("maci_pubKey");
localStorage.removeItem("maci_pubKeyX");
localStorage.removeItem("maci_pubKeyY");
localStorage.removeItem("maci_stateIndex");
localStorage.removeItem("maci_pollStateIndex");
localStorage.removeItem("maci_voiceCredits");

console.log("✅ Cleared all MACI localStorage data");
console.log("Now go to /admin/polls to deploy a new MACI contract");
