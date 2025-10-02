import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: false, unique: true, sparse: true })
  email: string;

  @Prop({ required: false })
  password: string; // Hashed password

  @Prop({ required: false, unique: true, sparse: true })
  walletAddress?: string; // MetaMask wallet address

  @Prop({ required: false, unique: true, sparse: true })
  githubId?: string; // GitHub OAuth ID

  @Prop({ required: false, unique: true, sparse: true })
  googleId?: string; // Google OAuth ID

  @Prop({ required: true, enum: ["admin", "user"], default: "user" })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
