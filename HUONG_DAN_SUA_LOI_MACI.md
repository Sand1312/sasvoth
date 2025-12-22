# Hướng Dẫn Sửa Lỗi MACI System

## Tổng Quan Các Vấn Đề

### 1. ❌ Lỗi MACI_address trong localStorage (2 keys)
**Vấn đề hiện tại:**
- MACI address đang được lưu trong localStorage với 2 keys:
  - `maciAddress` 
  - `maciStartBlock`
- Điều này gây ra vấn đề khi có nhiều MACI contracts hoặc polls

**Giải pháp:**
- Bỏ hoàn toàn việc lưu `maciAddress` và `maciStartBlock` trong localStorage
- Lấy thông tin này từ API/database thay vì localStorage
- Mỗi poll có thể thuộc về MACI contract khác nhau

**⚠️ LƯU Ý:** Chỉ bỏ `maciAddress` và `maciStartBlock` (contract info), KHÔNG bỏ `maci_priv_key` và `maci_pub_key` (user keys)

---

### 2. ❌ Lỗi Sign Up không rõ ràng
**Vấn đề hiện tại:**
- Thiếu payload validation
- Lỗi "Already signed up" không được xử lý riêng
- Error messages không cụ thể

**Giải pháp:**
- Thêm validation cho payload
- Catch lỗi "AlreadySignedUp" từ smart contract
- Trả về error message rõ ràng với HTTP status codes phù hợp

---

### 3. ❌ Thiếu START_BLOCK trong database
**Vấn đề hiện tại:**
- START_BLOCK chỉ được lưu trong localStorage
- Không lưu vào database khi deploy MACI
- Gây khó khăn khi scan events từ blockchain

**Giải pháp:**
- Lưu `startBlock` vào database schema `MaciDeployment`
- Tự động fetch startBlock khi deploy MACI contract
- Return startBlock cùng với maciAddress trong API response

---

## Chi Tiết Thực Hiện

### Bước 1: Cải thiện Error Handling cho Sign Up

**File:** `apps/api/src/modules/maci/maci.service.ts`

**Vị trí:** Method `signup()` (dòng ~110-160)

**Thay đổi:**

```typescript
async signup(maciPubKey: string, maciAddress?: string, sgData?: string) {
  try {
    this.logger.log(`Signing up to MACI... PubKey: ${maciPubKey}`);
    
    // ✅ THÊM: Validate payload
    if (!maciPubKey) {
      throw new HttpException("Missing payload: maciPubKey is required", 400);
    }
    
    const providerV6 = new ethers6.JsonRpcProvider(this.provider.connection.url);
    const signerV6 = new ethers6.Wallet(this.privateKey, providerV6);
    
    const address = maciAddress || this.maciAddress;
    
    this.logger.log(`Using MACI Address: ${address}`);

    // ✅ SỬA: Validate maciPubKey format
    if (!maciPubKey.startsWith("macipk.")) {
      throw new HttpException("Invalid MACI Public Key format", 400);
    }

    const result = await sdkSignup({
      maciAddress: address,
      maciPublicKey: maciPubKey,
      signer: signerV6,
      sgData: sgData || "0x0000000000000000000000000000000000000000000000000000000000000000"
    });

    // ... rest of code ...

    return {
      success: true,
      stateIndex: result.stateIndex.toString(),
      hash: result.transactionHash,
      blockNumber
    };
  } catch (error) {
    this.logger.error("Signup failed", error);
    
    // ✅ THÊM: Check for specific error types
    const errorMessage = error.message || error.toString();
    
    // Already signed up error
    if (errorMessage.includes('AlreadySignedUp') || errorMessage.includes('already signed up')) {
      throw new HttpException('Already signed up', 409);
    }
    
    // Missing or invalid parameters
    if (errorMessage.includes('missing') || errorMessage.includes('required')) {
      throw new HttpException(`Missing required parameters: ${errorMessage}`, 400);
    }
    
    // Re-throw HttpException as-is
    if (error instanceof HttpException) {
      throw error;
    }
    
    throw new HttpException(`Signup failed: ${errorMessage}`, 500);
  }
}
```

**HTTP Status Codes:**
- ✅ `400` - Missing payload hoặc invalid format
- ✅ `409` - Already signed up
- ✅ `500` - Server error

---

### Bước 2: Thêm API Endpoint để lấy Latest MACI Deployment

**File:** `apps/api/src/modules/maci/maci.controller.ts`

**Vị trí:** Sau method `submitProofs()` (dòng ~289)

**Thêm endpoint mới:**

```typescript
/**
 * Get latest MACI deployment
 * GET /maci/deployments/latest
 */
@Get('deployments/latest')
@ApiOperation({ summary: 'Get latest MACI deployment info' })
@ApiResponse({ status: 200, description: 'Latest MACI deployment' })
async getLatestDeployment() {
  return this.maciService.getLatestDeployment();
}
```

---

**File:** `apps/api/src/modules/maci/maci.service.ts`

**Vị trí:** Cuối file, trước dấu `}` cuối (dòng ~1289)

**Thêm method mới:**

