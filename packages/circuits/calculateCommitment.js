const circomlibjs = require("circomlibjs");

async function main() {
    // Poseidon đã là function, không cần await
    const poseidon = await circomlibjs.buildPoseidon();
    
    const inputs = [
        1,    // vote
        100,  // voiceCredits
        1,    // nonce  
        1,    // pollId
        123456  // privateKey
    ];
    
    const commitment = poseidon(inputs);
    console.log("Real voteCommitment:", poseidon.F.toString(commitment));
}

main().catch(console.error);