// src/maci/maci.service.ts
import { Injectable, HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { ethers } from 'ethers';
import { PollsService } from '../polls/polls.service';
import { VotesService } from '../votes/votes.service';

const MACI_ABI = require('../../../../../packages/contracts/abi/contracts/Maci.json');
const POLL_ABI = require('../../../../../packages/contracts/abi/contracts/Poll.json');

const execAsync = promisify(exec);

@Injectable()
export class MaciService {
  private readonly logger = new Logger(MaciService.name);
  private readonly coordinatorUrl: string;
  private readonly privateKey: string;
  private readonly walletAddress: string;
  private readonly maciAddress: string;
  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly pollsService: PollsService;
  private readonly votesService: VotesService;

  constructor(
    private configService: ConfigService,
  ) {
    this.coordinatorUrl = this.configService.get('MACI_COORDINATOR_URL', 'http://localhost:3000');
    this.privateKey = this.configService.get('WALLET_PRIVATE_KEY', '');
    this.walletAddress = this.configService.get('WALLET_ADDRESS', '');
    this.maciAddress = this.configService.get('MACI_ADDRESS', '');
    
    const rpcUrl = this.configService.get('RPC_URL', 'https://sepolia-rollup.arbitrum.io/rpc');
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Generate auth token by calling generate-auth.js
   */
  private async generateAuthToken(): Promise<string> {
    const scriptPath = path.join(process.cwd(), 'src/utils/generate-auth.js');
    const { stdout } = await execAsync(`node ${scriptPath} ${this.privateKey}`);
    return stdout.split('\n').find(line => line.startsWith('Bearer'))?.trim() || '';
  }

  /**
   * Encrypt session key by calling encrypt-helper.js
   */
  private async encryptSessionKey(address: string): Promise<string> {
    const scriptPath = path.join(process.cwd(), 'src/utils/encrypt-helper.js');
    const { stdout } = await execAsync(`node ${scriptPath} "${address}"`);
    return stdout.split('\n').find(line => !line.includes('Encrypted'))?.trim() || '';
  }
async deployPoll(config: {
    startDate: number;
    endDate: number;
    voteOptions?: number;
  }) {
    try {
      // this.logger.log('Deploying new poll...');
      // this.logger.debug(`Config: ${JSON.stringify(config)}`);
      
      const authToken = await this.generateAuthToken();
      // this.logger.debug(`Auth token generated: ${authToken.substring(0, 50)}...`);
      // this.logger.debug(`Full Auth token: "${authToken}"`);

      const encryptedSessionKey = await this.encryptSessionKey(this.walletAddress);
      // this.logger.debug(`Encrypted session key: ${encryptedSessionKey.substring(0, 50)}...`);
      // this.logger.debug(`Full Encrypted session key: "${encryptedSessionKey}"`);

      const response = await fetch(`${this.coordinatorUrl}/v1/deploy/poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({
          chain: 'arbitrum_sepolia',
          sessionKeyAddress: encryptedSessionKey,
          config: {
            startDate: config.startDate,
            endDate: config.endDate,
            mode: 1,
            tallyProcessingStateTreeDepth: 1,
            messageBatchSize: 2,
            pollStateTreeDepth: 10,
            voteOptionTreeDepth: 2,
            policy: {
              policyType: '@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllPolicy.sol:FreeForAllPolicy',
              checkerType: 'FreeForAll',
            },
            initialVoiceCreditsProxy: {
              factoryType: 'ConstantInitialVoiceCreditProxyFactory',
              type: 'ConstantInitialVoiceCreditProxy',
              args: { amount: '100' },
            },
            voteOptions: (config.voteOptions || 4).toString(),
          },
        }),
      });

      const result = await response.json();
      this.logger.debug(`Coordinator response: ${JSON.stringify(result)}`);
      if (!result.pollId) {
        this.logger.error(`Coordinator deploy poll failed. Response: ${JSON.stringify(result)}`);
        throw new HttpException('Failed to deploy poll', 500);
      }

      this.logger.log(`Poll deployed: ${result.pollId}`);
      return {
        pollId: result.pollId,
        maciAddress: result.maciContractAddress || this.maciAddress,
      };
    } catch (error) {
      this.logger.error('Deploy poll failed', error);
      throw error;
    }
  }
  /**
   * Merge poll after it ends (via coordinator)
   */
  async mergePoll(pollId: string) {
    try {
      this.logger.log(`Merging poll ${pollId}...`);
      
      const authToken = await this.generateAuthToken();
      const encryptedSessionKey = await this.encryptSessionKey(this.walletAddress);

      const response = await fetch(`${this.coordinatorUrl}/v1/proof/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({
          poll: pollId,
          pollId: pollId,
          maciContractAddress: this.maciAddress,
          chain: 'arbitrum_sepolia',
          sessionKeyAddress: encryptedSessionKey,
        }),
      });

      const result = await response.json();
      
      if (result !== true) {
        throw new HttpException('Merge failed', 500);
      }

      this.logger.log(`Poll ${pollId} merged successfully`);
      return true;
    } catch (error) {
      this.logger.error('Merge poll failed', error);
      throw error;
    }
  }

  /**
   * 5. Generate proofs and get tally results
   */
  async generateProofs(pollId: string) {
    try {
      this.logger.log(`Generating proofs for poll ${pollId}...`);
      this.logger.log(`Using coordinator URL: ${this.coordinatorUrl}`);
      
      const authToken = await this.generateAuthToken();

      const requestBody = {
        poll: Number(pollId),
        pollId: Number(pollId),
        maciContractAddress: this.maciAddress,
        chain: 'arbitrum_sepolia',
        mode: 1,
        useWasm: true,
      };

      this.logger.log(`Request body: ${JSON.stringify(requestBody)}`);

      // Proof generation can take a very long time (hours). Increase timeout
      // and add retries for transient network errors (ECONNRESET, connection resets).
      const MAX_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
      const MAX_RETRIES = 3;

      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        attempt += 1;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

        try {
          this.logger.log(`Attempt ${attempt} to call coordinator (timeout ${MAX_TIMEOUT_MS}ms)`);

          const response = await fetch(`${this.coordinatorUrl}/v1/proof/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authToken,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeout);

          this.logger.log(`Response status: ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`HTTP Error ${response.status}: ${errorText}`);
            throw new HttpException(`Coordinator returned ${response.status}: ${errorText}`, response.status);
          }

          const result = await response.json();
          this.logger.log(`Response: ${JSON.stringify(result)}`);

          if (result.statusCode === 500) {
            this.logger.error(`Coordinator internal error: ${result.message}`);
            // If coordinator indicates an internal error, retry a few times before failing
            if (attempt < MAX_RETRIES) {
              this.logger.log(`Retrying after coordinator error (attempt ${attempt}/${MAX_RETRIES})`);
              await sleep(2000 * attempt);
              continue;
            }
            throw new HttpException(result.message, 500);
          }

          if (!result.results) {
            throw new HttpException(`No results in proof generation. Full response: ${JSON.stringify(result)}`, 500);
          }

          this.logger.log(`✅ Proofs generated successfully for poll ${pollId}`);

          return {
            results: result.results,
            tally: result.results.tally,
            totalSpentVoiceCredits: result.totalSpentVoiceCredits?.spent || result.totalSpentVoiceCredits,
            commitment: result.results.commitment,
          };
        } catch (fetchError: any) {
          clearTimeout(timeout);

          // Handle Abort (timeout) separately
          if (fetchError.name === 'AbortError') {
            this.logger.error(`Attempt ${attempt} aborted due to timeout (${MAX_TIMEOUT_MS}ms)`);
            if (attempt >= MAX_RETRIES) {
              throw new HttpException(`Request timeout: Proof generation took too long (> ${MAX_TIMEOUT_MS} ms)`, 504);
            }
            await sleep(1000 * attempt);
            continue;
          }

          // Retry on network resets / transient connection errors
          const msg = fetchError?.message || '';
          if (msg.includes('ECONNRESET') || msg.includes('connection reset') || msg.includes('ECONNREFUSED')) {
            this.logger.warn(`Transient network error on attempt ${attempt}: ${msg}`);
            if (attempt < MAX_RETRIES) {
              await sleep(1500 * attempt);
              continue;
            }
          }

          // If not retriable or out of attempts, rethrow
          throw fetchError;
        }
      }

      // If we exit loop without returning, fail
      throw new HttpException('Failed to generate proofs after multiple attempts', 500);
    } catch (error) {
      this.logger.error('Generate proofs failed', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(`Failed to generate proofs: ${error.message}`, 500);
    }
  }

  /**
   * 6. Submit proofs on-chain (optional)
   */
  async submitProofs(pollId: string) {
    try {
      this.logger.log(`Submitting proofs for poll ${pollId}...`);
      
      const authToken = await this.generateAuthToken();

      const response = await fetch(`${this.coordinatorUrl}/v1/proof/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({
          poll: pollId,
          pollId: pollId,
          maciContractAddress: this.maciAddress,
          chain: 'arbitrum_sepolia',
        }),
      });

      const result = await response.json();

      if (result.statusCode === 500) {
        this.logger.warn(`Submit proofs warning: ${result.message}`);
        return { success: false, message: result.message };
      }

      this.logger.log(`Proofs submitted for poll ${pollId}`);
      return { success: true, result };
    } catch (error) {
      this.logger.error('Submit proofs failed', error);
      return { success: false, error };
    }
  }
  async getPollContracts(pollId: string) {
  try {
    const { createPublicClient, http } = await import('viem');
    const { arbitrumSepolia } = await import('viem/chains');
    
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
    });

    // MACI ABI - getPoll function
    const maciAbi = [
      {
        inputs: [{ name: '_pollId', type: 'uint256' }],
        name: 'getPoll',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    // Poll ABI - get contracts
    const pollAbi = [
      {
        inputs: [],
        name: 'extContracts',
        outputs: [
          { name: 'messageProcessor', type: 'address' },
          { name: 'tally', type: 'address' },
          { name: 'subsidy', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    // Get Poll contract address
    const pollAddress = await publicClient.readContract({
      address: this.maciAddress as `0x${string}`,
      abi: maciAbi,
      functionName: 'getPoll',
      args: [BigInt(pollId)],
    }) as `0x${string}`;

    // Get Poll's external contracts
    const extContracts = (await publicClient.readContract({
      address: pollAddress as `0x${string}`,
      abi: pollAbi,
      functionName: 'extContracts',
    })) as [`0x${string}`, `0x${string}`, `0x${string}`];

    const [messageProcessor, tally, subsidy] = extContracts;

    return {
      pollId,
      maciAddress: this.maciAddress,
      pollAddress: pollAddress,
      messageProcessor,
      tally,
      subsidy,
    };
  } catch (error) {
    this.logger.error('Get poll contracts failed', error);
    throw error;
  }
}

  /**
   * Merge state tree directly (without coordinator)
   */
  async mergeStateDirect(pollId: string) {
    try {
      this.logger.log(`Merging state for poll ${pollId} directly...`);

      const rpcUrl = this.configService.get('RPC_URL', 'https://sepolia-rollup.arbitrum.io/rpc');
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(this.privateKey, provider);

      // Get poll contract
      const maciContract = new ethers.Contract(this.maciAddress, MACI_ABI, provider);
      const pollData = await maciContract.getPoll(pollId);
      const pollAddress = pollData.poll;

      this.logger.log(`Poll address: ${pollAddress}`);

      const pollContract = new ethers.Contract(pollAddress, POLL_ABI, provider);

      // Check if poll has ended
      const dates = await pollContract.getStartAndEndDate();
      const startDate = Number(dates[0]);
      const endDate = Number(dates[1]);
      const now = Math.floor(Date.now() / 1000);

      this.logger.log(`Poll dates - Start: ${new Date(startDate * 1000).toISOString()}, End: ${new Date(endDate * 1000).toISOString()}`);
      this.logger.log(`Current time: ${new Date(now * 1000).toISOString()}`);

      if (now <= endDate) {
        throw new HttpException(
          `Poll has not ended yet. End date: ${new Date(endDate * 1000).toISOString()}, Current time: ${new Date(now * 1000).toISOString()}`,
          400
        );
      }

      // Check if state is already merged
      const stateMerged = await pollContract.stateMerged();
      if (stateMerged) {
        this.logger.warn(`State already merged for poll ${pollId}`);
        return {
          success: true,
          message: 'State already merged',
          alreadyMerged: true,
        };
      }

      // Call mergeState
      const pollContractWithSigner = new ethers.Contract(pollAddress, POLL_ABI, signer);
      const tx = await pollContractWithSigner.mergeState();
      
      this.logger.log(`Merge transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      this.logger.log(`State merged successfully for poll ${pollId}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        alreadyMerged: false,
      };
    } catch (error) {
      this.logger.error(`Failed to merge state: ${error.message}`);
      throw error;
    }
  }
}
