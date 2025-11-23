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

export async function generateSignature(

): Promise<any> {
  
  const wallet = new ethers.Wallet('0xb63cae545dd7a2f8413dc1434af812c64caee040220223537ab92d880b848d6b');
    let w = "MIICCgKCAgEAyQNwpSAMOaoCee5tgqNf07/xomi27rMBbbs7aLGE8FB9mH/fH9nOvl8tWgZI9tue31GTVdVff3BGPw70HS5RWGMxM5ElhjFETB2On9iDwMlEF0ZjgmoKeJsDbHihWnwjgr+JD29OG//I7dessNxn4fQZ9lbcB8h9eEooGZUxqSaMHH9FCiZnZhPmvbB3kAwuDzPb/l9CPuu3m223PcbFSSN7ELQQ1VKNEVAe9JEYHLPzK9B6dK+3kzHL/nTv/Dn/i9CEmgDitRsq366EtHl0qKLmQICFLKaCE+J42nznMDPuZRfpPDlVEAlJEHxxnKS/LbbuloEl8210GXSKcA2KoxQ/zPBePUwfW+gl1TsFD3VfUpR4QwGdnmFXUrBnDAS2whvvUXJkCDU26YyhmjpDlOGBlrBiBEUUZkObSAxi2hjgshdMh0KCKufmc8HftyOPBEDTqX4RN03GLx+8E7pXnzdbq1LwfC52Pts25fcHx7Qpp8gWUD9yJaxNwgZNl1w0g0Puf3grpvQnEeE9cfbssOchfG+0uW7zHpaeyxqCjeNZrr7H71Vbsh6ggulckZDUoHjtGx9uc6J4kkYgBRUjoE0qw4aLbRn9rTy4UJ29japD6ILZNgIwkQRf1L5sBfi9VCjKyPHtQQUqlrnMDorWMiwCNC4734CAcJ0lA6JQkPcCAwEAAQ==";
  const message = `${w.toLowerCase()}_$`;
  
  // Sửa: signMessage tự động thêm prefix, không cần làm thủ công
  const signature = await wallet.signMessage(ethers.utils.toUtf8Bytes(message));
  const sig = ethers.utils.splitSignature(signature);

  return {
   sig
  };

  
}


