# Hướng Dẫn Verify Vote và Claim Reward

## Tổng Quan

Hệ thống verify vote và claim reward cho phép người dùng:
1. Tạo ZK proof để chứng minh họ đã vote
2. Verify proof on-chain
3. Nhận reward token dựa trên vote weight

## Flow Tổng Thể

```
User Vote → Generate ZK Proof → Verify on Contract → Save Reward to DB → Claim Token
```

### Chi Tiết Từng Bước

#### 1. User Vote (Đã có sẵn trong hệ thống MACI)
- User signup với MACI keypair
- User publish message để vote
- Vote được encrypt và gửi lên chain

#### 2. Generate ZK Proof (Frontend)
**Location**: `apps/web/components/claim/PrizeClaimForm.tsx`

User cần nhập:
- `voteOptionIndex`: Index của option đã vote (0, 1, 2,...)
- `voteWeight`: Voice credits đã dùng
- `nonce`: Nonce của vote (thường là 0)
- `password`: Secret password (số) dùng để tạo commitment

**Proof Input**:
```typescript
{
  privateKey: passwordBigInt,        // Password người dùng
  vote: voteNum,                     // Vote option index
  voiceCredits: weightNum,           // Voice credits
  nonce: nonceNum,                   // Nonce
  pollId: pollIdNum,                 // Poll ID
  pubkeyX: BigInt(pubKeyX),          // MACI public key X
  pubkeyY: BigInt(pubKeyY),          // MACI public key Y
  voiceCreditBalance: weightNum * weightNum,
  voterIndex: BigInt(stateIndex),    // State index trong MACI
  voteCommitment: BigInt(voteCommitment),
  outcome: BigInt(0)
}
```

**Commitment Calculation**:
```typescript
const voteCommitment = poseidon([
  voteNum,
  weightNum,
  nonceNum,
  pollIdNum,
  passwordBigInt
]);
```

#### 3. Verify Proof On-Chain
**Location**: `apps/web/hooks/useVerifyVote.ts`

**Contract**: `VerifyVote.sol` (address: `0xB01489a6Cb3A66AC56bCE486777307516E20ED32`)

**Function**:
```solidity
function verifyVoteProof(
    uint256 pollId,
    uint256 voterIndex,
    uint256[8] calldata proof,
    uint256[10] calldata publicSignals
) external returns (bool)
```

**Proof Format**:
```typescript
[
  BigInt(proof.pi_a[0]),
  BigInt(proof.pi_a[1]),
  BigInt(proof.pi_b[0][0]),
  BigInt(proof.pi_b[0][1]),
  BigInt(proof.pi_b[1][0]),
  BigInt(proof.pi_b[1][1]),
  BigInt(proof.pi_c[0]),
  BigInt(proof.pi_c[1])
]
```

#### 4. Save Reward to Database (Backend)
**Location**: `apps/api/src/modules/rewards/rewards.service.ts`

**Endpoint**: `POST /api/v1/rewards`

**Request Body**:
```json
{
  "walletAddress": "0x...",
  "pollId": "123",
  "voteWeight": 9
}
```

**Response**:
```json
{
  "_idClaim": "unique-claim-id",
  "amountToken": "900000000000000000", // 9 tokens (vote weight * 10^18)
  "_v": 28,
  "_r": "0x...",
  "_s": "0x..."
}
```

**Signature Generation**:
Backend tạo EIP-712 signature với:
```typescript
const message = ethers.utils.solidityKeccak256(
  ['string', 'uint256'],
  [_idClaim, amountToken]
);
```

#### 5. Claim Token (On-Chain)
**Location**: `apps/web/hooks/useClaimContract.ts`

**Contract**: `Claiming.sol` (address: `0x1FDc22E49e39054f38479fccC17D17813EF73B11`)

**Function**:
```solidity
function ClaimReward(
    string memory _idClaim,
    uint256 rewardAmount,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
) external
```

