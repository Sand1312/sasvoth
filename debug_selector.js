const ethers = require("ethers");

function getSelector(sig) {
  if (ethers.id) return ethers.id(sig).slice(0, 10);
  if (ethers.utils && ethers.utils.id) return ethers.utils.id(sig).slice(0, 10);
  return "error";
}

// MACI / Poll signatures
const sigs = [
  "publishMessage((uint256[10],(uint256,uint256)),(uint256,uint256))",
  "publishMessageBatch((uint256[10],(uint256,uint256))[],(uint256,uint256)[])",
  "topUp(uint256,uint256,uint256)",
  "signUp(uint256,uint256,uint256)"
];

console.log("Calculating selectors...");
// Canonical form for publishMessageBatch is complex:
// publishMessageBatch(((uint256[10]),(uint256,uint256))[],(uint256,uint256)[])

const canonical = "publishMessage(((uint256[10]),(uint256,uint256)),(uint256,uint256))";
console.log(`${canonical} -> ${getSelector(canonical)}`);

const canonical2 = "publishMessage((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,(uint256,uint256)),(uint256,uint256))";
// Flattened message? No, it's a struct.

// Output all
sigs.forEach(sig => {
    console.log(`${sig} -> ${getSelector(sig)}`);
});

const legacy = "publishMessage(uint256[10],uint256[2],uint256[2])"; 
const target = "0x122db153";

console.log("Target:", target);
