import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: false, unique: true, sparse: true })
  email: string;

  @Prop({ required: false })
  password: string; // Hashed password

  @Prop({ required: true })
  walletAddress?: string; // MetaMask wallet address

  @P
  @Prop({ required: true, enum: ["admin", "user"], default: "user" })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
