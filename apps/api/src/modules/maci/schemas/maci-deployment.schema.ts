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
}

export const MaciDeploymentSchema = SchemaFactory.createForClass(MaciDeployment);
