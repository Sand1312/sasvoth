import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { MaciDeploymentsService } from './maci-deployments.service';

/**
 * SmartNonce Service
 * 
 * Implements the SmartNonce algorithm that reconciles:
 * - Hot Storage (Redis): Fast, optimistic pending nonces
 * - Cold Storage (The Graph): Trusted, confirmed on-chain state
 * 
 * Algorithm: nextNonce = max(confirmedNonce, pendingNonce) + 1
 */
@Injectable()
export class SmartNonceService implements OnModuleInit {
  private readonly logger = new Logger(SmartNonceService.name);
  private redlock: Redlock;
  private fallbackSubgraphUrl: string;

  // TTL for pending nonces in Redis (10 minutes - time for Graph to catch up)
  private readonly PENDING_NONCE_TTL = 600;
  
  // Lock TTL for vote transactions (2 minutes - enough for slow blockchain tx)
  private readonly LOCK_TTL = 120000;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => MaciDeploymentsService))
    private readonly maciDeploymentsService: MaciDeploymentsService,
  ) {
    // Keep env var as fallback
    this.fallbackSubgraphUrl = this.configService.get<string>('SUBGRAPH_URL') || '';
  }

  onModuleInit() {
    // Initialize Redlock with the Redis client
    this.redlock = new Redlock([this.redis], {
      // Retry settings for lock acquisition
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
      automaticExtensionThreshold: 500,
    });

    this.redlock.on('error', (error) => {
      this.logger.error('Redlock error', error);
    });

    this.logger.log('SmartNonceService initialized with Redlock');
  }

  /**
   * Calculate the next nonce for a user in a poll
   * Uses the SmartNonce algorithm: max(confirmed, pending) + 1
   * 
   * @param pollId - Poll ID
   * @param stateIndex - User's state index in the MACI state tree
   */
  async calculateNextNonce(pollId: string, stateIndex: string | number): Promise<number> {
    const stateIndexStr = stateIndex.toString();
    
    // Validate stateIndex is a number, not a public key
    if (!this.isValidStateIndex(stateIndexStr)) {
      this.logger.error(`Invalid stateIndex format: "${stateIndexStr.slice(0, 30)}..." - must be numeric`);
      throw new Error(`Invalid stateIndex format: expected numeric string, got "${stateIndexStr.slice(0, 20)}..."`);
    }
    
    // Step 1: Fetch confirmed count from The Graph (slow but trusted)
    const confirmedNonce = await this.getConfirmedNonce(pollId, stateIndexStr);

    // Step 2: Fetch pending nonce from Redis (fast but volatile)
    const pendingNonce = await this.getPendingNonce(pollId, stateIndexStr);

    // Step 3: Reconciliation - take max to never reuse a nonce
    const currentNonce = Math.max(confirmedNonce, pendingNonce);
    const nextNonce = currentNonce + 1;

    this.logger.debug(
      `SmartNonce for stateIndex ${stateIndexStr} in poll ${pollId}: ` +
      `confirmed=${confirmedNonce}, pending=${pendingNonce}, next=${nextNonce}`
    );

    return nextNonce;
  }

  /**
   * Get confirmed nonce from The Graph (Cold Storage)
   * 
   * Note: The subgraph Vote entity doesn't directly track stateIndex.
   * We would need Registration or Account entity to map stateIndex to user.
   * For now, we rely on Redis as the primary source and use subgraph
   * only for basic sanity checks.
   * 
   * @param pollId - Poll ID
   * @param stateIndex - User's state index
   */
  private async getConfirmedNonce(pollId: string, stateIndex: string): Promise<number> {
    // Get subgraph URL from latest MACI deployment or fallback to env var
    const subgraphUrl = await this.getSubgraphUrl();
    
    if (!subgraphUrl) {
      this.logger.debug('Subgraph URL not configured, using 0 for confirmed nonce');
      return 0;
    }

    try {
      // Query Account entity by stateIndex to get user's vote count
      // Account.id = stateIndex
      const query = `
        query GetAccountVotes($stateIndex: ID!) {
          account(id: $stateIndex) {
            id
            voiceCreditBalance
          }
        }
      `;

      const response = await fetch(subgraphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { stateIndex }
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Subgraph query failed: ${response.statusText}`);
        return 0;
      }

      const result = await response.json();
      
      if (result.errors) {
        this.logger.debug(`Subgraph errors: ${JSON.stringify(result.errors)}`);
        return 0;
      }

      // For now, if account exists, return 0 and rely on Redis for actual count
      // TODO: Extend subgraph schema to track message count per user
      const account = result.data?.account;
      if (account) {
        this.logger.debug(`Account ${stateIndex} found in subgraph`);
      } else {
        this.logger.debug(`Account ${stateIndex} not found in subgraph`);
      }
      
      // Since subgraph doesn't track message count per stateIndex,
      // return 0 and rely on Redis for accurate nonce tracking
      return 0;
    } catch (error) {
      this.logger.debug('Failed to query subgraph for confirmed nonce', error);
      return 0;
    }
  }


  /**
   * Get subgraph URL from latest MACI deployment or fallback to env var
   */
  private async getSubgraphUrl(): Promise<string | null> {
    try {
      // Try to get from latest MACI deployment in database
      const latestDeployment = await this.maciDeploymentsService.getLatest();
      if (latestDeployment?.subgraphUrl) {
        return latestDeployment.subgraphUrl;
      }
    } catch (error) {
      this.logger.debug('Could not fetch MACI deployment from database');
    }
    
    // Fallback to env var
    return this.fallbackSubgraphUrl || null;
  }

  /**
   * Get pending nonce from Redis (Hot Storage)
   */
  private async getPendingNonce(pollId: string, stateIndex: string): Promise<number> {
    const key = this.getNonceKey(pollId, stateIndex);
    const value = await this.redis.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Set pending nonce in Redis with TTL (optimistic update)
   */
  async setPendingNonce(pollId: string, stateIndex: string, nonce: number): Promise<void> {
    const key = this.getNonceKey(pollId, stateIndex);
    await this.redis.set(key, nonce.toString(), 'EX', this.PENDING_NONCE_TTL);
  }

  /**
   * Execute a vote transaction with distributed locking
   * Prevents race conditions where two requests calculate the same nonce
   */
  async withVoteLock<T>(
    pollId: string,
    stateIndex: string | number,
    fn: (nonce: number) => Promise<T>
  ): Promise<T> {
    const stateIndexStr = stateIndex.toString();
    const lockKey = `lock:vote:${pollId}:${stateIndexStr}`;
    
    let lock;
    try {
      lock = await this.redlock.acquire([lockKey], this.LOCK_TTL);
    } catch (lockError: any) {
      // If lock cannot be acquired, log and proceed without lock (graceful degradation)
      // This is better than blocking the user entirely
      this.logger.warn(`Failed to acquire vote lock for ${lockKey}: ${lockError.message}`);
      this.logger.warn('Proceeding without distributed lock - race conditions possible');
      
      // Calculate nonce without lock
      const nonce = await this.calculateNextNonce(pollId, stateIndexStr);
      const result = await fn(nonce);
      await this.setPendingNonce(pollId, stateIndexStr, nonce);
      return result;
    }
    
    try {
      // Calculate nonce while holding the lock
      const nonce = await this.calculateNextNonce(pollId, stateIndexStr);
      
      // Execute the vote function
      const result = await fn(nonce);
      
      // Optimistically update Redis with the used nonce
      await this.setPendingNonce(pollId, stateIndexStr, nonce);
      
      return result;
    } finally {
      // Always release the lock
      if (lock) {
        try {
          await lock.release();
        } catch (releaseError) {
          this.logger.warn(`Failed to release lock: ${releaseError}`);
        }
      }
    }
  }

  /**
   * Sync a user's nonce with The Graph (called by background job)
   * Removes stale Redis entries when Graph has caught up
   */
  async syncNonceWithGraph(pollId: string, stateIndex: string | number): Promise<boolean> {
    const stateIndexStr = stateIndex.toString();
    const confirmedNonce = await this.getConfirmedNonce(pollId, stateIndexStr);
    const pendingNonce = await this.getPendingNonce(pollId, stateIndexStr);

    if (confirmedNonce >= pendingNonce) {
      // Graph has caught up, remove the Redis key
      const key = this.getNonceKey(pollId, stateIndexStr);
      await this.redis.del(key);
      this.logger.debug(
        `Synced nonce for stateIndex ${stateIndexStr} in poll ${pollId}: ` +
        `Graph (${confirmedNonce}) >= Redis (${pendingNonce}), cleared Redis`
      );
      return true;
    }

    return false;
  }

  /**
   * Get all pending nonce keys for a poll (for background sync)
   */
  async getPendingNonceKeys(pollId: string): Promise<string[]> {
    const pattern = `maci:nonce:${pollId}:*`;
    const keys = await this.redis.keys(pattern);
    return keys;
  }

  /**
   * Generate Redis key for nonce storage
   */
  private getNonceKey(pollId: string, stateIndex: string): string {
    return `maci:nonce:${pollId}:${stateIndex}`;
  }

  /**
   * Get Redlock instance for external use if needed
   */
  getRedlock(): Redlock {
    return this.redlock;
  }

  /**
   * Validate that stateIndex is a numeric value
   * Returns false for invalid values like "macipk.xxx"
   */
  private isValidStateIndex(stateIndex: string): boolean {
    // StateIndex should be a non-negative integer (e.g., "0", "1", "9", "123")
    // Not a MACI public key (e.g., "macipk.xxx")
    const parsed = parseInt(stateIndex, 10);
    return !isNaN(parsed) && parsed >= 0 && String(parsed) === stateIndex;
  }
}
