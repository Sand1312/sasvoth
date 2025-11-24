pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/poseidon.circom";

template VoteProof() {
    signal input privateKey;
    signal input vote;
    signal input voiceCredits;
    signal input nonce;
    signal input pollId;
    signal input pubkeyX;
    signal input pubkeyY;
    signal input voiceCreditBalance;

    signal input voterIndex;
    signal input voteCommitment;
    signal input outcome;

    component commitment = Poseidon(5);
    commitment.inputs[0] <== vote;
    commitment.inputs[1] <== voiceCredits;
    commitment.inputs[2] <== nonce;
    commitment.inputs[3] <== pollId;
    commitment.inputs[4] <== privateKey;
    commitment.out === voteCommitment;

    vote === outcome;
}

component main {public [voterIndex, voteCommitment, outcome]} = VoteProof();
