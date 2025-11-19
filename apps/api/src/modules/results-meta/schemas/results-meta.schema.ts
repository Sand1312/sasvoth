import {Prop,Schema,SchemaFactory} from "@nestjs/mongoose";
import {HydratedDocument} from "mongoose";
export type ResultsMetaDocument= HydratedDocument<ResultsMeta>;

@Schema()
export class ResultsMeta{
    @Prop({type:String,required:true})
    pollId:string;
    
    @Prop({type:String,required:true})
    result_cid:string;

    @Prop({type:String,required:true})
    outCome:string;

    @Prop({ required: false, default: Date.now })
    createdAt: Date;
}

export const ResultsMetaSchema= SchemaFactory.createForClass(ResultsMeta);