```typescript
/**
 * Get latest MACI deployment info
 */
async getLatestDeployment() {
  try {
    const deployment = await this.maciDeploymentsService.getLatest();
    
    if (!deployment) {
      throw new HttpException('No MACI deployment found', 404);
    }

    return {
      maciAddress: deployment.maciAddress,
      startBlock: deployment.startBlock || 0,
      subgraphUrl: deployment.subgraphUrl,
      chain: deployment.chain,
      deploymentId: deployment.deploymentId,
      createdAt: deployment.createdAt
    };
  } catch (error) {
    this.logger.error('Failed to get latest deployment', error);
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException('Failed to get latest deployment', 500);
  }
}
```

---

### Bước 3: Thêm API Client Method (Frontend)

**File:** `apps/web/api/maci.api.ts`

**Vị trí:** Sau method `submitProofs()` (dòng ~207)

**Thêm:**

```typescript
/**
 * Get latest MACI deployment
 * GET /maci/deployments/latest
 */
getLatestDeployment: async () => {
  const response = await api.get("/maci/deployments/latest");
  return response.data;
},
```

---

### Bước 4: Cập nhật Frontend để dùng API thay vì localStorage

**File:** `apps/web/hooks/useMACI.ts`

**Vị trí:** Method `getMaciAddress()` (dòng ~34-49)

**Thay đổi:**

```typescript
// ❌ CŨ - Đọc từ localStorage
const getMaciAddress = (): string => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("maciAddress");
    const envAddress = process.env.NEXT_PUBLIC_MACI_ADDRESS;
    const fallbackAddress = MACI_ADDRESS;

    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_MACI_ADDRESS || MACI_ADDRESS;
};

// ✅ MỚI - Fetch từ API
const [maciDeployment, setMaciDeployment] = useState<any>(null);

useEffect(() => {
  async function fetchMaciDeployment() {
    try {
      const deployment = await maciApi.getLatestDeployment();
      setMaciDeployment(deployment);
    } catch (error) {
      console.error("Failed to fetch MACI deployment:", error);
      // Fallback to env variable
      setMaciDeployment({
        maciAddress: process.env.NEXT_PUBLIC_MACI_ADDRESS || MACI_ADDRESS,
        startBlock: 0
      });
    }
  }
  fetchMaciDeployment();
}, []);

const getMaciAddress = (): string => {
  return maciDeployment?.maciAddress || process.env.NEXT_PUBLIC_MACI_ADDRESS || MACI_ADDRESS;
};

const getStartBlock = (): number => {
  return maciDeployment?.startBlock || 0;
};
```

---

### Bước 5: Xóa localStorage Keys

**Các file cần sửa:**

1. **`apps/web/app/admin/polls/page.tsx`** (dòng ~468-472)
   - ❌ Xóa: `localStorage.removeItem("maciAddress")`
   - ❌ Xóa: `localStorage.removeItem("maciStartBlock")`

2. **`apps/web/app/votes/[id]/page.tsx`** (dòng ~245, 393-399)
   - ❌ Xóa: `localStorage.getItem("maciAddress")`
   - ✅ Thay bằng: `await maciApi.getLatestDeployment()`

3. **`apps/web/hooks/useMaciJoinPoll.ts`** (dòng ~23)
   - ❌ Xóa: `localStorage.getItem("maciStartBlock")`
   - ✅ Lấy từ API response

4. **`apps/web/app/polls/[id]/components/interactive/tally-button.tsx`** (dòng ~40, 44)
   - ❌ Xóa: `localStorage.getItem("maciAddress")`
   - ❌ Xóa: `localStorage.getItem("maciStartBlock")`
   - ✅ Thay bằng API call

---

### Bước 6: Cập nhật Database Schema (Đã có sẵn ✅)

**File:** `apps/api/src/modules/maci/schemas/maci-deployment.schema.ts`

**Schema hiện tại:**

```typescript
@Schema({ timestamps: true })
export class MaciDeployment {
    @Prop({ required: true, unique: true, index: true })
    maciAddress: string;

    @Prop({ required: false })
    subgraphUrl: string;

    @Prop({ required: false })
    startBlock: number;  // ✅ ĐÃ CÓ FIELD NÀY

    @Prop({ required: true })
    chain: string;

    @Prop({ required: false })
    deploymentId: string;

    @Prop({ required: false })
    txHash: string;

    @Prop({ type: Object, required: false })
    config: Record<string, any>;
}
```

**✅ Schema đã có `startBlock` field - Không cần thay đổi**

---

### Bước 7: Đảm bảo deployMaci() lưu startBlock vào DB

**File:** `apps/api/src/modules/maci/maci.service.ts`

**Vị trí:** Method `deployMaci()` (dòng ~480-580)

**Kiểm tra code hiện tại:**

