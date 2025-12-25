import { hashMessage, keccak256, encodePacked, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { randomBytes } from 'crypto';

const privateKey = (process.env.PRIVATE_KEY || '0xb63cae545dd7a2f8413dc1434af812c64caee040220223537ab92d880b848d6b') as `0x${string}`;

export async function generateSignatureForClaim(
  userAddress: string,
  rewardAmount: string, // Wei amount as string
  idClaim: string,
): Promise<{ v: number; r: string; s: string }> {

  // 1. Khởi tạo account từ Private Key của Owner
  const formattedPK = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}` as `0x${string}`;
  const account = privateKeyToAccount(formattedPK);

  // 2. Tái lập logic nối chuỗi fourthString trong Solidity:
  // fourthString = lowercase(sender) + "_" + rewardAmount + "_" + idClaim
  const messageString = `${userAddress.toLowerCase()}_${rewardAmount}_${idClaim}`;

  // DEBUG: Log để verify
  console.log('=== SIGNATURE GENERATION DEBUG ===');
  console.log('userAddress:', userAddress.toLowerCase());
  console.log('rewardAmount:', rewardAmount);
  console.log('idClaim:', idClaim);
  console.log('messageString:', messageString);
  console.log('signer address (owner):', account.address);

  // 3. Hash lần 1 - tương đương returnHashedMessage trong Contract
  // hashMessage thêm prefix "\x19Ethereum Signed Message:\n{len}" + message
  const firstHash = hashMessage(messageString);
  console.log('firstHash:', firstHash);

  // 4. Ký raw bytes của firstHash
  // Contract sẽ: keccak256("\x19Ethereum Signed Message:\n32" + firstHash)
  // signMessage với raw sẽ tự động làm điều này
  const signature = await account.signMessage({
    message: { raw: toBytes(firstHash) },
  });
  console.log('full signature:', signature);

  // 5. Tách v, r, s từ signature (dạng hex string)
  // Format: r (32 bytes) + s (32 bytes) + v (1 byte)
  const r = signature.slice(0, 66) as `0x${string}`;
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`;
  const v = parseInt(signature.slice(130, 132), 16);

  console.log('v:', v);
  console.log('r:', r);
  console.log('s:', s);
  console.log('=================================');

  return { v, r, s };
}

export function generateIdClaim(): string {
  // Cách 1: Dùng random hex (Khuyên dùng vì nó ngắn gọn và chuyên nghiệp)
  // Tạo ra chuỗi kiểu: "0x74f...82a"
  return `0x${randomBytes(16).toString('hex')}`;
}

// Nếu bạn muốn idClaim mang tính định danh rõ ràng hơn:
export function generateIdClaimWithPrefix(userAddress: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000);
  // Tạo ra chuỗi kiểu: "CLAIM_0xa60..._170324123_456"
  return `CLAIM_${userAddress.slice(0, 6)}_${timestamp}_${randomSuffix}`;
}