Contract sẽ:
1. Verify signature từ backend
2. Check `_idClaim` chưa được claim
3. Transfer HD token cho user
4. Mark `_idClaim` là đã claimed

## Components

### Frontend Components

#### 1. PrizeClaimForm
**Path**: `apps/web/components/claim/PrizeClaimForm.tsx`

Form cho user nhập thông tin và claim reward:
- Vote option index
- Vote weight
- Nonce
- Secret password

**Usage**:
```tsx
<PrizeClaimForm 
  pollId="123"
  maciAddress="0x..."
  startBlock={12345}
/>
```

### Hooks

#### 1. useGenProofVerify
**Path**: `apps/web/hooks/genProofVerify.ts`

Generate và verify ZK proof locally:
```typescript
const { generateVoteProof, verifyProof } = useGenProofVerify();

const proofData = await generateVoteProof(input);
const isValid = await verifyProof(proofData.proof, proofData.publicSignals);
```

#### 2. useVerifyVote
**Path**: `apps/web/hooks/useVerifyVote.ts`

Verify proof on-chain:
```typescript
const { verifyVote } = useVerifyVote();

await verifyVote(pollId, stateIndex, proof, publicSignals);
```

#### 3. useRewards
**Path**: `apps/web/hooks/useRewards.ts`

Save reward to backend:
```typescript
const { saveReward } = useRewards();

const res = await saveReward(address, pollId, voteWeight);
// Returns: { _idClaim, amountToken, _v, _r, _s }
```

#### 4. useClaimContract
**Path**: `apps/web/hooks/useClaimContract.ts`

Claim token from smart contract:
```typescript
const { claimReward } = useClaimContract();

await claimReward(_idClaim, amountToken, _v, _r, _s);
```

### Backend Services

#### 1. RewardsService
**Path**: `apps/api/src/modules/rewards/rewards.service.ts`

**Methods**:
- `saveReward(createRewardDto)`: Tạo reward và signature
- `findAll()`: Lấy tất cả rewards
- `findByWallet(walletAddress)`: Lấy rewards theo wallet

#### 2. RewardsController
**Path**: `apps/api/src/modules/rewards/rewards.controller.ts`

**Endpoints**:
- `POST /api/v1/rewards`: Tạo reward mới
- `GET /api/v1/rewards`: Lấy tất cả rewards
- `GET /api/v1/rewards/:walletAddress`: Lấy rewards theo wallet

## Smart Contracts

### 1. VerifyVote Contract
**Address**: `0xB01489a6Cb3A66AC56bCE486777307516E20ED32`

Verify ZK proof cho vote:
```solidity
function verifyVoteProof(
    uint256 pollId,
    uint256 voterIndex,
    uint256[8] calldata proof,
    uint256[10] calldata publicSignals
) external returns (bool)
```

### 2. Claiming Contract
**Address**: `0x1FDc22E49e39054f38479fccC17D17813EF73B11`

Claim reward tokens:
```solidity
function ClaimReward(
    string memory _idClaim,
    uint256 rewardAmount,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
) external
```

**Security**:
- Signature verification từ backend wallet
- Prevent double claiming với `_idClaim`
- Only owner có thể withdraw funds

## Admin Functions

### Fund Management
**Location**: `apps/web/app/admin/dashboard/page.tsx`

Admin có thể:

#### 1. Deposit HD Tokens
Transfer token vào contract để trả rewards:
```typescript
const { transfer } = useToken();
await transfer(CLAIM_CONTRACT_ADDRESS, amount);
```

#### 2. Withdraw ETH
Rút ETH từ contract:
```typescript
const { withdrawETH } = useClaimContract();
await withdrawETH();
```

#### 3. Withdraw HD Tokens
Rút HD tokens từ contract:
```typescript
const { withdrawToken } = useClaimContract();
await withdrawToken();
```

## Ví Dụ Hoàn Chỉnh

### User Flow