```typescript
// Get block number from Coordinator response or fetch from chain
let startBlock = result.blockNumber || result.startBlock || 0;

if (!startBlock || startBlock === 0) {
  try {
    // Fetch current block number from chain as fallback
    const currentBlock = await this.provider.getBlockNumber();
    // Use slightly earlier block to ensure we capture the deploy tx
    startBlock = Math.max(0, currentBlock - 10);
    this.logger.log(`Fetched startBlock from chain: ${startBlock}`);
  } catch (e) {
    this.logger.warn('Failed to fetch block number from chain, using 0');
    startBlock = 0;
  }
}

// Save MACI deployment info to database
try {
  await this.maciDeploymentsService.upsert({
    maciAddress,
    subgraphUrl: subgraphUrl || undefined,
    startBlock,  // ✅ ĐÃ LƯU startBlock
    chain: payload.chain || 'arbitrum_sepolia',
    config: payload.config,
  });
  this.logger.log(`MACI deployment saved to database: ${maciAddress}`);
} catch (dbError) {
  this.logger.warn('Failed to save MACI deployment to database', dbError);
}
```

**✅ Code đã lưu startBlock vào DB - Không cần thay đổi**

---

## 🚨 URGENT: Files Cần Sửa NGAY để Fix Wallet Mismatch Bug

### New Files (Tạo mới)

| File | Purpose | Priority |
|------|---------|----------|
| `apps/web/utils/maciStorage.ts` | Wallet-specific localStorage manager | 🔴 URGENT |

### Modified Files (Sửa)

| File | Changes | Priority |
|------|---------|----------|
| `apps/web/contexts/AuthContext.tsx` | Clear MACI keys on logout | 🔴 URGENT |
| `apps/web/hooks/useMaciSignup.ts` | Use wallet-specific storage | 🔴 URGENT |
| `apps/web/hooks/useMaciVote.ts` | Load keys by wallet address | 🔴 URGENT |
| `apps/web/hooks/useMaciJoinPoll.ts` | Load keys by wallet address | 🔴 URGENT |
| `apps/web/hooks/useCheckJoinStatus.ts` | Check keys by wallet address | 🔴 URGENT |

### Testing Checklist

- [ ] User A login → Generate keys → Keys saved with wallet A address
- [ ] User A logout → All MACI keys cleared
- [ ] User B login → No MACI keys from User A
- [ ] User B signup → New keys with wallet B address
- [ ] Switch back to User A → Load keys for wallet A (if exists)
- [ ] Try to vote with wallet B keys on wallet A → Should fail

---

## Tóm Tắt Files Cần Sửa (Error Handling & API Changes)

### Backend (API)

| File | Changes | Lines |
|------|---------|-------|
| `apps/api/src/modules/maci/maci.service.ts` | Cải thiện error handling trong `signup()` | ~110-180 |
| `apps/api/src/modules/maci/maci.service.ts` | Thêm method `getLatestDeployment()` | ~1289 |
| `apps/api/src/modules/maci/maci.controller.ts` | Thêm endpoint `GET /maci/deployments/latest` | ~289 |

### Frontend (Web)

| File | Changes | Lines |
|------|---------|-------|
| `apps/web/api/maci.api.ts` | Thêm `getLatestDeployment()` | ~207 |
| `apps/web/hooks/useMACI.ts` | Fetch MACI từ API thay vì localStorage | ~34-49 |
| `apps/web/app/admin/polls/page.tsx` | Xóa localStorage usage | ~468-472 |
| `apps/web/app/votes/[id]/page.tsx` | Xóa localStorage, dùng API | ~245, ~393-399 |
| `apps/web/hooks/useMaciJoinPoll.ts` | Lấy startBlock từ API | ~23 |
| `apps/web/app/polls/[id]/components/interactive/tally-button.tsx` | Xóa localStorage, dùng API | ~40, ~44 |

### Files Cần Xóa (Optional)

| File | Reason |
|------|--------|
| `force_update_maci.js` | Không còn cần thiết khi dùng API |
| `clear_maci_storage.js` | Không còn cần thiết khi dùng API |
| `check_localStorage.js` | Debug script - có thể xóa |

---

## Cách MACI Address Hoạt Động Sau Khi Sửa

### Flow Mới:

1. **Deploy MACI Contract** (Admin)
   ```
   Admin -> Deploy MACI 
   -> Backend nhận response từ Coordinator
   -> Lưu vào DB: { maciAddress, startBlock, subgraphUrl, chain }
   -> Return về frontend
   ```

2. **User Sign Up / Join Poll**
   ```
   User action 
   -> Frontend gọi API: GET /maci/deployments/latest
   -> Backend query DB: MaciDeployment.findOne().sort({ createdAt: -1 })
   -> Return: { maciAddress, startBlock, ... }
   -> Frontend dùng maciAddress này cho các actions
   ```

3. **Multiple MACI Contracts** (Tương lai)
   ```
   Poll Model có thể thêm field: maciContractAddress
   -> Mỗi poll biết nó thuộc MACI contract nào
   -> Query subgraph tương ứng với MACI đó
   ```

---

## Error Messages Mapping

### Backend Response Codes

| Error | HTTP Code | Message | Location |
|-------|-----------|---------|----------|
| Missing payload | 400 | "Missing payload: maciPubKey is required" | `maci.service.ts:signup()` |
| Invalid format | 400 | "Invalid MACI Public Key format" | `maci.service.ts:signup()` |
| Already signed up | 409 | "Already signed up" | `maci.service.ts:signup()` catch block |
| Signature expired | 400 | "Signature expired" | `maci.service.ts:signupWithSignature()` |
| No deployment found | 404 | "No MACI deployment found" | `maci.service.ts:getLatestDeployment()` |

