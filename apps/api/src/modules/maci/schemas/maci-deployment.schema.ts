import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type MaciDeploymentDocument = HydratedDocument<MaciDeployment>;

/**
 * MaciDeployment Schema
 * 
 * Stores information about MACI contract deployments.
 * Each MACI contract has one associated subgraph.
 * Multiple polls can be created under one MACI contract.
 */
@Schema({ timestamps: true })
export class MaciDeployment {
    @Prop({ required: true, unique: true, index: true })
    maciAddress: string;

    @Prop({ required: true })
    name: string;  // Deployment name (e.g., "CSES") - used in EIP-712 domain

    @Prop({ required: false })
    logo: string;  // Logo URL for subscriptions card

    @Prop({ required: false })
    subgraphUrl: string;

    @Prop({ required: false })
    startBlock: number;

    @Prop({ required: true })
    chain: string;

    @Prop({ required: false })
    deploymentId: string;

    @Prop({ required: false })
    txHash: string;

    @Prop({ type: Object, required: false })
    config: Record<string, any>;

    // === Cached Stats (updated by DeploymentStatsSyncJob) ===
    @Prop({ required: false, default: 0 })
    members: number;  // numSignUps from MACI contract

    @Prop({ required: false, default: 0 })
    pollCount: number;  // nextPollId from MACI contract

    @Prop({ required: false, default: true })
    isValid: boolean;  // false if contract doesn't exist or has wrong ABI
}

export const MaciDeploymentSchema = SchemaFactory.createForClass(MaciDeployment);
