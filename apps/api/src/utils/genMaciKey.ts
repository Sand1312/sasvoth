import { PrivKey, Keypair } from 'maci-domainobjs';

export function createMACIKeypair() {
    try {
        // Cách 1: Tạo private key từ random bytes
        const randomHex = Array.from({length: 64}, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
        const privKey = new PrivKey(randomHex);
        
        // Cách 2: Hoặc thử generate()
        // const privKey = PrivKey.generate();
        
        const keypair = new Keypair(privKey);
        
        const formattedPrivateKey = `macisk.${privKey.serialize()}`;
        const formattedPublicKey = `macipk.${keypair.pubKey.serialize()}`;
        
        return {
            privateKey: formattedPrivateKey,
            publicKey: formattedPublicKey,
            publicKeyAsContractParam: {
                X: keypair.pubKey.rawPubKey[0].toString(),
                Y: keypair.pubKey.rawPubKey[1].toString()
            }
        };
    } catch (error) {
        console.error('Error creating MACI keypair:', error);
        throw error;
    }
}