### Frontend Error Display

**Nơi hiển thị error:**
- Modal/Toast notifications (dùng `useFeedback()` hook)
- Form validation errors (dưới input fields)
- Console logs (cho debugging)

**Ví dụ xử lý:**

```typescript
try {
  await maciApi.signup({ maciPubKey });
} catch (error) {
  if (error.response?.status === 409) {
    showError("Already Signed Up", "You have already signed up to this MACI contract.");
  } else if (error.response?.status === 400) {
    showError("Invalid Input", error.response?.data?.message || "Please check your input.");
  } else {
    showError("Signup Failed", error.message);
  }
}
```

---

## Testing Checklist

### Backend Tests

- [ ] Test signup với missing payload -> 400 error
- [ ] Test signup với invalid format -> 400 error  
- [ ] Test signup với user đã signup -> 409 error
- [ ] Test `GET /maci/deployments/latest` -> return latest deployment
- [ ] Test `GET /maci/deployments/latest` khi chưa có deployment -> 404 error
- [ ] Test deployMaci lưu đúng startBlock vào DB

### Frontend Tests

- [ ] Test fetch MACI deployment từ API thành công
- [ ] Test fallback khi API call thất bại
- [ ] Test hiển thị error messages rõ ràng
- [ ] Test không còn read/write localStorage cho maciAddress
- [ ] Test Join Poll với startBlock từ API
- [ ] Test Tally với maciAddress từ API

### Integration Tests

- [ ] Deploy MACI -> Verify DB có record mới với startBlock
- [ ] Sign Up -> Verify error messages hiển thị đúng
- [ ] Multiple polls -> Verify mỗi poll có thể query đúng MACI contract

---

## Migration Notes

**Khi deploy lên production:**

1. ✅ Database migration: Schema đã có `startBlock` field
2. ⚠️ Cần re-deploy MACI contract mới hoặc manually insert existing MACI vào DB
3. ⚠️ Clear localStorage của users: Add migration script hoặc ignore old data
4. ✅ API endpoints backward compatible (legacy endpoints vẫn hoạt động)

**Migration Script (Optional):**

```typescript
// Run once to migrate existing MACI from env to DB
async function migrateMaciToDatabase() {
  const existingMaci = process.env.MACI_ADDRESS;
  const existingStartBlock = process.env.MACI_START_BLOCK || 0;
  
  if (existingMaci) {
    await maciDeploymentsService.upsert({
      maciAddress: existingMaci,
      startBlock: parseInt(existingStartBlock),
      chain: 'arbitrum_sepolia',
    });
    console.log('✅ Migrated existing MACI to database');
  }
}
```

---

## Subgraph Query Strategy

**Câu hỏi:** Làm thế nào để biết poll thuộc MACI contract nào?

**Trả lời:**

### Option 1: Query Subgraph với MACI Address Filter

```graphql
query GetPollsByMaci($maciAddress: String!) {
  polls(where: { maci: $maciAddress }) {
    id
    pollId
    maci
    # ... other fields
  }
}
```

### Option 2: Lưu maciAddress trong Poll Model (Database)

```typescript
// apps/api/src/modules/polls/schemas/poll.schema.ts
@Schema()
export class Poll {
  // ... existing fields
  
  @Prop({ required: false })
  maciContractAddress?: string;  // Thêm field này
}
```

**Khi deploy poll:**
```typescript
const latestMaci = await maciDeploymentsService.getLatest();
await pollsService.create({
  ...pollData,
  maciContractAddress: latestMaci.maciAddress
});
```

**Khi query poll:**
```typescript
const poll = await pollsService.findById(pollId);
const maciDeployment = await maciDeploymentsService.getByAddress(
  poll.maciContractAddress
);
const subgraphUrl = maciDeployment.subgraphUrl;
// Use this subgraph to query poll data
```

---

## 🔐 Security: Lưu MACI Private Key & Public Key Ở Đâu?

### ⚠️ QUAN TRỌNG: Phân Biệt 2 Loại Keys

#### 1. Contract Info (BỎ khỏi localStorage)
- ❌ `maciAddress` - Địa chỉ MACI contract → Lấy từ API
- ❌ `maciStartBlock` - Block number deploy → Lấy từ API

#### 2. User MACI Keys (VẪN lưu trong localStorage - TẠM THỜI)
- ✅ `maci_priv_key` - MACI Private Key của user
- ✅ `maci_pub_key` - MACI Public Key của user
- ✅ `maci_state_index` - State index sau khi signup

### 🚨 VẤN ĐỀ NGHIÊM TRỌNG: Keys Không Match Với Wallet Mới

**Tình huống:**
```
1. User A login wallet 0xAAA → Generate MACI keys → Lưu localStorage
2. User A logout
3. User B login wallet 0xBBB → Vẫn dùng MACI keys của User A ❌
4. User B vote → Dùng nhầm identity của User A → VOTE SAI!
```

