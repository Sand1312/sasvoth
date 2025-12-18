import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MaciDeployment, MaciDeploymentDocument } from './schemas/maci-deployment.schema';

/**
 * MaciDeploymentsService
 * 
 * Manages MACI contract deployment records.
 * Used to store and retrieve subgraph URLs per MACI contract.
 */
@Injectable()
export class MaciDeploymentsService {
  private readonly logger = new Logger(MaciDeploymentsService.name);

  constructor(
    @InjectModel(MaciDeployment.name) private maciDeploymentModel: Model<MaciDeploymentDocument>,
  ) {}

  /**
   * Create or update a MACI deployment record
   */
  async upsert(data: {
    maciAddress: string;
    subgraphUrl?: string;
    startBlock?: number;
    chain: string;
    deploymentId?: string;
    txHash?: string;
    config?: Record<string, any>;
  }): Promise<MaciDeploymentDocument> {
    const normalized = data.maciAddress.toLowerCase();
    
    const existing = await this.maciDeploymentModel.findOne({ 
      maciAddress: normalized 
    });

    if (existing) {
      // Update existing record
      if (data.subgraphUrl) existing.subgraphUrl = data.subgraphUrl;
      if (data.startBlock) existing.startBlock = data.startBlock;
      if (data.deploymentId) existing.deploymentId = data.deploymentId;
      if (data.txHash) existing.txHash = data.txHash;
      if (data.config) existing.config = data.config;
      
      await existing.save();
      this.logger.log(`Updated MACI deployment: ${normalized}`);
      return existing;
    }

    // Create new record
    const deployment = new this.maciDeploymentModel({
      ...data,
      maciAddress: normalized,
    });
    
    await deployment.save();
    this.logger.log(`Created MACI deployment: ${normalized}`);
    return deployment;
  }

  /**
   * Get deployment by MACI address
   */
  async getByAddress(maciAddress: string): Promise<MaciDeploymentDocument | null> {
    return this.maciDeploymentModel.findOne({ 
      maciAddress: maciAddress.toLowerCase() 
    });
  }

  /**
   * Get subgraph URL for a MACI address
   */
  async getSubgraphUrl(maciAddress: string): Promise<string | null> {
    const deployment = await this.getByAddress(maciAddress);
    return deployment?.subgraphUrl || null;
  }

  /**
   * Update subgraph URL for a MACI deployment
   */
  async updateSubgraphUrl(maciAddress: string, subgraphUrl: string): Promise<void> {
    await this.maciDeploymentModel.updateOne(
      { maciAddress: maciAddress.toLowerCase() },
      { $set: { subgraphUrl } }
    );
    this.logger.log(`Updated subgraph URL for ${maciAddress}: ${subgraphUrl}`);
  }

  /**
   * Get all deployments
   */
  async getAll(): Promise<MaciDeploymentDocument[]> {
    return this.maciDeploymentModel.find().sort({ createdAt: -1 });
  }

  /**
   * Get the latest deployment (most recently created)
   */
  async getLatest(): Promise<MaciDeploymentDocument | null> {
    return this.maciDeploymentModel.findOne().sort({ createdAt: -1 });
  }
}
