import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class ResultsMetaService {
    constructor(@InjectModel('ResultsMeta') private resultsMetaModel: Model<any>) {}

    async saveResultsMeta(votingEventsId: string, result_cid: string, outCome: string): Promise<any> {
        const resultsMeta = new this.resultsMetaModel({ votingEventsId, result_cid, outCome });
        return resultsMeta.save();
    }
    async getOutComeByVotingEventId(votingEventsId: string): Promise<any> {
        const resultsMeta = await this.resultsMetaModel.findOne({ votingEventsId }).exec();
        if (!resultsMeta) {
            throw new Error("ResultsMeta not found");
        }
        return resultsMeta.outCome;
    } 

    async getAllResultsMeta(): Promise<any[]> {
        let results = await this.resultsMetaModel.find().exec();
        results.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return results;
    }
}