**Tại sao nguy hiểm:**
- User B vote với keys của User A
- Vote không hợp lệ hoặc vote cho người khác
- Mất tính bảo mật và privacy của MACI

**PHẢI FIX NGAY:**

### 🔧 FIX NGAY: Validate và Clear Keys

#### Solution 1: Clear Keys Khi Logout/Switch Wallet (PHẢI LÀM NGAY)

**File:** `apps/web/contexts/AuthContext.tsx`

```typescript
const signout = async () => {
  try {
    await authApi.signout();
    
    // ✅ THÊM: Clear MACI keys khi logout
    localStorage.removeItem('maci_priv_key');
    localStorage.removeItem('maci_pub_key');
    localStorage.removeItem('maci_state_index');
    localStorage.removeItem('maci_poll_state_index');
    localStorage.removeItem('maci_voice_credits');
    
    // Clear poll-specific keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('maci_poll_state_index_') || 
          key.startsWith('maci_voice_credits_')) {
        localStorage.removeItem(key);
      }
    });
    
    setUser(null);
    replaceTo("/signin");
  } catch (error) {
    console.error("Signout error:", error);
    throw error;
  }
};
```

#### Solution 2: Validate Keys Match Current Wallet (PHẢI LÀM NGAY)

**File:** `apps/web/hooks/useMaciSignup.ts`

```typescript
const signup = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // ✅ THÊM: Check if keys exist and match current wallet
    const existingPubKey = localStorage.getItem('maci_pub_key');
    const existingWallet = localStorage.getItem('maci_wallet_address');
    const currentWallet = walletAddress?.toLowerCase();
    
    if (existingPubKey && existingWallet !== currentWallet) {
      console.warn('⚠️ MACI keys from different wallet detected! Clearing...');
      
      // Clear old keys
      localStorage.removeItem('maci_priv_key');
      localStorage.removeItem('maci_pub_key');
      localStorage.removeItem('maci_state_index');
      localStorage.removeItem('maci_wallet_address');
      
      // Show warning to user
      alert('Detected keys from another wallet. Generating new MACI identity...');
    }
    
    // Generate new keys
    const { keypair, privateKey, publicKey } = generateMaciKeypair();
    
    // Save keys WITH wallet address
    localStorage.setItem("maci_priv_key", privateKey);
    localStorage.setItem("maci_pub_key", publicKey);
    localStorage.setItem("maci_wallet_address", currentWallet); // ✅ THÊM
    
    // Signup...
  }
};
```

#### Solution 3: Wallet-Specific LocalStorage Keys (PHẢI LÀM NGAY)

**Thay vì:**
```typescript
localStorage.setItem('maci_priv_key', privateKey); // ❌ Global key
```

**Dùng:**
```typescript
const walletAddress = '0x123...';
localStorage.setItem(`maci_priv_key_${walletAddress}`, privateKey); // ✅ Wallet-specific
localStorage.setItem(`maci_pub_key_${walletAddress}`, publicKey);
localStorage.setItem(`maci_state_index_${walletAddress}`, stateIndex);
```

**Implementation:**

```typescript
// apps/web/utils/maciStorage.ts
export class MaciStorage {
  private static getKey(walletAddress: string, keyType: string): string {
    return `maci_${keyType}_${walletAddress.toLowerCase()}`;
  }
  
  static savePrivateKey(walletAddress: string, privateKey: string): void {
    localStorage.setItem(
      this.getKey(walletAddress, 'priv_key'), 
      privateKey
    );
  }
  
  static loadPrivateKey(walletAddress: string): string | null {
    return localStorage.getItem(this.getKey(walletAddress, 'priv_key'));
  }
  
  static savePublicKey(walletAddress: string, publicKey: string): void {
    localStorage.setItem(
      this.getKey(walletAddress, 'pub_key'), 
      publicKey
    );
  }
  
  static loadPublicKey(walletAddress: string): string | null {
    return localStorage.getItem(this.getKey(walletAddress, 'pub_key'));
  }
  
  static saveStateIndex(walletAddress: string, stateIndex: string): void {
    localStorage.setItem(
      this.getKey(walletAddress, 'state_index'), 
      stateIndex
    );
  }
  
  static loadStateIndex(walletAddress: string): string | null {
    return localStorage.getItem(this.getKey(walletAddress, 'state_index'));
  }
  
  static clearAll(walletAddress: string): void {
    const keys = ['priv_key', 'pub_key', 'state_index'];
    keys.forEach(key => {
      localStorage.removeItem(this.getKey(walletAddress, key));
    });
  }
}

// Usage in hooks:
import { MaciStorage } from '@/utils/maciStorage';

const signup = async () => {
  // Save
  MaciStorage.savePrivateKey(walletAddress, privateKey);
  MaciStorage.savePublicKey(walletAddress, publicKey);
  MaciStorage.saveStateIndex(walletAddress, stateIndex);
};

const vote = async () => {
  // Load
  const privateKey = MaciStorage.loadPrivateKey(walletAddress);
  if (!privateKey) {
    throw new Error('Not signed up yet');
  }
};
```

---

### Các Options Lưu User Keys

#### Option 1: localStorage với Wallet Validation (Hiện tại - CẦN FIX NGAY) ⚠️

