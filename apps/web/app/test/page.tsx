// app/test/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useMaci } from './useHook';

const POLL_ID = '22';

export default function TestPage() {
  const { keypair, loading, status: hookStatus, signupToMaci, submitVote, checkPollStatus } = useMaci();
  const [signedUp, setSignedUp] = useState(false);
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [account, setAccount] = useState<string | null>(null);
  const [voteOption, setVoteOption] = useState(0);
  const [voteWeight, setVoteWeight] = useState(1);
  const [pollStatus, setPollStatus] = useState<any>(null);

  // Auto-connect MetaMask on mount
  useEffect(() => {
    const connectWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          setAccount(accounts[0]);
          setStatus(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        } catch (error: any) {
          console.error('Failed to connect wallet:', error);
          setStatus('Failed to connect wallet. Please connect manually.');
        }
      } else {
        setStatus('MetaMask not found. Please install MetaMask.');
      }
    };

    connectWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0 && accounts[0]) {
          setAccount(accounts[0]);
          setStatus(`Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        } else {
          setAccount(null);
          setStatus('Wallet disconnected');
        }
      });
    }
  }, []);

  useEffect(() => {
    // Load existing keypair on mount
    const savedKeypair = localStorage.getItem(`maci_keypair_poll_${POLL_ID}`);
    if (savedKeypair) {
      try {
        const data = JSON.parse(savedKeypair);
        setSignedUp(true);
        setJoined(data.joinedPoll || false);
        setStatus(data.joinedPoll ? 'Ready to vote' : 'Signed up - need to join poll');
      } catch (error) {
        console.error('Invalid keypair data:', error);
        localStorage.removeItem(`maci_keypair_poll_${POLL_ID}`);
        setStatus('Invalid data cleared. Please sign up again.');
      }
    }

    // Check poll status
    if (checkPollStatus) {
      checkPollStatus(POLL_ID).then(setPollStatus).catch(console.error);
    }
  }, [checkPollStatus]);

  // Update status from hook
  useEffect(() => {
    if (hookStatus) {
      setStatus(hookStatus);
    }
  }, [hookStatus]);

  const handleSignup = async () => {
    if (!account) {
      setStatus('Please connect your wallet first');
      return;
    }
    
    try {
      setStatus('Generating MACI keypair...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for UI update
      
      setStatus('Please confirm transaction in MetaMask...');
      const result = await signupToMaci(POLL_ID);
      
      setSignedUp(true);
      setStatus(`✅ Successfully signed up! TX: ${result.txHash.slice(0, 10)}...`);
      console.log('Signup result:', result);
    } catch (error: any) {
      console.error('Signup failed:', error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  // const handleJoinPoll = async () => {
  //   try {
  //     const result = await joinPoll(POLL_ID);
  //     setJoined(true);
  //     setStatus(`✅ Joined poll! TX: ${result.hash.slice(0, 10)}...`);
  //   } catch (error: any) {
  //     console.error('Join poll failed:', error);
  //     setStatus(`❌ Error: ${error.message}`);
  //   }
  // };

  const handleVote = async () => {
    try {
      const result = await submitVote(POLL_ID, voteOption, voteWeight);
      setStatus(`✅ Vote submitted! TX: ${result.hash.slice(0, 10)}...`);
    } catch (error: any) {
      console.error('Vote failed:', error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const clearData = () => {
    localStorage.removeItem(`maci_keypair_poll_${POLL_ID}`);
    setSignedUp(false);
    setStatus('Data cleared');
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">MACI Poll Test - Poll {POLL_ID}</h1>
        <div className="flex gap-2">
          {account && (
            <div className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}
          {keypair && (
            <button 
              onClick={() => {
                if (confirm('Clear all data and start over?')) {
                  clearData();
                  setSignedUp(false);
                }
              }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Data
            </button>
          )}
        </div>
      </div>

      {pollStatus && (
        <div className={`mb-4 p-4 rounded ${pollStatus.isActive ? 'bg-green-100' : pollStatus.hasEnded ? 'bg-red-100' : 'bg-yellow-100'}`}>
          <h2 className="font-semibold mb-2">Poll Status:</h2>
          <p className="text-sm">
            {pollStatus.hasEnded ? '🔴 Poll has ended' : pollStatus.hasStarted ? '🟢 Poll is active' : '🟡 Poll has not started yet'}
          </p>
          <p className="text-xs mt-1 text-gray-600">
            Start: {new Date(pollStatus.startDate * 1000).toLocaleString()} | 
            End: {new Date(pollStatus.endDate * 1000).toLocaleString()}
          </p>
        </div>
      )}
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Status:</h2>
        <p className="text-sm">{status || 'Ready'}</p>
      </div>
      
      {keypair && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="font-semibold mb-2">Your MACI Keypair:</h2>
          <p className="text-xs break-all">Public Key: {keypair.pubKey.serialize()}</p>
        </div>
      )}
      
      {!signedUp && (
        <button 
          onClick={handleSignup}
          disabled={loading}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          Sign up to MACI (Poll {POLL_ID})
        </button>
      )}

      {signedUp && (
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded">
            <h2 className="font-bold mb-2">✓ Signed up successfully!</h2>
            <p className="text-sm">You can now vote on poll {POLL_ID}</p>
          </div>
          
          <div className="mt-6 p-4 border rounded">
            <h2 className="text-xl font-semibold mb-4">Cast Your Vote:</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vote Option Index:</label>
                <input 
                  type="number" 
                  value={voteOption}
                  onChange={(e) => setVoteOption(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Vote Weight:</label>
                <input 
                  type="number" 
                  value={voteWeight}
                  onChange={(e) => setVoteWeight(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded"
                  min="1"
                />
              </div>
              
              <button 
                onClick={handleVote}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
              >
                Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="mt-4 p-4 bg-yellow-100 rounded">
          <p className="text-center">Processing...</p>
        </div>
      )}
    </div>
  );
}