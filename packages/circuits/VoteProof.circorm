pragma circom 2.1.0;

include "maci-crypto/circuits/circom/ts/poseidon.circom";
include "maci-crypto/circuits/circom/ts/hashStateLeaf.circom";


template VoteProof() {
    // Private inputs (chỉ user biết)
    signal input privateKey;
    signal input vote;
    signal input voiceCredits;
    signal input nonce;
    signal input pollId;
    signal input pubkeyX;
    signal input pubkeyY;
    signal input voiceCreditBalance;

    // Public inputs (disclosed to prove winning vote)
    signal input voterIndex;
    signal input voteCommitment;
    signal input outcome;              // Winning option
    signal input stateLeaf;

    // 1. Verify state leaf là hợp lệ
    component leafHash = HashStateLeaf();
    leafHash.pubkey.x <== pubkeyX;
    leafHash.pubkey.y <== pubkeyY;
    leafHash.voiceCreditBalance <== voiceCreditBalance;
    leafHash.nonce <== nonce;
    leafHash.out === stateLeaf;

    // 2. Verify vote commitment từ vote details
    component commitment = Poseidon(5);
    commitment.inputs[0] <== vote;
    commitment.inputs[1] <== voiceCredits;
    commitment.inputs[2] <== nonce;
    commitment.inputs[3] <== pollId;
    commitment.inputs[4] <== privateKey;
    commitment.out === voteCommitment;

    // 3. Verify vote là cho lựa chọn chiến thắng
    vote === outcome;
}

component main {public [voterIndex, voteCommitment, outcome, stateLeaf]} = VoteProof();