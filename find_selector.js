const ethers = require("ethers");
const fs = require("fs");

const abiPath = "/Users/thesand/sasvoth/packages/contracts/abi/contracts/Poll.json";
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

function getSelector(sig) {
  if (ethers.id) return ethers.id(sig).slice(0, 10);
  if (ethers.utils && ethers.utils.id) return ethers.utils.id(sig).slice(0, 10);
  return "error";
}

function getSignature(item) {
  // if (item.type !== "function") return null; // Removed check
  const inputs = item.inputs.map(input => {
    if (input.type === "tuple") {
      return `(${input.components.map(c => {
          if (c.type === "tuple") {
             // simplify recursion for now, assume 1 level or implement recursively if needed
             // Actually, recursion needed
             return getComponentType(c);
          }
          return c.type;
      }).join(",")})`;
    }
    return input.type;
  }).join(",");
  return `${item.name}(${inputs})`;
}

function getComponentType(component) {
    if (component.type !== "tuple") return component.type;
    return `(${component.components.map(c => getComponentType(c)).join(",")})`;
}

console.log("Scanning Poll.json for 0x122db153...");

abi.forEach(item => {
  if (item.type === "function" || item.type === "error") {
    const sig = getSignature(item);
    if (!sig) return;
    const selector = getSelector(sig);
    console.log(sig, "->", selector); // Log all to be sure
    if (selector === "0x122db153") {
        console.log("MATCH FOUND:", sig, "->", selector);
    }
  }
});
