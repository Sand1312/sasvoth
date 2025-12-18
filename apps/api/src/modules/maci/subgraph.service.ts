import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Subgraph deployment configuration
 */
export interface SubgraphDeployConfig {
  maciContractAddress: string;
  maciContractStartBlock: number;
  network: string;
  subgraphName?: string;
  deployKey?: string;
}

/**
 * SubgraphService
 * 
 * Handles subgraph deployment for MACI contracts via Coordinator service.
 * Proxies deployment requests to Coordinator's /v1/subgraph/deploy endpoint.
 */
@Injectable()
export class SubgraphService {
  private readonly logger = new Logger(SubgraphService.name);
  private currentSubgraphUrl: string | null = null;
  private readonly coordinatorUrl: string;
  private readonly privateKey: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.coordinatorUrl = this.configService.get<string>('MACI_COORDINATOR_URL') || 'http://localhost:3000';
    this.privateKey = this.configService.get<string>('WALLET_PRIVATE_KEY') || 
      this.configService.get<string>('ETH_PRIVATE_KEY') || '';
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
   * Deploy a new subgraph for a MACI contract via Coordinator
   */
  async deploy(config: SubgraphDeployConfig): Promise<{ subgraphUrl: string; deploymentId: string }> {
    this.logger.log(`Deploying subgraph for MACI: ${config.maciContractAddress} via Coordinator`);

    try {
      const authToken = await this.generateAuthToken();

      // Map network name to coordinator format if needed
      const chain = this.mapNetworkToChain(config.network);

      // Generate unique version tag in semver format to avoid "Version label already exists" error
      // Coordinator requires format matching /^v\d+\.\d+\.\d+$/
      const patchVersion = Date.now() % 100000; // Use last 5 digits of timestamp
      const versionTag = `v1.0.${patchVersion}`;
      this.logger.log(`Deploying subgraph with version tag: ${versionTag}`);
      
      const response = await fetch(`${this.coordinatorUrl}/v1/subgraph/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify({
          network: chain,
          maciContractAddress: config.maciContractAddress,
          startBlock: config.maciContractStartBlock,
          name: config.subgraphName || 'maci-subgraph',
          tag: versionTag,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Coordinator subgraph deploy failed [${response.status}]: ${errorText}`);
        throw new Error(`Subgraph deployment failed: ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`Coordinator subgraph response: ${JSON.stringify(result)}`);

      const subgraphUrl = result.subgraphUrl || result.url || '';
      const deploymentId = result.deploymentId || result.id || 'unknown';

      if (subgraphUrl) {
        this.currentSubgraphUrl = subgraphUrl;
        this.logger.log(`Subgraph deployed: ${subgraphUrl}`);
      }

      return { subgraphUrl, deploymentId };

    } catch (error) {
      this.logger.error('Subgraph deployment failed', error);
      throw error;
    }
  }

  /**
   * Map network names to coordinator chain format
   */
  private mapNetworkToChain(network: string): string {
    const mapping: Record<string, string> = {
      'arbitrum-sepolia': 'arbitrum_sepolia',
      'arbitrum_sepolia': 'arbitrum_sepolia',
      'sepolia': 'sepolia',
      'mainnet': 'mainnet',
    };
    return mapping[network.toLowerCase()] || network;
  }



  /**
   * Get the current subgraph URL
   */
  getSubgraphUrl(): string | null {
    return this.currentSubgraphUrl || 
      this.configService.get<string>('SUBGRAPH_URL') || 
      null;
  }

  /**
   * Update subgraph URL dynamically (called after deployment)
   */
  setSubgraphUrl(url: string): void {
    this.currentSubgraphUrl = url;
    this.logger.log(`Subgraph URL updated to: ${url}`);
  }

  /**
   * Check if a subgraph is deployed and accessible
   */
  async healthCheck(): Promise<{ healthy: boolean; url: string | null; error?: string }> {
    const url = this.getSubgraphUrl();
    
    if (!url) {
      return { healthy: false, url: null, error: 'No subgraph URL configured' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '{ _meta { block { number } } }'
        }),
      });

      if (!response.ok) {
        return { healthy: false, url, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      if (data.errors) {
        return { healthy: false, url, error: JSON.stringify(data.errors) };
      }

      return { healthy: true, url };
    } catch (error) {
      return { healthy: false, url, error: error.message };
    }
  }
}
