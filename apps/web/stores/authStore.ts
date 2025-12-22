"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// ============ Types ============

export type AuthOperationType = "login-email" | "login-wallet" | "signup" | "logout";

interface AuthOperation {
  type: AuthOperationType;
  timestamp: number;
}

interface AuthLockState {
  // === Lock State ===
  pendingOperation: AuthOperation | null;

  // === Actions ===
  acquireLock: (type: AuthOperationType) => boolean;
  releaseLock: () => void;
  isLocked: () => boolean;
  getPendingOperation: () => AuthOperation | null;
}

// ============ Store ============

export const useAuthStore = create<AuthLockState>()(
  subscribeWithSelector((set, get) => ({
    pendingOperation: null,

    acquireLock: (type) => {
      const { pendingOperation } = get();

      if (pendingOperation) {
        console.warn(
          `[AuthStore] Lock denied: ${pendingOperation.type} already in progress`
        );
        return false;
      }

      const op: AuthOperation = {
        type,
        timestamp: Date.now(),
      };

      set({ pendingOperation: op });
      console.log(`[AuthStore] Lock acquired: ${type}`);
      return true;
    },

    releaseLock: () => {
      const { pendingOperation } = get();
      if (pendingOperation) {
        console.log(`[AuthStore] Lock released: ${pendingOperation.type}`);
      }
      set({ pendingOperation: null });
    },

    isLocked: () => get().pendingOperation !== null,

    getPendingOperation: () => get().pendingOperation,
  }))
);

// ============ Hook for lock-guarded operations ============

/**
 * Hook providing ACID-like lock wrapper for auth operations
 * Ensures only one login/signup/logout can run at a time per browser tab
 *
 * Usage:
 * ```typescript
 * const { withAuthLock, isLocked } = useWithAuthLock();
 *
 * const handleLogin = async () => {
 *   return withAuthLock('login-wallet', async () => {
 *     // ... login logic ...
 *   });
 * };
 * ```
 */
export const useWithAuthLock = () => {
  const acquireLock = useAuthStore((s) => s.acquireLock);
  const releaseLock = useAuthStore((s) => s.releaseLock);
  const isLocked = useAuthStore((s) => s.isLocked);

  const withAuthLock = async <T>(
    type: AuthOperationType,
    fn: () => Promise<T>
  ): Promise<T> => {
    const acquired = acquireLock(type);

    if (!acquired) {
      throw new Error(`Cannot ${type}: another auth operation is in progress`);
    }

    try {
      return await fn();
    } finally {
      releaseLock();
    }
  };

  return { withAuthLock, isLocked };
};

// ============ Selectors ============

export const selectIsAuthLocked = (state: AuthLockState) => state.isLocked();
