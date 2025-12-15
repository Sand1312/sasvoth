const { ethers } = require("ethers");

const selector = "0x122db153";
const signatures = [
    "numSignUps()",
    "numSignups()",
    "getStateIndex(uint256)",
    "stateAq()",
    "pollFactory()",
    "signUp(uint256,uint256,bytes)",
    "getPoll(uint256)"
];

console.log("Checking selectors:");
signatures.forEach(sig => {
    let hash;
    try {
        // Try v6
        hash = ethers.id(sig).substring(0, 10);
    } catch (e) {
        // Try v5
        try {
             hash = ethers.utils.id(sig).substring(0, 10);
        } catch (e2) {
             console.error("Could not hash using ethers.id or ethers.utils.id");
             return;
        }
    }
    console.log(`${sig}: ${hash}`);
    if (hash === selector) console.log("MATCH FOUND for", sig);
});

const RPC_URL = "https://arbitrum-sepolia-rpc.publicnode.com";
const MACI_ADDRESS = "0x3733a522f55126EB592520A2A6A8473172954cF6";

async function checkContract() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    const code = await provider.getCode(MACI_ADDRESS);
    console.log("Code length at MACI address:", code.length);
    if (code === "0x") {
        console.error("No code at MACI address!");
        return;
    }

    const abi = ["function numSignUps() view returns (uint256)", "function stateAq() view returns (address)"];
    const contract = new ethers.Contract(MACI_ADDRESS, abi, provider);

    try {
        console.log("Calling stateAq()...");
        const stateAq = await contract.stateAq();
        console.log("stateAq address:", stateAq);
        
        console.log("Calling numSignUps()...");
        const num = await contract.numSignUps();
        console.log("numSignUps:", num.toString());
    } catch (e) {
        console.error("Contract call failed:", e);
        if (e.info && e.info.error) console.log("Info Error:", e.info.error);
    }
}

checkContract();
