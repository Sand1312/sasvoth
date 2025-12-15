const { ethers } = require("ethers");

const MACI_ADDRESS = "0x18dC7d25710751A20fA842E6b9634eD40Bee9A47";
const RPC_URL = "https://arbitrum-sepolia-rpc.publicnode.com";

async function checkProxy() {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    
    // EIP-1967 Implementation Slot
    // bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
    const storedImpl = await provider.getStorageAt(
        MACI_ADDRESS, 
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
    );
    
    console.log("Implementation Slot:", storedImpl);
    
    // Check if it's non-zero
    if (storedImpl === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("WARNING: Implementation slot is empty. This might not be an initialized Proxy.");
    } else {
        const implAddress = "0x" + storedImpl.slice(26); // Last 20 bytes
        console.log("Implementation Address:", implAddress);
        
        // Check code at implementation
        const code = await provider.getCode(implAddress);
        console.log("Impl Code Length:", code.length);
    }
    
    // Try calling a different function: pollFactory()
    const contract = new ethers.Contract(MACI_ADDRESS, ["function pollFactory() view returns (address)"], provider);
    try {
        const pf = await contract.pollFactory();
        console.log("pollFactory:", pf);
    } catch (e) {
        console.log("pollFactory failed");
    }
}

checkProxy();
