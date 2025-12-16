const { ethers } = require("ethers");

const selector = "0x122db153";
const sig = "numSignUps()";

// Hash check
let hash;
try {
    hash = ethers.id(sig).substring(0, 10);
} catch (e) {
    try {
         hash = ethers.utils.id(sig).substring(0, 10);
    } catch (e2) {
         console.log("Hashing failed");
    }
}
console.log(`Selector for ${sig}: ${hash} (Expected: ${selector})`);


const RPC_URL = "https://arbitrum-sepolia-rpc.publicnode.com";
const MACI_ADDRESS = "0x18dC7d25710751A20fA842E6b9634eD40Bee9A47";

async function checkContract() {
    let provider;
    try {
        if (ethers.JsonRpcProvider) {
             provider = new ethers.JsonRpcProvider(RPC_URL);
        } else {
             provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        }
    } catch (e) {
        console.log("Provider init failed, checking v5 syntax...");
        provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    }
    
    const code = await provider.getCode(MACI_ADDRESS);
    console.log("Code length at MACI address:", code.length);
    if (code === "0x") {
        console.error("No code at MACI address!");
        return;
    }

    const abi = [
        "function numSignUps() view returns (uint256)", 
        "function stateAq() view returns (address)",
        "function getStateTreeRoot() view returns (uint256)"
    ];
    const contract = new ethers.Contract(MACI_ADDRESS, abi, provider);

    try {
        console.log("Calling numSignUps()...");
        const num = await contract.numSignUps();
        console.log("numSignUps SUCCESS:", num.toString());
    } catch (e) {
        console.error("numSignUps FAILED:", e.reason || e.message);
        if (e.transaction) console.log("Tx Data:", e.transaction.data);
    }

    try {
        console.log("Calling stateAq()...");
        const aq = await contract.stateAq();
        console.log("stateAq address:", aq);
    } catch (e) {
        console.error("stateAq FAILED");
    }
}

checkContract();
