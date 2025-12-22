'use client';

import { ReactNode } from 'react';
import { createConfig, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { arbitrumSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// SOLUTION: Dùng RPC của MetaMask (injected provider) thay vì tự config
// Wagmi v2 sẽ tự động dùng RPC từ wallet khi có injected connector
const config = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    // Dùng public RPC làm fallback (cho read operations)
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc', {
      timeout: 30_000,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  connectors: [
    // MetaMask/injected wallet sẽ tự dùng RPC của nó cho write operations
    injected({ 
      target: 'metaMask',
      shimDisconnect: true,
    }),
  ],
});

console.log('🔗 Wagmi config: Using MetaMask RPC for transactions');

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}