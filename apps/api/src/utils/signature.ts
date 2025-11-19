import { ethers } from 'ethers';

const privateKey = process.env.PRIVATE_KEY || '339872a763a25eee536042cb410594486927d23852146aaf5c9f6c853fdfbea7';

export async function generateSignatureForClaim(
  userAddress: string,
  rewardAmount: number,
  idClaim: string,
): Promise<{ v: number; r: string; s: string }> {
  
  const wallet = new ethers.Wallet(privateKey);
  
  const message = `${userAddress.toLowerCase()}_${rewardAmount}_${idClaim}`;
  
  const hashedMessage = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));
  
  const prefix = '\x19Ethereum Signed Message:\n32';
  const prefixedHash = ethers.utils.keccak256(
    ethers.utils.concat([
      ethers.utils.toUtf8Bytes(prefix),
      ethers.utils.arrayify(hashedMessage)
    ])
  );

  const signature = await wallet.signMessage(ethers.utils.arrayify(prefixedHash));
  const sig = ethers.utils.splitSignature(signature);

  return {
    v: sig.v,
    r: sig.r,
    s: sig.s
  };
}

export function generateIdClaim(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `reward_${timestamp}_${random}`;
}