const { hashMessage, toBytes, keccak256, encodePacked, stringToBytes } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

async function testSignature() {
    // Use your actual private key
    const privateKey = '0x339872a763a25eee536042cb410594486927d23852146aaf5c9f6c853fdfbea7';
    const account = privateKeyToAccount(privateKey);

    // Test data from the logs
    const userAddress = '0xa60a2b2c6a4165a561d67753c21034fa0cbde702';
    const rewardAmount = '15000000000000000000';
    const idClaim = '0xf8df5e9f5c0c2829ba62a6a0b0157bae';

    console.log('\n=== SIGNATURE TEST ===');
    console.log('Signer (owner) address:', account.address);
    console.log('User address:', userAddress);
    console.log('Reward amount:', rewardAmount);
    console.log('ID Claim:', idClaim);

    // Build message exactly like contract does
    const messageString = `${userAddress.toLowerCase()}_${rewardAmount}_${idClaim}`;
    console.log('\nMessage string:', messageString);
    console.log('Message length:', messageString.length);

    // Step 1: First hash (like returnHashedMessage in contract)
    const firstHash = hashMessage(messageString);
    console.log('\nFirst hash (returnHashedMessage equivalent):', firstHash);

    // Step 2: Sign the raw bytes of firstHash
    const signature = await account.signMessage({
        message: { raw: toBytes(firstHash) },
    });
    console.log('\nFull signature:', signature);

    // Extract v, r, s
    const r = signature.slice(0, 66);
    const s = `0x${signature.slice(66, 130)}`;
    const v = parseInt(signature.slice(130, 132), 16);

    console.log('\nExtracted:');
    console.log('v:', v);
    console.log('r:', r);
    console.log('s:', s);

    // Verify: compute what contract would compute
    // Contract does: prefixedHashMessage = keccak256("\x19Ethereum Signed Message:\n32" + firstHash)
    // Then ecrecover(prefixedHashMessage, v, r, s) should return owner

    console.log('\n=== VERIFICATION ===');
    console.log('If this works, signer should match owner address');
    console.log('Expected signer:', account.address);
}

testSignature().catch(console.error);
