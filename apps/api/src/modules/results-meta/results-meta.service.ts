import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { VotesService } from "../votes/votes.service";
import { poll } from "viem/_types/utils/poll";

@Injectable()
export class ResultsMetaService {
    
    constructor(@InjectModel('ResultsMeta') private resultsMetaModel: Model<any>,
    private readonly votesService: VotesService) {}

    async saveResultsMeta(pollId: string, result_cid: string, outCome: string): Promise<any> {
        const resultsMeta = new this.resultsMetaModel({ pollId, result_cid, outCome });
        return resultsMeta.save();
    }
    async getOutComeByVotingEventId(pollId: string): Promise<any> {
        const resultsMeta = await this.resultsMetaModel.findOne({ pollId }).exec();
        if (!resultsMeta) {
            throw new Error("ResultsMeta not found");
        }
        return resultsMeta;
    } 

    async getAllResultsMeta(): Promise<any[]> {
        let results = await this.resultsMetaModel.find().exec();
        results.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return results;
    }
    async tallyVotes(pollId: string): Promise<any> {
        const votes = await this.votesService.get(pollId);
        if(!votes || votes.length ===0){
            throw new Error("No votes found for this poll");
        }
        let detailResult: number[] = [];
        for(let vote of votes){
            detailResult[vote.selectedOption] = (detailResult[vote.selectedOption] || 0) + (vote.voiceCredits||0);
        }
        let outCome:number=0;
        for (let i=0; i< detailResult.length; i++){
            if((detailResult[i] || 0) > (detailResult[outCome] || 0)){
                outCome = i;
            }
        }
        const createdAt = new Date();
        const results = new this.resultsMetaModel({ pollId:pollId,outCome: outCome,createdAt: createdAt ,detailResult: detailResult,  });
        await results.save();
        return results;
    }
}