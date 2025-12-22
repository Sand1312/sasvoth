# Tổng Hợp Refactor Hệ Thống Quản Lý Khóa MACI

> **Ngày:** 21/12/2024  
> **Branch:** dev/signup

---

## 1. File Mới: `apps/web/utils/maciKeyDerivation.ts`

Tạo mới file chứa logic tạo khóa MACI:

```typescript
// Các hàm chính:
deriveMaciKeypair()     // Tạo keypair từ chữ ký EIP-712
clearMaciKeyCache()     // Xóa cache khi logout
hasCachedMaciKeypair()  // Check có cache chưa
getCachedMaciKeypair()  // Lấy keypair từ cache
getStateIndexFromChain() // Query stateIndex từ blockchain
```

---

## 2. Backend: `apps/api/src/modules/maci/maci.service.ts`

### Thêm Import
```typescript
import { PubKey } from '@maci-protocol/domainobjs';
```

### Thêm Error Handling cho "Đã Đăng Ký"
```typescript
// Trong hàm signup(), catch block:
const isAlreadySignedUp =
  errMsg.includes("0xf45d43bf") || // UserAlreadyJoined
  errMsg.includes("0x258a195a");   // LeafAlreadyExists

if (isAlreadySignedUp) {
  // Query stateIndex từ chain thay vì throw 500
  const pubKey = PubKey.deserialize(maciPubKey);
  const publicKeyHash = await maciContract.hash2([pubKeyX, pubKeyY]);
  const stateIndex = await maciContract.getStateIndex(publicKeyHash);
  
  return {
    success: true,
    stateIndex: stateIndex.toString(),
    alreadySignedUp: true
  };
}
```

---

## 3. Backend: `apps/api/src/modules/polls/schemas/polls.ts`

### Thêm Field
```typescript
@Prop({ required: false })
maciAddress: string;  // MACI contract address this poll belongs to
```

---

## 4. Backend: `apps/api/src/modules/polls/polls.controller.ts`

### Thêm vào UpdateChainDto
```typescript
class UpdateChainDto {
  @ApiProperty()
  pollIdOnChain: number;

  @ApiProperty({ required: false })
  subgraphUrl?: string;

  @ApiProperty({ required: false })
  maciAddress?: string;  // MỚI
}
```

---

## 5. Backend: `apps/api/src/modules/polls/polls.service.ts`

### Cập Nhật savePollOnChainId
```typescript
async savePollOnChainId(
  pollId: string,
  pollIdOnChain: number,
  subgraphUrl?: string,
  maciAddress?: string,  // THÊM PARAM MỚI
) {
  const update: any = { pollIdOnChain };
  if (subgraphUrl) update.subgraphUrl = subgraphUrl;
  if (maciAddress) update.maciAddress = maciAddress;  // THÊM
  // ...
}
```

---

## 6. Frontend: `apps/web/hooks/useMaciSignup.ts`

### Xóa localStorage Writes
```diff
- localStorage.setItem("maci_priv_key", privateKey);
- localStorage.setItem("maci_pub_key", publicKey);
- localStorage.setItem("maci_state_index", stateIndex);
```

### Thêm Xử Lý "Đã Đăng Ký"
```typescript
} catch (apiErr: any) {
  const isAlreadySignedUp = 
    errMsg.toLowerCase().includes("already") ||
    errMsg.toLowerCase().includes("signed up");
  
  if (isAlreadySignedUp) {
    return {
      success: true,
      stateIndex: null,
      alreadySignedUp: true,
    };
  }
  throw apiErr;
}
```

---

## 7. Frontend: `apps/web/hooks/useMaciVote.ts`

### Thay Đổi
```diff
- const privateKey = localStorage.getItem("maci_priv_key");
- const publicKey = localStorage.getItem("maci_pub_key");
- const stateIndex = localStorage.getItem("maci_poll_state_index");

+ const { privateKey, publicKey, pubKeyX, pubKeyY } = await deriveMaciKeypair(
+   address, chainId, signTypedDataAsync, { maciAddress }
+ );
+ const { stateIndex } = await getStateIndexFromChain(...);
```

---

## 8. Frontend: `apps/web/hooks/useMaciJoinPoll.ts`

### Thay Đổi
```diff
- const privateKey = localStorage.getItem("maci_priv_key");

+ const { privateKey } = await deriveMaciKeypair(
+   address, chainId, signTypedDataAsync, { maciAddress }
+ );
```

---

## 9. Frontend: `apps/web/hooks/useMACI.ts`

### Thêm Optional maciAddress Param
```typescript
const signupToMaci = async (
  pubKeyX?: string, 
  pubKeyY?: string, 
  maciAddressOverride?: string  // MỚI
) => {
  const maciAddress = maciAddressOverride || getMaciAddress();
  // ...
};

const joinMaciPoll = async (
  pollId: string,
  startBlock: number | undefined,
  privKey: string,
  signupBlockNumber?: number,
  maciAddressOverride?: string  // MỚI
) => { ... };

const submitVote = async (
  pollId: string,
  voteOptionIndex: number,
  voteWeight: number,
  nonce: number = 1,
  startBlock?: number,
  maciAddressOverride?: string  // MỚI
) => { ... };
```

---

## 10. Frontend: `apps/web/app/polls/[id]/components/interactive/signup-modal.tsx`

### Xóa localStorage
```diff
- localStorage.setItem(`maci_poll_state_index_${pollIdOnChain}`, joinResult.pollStateIndex);
- localStorage.setItem("maci_poll_state_index", joinResult.pollStateIndex);
- localStorage.setItem(`maci_voice_credits_${pollIdOnChain}`, joinResult.voiceCredits);
- localStorage.setItem("maci_voice_credits", joinResult.voiceCredits);

+ // Note: No localStorage needed - useMaciVote now gets stateIndex from chain
```

### Thay Đổi Check Cache
```diff
- const hasExistingKey = localStorage.getItem("maci_priv_key");

+ const hasExistingKey = hasCachedMaciKeypair(address, chainId);
```

---

## 11. Frontend: `apps/web/contexts/AuthContext.tsx`

### Thêm Clear Cache Khi Logout
```typescript
import { clearMaciKeyCache } from "@/utils/maciKeyDerivation";

const signout = async () => {
  // ... existing logout logic
  clearMaciKeyCache();  // THÊM
};
```

---

## 12. Frontend: `apps/web/lib/polls/service.ts`

### Thêm maciAddress vào Types
```typescript
export type PollData = {
  id: string;
  onChainId: string;
  // ... existing fields
  maciAddress?: string;  // MỚI
};

type ApiPoll = {
  // ... existing fields
  maciAddress?: string;  // MỚI
};
```

### Thêm Mapping
```typescript
return {
  // ... existing mappings
  maciAddress: source.maciAddress,  // MỚI
};
```

---

## Package Đã Cài

```bash
# Trong apps/api
pnpm add @maci-protocol/domainobjs
```
