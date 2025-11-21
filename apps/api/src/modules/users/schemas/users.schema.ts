import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsersDocument = HydratedDocument<Users>;

@Schema()
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

  @Prop({ default: 0 })
  balance: number;

  @Prop({})
  historyDeposit: Array<{
    amount: number;
    timestamp: Date;
    txHash: string;
  }>;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
