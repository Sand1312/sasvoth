// hooks/useMaci.ts
'use client';

import { useState } from 'react';
import { Keypair, PrivKey } from '@maci-protocol/domainobjs';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { MACI_ADDRESS } from '@sasvoth/maci-assets';
import { MACI_ABI, POLL_ABI } from '@sasvoth/contracts';

const ZERO_DATA = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function useMaci() {
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  // Get wallet client
  const getWalletClient = async () => {
    if (!window.ethereum) throw new Error('No wallet found');
    
    return createWalletClient({
      chain: arbitrumSepolia,
      transport: custom(window.ethereum),
    });
  };

  const getPublicClient = () => {
    // Fallback RPC URLs for Arbitrum Sepolia
   const rpcUrls = [
  'https://arbitrum-sepolia.drpc.org',
  'https://arbitrum-sepolia-rpc.publicnode.com',
  'https://sepolia-rollup.arbitrum.io/rpc',
];
    
    return createPublicClient({
      chain: arbitrumSepolia,
      transport: http(rpcUrls[0], {
        batch: true,
        retryCount: 3,
        timeout: 30_000,
      }),
    });
  };

  // Signup to MACI
  const signupToMaci = async (pollId: string) => {
    setLoading(true);
    try {
      // 0. Check if contract exists
      const publicClient = getPublicClient();
      const code = await publicClient.getBytecode({
        address: MACI_ADDRESS as `0x${string}`,
      });
      
      if (!code || code === '0x') {
        throw new Error(`MACI contract not found at ${MACI_ADDRESS}. Please check the contract address.`);
      }
      
      console.log('✅ MACI contract found at:', MACI_ADDRESS);
      
      // 1. Generate keypair
      const kp = new Keypair();
      
      // 2. Get wallet
      const walletClient = await getWalletClient();
      const [account] = await walletClient.getAddresses();
      if (!account) throw new Error('No account connected');

      console.log('🔑 Wallet:', account);
      console.log('🔑 MACI Public Key:', kp.pubKey.serialize());

      // 3. Signup to MACI
      console.log('📝 Signing up to MACI...');
      console.log('⏳ Waiting for user to confirm transaction...');
      
      const hash = await walletClient.writeContract({
        address: MACI_ADDRESS as `0x${string}`,
        abi: MACI_ABI,
        functionName: 'signUp',
        args: [
          {
            x: kp.pubKey.rawPubKey[0],
            y: kp.pubKey.rawPubKey[1],
          },
          ZERO_DATA as `0x${string}`,
        ],
        account,
      });

      console.log('✅ Signup transaction sent:', hash);
      console.log('⏳ Waiting for confirmation...');

      // 4. Save keypair
      localStorage.setItem(`maci_keypair_poll_${pollId}`, JSON.stringify({
        publicKey: kp.pubKey.serialize(),
        privateKey: kp.privKey.serialize(),
        pollId,
        signupTx: hash,
        signedUpAt: new Date().toISOString(),
      }));

      setKeypair(kp);

      return {
        txHash: hash,
        publicKey: kp.pubKey.serialize(),
      };
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      
      // Check for specific error types
      if (error.message?.includes('User rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction');
      } else if (error.message?.includes('not found')) {
        throw error; // Re-throw contract not found error
      } else {
        throw new Error(error.shortMessage || error.message || 'Failed to signup');
      }
    } finally {
      setLoading(false);
    }
  };

  // Vote function - publish message to poll
  const submitVote = async (pollId: string, voteOptionIndex: number, voteWeight: number) => {
    setLoading(true);
    setStatus('Loading keypair...');
    try {
      // Load keypair
      const saved = localStorage.getItem(`maci_keypair_poll_${pollId}`);
      if (!saved) throw new Error('No keypair found. Please sign up first.');

      const data = JSON.parse(saved);
      const privKey = PrivKey.deserialize(data.privateKey);
      const kp = new Keypair(privKey);

      // Get wallet
      const walletClient = await getWalletClient();
      const [account] = await walletClient.getAddresses();
      if (!account) throw new Error('No account connected');

      // Get poll address
      setStatus('Getting poll address...');
      const publicClient = getPublicClient();
      const pollData = await publicClient.readContract({
        address: MACI_ADDRESS as `0x${string}`,
        abi: MACI_ABI,
        functionName: 'getPoll',
        args: [BigInt(pollId)],
      }) as any;

      const pollAddress = pollData.poll;
      console.log('📍 Poll address:', pollAddress);

      // For publishMessage, we need a proper MACI message (10 uint256 array)
      // This is simplified - in production you'd encrypt the message properly
      setStatus('Creating vote message...');
      const message = {
        data: [
          BigInt(voteOptionIndex), // msgType or stateIndex
          BigInt(voteWeight), // voteOptionIndex
          BigInt(0), // newVoteWeight
          BigInt(0), // nonce
          BigInt(0), // pollId
          BigInt(0), // salt
          BigInt(0), // padding
          BigInt(0), // padding
          BigInt(0), // padding
          BigInt(0), // padding
        ] as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
      };

      setStatus('Submitting vote transaction...');
      console.log('🗳️ Submitting vote...');
      console.log('Option:', voteOptionIndex, 'Weight:', voteWeight);

      const hash = await walletClient.writeContract({
        address: pollAddress as `0x${string}`,
        abi: POLL_ABI,
        functionName: 'publishMessage',
        args: [
          message,
          {
            x: kp.pubKey.rawPubKey[0],
            y: kp.pubKey.rawPubKey[1],
          },
        ],
        account,
      });

      console.log('✅ Vote submitted!');
      console.log('TX:', hash);
      setStatus('Vote submitted successfully!');

      return { hash };
    } catch (error: any) {
      console.error('❌ Vote error:', error);
      setStatus('Error: ' + (error.shortMessage || error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Join poll with ZK proof (via backend API)
  /*
  const joinPoll = async (pollId: string) => {
    setLoading(true);
    setStatus('Loading keypair...');
    try {
      // Load keypair
      const saved = localStorage.getItem(`maci_keypair_poll_${pollId}`);
      if (!saved) throw new Error('No keypair found. Please sign up to MACI first.');

      const data = JSON.parse(saved);

      setStatus('Joining poll via backend...');
      console.log('🎫 Calling backend API to join poll...');

      // Call backend API
      const response = await fetch('http://localhost:8000/maci/join-poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pollId,
          maciPrivateKey: data.privateKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join poll');
      }

      const result = await response.json();

      console.log('✅ Joined poll!');
      console.log('Result:', result);
      setStatus('Joined poll successfully!');

      // Update saved data
      const updatedData = {
        ...data,
        joinedPoll: true,
        joinTx: result.transactionHash,
        joinedAt: new Date().toISOString(),
        pollStateIndex: result.pollStateIndex,
        voiceCredits: result.voiceCredits,
      };
      localStorage.setItem(`maci_keypair_poll_${pollId}`, JSON.stringify(updatedData));

      return { hash: result.transactionHash };
    } catch (error: any) {
      console.error('❌ Join poll error:', error);
      setStatus('Error: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  */

  // Check if poll is active
  const checkPollStatus = async (pollId: string) => {
    try {
      const publicClient = getPublicClient();
      
      // Get poll address
      const pollData = await publicClient.readContract({
        address: MACI_ADDRESS as `0x${string}`,
        abi: MACI_ABI,
        functionName: 'getPoll',
        args: [BigInt(pollId)],
      }) as any;

      const pollAddress = pollData.poll;

      // Get poll start and end dates
      const dates = await publicClient.readContract({
        address: pollAddress as `0x${string}`,
        abi: POLL_ABI,
        functionName: 'getStartAndEndDate',
        args: [],
      }) as [bigint, bigint];

      const startDate = dates[0];
      const endDate = dates[1];
      const now = BigInt(Math.floor(Date.now() / 1000));

      return {
        pollAddress,
        startDate: Number(startDate),
        endDate: Number(endDate),
        isActive: now >= startDate && now <= endDate,
        hasStarted: now >= startDate,
        hasEnded: now > endDate,
      };
    } catch (error: any) {
      console.error('Failed to check poll status:', error);
      throw error;
    }
  };

  return {
    keypair,
    loading,
    status,
    signupToMaci,
    // joinPoll,
    submitVote,
    checkPollStatus,
  };
}