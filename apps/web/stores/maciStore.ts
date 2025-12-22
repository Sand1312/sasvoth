"use client";

import { create } from "zustand";
import { subscribeWithSelector, persist } from "zustand/middleware";

// ============ Types ============

export interface MaciKeypair {
  keypair: any; // Keypair from @maci-protocol/domainobjs (non-serializable)
  privateKey: string;
  publicKey: string;
  pubKeyX: string;
  pubKeyY: string;
}

export type OperationType = "signup" | "join" | "vote";

interface MaciOperation {
  type: OperationType;
  pollId?: string;
  walletAddress: string;
  timestamp: number;
}

interface MaciState {
  // === Keypair Cache ===
  keypairs: Record<string, MaciKeypair>;

  // === Client-side Lock (Mutex) ===
  pendingOperation: MaciOperation | null;

  // === Actions ===
  // Lock management
  acquireLock: (op: Omit<MaciOperation, "timestamp">) => boolean;
  releaseLock: () => void;
  isLocked: () => boolean;
  getPendingOperation: () => MaciOperation | null;

  // Keypair management
  setKeypair: (
    walletAddress: string,
    chainId: number,
    keypair: MaciKeypair,
    maciAddress?: string
  ) => void;
  getKeypair: (
    walletAddress: string,
    chainId: number,
    maciAddress?: string
  ) => MaciKeypair | null;
  hasKeypair: (
    walletAddress: string,
    chainId: number,
    maciAddress?: string
  ) => boolean;
  clearKeypair: (walletAddress?: string, chainId?: number) => void;
}

// ============ Helpers ============

/**
 * Generate cache key for keypair storage
 * Format: {walletAddress}_{chainId}_{maciAddress?}
 */
const getCacheKey = (
  walletAddress: string,
  chainId: number,
  maciAddress?: string
): string => {
  const base = `${walletAddress.toLowerCase()}_${chainId}`;
  return maciAddress ? `${base}_${maciAddress.toLowerCase()}` : base;
};

// ============ Store ============

export const useMaciStore = create<MaciState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        keypairs: {},
        pendingOperation: null,

        // === Lock Management ===
        acquireLock: (op) => {
          const { pendingOperation } = get();

          if (pendingOperation) {
            console.warn(
              `[MaciStore] Lock denied: ${pendingOperation.type} already in progress`
            );
            return false;
          }

          const fullOp: MaciOperation = {
            ...op,
            timestamp: Date.now(),
          };

          set({ pendingOperation: fullOp });
          console.log(`[MaciStore] Lock acquired: ${op.type}`);
          return true;
        },

        releaseLock: () => {
          const { pendingOperation } = get();
          if (pendingOperation) {
            console.log(`[MaciStore] Lock released: ${pendingOperation.type}`);
          }
          set({ pendingOperation: null });
        },

        isLocked: () => get().pendingOperation !== null,

        getPendingOperation: () => get().pendingOperation,

        // === Keypair Management ===
        setKeypair: (walletAddress, chainId, keypair, maciAddress) => {
          const key = getCacheKey(walletAddress, chainId, maciAddress);
          set((state) => ({
            keypairs: { ...state.keypairs, [key]: keypair },
          }));
          console.log(`[MaciStore] Keypair cached: ${key.slice(0, 20)}...`);
        },

        getKeypair: (walletAddress, chainId, maciAddress) => {
          const key = getCacheKey(walletAddress, chainId, maciAddress);
          return get().keypairs[key] || null;
        },

        hasKeypair: (walletAddress, chainId, maciAddress) => {
          const key = getCacheKey(walletAddress, chainId, maciAddress);
          return key in get().keypairs;
        },

        clearKeypair: (walletAddress, chainId) => {
          if (walletAddress && chainId) {
            const prefix = `${walletAddress.toLowerCase()}_${chainId}`;
            set((state) => {
              const newKeypairs = { ...state.keypairs };
              Object.keys(newKeypairs).forEach((key) => {
                if (key.startsWith(prefix)) {
                  delete newKeypairs[key];
                }
              });
              return { keypairs: newKeypairs };
            });
          } else {
            set({ keypairs: {} });
          }
        },
      }),
      {
        name: "maci-keypair-store",
        // Only persist keypairs, not lock state
        partialize: (state) => ({ keypairs: state.keypairs }),
        // Custom storage to handle non-serializable Keypair objects
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            try {
              const data = JSON.parse(str);
              // Remove non-serializable keypair.keypair field on rehydration
              // The Keypair object will be re-derived on next use
              if (data?.state?.keypairs) {
                Object.values(data.state.keypairs).forEach((kp: any) => {
                  delete kp.keypair;
                });
              }
              return data;
            } catch {
              return null;
            }
          },
          setItem: (name, value) => {
            // Remove keypair object before persisting (has methods, not serializable)
            const cloned = JSON.parse(JSON.stringify(value));
            if (cloned?.state?.keypairs) {
              Object.values(cloned.state.keypairs).forEach((kp: any) => {
                delete kp.keypair;
              });
            }
            localStorage.setItem(name, JSON.stringify(cloned));
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
      }
    )
  )
);

// ============ Hook for lock-guarded operations ============

/**
 * Hook providing ACID-like lock wrapper for MACI operations
 * Ensures only one signup/join/vote can run at a time per browser tab
 *
 * Usage:
 * ```typescript
 * const { withLock, isLocked } = useWithMaciLock();
 *
 * const handleSignup = async () => {
 *   return withLock('signup', address, undefined, async () => {
 *     // ... signup logic ...
 *   });
 * };
 * ```
 */
export const useWithMaciLock = () => {
  const acquireLock = useMaciStore((s) => s.acquireLock);
  const releaseLock = useMaciStore((s) => s.releaseLock);
  const isLocked = useMaciStore((s) => s.isLocked);

  const withLock = async <T>(
    type: OperationType,
    walletAddress: string,
    pollId: string | undefined,
    fn: () => Promise<T>
  ): Promise<T> => {
    const acquired = acquireLock({ type, walletAddress, pollId });

    if (!acquired) {
      throw new Error(`Cannot ${type}: another MACI operation is in progress`);
    }

    try {
      return await fn();
    } finally {
      releaseLock();
    }
  };

  return { withLock, isLocked };
};

// ============ Selectors for fine-grained subscriptions ============

export const selectHasKeypair = (
  walletAddress: string,
  chainId: number,
  maciAddress?: string
) => {
  return (state: MaciState) =>
    state.hasKeypair(walletAddress, chainId, maciAddress);
};

export const selectIsLocked = (state: MaciState) => state.isLocked();
