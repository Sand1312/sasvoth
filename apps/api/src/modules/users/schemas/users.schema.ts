import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsersDocument = HydratedDocument<Users>;

@Schema({ timestamps: true })
export class Users {
  @Prop({ required: false, unique: true, sparse: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ required: false, unique: true, sparse: true })
  walletAddress?: string;

  @Prop({ required: false, unique: true, sparse: true })
  githubId?: string;

  @Prop({ required: false, unique: true, sparse: true })
  googleId?: string;

  @Prop({ required: true, enum: ['admin', 'user'], default: 'user' })
  role: string;

  @Prop({
    type: String,
    required: true,
    enum: ['google', 'github', 'email', 'wallet', 'all'],
    default: 'email',
  })
  authType: string;

  @Prop({ required: false })
  publicKey?: string;

  @Prop({ required: false })
  publicKeyX?: string;

  @Prop({ required: false })
  publicKeyY?: string;

  @Prop({ required: false })
  stateIndex?: number;

  /**
   * Track all MACI signups for this user (supports multiple MACI deployments)
   *
   * ACID Note: On-chain signup has no transaction rollback.
   * Order of operations:
   * 1. On-chain signup succeeds → get stateIndex
   * 2. Save to database (best-effort, log error if fails)
   * 3. Stats sync job reconciles any inconsistencies periodically
   */
  @Prop({ type: Array, default: [] })
  maciSignups: Array<{
    maciAddress: string; // MACI contract address
    stateIndex: number; // User's state index in this MACI
    publicKey: string; // MACI public key used (macipk.xxx)
    txHash?: string; // Transaction hash
    signedUpAt: Date; // Timestamp
  }>;

  @Prop({ default: 0 })
  balance: number;

  @Prop({})
  historyDeposit: Array<{
    amount: number;
    timestamp: Date;
    txHash: string;
  }>;

  @Prop({ required: false })
  avatar?: string;

  @Prop({ required: false, type: Date })
  dateOfBirth?: Date;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
