import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SmartNonceService } from './smart-nonce.service';

/**
 * Nonce Synchronization Background Job
 * 
 * Self-healing mechanism that ensures Redis doesn't hold stale nonce data.
 * Runs every 5 minutes to compare Redis pending nonces with Graph confirmed nonces.
 * 
 * When Graph has caught up (confirmedNonce >= pendingNonce), the Redis key is deleted.
 */
@Injectable()
export class NonceSyncJob {
  private readonly logger = new Logger(NonceSyncJob.name);
  private isRunning = false;

  constructor(
    private readonly smartNonceService: SmartNonceService,
  ) {}

  /**
   * Run nonce synchronization every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncNonces() {
    if (this.isRunning) {
      this.logger.warn('Nonce sync already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting nonce synchronization...');

      // Get all active polls (we need to query for each poll's pending nonces)
      // For now, we'll scan Redis for all nonce keys
      const pollPattern = 'maci:nonce:*';
      const keys = await this.scanRedisKeys(pollPattern);

      if (keys.length === 0) {
        this.logger.debug('No pending nonces to sync');
        return;
      }

      this.logger.log(`Found ${keys.length} pending nonce entries to check`);

      // Group keys by poll
      const pollUserMap = this.groupKeysByPoll(keys);

      let syncedCount = 0;
      let errorCount = 0;

      for (const [pollId, stateIndices] of Object.entries(pollUserMap)) {
        for (const stateIndex of stateIndices) {
          try {
            // Skip invalid stateIndex values (e.g., macipk.xxx from old buggy data)
            if (!this.isValidStateIndex(stateIndex)) {
              this.logger.warn(
                `Skipping invalid stateIndex "${stateIndex.slice(0, 20)}..." in poll ${pollId} - not a number`
              );
              // Clean up invalid key
              const invalidKey = `maci:nonce:${pollId}:${stateIndex}`;
              await ((this.smartNonceService as any).redis as any).del(invalidKey);
              continue;
            }
            
            const synced = await this.smartNonceService.syncNonceWithGraph(pollId, stateIndex);
            if (synced) {
              syncedCount++;
            }
          } catch (error) {
            errorCount++;
            this.logger.error(
              `Failed to sync nonce for stateIndex ${stateIndex} in poll ${pollId}`,
              error
            );
          }
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Nonce sync completed in ${duration}ms: ` +
        `${syncedCount} synced, ${errorCount} errors, ${keys.length - syncedCount - errorCount} pending`
      );

    } catch (error) {
      this.logger.error('Nonce sync failed', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Scan Redis for keys matching pattern
   */
  private async scanRedisKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      // Use SCAN to avoid blocking Redis
      const redis = (this.smartNonceService as any).redis;
      const [nextCursor, foundKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    return keys;
  }

  /**
   * Group Redis keys by poll ID
   * Key format: maci:nonce:{pollId}:{stateIndex}
   */
  private groupKeysByPoll(keys: string[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const key of keys) {
      const parts = key.split(':');
      if (parts.length >= 4) {
        const pollId = parts[2];
        const stateIndex = parts.slice(3).join(':');

        if (!result[pollId]) {
          result[pollId] = [];
        }
        result[pollId].push(stateIndex);
      }
    }

    return result;
  }

  /**
   * Manually trigger sync (for testing/admin purposes)
   */
  async triggerSync(): Promise<{ synced: number; errors: number; pending: number }> {
    await this.syncNonces();
    
    // Return current stats (simplified)
    return {
      synced: 0,
      errors: 0,
      pending: 0
    };
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
