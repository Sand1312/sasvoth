const { ethers } = require('ethers');

// Test data from your screenshot
const userAddress = '0xa60a2b2c6A4165a561D67753c21034fA0cBdE702';
const rewardAmount = '15000000000000000000';
const idClaim = 'reward_1766435569780_jkog7jao';
const v = 28;
const r = '0xcd8e350c0b33a5236f889e60de1b10623c6e66e9717e31580f60f7721c2d6878';
const s = '0x6dd6fd013ab5d65239779609c91e0938d8fbc9449f71634adacd76823679606d';

// Private key from signature.ts
const privateKey = process.env.PRIVATE_KEY || '339872a763a25eee536042cb410594486927d23852146aaf5c9f6c853fdfbea7';
const wallet = new ethers.Wallet(privateKey);

console.log('\n🔍 Testing Signature Verification\n');
console.log('Backend wallet address:', wallet.address);
console.log('User address:', userAddress);
console.log('Reward amount:', rewardAmount);
console.log('ID Claim:', idClaim);
console.log('\n--- Method 1: Current backend logic ---');

// Current backend logic
const addressWithout0x = userAddress.toLowerCase().replace('0x', '');
const message = `${addressWithout0x}_${rewardAmount}_${idClaim}`;
console.log('Message:', message);

const messageBytes = ethers.utils.toUtf8Bytes(message);
const messageLen = messageBytes.length.toString();
const hashedMessage = ethers.utils.keccak256(
  ethers.utils.solidityPack(
    ['string', 'string', 'string'],
    ['\x19Ethereum Signed Message:\n', messageLen, message]
  )
);
console.log('Hashed message:', hashedMessage);

// Verify signature
try {
  const recoveredAddress = ethers.utils.recoverAddress(
    hashedMessage,
    { v, r, s }
  );
  console.log('✅ Recovered signer:', recoveredAddress);
  console.log('Match backend wallet?', recoveredAddress.toLowerCase() === wallet.address.toLowerCase());
} catch (err) {
  console.error('❌ Failed to recover:', err.message);
}

console.log('\n--- Method 2: Simple signMessage ---');

async function testSimpleSign() {
  const sig = await wallet.signMessage(message);
  const recovered = ethers.utils.verifyMessage(message, sig);
  console.log('Signer with simple signMessage:', recovered);
  console.log('Signature:', sig);
}

testSimpleSign();
