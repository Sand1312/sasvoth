import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UsersDocument = HydratedDocument<Users>;

@Schema()
export class Users {
  @Prop({ required: false, unique: true, sparse: true })
  email: string;

  @Prop({ required: false })
  password: string; // Hashed password

  @Prop({type:String,required:true,})
  name:string;
  
  @Prop({ required: false, unique: true, sparse: true })
  walletAddress?: string; // MetaMask wallet address

  @Prop({ required: false, unique: true, sparse: true })
  githubId?: string; // GitHub OAuth ID

  @Prop({ required: false, unique: true, sparse: true })
  googleId?: string; // Google OAuth ID

  @Prop({ required: true, enum: ["admin", "user"], default: "user" })
  role: string;

  @Prop({ type:String, required: true, enum:["google","github","email","wallet","all"], default:"email"})
  authType: string;

  @Prop({default:0})
  balance:number;

  @Prop({required:false , unique:true})
  publicKey:String;

  @Prop({required:false , unique:true})
  publicKeyX:String;

   @Prop({required:false , unique:true})
  publicKeyY:String;

  @Prop({required:false, unique:true})
  stateIndex:number;

}

export const UsersSchema = SchemaFactory.createForClass(Users);
