import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
export type RewardsDocument = HydratedDocument<Rewards>;

@Schema()
export class Rewards {
    @Prop({ type: String, required: true })
    userId: string;
    
    @Prop({ type: String, required: true })
    voting_events_id : number;

    @Prop({ type: Number, required: true })
    credit_count: number;
    
    @Prop({ type: Number, required: true })
    amountToken: number;

    @Prop({type:String, required:true, enum:["pending","claimed","failed"], default:"pending"})
    status: string;

    @Prop({type:String, required:false})
    _idClaim:string;

  @Prop({ 
        required: false, 
        type: {
            r: { type: String, required: true },   // Lưu hex string
            s: { type: String, required: true },   // Lưu hex string  
            v: { type: Number, required: true }    // 27, 28, etc.
        } 
    })
    signature: {
        r: string;
        s: string;
        v: number;
    };
}

export const RewardsSchema = SchemaFactory.createForClass(Rewards);