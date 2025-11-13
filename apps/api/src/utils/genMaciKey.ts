const { Keypair, PrivKey } = require('maci-crypto');
const { randomBytes } = require('crypto');

/**
 * Tạo cặp khóa cho MACI với định dạng giống MACI CLI (có BigInt)
 * @returns {Object} { privateKey, publicKey, publicKeyAsContractParam }
 */
export function createMACIKeypair() {
    // Tạo private key ngẫu nhiên 32 bytes
    const privateKey = randomBytes(32);
    
    // Tạo keypair
    const keypair = new Keypair(new PrivKey(privateKey));
    

    const formattedPrivateKey = `macisk.${keypair.privKey.rawPrivKey.toString('hex')}`;
    

    const publicKeyHash = require('crypto').createHash('sha256')
        .update(Buffer.from(keypair.pubKey.rawPubKey[0].toString() + keypair.pubKey.rawPubKey[1].toString()))
        .digest('hex')
        .slice(0, 64);
    const formattedPublicKey = `macipk.${publicKeyHash}`;
    
    return {
        privateKey: formattedPrivateKey,
        publicKey: formattedPublicKey,
        publicKeyAsContractParam: {
            X: `${keypair.pubKey.rawPubKey[0].toString()}n`, 
            Y: `${keypair.pubKey.rawPubKey[1].toString()}n`  
        },
        raw: {
            privateKey: keypair.privKey.rawPrivKey.toString('hex'),
            publicKey: keypair.pubKey.rawPubKey,
            publicKeyBigInt: {
                X: BigInt(keypair.pubKey.rawPubKey[0].toString()),
                Y: BigInt(keypair.pubKey.rawPubKey[1].toString())
            }
        }
    };
}