**Ưu điểm:**
- Đơn giản, dễ implement
- Persist qua browser sessions
- Không cần server storage

**Nhược điểm:**
- ❌ Dễ bị XSS attack
- ❌ Không encrypt
- ❌ User có thể mất key nếu clear browser data

**Code hiện tại:**
```typescript
// useMaciSignup.ts
localStorage.setItem("maci_priv_key", privateKey);
localStorage.setItem("maci_pub_key", publicKey);
```

---

#### Option 2: Encrypted localStorage (Recommended for MVP) ✅

**Ưu điểm:**
- Vẫn đơn giản nhưng an toàn hơn
- Encrypt với password/wallet signature
- Persist qua sessions

**Nhược điểm:**
- Vẫn có XSS risk (nếu attac - PHẢI FIX NGAY

**🚨 Priority 1 - FIX BUG (Làm ngay hôm nay):**
1. ✅ Clear MACI keys khi logout
2. ✅ Validate keys match current wallet
3. ✅ Use wallet-specific localStorage keys
4. ✅ Show warning khi detect wallet mismatch

**Priority 2 - Security Enhancement

**Implementation:**

```typescript
// utils/encryption.ts
import CryptoJS from 'crypto-js';

export function encryptPrivateKey(privateKey: string, password: string): string {
  return CryptoJS.AES.encrypt(privateKey, password).toString();
}

export function decryptPrivateKey(encrypted: string, password: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, password);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// useMaciSignup.ts
const encryptedKey = encryptPrivateKey(privateKey, userPassword);
localStorage.setItem("maci_priv_key_encrypted", encryptedKey);

// Khi cần dùng:
const privateKey = decryptPrivateKey(
  localStorage.getItem("maci_priv_key_encrypted")!, 
  userPassword
);
```

**Dependencies:**
```bash
pnpm add crypto-js
pnpm add -D @types/crypto-js
```

---

#### Option 3: Deterministic Generation từ Wallet Signature (Best Practice) 🌟

**Ưu điểm:**
- ✅ Không cần lưu private key
- ✅ Generate lại từ wallet signature
- ✅ Consistent across devices
- ✅ An toàn nhất

**Nhược điểm:**
- Phức tạp hơn
- Cần user sign message mỗi lần
- Phải dùng cùng wallet

**Implementation:**

```typescript
// utils/maciKeyDerivation.ts
import { Keypair, PrivateKey } from "@maci-protocol/domainobjs";
import { ethers } from "ethers";

/**
 * Generate MACI keypair deterministically from wallet signature
 */
export async function generateMaciKeypairFromWallet(
  walletAddress: string,
  signer: any // ethers Signer or window.ethereum
): Promise<Keypair> {
  // Create deterministic message
  const message = `Generate MACI Identity for ${walletAddress}`;
  
  // Request signature from user's wallet
  const signature = await signer.signMessage(message);
  
  // Use signature as seed
  const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature));
  const seedBigInt = BigInt(seed);
  
  // Generate MACI keypair
  const privateKey = new PrivateKey(seedBigInt);
  const keypair = new Keypair(privateKey);
  
  return keypair;
}

// useMaciSignup.ts
const keypair = await generateMaciKeypairFromWallet(
  walletAddress,
  window.ethereum
);

// KHÔNG lưu private key, chỉ lưu public info
localStorage.setItem("maci_pub_key", keypair.pubKey.serialize());
// Private key sẽ được generate lại từ signature khi cần
```

**Flow:**
1. User connect wallet → Sign message 1 lần
2. Derive MACI keypair từ signature
3. Sign up to MACI với public key
4. Lưu public key + stateIndex
5. Mỗi lần cần private key → User sign message lại → Derive lại

---

#### Option 4: Backend Database (❌ KHÔNG KHUYẾN KHÍCH)

**Tại sao không nên:**
- ❌ Server có thể bị hack → Lộ tất cả private keys
- ❌ Không trustless (user phải trust server)
- ❌ Vi phạm nguyên tắc "Your keys, your votes"

**Nếu bắt buộc phải dùng:**
- Encrypt private key trước khi lưu
- Chỉ user có password mới decrypt được
- Use Hardware Security Module (HSM)

```typescript
// ❌ KHÔNG LÀM THẾ NÀY
await userService.update(userId, {
  maciPrivateKey: privateKey // RAW KEY - VERY BAD!
});

// ✅ Nếu bắt buộc:
const encrypted = encryptPrivateKey(privateKey, userPassword);
await userService.update(userId, {
  maciPrivateKeyEncrypted: encrypted
});
```

---

#### Option 5: Memory Only (Secure nhưng Không Practical)

**Ưu điểm:**
- ✅ Không bị XSS qua localStorage
- ✅ Tự động xóa khi close tab

**Nhược điểm:**
- ❌ Mất key khi refresh page
- ❌ User phải signup lại
- ❌ Trải nghiệm người dùng tệ

```typescript
// Use React state/context
const [maciPrivateKey, setMaciPrivateKey] = useState<string | null>(null);

// Lost on refresh ❌
```

---

### 📊 So Sánh Các Options

| Option | Security | UX | Complexity | Recommended |
|--------|----------|-----|-----------|-------------|
| Plain localStorage | ⭐ | ⭐⭐⭐ | ⭐ | ❌ No |
| Encrypted localStorage | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ✅ Yes (MVP) |
| Deterministic from Wallet | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | 🌟 Best |
| Backend DB | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ❌ No |
| Memory Only | ⭐⭐⭐⭐ | ❌ | ⭐ | ❌ No |

---

### 🎯 Khuyến Nghị Cho Dự Án

#### Phase 1: MVP (Hiện tại)
**Giữ localStorage như hiện tại NHƯNG:**
1. ✅ Thêm warning cho user
2. ✅ Implement backup/export key feature
3. ✅ Validate XSS protection (CSP headers)

```typescript
// Add warning modal
const showMaciKeyWarning = () => {
  alert(`
    ⚠️ QUAN TRỌNG: 
    MACI Private Key của bạn đang được lưu trong trình duyệt.
    
    - Không nên sử dụng trên máy tính công cộng
    - Backup key của bạn ngay
    - Không chia sẻ private key với ai
    
    Private Key: ${localStorage.getItem('maci_priv_key')}
    
    Vui lòng copy và lưu ở nơi an toàn!
  `);
};
```

#### Phase 2: Production
**Implement Deterministic Generation:**
1. ✅ User sign message với wallet
2. ✅ Derive MACI keypair từ signature
3. ✅ Không lưu private key
4. ✅ Generate lại khi cần

```typescript
// Implementation roadmap
1. Create generateMaciKeypairFromWallet() utility
2. Update useMaciSignup to use deterministic generation
3. Update useMaciVote to request signature when needed
4. Add migration guide for existing users
```

#### Phase 3: Advanced (Optional)
**Multiple Options cho User:**
1. ✅ Option A: Deterministic (recommend)
2. ✅ Optio0: FIX Wallet Mismatch Bug (URGENT - Làm trước tiên!)

**File 1:** `apps/web/utils/maciStorage.ts` (Tạo mới)

```typescript
/**
 * Wallet-specific MACI key storage
 * Prevents key mismatch between different wallets
 */
export class MaciStorage {
  private static getKey(walletAddress: string, keyType: string): string {
    if (!walletAddress) throw new Error('Wallet address required');
    return `maci_${keyType}_${walletAddress.toLowerCase()}`;
  }
  
  static saveKeys(
    walletAddress: string, 
    privateKey: string, 
    publicKey: string,
    stateIndex?: string
  ): void {
    localStorage.setItem(this.getKey(walletAddress, 'priv_key'), privateKey);
    localStorage.setItem(this.getKey(walletAddress, 'pub_key'), publicKey);
    if (stateIndex) {
      localStorage.setItem(this.getKey(walletAddress, 'state_index'), stateIndex);
    }
  }
  
  static loadKeys(walletAddress: string): {
    privateKey: string | null;
    publicKey: string | null;
    stateIndex: string | null;
  } {
    return {
      privateKey: localStorage.getItem(this.getKey(walletAddress, 'priv_key')),
      publicKey: localStorage.getItem(this.getKey(walletAddress, 'pub_key')),
      stateIndex: localStorage.getItem(this.getKey(walletAddress, 'state_index')),
    };
  }
  
  static clearKeys(walletAddress: string): void {
    localStorage.removeItem(this.getKey(walletAddress, 'priv_key'));
    localStorage.removeItem(this.getKey(walletAddress, 'pub_key'));
    localStorage.removeItem(this.getKey(walletAddress, 'state_index'));
  }
  
  /**
   * Clear ALL MACI keys (for logout)
   */
  static clearAllWallets(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('maci_')) {
        localStorage.removeItem(key);
      }
    });
  }
}
```

**File 2:** `apps/web/contexts/AuthContext.tsx`

```typescript
import { MaciStorage } from '@/utils/maciStorage';

const signout = async () => {
  try {
    await authApi.signout();
    
    // ✅ Clear ALL MACI keys
    MaciStorage.clearAllWallets();
    
    setUser(null);
    replaceTo("/signin");
  } catch (error) {
    console.error("Signout error:", error);
    throw error;
  }
};
```

**File 3:** `apps/web/hooks/useMaciSignup.ts`

```typescript
import { MaciStorage } from '@/utils/maciStorage';

const signup = async () => {
  setLoading(true);
  setError(null);
  
  try {
    if (!walletAddress) {
      throw new Error('Please connect wallet first');
    }
    
    // ✅ Check existing keys for current wallet
    const existing = MaciStorage.loadKeys(walletAddress);
    
    if (existing.publicKey) {
      console.log('Found existing MACI keys for this wallet');
      // Optionally: verify if already signed up on-chain
    }
    
    // Generate new keys
    const { keypair, privateKey, publicKey } = generateMaciKeypair();
    
    // Signup to MACI
    const result = await maciApi.signup({
      maciPubKey: publicKey
    });
    
    // ✅ Save with wallet-specific keys
    MaciStorage.saveKeys(
      walletAddress,
      privateKey,
      publicKey,
      result.stateIndex?.toString()
    );
    
    setSuccess(true);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**File 4:** `apps/web/hooks/useMaciVote.ts`

```typescript
import { MaciStorage } from '@/utils/maciStorage';

const vote = async (pollId: string, optionIndex: number, voteWeight: number) => {
  setLoading(true);
  setError(null);
  
  try {
    if (!walletAddress) {
      throw new Error('Please connect wallet');
    }
    
    // ✅ Load keys for current wallet
    const { privateKey, stateIndex } = MaciStorage.loadKeys(walletAddress);
    
    if (!privateKey || !stateIndex) {
      throw new Error('Please sign up to MACI first');
    }
    
    // Vote...
    await maciApi.vote(pollId, {
      voteOptionIndex: optionIndex,
      voteWeight,
      userStateIndex: stateIndex,
      userMaciPrivateKey: privateKey,
      // ...
    });
    
  } finally {
    setLoading(false);
  }
};
```

**File 5:** `apps/web/hooks/useCheckJoinStatus.ts`

```typescript
import { MaciStorage } from '@/utils/maciStorage';

const checkJoinStatus = useCallback(async (
  pollId: string,
  walletAddress: string
) => {
  // ✅ Load from wallet-specific storage
  const { stateIndex, publicKey } = MaciStorage.loadKeys(walletAddress);
  
  if (!stateIndex || !publicKey) {
    return { isJoined: false };
  }
  
  // Continue checking...
}, []);
```

---

#### Step n B: Manual backup (advanced users)
3. ✅ Option C: Hardware wallet integration

---

### 🔧 Implementation Steps

#### Step 1: Add Encryption (Quick Win)

```typescript
// apps/web/utils/encryption.ts
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'maci_priv_key_encrypted';

export function saveEncryptedPrivateKey(
  privateKey: string, 
  walletAddress: string
): void {
  // Use wallet address as encryption key (user doesn't need to remember password)
  const encrypted = CryptoJS.AES.encrypt(privateKey, walletAddress).toString();
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export function loadEncryptedPrivateKey(walletAddress: string): string | null {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, walletAddress);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return null;
  }
}
```

#### Step 2: Implement Deterministic Generation (Better)

```typescript
// apps/web/utils/maciKeyDerivation.ts
export async function getMaciKeypair(
  walletAddress: string,
  signer: any
): Promise<Keypair> {
  // Check if we have cached public key
  const cachedPubKey = localStorage.getItem('maci_pub_key');
  
  // Generate from signature
  const message = `MACI Identity for ${walletAddress}\n\nThis signature generates your MACI voting key deterministically.`;
  const signature = await signer.signMessage(message);
  const seed = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature));
  const privateKey = new PrivateKey(BigInt(seed));
  const keypair = new Keypair(privateKey);
  
  // Verify with cached if exists
  if (cachedPubKey && cachedPubKey !== keypair.pubKey.serialize()) {
    throw new Error('Wallet mismatch - please use the same wallet');
  }
  
  return keypair;
}
```

#### Step 3: Update Components

```typescript
// apps/web/hooks/useMaciSignup.ts
const signup = async () => {
  // Generate keypair deterministically
  const keypair = await getMaciKeypair(walletAddress, signer);
  
  // Only save public info
  localStorage.setItem('maci_pub_key', keypair.pubKey.serialize());
  
  // Signup
  await maciApi.signup({
    maciPubKey: keypair.pubKey.serialize()
  });
};

