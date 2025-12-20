// src/maci/maci.service.ts
import {
  Injectable,
  HttpException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { ethers } from 'ethers';
import { ethers as ethers6 } from 'ethers6';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PollsService } from '../polls/polls.service';
import { ResultsMetaService } from '../results-meta/results-meta.service';
import { SmartNonceService } from './smart-nonce.service';
import { SubgraphService } from './subgraph.service';
import { MaciDeploymentsService } from './maci-deployments.service';

import {
  signup as sdkSignup,
  joinPoll as sdkJoinPoll,
  publishBatch as sdkPublishBatch,
} from '@maci-protocol/sdk';

const { MACI_ABI, POLL_ABI } = require('@sasvoth/contracts');

const execAsync = promisify(exec);
const fs = require("fs");


@Injectable()
export class MaciService {
  private readonly logger = new Logger(MaciService.name);
  private readonly coordinatorUrl: string;
  private readonly privateKey: string;
  private readonly walletAddress: string;
  private readonly maciAddress: string;
  private readonly provider: ethers.providers.JsonRpcProvider;

  // private readonly pollsService: PollsService; // Removed to avoid duplicate identifier

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => ResultsMetaService))
    private resultsMetaService: ResultsMetaService,
    @Inject(forwardRef(() => PollsService)) private pollsService: PollsService,
    @InjectRedis() private readonly redis: Redis,
    private readonly smartNonceService: SmartNonceService,
    private readonly subgraphService: SubgraphService,
    private readonly maciDeploymentsService: MaciDeploymentsService,
  ) {
    this.coordinatorUrl = this.configService.get(
      'MACI_COORDINATOR_URL',
      'https://roller-missile-vast-hampshire.trycloudflare.com/',
    );
    this.privateKey =
      this.configService.get('WALLET_PRIVATE_KEY') ||
      this.configService.get('ETH_PRIVATE_KEY') ||
      '';
    
    if (!this.privateKey) {
        this.logger.error("No private key found (WALLET_PRIVATE_KEY or ETH_PRIVATE_KEY)");
    }
    this.walletAddress = this.configService.get('WALLET_ADDRESS', '');
    this.maciAddress = this.configService.get('MACI_ADDRESS', '');

    const rpcUrl = this.configService.get(
      'RPC_URL',
      'https://sepolia-rollup.arbitrum.io/rpc',
    );
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Generate auth token by calling generate-auth.js
   */
  private async generateAuthToken(): Promise<string> {
    const scriptPath = path.join(process.cwd(), 'src/utils/generate-auth.js');
    const { stdout } = await execAsync(`node ${scriptPath} ${this.privateKey}`);
    return (
      stdout
        .split('\n')
        .find((line) => line.startsWith('Bearer'))
        ?.trim() || ''
    );
  }

  /**
   * Encrypt session key by calling encrypt-helper.js
   */
  private async encryptSessionKey(address: string): Promise<string> {
    const scriptPath = path.join(process.cwd(), 'src/utils/encrypt-helper.js');
    const { stdout } = await execAsync(`node ${scriptPath} "${address}"`);
    return (
      stdout
        .split('\n')
        .find((line) => !line.includes('Encrypted'))
        ?.trim() || ''
    );
  }


  /**
   * Signup to MACI
   */
  async signup(maciPubKey: string, maciAddress?: string, sgData?: string) {
    try {
      this.logger.log(`Signing up to MACI... PubKey: ${maciPubKey}`);
      
      const providerV6 = new ethers6.JsonRpcProvider(this.provider.connection.url);
      const signerV6 = new ethers6.Wallet(this.privateKey, providerV6);
      
      const address = maciAddress || this.maciAddress;
      
      this.logger.log(`Using MACI Address: ${address}`);

      // Validate maciPubKey
      if (!maciPubKey || !maciPubKey.startsWith("macipk.")) {
        throw new HttpException("Invalid MACI Public Key format", 400);
      }

      const result = await sdkSignup({
        maciAddress: address,
        maciPublicKey: maciPubKey,
        signer: signerV6,
        sgData: sgData || "0x0000000000000000000000000000000000000000000000000000000000000000"
      });

      this.logger.log(`Signup success. StateIndex: ${result.stateIndex}`);

      // Get block number
      let blockNumber: number | undefined;
      if (result.transactionHash) {
          try {
              const receipt = await this.provider.waitForTransaction(result.transactionHash, 1);
              blockNumber = receipt.blockNumber;
          } catch (e) {
              try {
                  blockNumber = await this.provider.getBlockNumber();
              } catch(e2) {}
          }
      }

      return {
        success: true,
        stateIndex: result.stateIndex.toString(),
        hash: result.transactionHash,
        blockNumber
      };
    } catch (error) {
      this.logger.error("Signup failed", error);
      throw new HttpException(`Signup failed: ${error.message}`, 500);
    }
  }

  /**
   * Get nonce for a user (for EIP-712 signing)
   * Queries the Gatekeeper contract or uses a local mapping
   */
  async getNonce(address: string) {
    try {
      // For now, use Redis to track nonces
      // In production, query the Gatekeeper contract: gatekeeper.nonces(address)
      const redisKey = `maci:signup:nonce:${address.toLowerCase()}`;
      const nonce = await this.redis.get(redisKey);
      
      return {
        nonce: nonce ? parseInt(nonce, 10) : 0,
        address: address.toLowerCase()
      };
    } catch (error) {
      this.logger.error("Get nonce failed", error);
      throw new HttpException(`Get nonce failed: ${error.message}`, 500);
    }
  }

  /**
   * Signup to MACI with EIP-712 signature (Secure)
   * 
   * 1. Verify user exists in Users collection (eligibility)
   * 2. Verify signature (will be done by Gatekeeper contract)
   * 3. Call Gatekeeper contract to relay signup
   * 
   * For now, until Gatekeeper is deployed, falls back to legacy signup
   */
  async signupWithSignature(
    pubKeyX: string,
    pubKeyY: string,
    signature: string,
    nonce: number,
    deadline: number,
    maciAddress?: string
  ) {
    try {
      this.logger.log(`EIP-712 Signup: pubKeyX=${pubKeyX.substring(0, 20)}...`);
      
      // 1. Verify user eligibility by checking Users collection
      // The signature verification will be done by the Gatekeeper contract
      // For eligibility, we recover the signer address and check DB
      
      // TODO: When Gatekeeper is deployed:
      // const gatekeeperAddress = this.configService.get('GATEKEEPER_ADDRESS');
      // const gatekeeper = new ethers.Contract(gatekeeperAddress, GATEKEEPER_ABI, signer);
      // const result = await gatekeeper.signupWithSignature(pubKeyX, pubKeyY, deadline, signature);
      
      // For now, verify deadline hasn't passed
      const now = Math.floor(Date.now() / 1000);
      if (deadline < now) {
        throw new HttpException('Signature expired', 400);
      }

      // Reconstruct the MACI public key and proceed with legacy signup
      // This is a temporary fallback until Gatekeeper contract is deployed
      const domainobjs = await import('maci-domainobjs');
      const { PubKey } = domainobjs;
      
      // Create PubKey from x/y coordinates
      const pubKey = new PubKey([BigInt(pubKeyX), BigInt(pubKeyY)]);
      const maciPubKey = pubKey.serialize();
      
      this.logger.log(`Reconstructed MACI PubKey: ${maciPubKey.substring(0, 30)}...`);

      // Increment nonce in Redis
      const redisKey = `maci:signup:nonce:${signature.substring(0, 42).toLowerCase()}`;
      await this.redis.incr(redisKey);

      // Fall back to legacy signup for now
      return await this.signup(maciPubKey, maciAddress);

    } catch (error) {
      this.logger.error("EIP-712 Signup failed", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(`EIP-712 Signup failed: ${error.message}`, 500);
    }
  }

  /**
   * Join Poll
   */
  async joinPoll(
    pollId: string, 
    maciPrivateKey: string, 
    maciAddress?: string, 
    startBlock?: number
  ) {
    try {
      this.logger.log(`Joining Poll ${pollId}...`);
      
      const providerV6 = new ethers6.JsonRpcProvider(this.provider.connection.url);
      const signerV6 = new ethers6.Wallet(this.privateKey, providerV6);
      
      const address = maciAddress || this.maciAddress;

      // Verify MACI State Tree Depth
      try {
        const maciContract = new ethers6.Contract(
          address,
          [
            "function stateTreeDepth() view returns (uint8)",
            "function getPoll(uint256) view returns (address poll, address messageProcessor, address tally)"
          ],
          providerV6
        );
        const depth = await maciContract.stateTreeDepth();
        this.logger.log(`MACI Contract State Tree Depth: ${depth}`);
        
        if (Number(depth) !== 10) {
           this.logger.warn(`WARNING: MACI State Tree Depth is ${depth}, but we are using PollJoining_10_test ZKey (depth 10). This will likely fail!`);
        }

        // Verify Poll Tree Depths
        const pollContracts = await maciContract.getPoll(pollId);
        const pollAddress = pollContracts[0];
        this.logger.log(`Poll Address: ${pollAddress} for Poll ID: ${pollId}`);
        const pollContract = new ethers6.Contract(pollAddress, POLL_ABI, providerV6);
        const treeDepths = await pollContract.treeDepths();
        this.logger.log(`Poll Tree Depths: intStateTreeDepth=${treeDepths.intStateTreeDepth}, messageTreeSubDepth=${treeDepths.messageTreeSubDepth}, messageTreeDepth=${treeDepths.messageTreeDepth}, voteOptionTreeDepth=${treeDepths.voteOptionTreeDepth}`);
        
      } catch (e) {
          this.logger.warn(`Could not verify state tree depth or poll depths: ${e.message}`);
      }

      // Resolve ZKey Paths - Try multiple locations
      // 1. Production/Docker path (if configured)
      // 2. Development path (relative to apps/api)
      const potentialPaths = [
          path.join(process.cwd(), "zkeys"), // Local zkeys folder
          path.join(process.cwd(), "../web/public/zkeys"), // Monorepo sibling
          path.join(process.cwd(), "public/zkeys"),
      ];

      let zkeyPath = "";
      let wasmPath = "";
      
      for (const basePath of potentialPaths) {
          const z = path.join(basePath, "PollJoining_10_test/PollJoining_10_test.0.zkey");
          const w = path.join(basePath, "PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm");
          if (fs.existsSync(z) && fs.existsSync(w)) {
              zkeyPath = z;
              wasmPath = w;
              this.logger.log(`Found ZKeys at: ${basePath}`);
              break;
          }
      }

      if (!zkeyPath || !wasmPath) {
          throw new HttpException("ZKey files not found. Setup zkeys in apps/api/zkeys or apps/web/public/zkeys", 500);
      }

      const ZERO_DATA = "0x0000000000000000000000000000000000000000000000000000000000000000";
      // Default start block for Arbi Sepolia if not provided
      const effectiveStartBlock = startBlock || 224688901;

      const result = await sdkJoinPoll({
        maciAddress: address,
        privateKey: maciPrivateKey,
        pollId: BigInt(pollId),
        pollJoiningZkey: zkeyPath,
        useWasm: true,
        pollJoiningWasm: wasmPath,
        sgDataArg: ZERO_DATA,
        ivcpDataArg: ZERO_DATA,
        signer: signerV6,
        startBlock: effectiveStartBlock,
        blocksPerBatch: 100000, // Reduced from 100000 if needed, but keeping high for sync
      });

      this.logger.log(`Join Poll success. PollStateIndex: ${result.pollStateIndex}`);

      return {
        success: true,
        pollStateIndex: result.pollStateIndex.toString(),
        voiceCredits: result.voiceCredits.toString(),
        hash: result.hash,
      };

    } catch (error: any) {
      this.logger.error("Join Poll failed", error);
       let errorMessage = error.message || "Unknown error joining poll";
       const errorData = error.data || error.error?.data || '';
       
       // Decode Poll contract custom errors by selector
       // Selectors computed from keccak256 of error signature
       const ERROR_SELECTORS: Record<string, string> = {
         '0xf45d43bf': 'UserAlreadyJoined',
         '0x75fc7f6f': 'InvalidPollProof',
         '0xa47dcd48': 'VotingPeriodOver',
         '0x1262a27a': 'VotingPeriodNotOver', 
         '0x256eadc8': 'VotingPeriodNotStarted',
         '0xb984588b': 'TooManySignups',
         '0xc64891a5': 'NotRelayer',
         '0xdfd58098': 'StateLeafNotFound',
         '0xb2d14184': 'UserNotSignedUp',
         '0xa2d0fee8': 'InvalidPublicKey',
       };

       // Check for known error selectors in error data
       let decodedError: string | null = null;
       for (const [selector, errorName] of Object.entries(ERROR_SELECTORS)) {
         if (errorMessage.includes(selector) || errorData.includes(selector)) {
           decodedError = errorName;
           break;
         }
       }

       if (decodedError) {
         this.logger.error(`Decoded custom error: ${decodedError}`);
       }
       
       // Handle "UserAlreadyJoined" (selector 0xf45d43bf)
       if (decodedError === 'UserAlreadyJoined') {
         this.logger.log("User already joined poll. Treating as success.");
         return {
           success: true,
           alreadyJoined: true,
           pollStateIndex: "0",
           voiceCredits: "0", 
         };
       }

       // Handle InvalidPollProof - ZK proof verification failed
       if (decodedError === 'InvalidPollProof') {
         errorMessage = "ZK Proof verification failed. Possible causes: (1) ZKey mismatch with contract, (2) State tree depth mismatch, (3) startBlock is wrong causing incorrect Merkle tree, (4) User not found in MACI state tree.";
         this.logger.error(`InvalidPollProof details: startBlock may be incorrect or user signup not indexed`);
       }

       // Handle UserNotSignedUp
       if (decodedError === 'UserNotSignedUp') {
         errorMessage = "User has not signed up to MACI. Please call signupToMaci first.";
       }

       // Handle VotingPeriodNotStarted
       if (decodedError === 'VotingPeriodNotStarted') {
         errorMessage = "Poll voting period has not started yet.";
       }

       // Handle VotingPeriodOver
       if (decodedError === 'VotingPeriodOver') {
         errorMessage = "Poll voting period has ended. Cannot join after deadline.";
       }

       if (errorMessage.includes("Signal indices not found")) {
         errorMessage = "User signup not found on-chain. Check startBlock or if user is signed up.";
       }
       
       this.logger.error(`Join Poll full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
      throw new HttpException(`Join Poll failed: ${errorMessage}`, 500);
    }
  }

  /**
   * Vote (Publish Batch)
   */
  async vote(
    pollId: string,
    voteOptionIndex: number,
    voteWeight: number,
    nonce: number, // Ignored - SmartNonce manages this
    userStateIndex: string,
    userMaciPrivateKey: string,
    userMaciPublicKey: string,
    maciAddress?: string
  ) {
    try {
      this.logger.log(`Voting on Poll ${pollId} for Option ${voteOptionIndex}...`);
      
      const providerV6 = new ethers6.JsonRpcProvider(this.provider.connection.url);
      const signerV6 = new ethers6.Wallet(this.privateKey, providerV6);
      
      const address = maciAddress || this.maciAddress;

      // Use SmartNonce with distributed locking
      // This ensures:
      // 1. No race conditions between concurrent votes
      // 2. Nonce is max(confirmed from Graph, pending in Redis) + 1
      // 3. Optimistic update to Redis after successful submission
      const result = await this.smartNonceService.withVoteLock(
        pollId,
        userStateIndex,
        async (smartNonce) => {
          this.logger.log(`SmartNonce calculated: ${smartNonce} for ${userMaciPublicKey.substring(0, 20)}...`);

          const publishResult = await sdkPublishBatch({
            messages: [{
              stateIndex: BigInt(userStateIndex),
              voteOptionIndex: BigInt(voteOptionIndex),
              newVoteWeight: BigInt(voteWeight),
              nonce: BigInt(smartNonce)
            }],
            publicKey: userMaciPublicKey,
            privateKey: userMaciPrivateKey,
            pollId: BigInt(pollId),
            maciAddress: address,
            signer: signerV6
          });

          this.logger.log(`Vote success. Hash: ${publishResult.hash}`);
          return publishResult;
        }
      );

      return {
        success: true,
        hash: result.hash
      };

    } catch (error) {
      this.logger.error("Vote failed", error);
      throw new HttpException(`Vote failed: ${error.message}`, 500);
    }
  }

  async deployMaci(payload: any) {
    try {
      this.logger.log('Deploying MACI contract via Coordinator...');
      const authToken = await this.generateAuthToken();
      let sessionKeyAddress = payload.sessionKeyAddress;

      // Encrypt session key if it looks like a wallet address and not already encrypted
      // (Basic heuristic or just re-encrypt to be safe if provided)
      if (
        sessionKeyAddress &&
        sessionKeyAddress.startsWith('0x') &&
        sessionKeyAddress.length === 42
      ) {
        sessionKeyAddress = await this.encryptSessionKey(sessionKeyAddress);
      }

      const response = await fetch(`${this.coordinatorUrl}/v1/deploy/maci`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({
          ...payload,
          sessionKeyAddress,
        }),
      });

      const result = await response.json();
      this.logger.debug(
        `Coordinator response (deployMaci): ${JSON.stringify(result)}`,
      );

      if (!result.maciContractAddress && !result.address) {
        this.logger.error(
          `Coordinator deploy maci failed. Response: ${JSON.stringify(result)}`,
        );
        throw new HttpException('Failed to deploy MACI contract', 500);
      }

      const maciAddress = result.maciContractAddress || result.address;
      
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

      // Deploy subgraph for the new MACI contract (optional, based on config)
      let subgraphUrl: string | null = null;
      const shouldDeploySubgraph = this.configService.get<boolean>('AUTO_DEPLOY_SUBGRAPH', false);
      
      if (shouldDeploySubgraph) {
        try {
          this.logger.log('Auto-deploying subgraph for new MACI contract...');
          const subgraphResult = await this.subgraphService.deploy({
            maciContractAddress: maciAddress,
            maciContractStartBlock: startBlock,
            network: payload.chain || 'arbitrum-sepolia',
          });
          subgraphUrl = subgraphResult.subgraphUrl;
          this.logger.log(`Subgraph deployed: ${subgraphUrl}`);
        } catch (subgraphError) {
          this.logger.warn('Subgraph auto-deployment failed, continuing without it', subgraphError);
        }
      }

      // Save MACI deployment info to database
      try {
        await this.maciDeploymentsService.upsert({
          maciAddress,
          subgraphUrl: subgraphUrl || undefined,
          startBlock,
          chain: payload.chain || 'arbitrum_sepolia',
          config: payload.config,
        });
        this.logger.log(`MACI deployment saved to database: ${maciAddress}`);
      } catch (dbError) {
        this.logger.warn('Failed to save MACI deployment to database', dbError);
      }

      return {
        address: maciAddress,
        blockNumber: startBlock,
        network: payload.chain,
        subgraphUrl,
      };
    } catch (error) {
      this.logger.error('Deploy MACI failed', error);
      throw error;
    }
  }

  async deployPoll(payload: any) {
    try {
      this.logger.log('Deploying new poll...');
      // this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

      const authToken = await this.generateAuthToken();
      let sessionKeyAddress = payload.sessionKeyAddress;

      // Use configured wallet address if no session key provided, or encrypt provided one
      if (!sessionKeyAddress) {
        sessionKeyAddress = await this.encryptSessionKey(this.walletAddress);
      } else if (
        sessionKeyAddress.startsWith('0x') &&
        sessionKeyAddress.length === 42
      ) {
        // If raw address provided, encrypt it
        sessionKeyAddress = await this.encryptSessionKey(sessionKeyAddress);
      }

      const maciAddress = payload.maciAddress || this.maciAddress;
      if (!maciAddress) {
        throw new HttpException(
          'MACI Address is required for poll deployment',
          400,
        );
      }

      // Merge defaults with provided config
      const defaultConfig = {
        mode: 1,
        intStateTreeDepth: 1,
        tallyProcessingStateTreeDepth: 1,
        messageBatchSize: 4, // Increased from 2 to 20 to match logic
        pollStateTreeDepth: 10,
        voteOptionTreeDepth: 2,
        voteOptions: 4,
        policy: {
          policyType:
            '@excubiae/contracts/contracts/extensions/freeForAll/FreeForAllPolicy.sol:FreeForAllPolicy',
          checkerType: 'FreeForAll',
        },
        initialVoiceCreditsProxy: {
          factoryType: 'ConstantInitialVoiceCreditProxyFactory',
          type: 'ConstantInitialVoiceCreditProxy',
          args: { amount: '100' },
        },
      };

      const finalConfig = { ...defaultConfig, ...(payload.config || {}) };
      // Ensure voteOptions is string if needed by Coordinator (some versions require string)
      if (typeof finalConfig.voteOptions === 'number') {
        finalConfig.voteOptions = finalConfig.voteOptions.toString();
      }

      const coordinatorPayload = {
        chain: payload.chain || 'arbitrum_sepolia',
        maciContractAddress: maciAddress, // pass MACI address!
        sessionKeyAddress,
        config: finalConfig,
      };

      const response = await fetch(`${this.coordinatorUrl}/v1/deploy/poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify(coordinatorPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.error(
          `Coordinator deploy poll failed [${response.status}]: ${text}`,
        );
        throw new HttpException(`Coordinator Error: ${text}`, response.status);
      }

      const result = await response.json();
      this.logger.debug(`Coordinator response: ${JSON.stringify(result)}`);

      if (!result.pollId) {
        this.logger.error(
          `Coordinator deploy poll failed (no pollId). Response: ${JSON.stringify(result)}`,
        );
        throw new HttpException(
          'Failed to deploy poll - No Poll ID returned',
          500,
        );
      }

      this.logger.log(`Coordinator reported Poll ID: ${result.pollId}`);

      // Verify actual Poll ID from chain (Coordinator might be desynced)
      // MACI uses nextPollId which is the ID for the NEXT poll to be created
      // So the latest deployed poll ID = nextPollId - 1
      try {
        const maciContract = new ethers.Contract(
          maciAddress,
          MACI_ABI,
          this.provider,
        );

        // Try nextPollId first (newer MACI versions)
        let onChainPollId: number;
        try {
          const nextPollId = await maciContract.nextPollId();
          onChainPollId = Number(nextPollId) - 1;
          this.logger.log(
            `On-Chain nextPollId: ${nextPollId}, Latest Poll ID: ${onChainPollId}`,
          );
        } catch {
          // Fallback to numPolls (older MACI versions)
          const numPolls = await maciContract.numPolls();
          onChainPollId = Number(numPolls) - 1;
          this.logger.log(
            `On-Chain numPolls: ${numPolls}, Latest Poll ID: ${onChainPollId}`,
          );
        }

        if (onChainPollId >= 0) {
          this.logger.log(
            `Returning verified on-chain Poll ID: ${onChainPollId}`,
          );
          return {
            pollId: onChainPollId.toString(),
            txHash: result.txHash,
          };
        }
      } catch (e) {
        this.logger.warn(`Failed to verify Poll ID from chain: ${e.message}`);
      }

      return {
        pollId: result.pollId,
        txHash: result.txHash,
        subgraphUrl: result.subgraphUrl,
      };
    } catch (error) {
      this.logger.error('Deploy poll failed', error);
      throw error;
    }
  }
  /**
   * Merge poll after it ends (via coordinator)
   */
  async mergePoll(pollId: string, maciAddress?: string) {
    try {
      this.logger.log(`Merging poll ${pollId}...`);

      const authToken = await this.generateAuthToken();
      const encryptedSessionKey = await this.encryptSessionKey(
        this.walletAddress,
      );

      const response = await fetch(`${this.coordinatorUrl}/v1/proof/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({
          poll: pollId,
          pollId: pollId,
          maciContractAddress: maciAddress || this.maciAddress,
          chain: 'arbitrum_sepolia',
          sessionKeyAddress: encryptedSessionKey,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        // Response might be plain text
      }

      if (!response.ok) {
        const errorText =
          typeof result === 'string' ? result : JSON.stringify(result);
        const errorMessage =
          result?.message ||
          result?.error ||
          errorText ||
          (await response.text());

        this.logger.warn(
          `DEBUG: Coordinator Error Response: ${JSON.stringify(result)}`,
        );
        this.logger.warn(`DEBUG: Extracted Error Message: ${errorMessage}`);

        if (
          errorMessage &&
          (errorMessage.includes('already been merged') ||
            errorMessage.includes('already merged'))
        ) {
          this.logger.warn(
            `Poll ${pollId} was already merged (coordinator 500). Keeping calm and carrying on.`,
          );
          return true;
        }

        this.logger.error(
          `Coordinator merge failed [${response.status}]: ${errorMessage}`,
        );
        throw new HttpException(
          `Coordinator Merge Error: ${errorMessage}`,
          response.status,
        );
      }

      // If status is 200/201 but result says false (unlikely given new coordinator spec, but preserving logic)
      if (result === false) {
        throw new HttpException('Merge failed (returned false)', 500);
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
  async generateProofs(
    pollId: string,
    maciAddress?: string,
    startBlock?: number,
  ) {
    try {
      this.logger.log(`Generating proofs for poll ${pollId}...`);
      this.logger.log(`Using coordinator URL: ${this.coordinatorUrl}`);

      const authToken = await this.generateAuthToken();

      const requestBody = {
        poll: Number(pollId),
        pollId: Number(pollId),
        maciContractAddress: maciAddress || this.maciAddress,
        startBlock: startBlock, // Add startBlock here
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
          this.logger.log(
            `Attempt ${attempt} to call coordinator (timeout ${MAX_TIMEOUT_MS}ms)`,
          );

          const response = await fetch(
            `${this.coordinatorUrl}/v1/proof/generate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: authToken,
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            },
          );

          clearTimeout(timeout);

          this.logger.log(`Response status: ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`HTTP Error ${response.status}: ${errorText}`);
            throw new HttpException(
              `Coordinator returned ${response.status}: ${errorText}`,
              response.status,
            );
          }

          const result = await response.json();
          // this.logger.log(`Response: ${JSON.stringify(result)}`); // Comment out to avoid huge logs

          if (result.statusCode === 500) {
            this.logger.error(`Coordinator internal error: ${result.message}`);
            // If coordinator indicates an internal error, retry a few times before failing
            if (attempt < MAX_RETRIES) {
              this.logger.log(`Retrying after coordinator error...`);
              await sleep(2000 * attempt);
              continue;
            }
            throw new HttpException(result.message, 500);
          }

          // Robust result extraction
          let tallyResults = result.results;
          if (!tallyResults && result.tallyData && result.tallyData.results) {
            tallyResults = result.tallyData.results;
          }

          if (!tallyResults) {
            // Fallback: Check if it's inside tallyProofs array
            if (
              result.tallyProofs &&
              result.tallyProofs.length > 0 &&
              result.tallyProofs[0].tallyData
            ) {
              tallyResults = result.tallyProofs[0].tallyData.results;
            }
          }

          if (!tallyResults || !tallyResults.tally) {
            throw new HttpException(`No results in proof generation.`, 500);
          }

          // Save extracted results
          try {
            this.logger.log(`Saving tally results for poll ${pollId}...`);
            await this.resultsMetaService.saveMaciResults(
              pollId,
              tallyResults.tally,
            );
            this.logger.log(`Tally results saved successfully.`);
          } catch (e) {
            this.logger.error(`Failed to save tally results: ${e.message}`, e);
          }

          this.logger.log(
            ` Proofs generated successfully for poll ${pollId}`,
          );

          return {
            results: tallyResults,
            tally: tallyResults.tally,
            totalSpentVoiceCredits:
              result.totalSpentVoiceCredits?.spent ||
              result.totalSpentVoiceCredits ||
              tallyResults.totalSpentVoiceCredits?.spent,
            commitment: tallyResults.commitment,
          };
        } catch (fetchError: any) {
          clearTimeout(timeout);

          // Handle Abort (timeout) separately
          if (fetchError.name === 'AbortError') {
            this.logger.error(
              `Attempt ${attempt} aborted due to timeout (${MAX_TIMEOUT_MS}ms)`,
            );
            if (attempt >= MAX_RETRIES) {
              throw new HttpException(
                `Request timeout: Proof generation took too long (> ${MAX_TIMEOUT_MS} ms)`,
                504,
              );
            }
            await sleep(1000 * attempt);
            continue;
          }

          // Retry on network resets / transient connection errors
          const msg = fetchError?.message || '';
          if (
            msg.includes('ECONNRESET') ||
            msg.includes('connection reset') ||
            msg.includes('ECONNREFUSED')
          ) {
            this.logger.warn(
              `Transient network error on attempt ${attempt}: ${msg}`,
            );
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
      throw new HttpException(
        'Failed to generate proofs after multiple attempts',
        500,
      );
    } catch (error) {
      this.logger.error('Generate proofs failed', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to generate proofs: ${error.message}`,
        500,
      );
    }
  }

  /**
   * 6. Submit proofs on-chain (optional)
   */
  async submitProofs(pollId: string, maciAddress?: string) {
    try {
      this.logger.log(`Submitting proofs for poll ${pollId}...`);

      const authToken = await this.generateAuthToken();

      const response = await fetch(`${this.coordinatorUrl}/v1/proof/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
        body: JSON.stringify({
          poll: Number(pollId),
          pollId: Number(pollId),
          maciContractAddress: maciAddress || this.maciAddress,
          chain: 'arbitrum_sepolia',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new HttpException(
          `Coordinator submit proofs failed: ${JSON.stringify(result)}`,
          500,
        );
      }

      // Save results if available
      if (result.results && result.results.tally) {
        try {
          this.logger.log(`Saving tally results for poll ${pollId}...`);
          await this.resultsMetaService.saveMaciResults(
            pollId,
            result.results.tally,
          );
          this.logger.log(`Tally results saved successfully.`);

          // Update status to ended
          this.logger.log(`Updating poll status to 'ended'...`);
          await this.pollsService.updateStatusByOnChainId(
            Number(pollId),
            'ended',
          );
          this.logger.log(`Poll status updated.`);
        } catch (e) {
          this.logger.error(
            `Failed to save tally results or update status: ${e.message}`,
            e,
          );
        }
      }

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
  async getPollContracts(pollId: string, maciAddress?: string) {
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

      const currentMaciAddress = maciAddress || this.maciAddress;

      // Get Poll contract address
      const pollAddress = (await publicClient.readContract({
        address: currentMaciAddress as `0x${string}`,
        abi: maciAbi,
        functionName: 'getPoll',
        args: [BigInt(pollId)],
      })) as `0x${string}`;

      // Get Poll's external contracts
      const extContracts = (await publicClient.readContract({
        address: pollAddress as `0x${string}`,
        abi: pollAbi,
        functionName: 'extContracts',
      })) as [`0x${string}`, `0x${string}`, `0x${string}`];

      const [messageProcessor, tally, subsidy] = extContracts;

      return {
        pollId,
        maciAddress: currentMaciAddress,
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

      const rpcUrl = this.configService.get(
        'RPC_URL',
        'https://sepolia-rollup.arbitrum.io/rpc',
      );
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(this.privateKey, provider);

      // Get poll contract
      const maciContract = new ethers.Contract(
        this.maciAddress,
        MACI_ABI,
        provider,
      );
      const pollData = await maciContract.getPoll(pollId);
      const pollAddress = pollData.poll;

      this.logger.log(`Poll address: ${pollAddress}`);

      const pollContract = new ethers.Contract(pollAddress, POLL_ABI, provider);

      // Check if poll has ended
      const dates = await pollContract.getStartAndEndDate();
      const startDate = Number(dates[0]);
      const endDate = Number(dates[1]);
      const now = Math.floor(Date.now() / 1000);

      this.logger.log(
        `Poll dates - Start: ${new Date(startDate * 1000).toISOString()}, End: ${new Date(endDate * 1000).toISOString()}`,
      );
      this.logger.log(`Current time: ${new Date(now * 1000).toISOString()}`);

      if (now <= endDate) {
        throw new HttpException(
          `Poll has not ended yet. End date: ${new Date(endDate * 1000).toISOString()}, Current time: ${new Date(now * 1000).toISOString()}`,
          400,
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
      const pollContractWithSigner = new ethers.Contract(
        pollAddress,
        POLL_ABI,
        signer,
      );
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
  /**
   * Signup to MACI via Coordinator
   */


  /**
   * Publish Message (Vote) via Coordinator
   */
  async publishMessage(
    pollId: string,
    message: any,
    encPubKey: { x: string; y: string },
    maciAddress?: string,
  ) {
    try {
      this.logger.log(
        `Publishing message for poll ${pollId} via Coordinator...`,
      );
      const authToken = await this.generateAuthToken();
      const address = maciAddress || this.maciAddress;

      const response = await fetch(
        `${this.coordinatorUrl}/v1/publish-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authToken,
          },
          body: JSON.stringify({
            pollId,
            maciContractAddress: address,
            message,
            encPubKey,
            chain: 'arbitrum_sepolia',
          }),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new HttpException(
          `Coordinator Publish Message Failed: ${text}`,
          response.status,
        );
      }

      const result = await response.json();
      this.logger.log(`Message published: ${JSON.stringify(result)}`);
      return result;
    } catch (e) {
      this.logger.error('Publish message failed', e);
      throw e;
    }
  }
}
