import { buildPoseidon } from "circomlibjs";

export async function calculateVoteCommitment(
  vote: string, 
  voiceCredits: string, 
  nonce: string, 
  pollId: string,
    privateKey: string
): Promise<string> {
  try {
    // Initialize Poseidon hash
    const poseidon = await buildPoseidon();
    
    // Convert inputs to BigInt
    const voteBigInt = BigInt(vote);
    const voiceCreditsBigInt = BigInt(voiceCredits);
    const nonceBigInt = BigInt(nonce);
    const pollIdBigInt = BigInt(pollId);
    const privateKeyBigInt = BigInt(privateKey);
    
    
    // Calculate commitment (Poseidon hash)
    const commitment = poseidon([voteBigInt, voiceCreditsBigInt, nonceBigInt, pollIdBigInt, privateKeyBigInt]);
    
    // Convert to string
    return poseidon.F.toString(commitment);
  } catch (error) {
    console.error('Error calculating commitment:', error);
    throw error;
  }
}