// apps/web/hooks/useMaciVote.ts
const vote = async (optionIndex: number) => {
  // Re-generate keypair when needed
  const keypair = await getMaciKeypair(walletAddress, signer);
  
  // Vote with private key
  await maciApi.vote(pollId, {
    // ... use keypair.privKey here
  });
};
```

---

### 🛡️ Security Best Practices

1. **Implement CSP Headers**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "script-src 'self'; object-src 'none';"
  }
];
```

2. **Add Warning UI**
```typescript
// Show warning when first generate keys
<Alert variant="warning">
  <AlertTitle>🔐 Security Notice</AlertTitle>
  <AlertDescription>
    Your MACI voting key is being generated. 
    Always use the same wallet to access your votes.
  </AlertDescription>
</Alert>
```

3. **Implement Key Export**
```typescript
export function exportMaciKey() {
  const privateKey = localStorage.getItem('maci_priv_key');
  const blob = new Blob([privateKey], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'maci-private-key-backup.txt';
  a.click();
}
```

---

## Kết Luận

✅ **Đã phân tích xong:**
- Error handling cho sign up
- MACI address management (bỏ localStorage, dùng API)
- START_BLOCK đã có trong DB schema
- API endpoint để get latest deployment

✅ **Sẵn sàng implement:**
- Tất cả thay đổi đã được document chi tiết
- Code examples đã chuẩn bị
- Testing checklist đã có

⚠️ **Lưu ý:**
- Test kỹ trước khi deploy production
- Có thể cần migration script cho existing data
- Consider thêm `maciContractAddress` vào Poll model cho multi-MACI support

---

**File này được tạo:** 2025-12-20  
**Tác giả:** GitHub Copilot  
**Mục đích:** Hướng dẫn sửa lỗi MACI system theo yêu cầu
