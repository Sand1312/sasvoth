import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MaciDeploymentsService } from './maci-deployments.service';

/**
 * Deployment Stats Synchronization Job
 *
 * Syncs members (numSignUps) and pollCount from RPC (on-chain = source of truth).
 * Graph is used as optimization when available.
 * Runs every 5 minutes + on startup.
 */
@Injectable()
export class DeploymentStatsSyncJob implements OnModuleInit {
  private readonly logger = new Logger(DeploymentStatsSyncJob.name);
  private isRunning = false;

  constructor(
    private readonly maciDeploymentsService: MaciDeploymentsService,
  ) {}

  /**
   * Trigger sync on module init (first startup)
   */
  async onModuleInit() {
    this.logger.log('Triggering initial stats sync on startup...');
    // Delay slightly to let other services initialize
    setTimeout(() => this.syncStats(), 5000);
  }

  /**
   * Run stats synchronization every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncStats() {
    if (this.isRunning) {
      this.logger.warn('Stats sync already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting deployment stats sync...');

      const deployments = await this.maciDeploymentsService.getAll();

      if (deployments.length === 0) {
        this.logger.debug('No deployments to sync');
        return;
      }

      this.logger.log(`Syncing stats for ${deployments.length} deployments`);

      // Import ethers once
      const { providers, Contract } = await import('ethers');

      // Chain to RPC URL mapping
      const chainRpcUrls: Record<string, string> = {
        arbitrum_sepolia:
          'https://arbitrum-sepolia.core.chainstack.com/42c1adce4c0b05f5fe6de1377bc9e4a5',
        'arbitrum-sepolia':
          'https://arbitrum-sepolia.core.chainstack.com/42c1adce4c0b05f5fe6de1377bc9e4a5',
        sepolia: 'https://rpc.sepolia.org',
        mainnet: 'https://eth.llamarpc.com',
        arbitrum: 'https://arb1.arbitrum.io/rpc',
      };

      let updatedCount = 0;
      let errorCount = 0;

      for (const deployment of deployments) {
        try {
          let members = 0;
          let pollCount = 0;

          // Get RPC URL for this deployment's chain
          const rpcUrl =
            chainRpcUrls[deployment.chain?.toLowerCase()] ||
            process.env.RPC_URL ||
            'https://arbitrum-sepolia.core.chainstack.com/42c1adce4c0b05f5fe6de1377bc9e4a5';

          this.logger.debug(
            `Syncing ${deployment.name} (chain: ${deployment.chain}, RPC: ${rpcUrl.slice(0, 30)}...)`,
          );

          const provider = new providers.JsonRpcProvider(rpcUrl);

          // Check if contract exists at address
          const code = await provider.getCode(deployment.maciAddress);
          if (code === '0x' || code === '0x0') {
            this.logger.warn(
              `⚠️ Contract not found at ${deployment.maciAddress} on ${deployment.chain} - marking invalid`,
            );
            await this.maciDeploymentsService.markInvalid(
              deployment.maciAddress,
            );
            continue;
          }

          // PRIMARY: Query RPC (on-chain is source of truth)
          try {
            const maciContract = new Contract(
              deployment.maciAddress,
              [
                'function numSignUps() view returns (uint256)',
                'function nextPollId() view returns (uint256)',
              ],
              provider,
            );

            const [numSignUps, nextPollId] = await Promise.all([
              maciContract.numSignUps(),
              maciContract.nextPollId(),
            ]);

            members = Number(numSignUps);
            pollCount = Number(nextPollId);

            this.logger.debug(
              `RPC result: members=${members}, polls=${pollCount}`,
            );
          } catch (rpcError: any) {
            this.logger.warn(
              `RPC query failed for ${deployment.maciAddress}: ${rpcError.message}`,
            );

            // FALLBACK: Try Graph if RPC failed
            if (deployment.subgraphUrl) {
              try {
                const response = await fetch(deployment.subgraphUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    query: `{ maci(id: "${deployment.maciAddress.toLowerCase()}") { numSignUps } }`,
                  }),
                });
                const data = await response.json();
                if (data?.data?.maci?.numSignUps) {
                  members = parseInt(data.data.maci.numSignUps, 10);
                  this.logger.debug(`Graph fallback: members=${members}`);
                }
              } catch (graphError) {
                this.logger.warn(
                  `Graph also failed for ${deployment.maciAddress}`,
                );
              }
            }

            // If both RPC and Graph failed (no data), mark as invalid
            if (members === 0 && pollCount === 0) {
              this.logger.warn(
                `❌ Both RPC and Graph failed for ${deployment.maciAddress} - marking invalid`,
              );
              await this.maciDeploymentsService.markInvalid(
                deployment.maciAddress,
              );
              continue;
            }
          }

          // Update deployment if stats changed
          if (
            members !== deployment.members ||
            pollCount !== deployment.pollCount
          ) {
            await this.maciDeploymentsService.updateStats(
              deployment.maciAddress,
              members,
              pollCount,
            );
            updatedCount++;
            this.logger.log(
              `✅ Updated ${deployment.name}: members=${members}, polls=${pollCount}`,
            );
          } else {
            this.logger.debug(`No change for ${deployment.name}`);
          }
        } catch (error: any) {
          errorCount++;
          this.logger.error(
            `Failed to sync ${deployment.maciAddress}: ${error.message}`,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Stats sync completed in ${duration}ms: ` +
          `${updatedCount} updated, ${errorCount} errors`,
      );
    } catch (error: any) {
      this.logger.error(`Stats sync failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger sync (for testing/admin purposes)
   */
  async triggerSync(): Promise<void> {
    await this.syncStats();
  }
}
