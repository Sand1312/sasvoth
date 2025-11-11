pragma circom 2.1.0;

include "maci-crypto.circom"; // Thư viện MACI cung cấp Poseidon hash và các hàm liên quan

// Template VoteProof để chứng minh vote hợp lệ và đủ điều kiện nhận thưởng
template VoteProof() {
    // Public inputs (công khai, gửi lên contract để verify)
    signal input voterIndex; // Chỉ số của người dùng trong MACI state tree
    signal input voteCommitment; // Hash của vote (Poseidon hash của thông số)
    signal input outcome; // Option thắng (do coordinator set trong PayToVote)
    signal input stateLeaf; // Hash của thông tin sign-up (publicKey, voiceCredits, voterIndex)

    // Private inputs (bí mật, chỉ dùng local, không gửi lên chain)
    signal input privateKey; // Khóa bí mật của người dùng (MACI keypair)
    signal input vote; // voteOptionIndex (ví dụ: 1 = option A)
    signal input voiceCredits; // Số voice credits dùng để vote
    signal input nonce; // Số thứ tự vote (để hỗ trợ vote lại)
    signal input pollId; // ID của poll
    signal input stateLeafPreimage; // Preimage của stateLeaf (thông tin sign-up)

    // Kiểm tra stateLeaf hợp lệ
    component leafHash = HashStateLeaf(); // Hàm hash từ maci-crypto
    leafHash.preimage <== stateLeafPreimage; // Preimage (publicKey, voiceCredits)
    leafHash.index <== voterIndex; // Chỉ số người dùng
    leafHash.publicKey <== privateKey; // Tính publicKey từ privateKey
    leafHash.output === stateLeaf; // Xác minh stateLeaf khớp với hash

    // Tái tạo voteCommitment bằng Poseidon hash
    component commitment = Commitment(); // Hàm Commitment từ maci-crypto
    commitment.message[0] <== vote; // voteOptionIndex
    commitment.message[1] <== voiceCredits; // Số voice credits
    commitment.message[2] <== nonce; // Nonce
    commitment.message[3] <== pollId; // ID của poll
    commitment.privateKey <== privateKey; // Khóa bí mật
    commitment.output === voteCommitment; // Xác minh voteCommitment khớp

    // Kiểm tra vote đúng outcome
    vote === outcome; // Đảm bảo voteOptionIndex == outcome
}

// Khai báo main với public inputs
component main {public [voterIndex, voteCommitment, outcome, stateLeaf]} = VoteProof();