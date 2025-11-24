import { buildPoseidon } from "circomlibjs";

export async function calculateVoteCommitment(
  vote: string, 
  voiceCredits: string, 
  nonce: string, 
  pollId: string,
  privateKey: string
): Promise<string> {
  try {
    console.log('Raw inputs:', { vote, voiceCredits, nonce, pollId, privateKey });

    const poseidon = await buildPoseidon();
    
    // Hàm convert an toàn cho mọi loại input
    const safeBigInt = (value: string): bigint => {
      if (!value) {
        throw new Error(`Empty value: ${value}`);
      }

      // Nếu là hex string (64 ký tự như private key)
      if (/^[0-9a-fA-F]{64}$/.test(value)) {
        return BigInt('0x' + value);
      }
      
      // Nếu là hex string có prefix 0x
      if (value.startsWith('0x')) {
        return BigInt(value);
      }
      
      // Nếu là number string
      if (/^\d+$/.test(value)) {
        return BigInt(value);
      }
      
      // Thử convert trực tiếp
      try {
        return BigInt(value);
      } catch (error) {
        throw new Error(`Cannot convert ${value} to BigInt. Type: ${typeof value}`);
      }
    };
    
    // Convert inputs
    const voteBigInt = safeBigInt(vote);
    const voiceCreditsBigInt = safeBigInt(voiceCredits);
    const nonceBigInt = safeBigInt(nonce);
    const pollIdBigInt = safeBigInt(pollId);
    const privateKeyBigInt = safeBigInt(privateKey);

   
    
    // Calculate commitment
    const commitment = poseidon([
      voteBigInt, 
      voiceCreditsBigInt, 
      nonceBigInt, 
      pollIdBigInt, 
      privateKeyBigInt
    ]);
    
    const result = poseidon.F.toString(commitment);
    console.log('Commitment result:', result);
    
    return result;
  } catch (error) {
    console.error('Error calculating commitment:', error);
    throw error;
  }
}