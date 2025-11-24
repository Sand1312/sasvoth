"use client";
import { maciApi } from "../api/maci.api";
import { useState } from 'react';
import { Keypair, PrivKey } from '@maci-protocol/domainobjs';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { MACI_ADDRESS } from '@sasvoth/maci-assets';
import { MACI_ABI, POLL_ABI } from '@sasvoth/contracts';
// import { useAccount } from "wagmi";
const ZERO_DATA = '0x0000000000000000000000000000000000000000000000000000000000000000';

export function useMaci() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    // const { address } = useAccount();
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
    const signupToMaci = async (publicKeyX:any, publicKeyY:any) => {
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
        
       
        
        // 2. Get wallet
        const walletClient = await getWalletClient();
        const [account] = await walletClient.getAddresses();
        if (!account) throw new Error('No account connected');
        const pubKeyX = BigInt(publicKeyX || 0);
        const pubKeyY = BigInt(publicKeyY || 0);
        console.log('📍 Signing up with pubKeyX:', pubKeyX, 'pubKeyY:', pubKeyY);

        
        const hash = await walletClient.writeContract({
          address: MACI_ADDRESS as `0x${string}`,
          abi: MACI_ABI,
          functionName: 'signUp',
          args: [
            {
              x: pubKeyX,
              y: pubKeyY,
            },
            ZERO_DATA as `0x${string}`,
          ],
          account,
        });
  
        return {
          txHash: hash,
         
        };
      } catch (error: any) {
        console.error(' Signup error:', error);
        
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
    deployPoll: maciApi.deployPoll,
    mergePoll: maciApi.mergePoll,
    mergeStateDirect: maciApi.mergeStateDirect,
    generateProofs: maciApi.generateProofs,
    submitProofs: maciApi.submitProofs,
    getPollContracts: maciApi.getPollContracts,
    loading,
    status,
    signupToMaci,
    submitVote,
    checkPollStatus,
  };
}
