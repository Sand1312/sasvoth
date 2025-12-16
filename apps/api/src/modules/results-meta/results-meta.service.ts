import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { VotesService } from "../votes/votes.service";
import { IpfsService } from "../ipfs/ipfs.service";
import { poll } from "viem/_types/utils/poll";

@Injectable()
export class ResultsMetaService {
    
    constructor(@InjectModel('ResultsMeta') private resultsMetaModel: Model<any>,
    private readonly votesService: VotesService,
    private readonly ipfsService: IpfsService) {}

    async saveResultsMeta(pollId: string, result_cid: string, outCome: string): Promise<any> {
        const resultsMeta = new this.resultsMetaModel({ pollId, result_cid, outCome });
        return resultsMeta.save();
    }
    async getOutComeByVotingEventId(pollId: string): Promise<any> {
        const resultsMeta = await this.resultsMetaModel.findOne({ pollId }).exec();
        // Return null if not found instead of throwing, or let controller handle error/null check
        if (!resultsMeta) {
            // throw new Error("ResultsMeta not found");
             return null;
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

    // ... (existing methods)

    async saveMaciResults(pollId: string, tally: string[]): Promise<any> {
        // Convert string tally to numbers
        const detailResult = tally.map(val => Number(val));
        
        // Calculate outcome (index with most votes)
        let outCome = 0;
        const totalVotes = detailResult.reduce((a, b) => a + (b || 0), 0);

        for (let i = 0; i < detailResult.length; i++) {
            if ((detailResult[i] || 0) > (detailResult[outCome] || 0)) {
                outCome = i;
            }
        }

        const createdAt = new Date();
        
        // Prepare data for IPFS
        const ipfsData = {
            pollId,
            tally: detailResult,
            totalVotes,
            outcomeIndex: outCome,
            timestamp: createdAt.toISOString(),
            source: 'MACI_COORDINATOR'
        };

        // Upload to IPFS
        let resultCid = '';
        try {
            const buffer = Buffer.from(JSON.stringify(ipfsData, null, 2));
            const cid = await this.ipfsService.addFile(buffer);
            if (cid) {
                resultCid = cid;
            }
        } catch (e) {
            console.error('Failed to upload results to IPFS', e);
        }

        // Upsert or create new result
        return await this.resultsMetaModel.findOneAndUpdate(
            { pollId },
            { 
                pollId,
                outCome, 
                detailResult, 
                result_cid: resultCid,
                createdAt 
            },
            { upsert: true, new: true }
        );
    }
}