```typescript
// 1. User đã vote trong MACI system với password = "123456"

// 2. Generate proof
const input = {
  privateKey: BigInt("123456"),
  vote: BigInt(0),              // Voted for option 0
  voiceCredits: BigInt(9),      // Used 9 voice credits
  nonce: BigInt(0),
  pollId: BigInt(123),
  pubkeyX: BigInt(pubKeyX),
  pubkeyY: BigInt(pubKeyY),
  voiceCreditBalance: BigInt(81), // 9^2
  voterIndex: BigInt(stateIndex),
  voteCommitment: BigInt(commitment),
  outcome: BigInt(0)
};

const proofData = await generateVoteProof(input);

// 3. Verify locally
const isValid = await verifyProof(proofData.proof, proofData.publicSignals);

// 4. Verify on-chain
await verifyVote(pollId, stateIndex, proof, publicSignals);

// 5. Save reward to backend
const res = await saveReward(walletAddress, "123", 9);
// Returns: { _idClaim: "abc123", amountToken: "900...", _v: 28, _r: "0x...", _s: "0x..." }

// 6. Claim token
await claimReward(res._idClaim, res.amountToken, res._v, res._r, res._s);
```

### Admin Flow

```typescript
// 1. Deposit 1000 HD tokens vào contract
const { transfer } = useToken();
await transfer(CLAIM_CONTRACT_ADDRESS, "1000");

// 2. Check contract balance
const { contractBalance } = useToken();
console.log(`Contract has ${contractBalance} HD tokens`);

// 3. Withdraw tokens if needed
const { withdrawToken } = useClaimContract();
await withdrawToken();
```

## Security Considerations

### 1. ZK Proof
- Proof đảm bảo user thực sự đã vote
- Không reveal vote choice
- Không thể fake vote weight

### 2. Backend Signature
- EIP-712 signature từ backend wallet
- Prevent unauthorized claims
- Each `_idClaim` chỉ claim được 1 lần

### 3. Smart Contract
- Only owner có thể withdraw
- Signature verification
- Double claim prevention

## Troubleshooting

### Common Issues

#### 1. "State index not found"
- User chưa signup trong MACI
- Cần gọi `signUp()` trước khi vote

#### 2. "Proof verification failed"
- Password sai
- Vote details không khớp với on-chain data
- Public signals không đúng

#### 3. "Claim already used"
- `_idClaim` đã được claim rồi
- Không thể claim 2 lần

#### 4. "Invalid signature"
- Signature từ backend không hợp lệ
- Backend wallet address không khớp

## Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

#### Backend (.env)
```bash
# Wallet cho signing
WALLET_PRIVATE_KEY=your-private-key
WALLET_ADDRESS=your-wallet-address

# Contract addresses
CLAIM_CONTRACT_ADDRESS=0x1FDc22E49e39054f38479fccC17D17813EF73B11
TOKEN_CONTRACT_ADDRESS=0xDa52d3Fb44fECd1eB69b7206d9c73b91CFAFA4a8
VERIFY_VOTE=0xB01489a6Cb3A66AC56bCE486777307516E20ED32
```

## Testing

### Test Vote và Claim

```typescript
// Test data
const testInput = {
  voteOptionIndex: "0",
  voteWeight: "9",
  nonce: "0",
  password: "123456",
  pollId: "123",
  maciAddress: "0x427f7F83c465eb7176c98Bf056233329b10c5E1b"
};

// Run through full flow
// 1. Generate proof
// 2. Verify on-chain
// 3. Save reward
// 4. Claim token
```

## Future Improvements

1. **Batch Claiming**: Cho phép claim nhiều rewards cùng lúc
2. **Reward Tiers**: Khác nhau reward dựa trên vote weight
3. **Time Lock**: Thêm thời gian chờ trước khi claim
4. **NFT Rewards**: Thêm NFT rewards cho top voters
5. **Leaderboard**: Hiển thị top voters và rewards

## References

- [MACI Documentation](https://maci.pse.dev/)
- [Snarkjs Documentation](https://github.com/iden3/snarkjs)
- [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712)
- [Poseidon Hash](https://www.poseidon-hash.info/)
