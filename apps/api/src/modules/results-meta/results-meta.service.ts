import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { VotesService } from "../votes/votes.service";
import { IpfsService } from "../ipfs/ipfs.service";
import { PollsService } from "../polls/polls.service";
import { poll } from "viem/_types/utils/poll";

@Injectable()
export class ResultsMetaService {
    
    constructor(@InjectModel('ResultsMeta') private resultsMetaModel: Model<any>,
    private readonly votesService: VotesService,
    private readonly ipfsService: IpfsService,
    @Inject(forwardRef(() => PollsService))
    private readonly pollsService: PollsService) {}

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

    /**
     * Start async tally process
     * 1. Set poll status to 'counting'
     * 2. Run tally in background
     * 3. Update to 'ended' when complete
     */
    async startTally(pollId: string): Promise<{ status: 'started' | 'already_counting' | 'already_complete'; message: string }> {
        // Check if already counting or has results
        const existingResults = await this.resultsMetaModel.findOne({ pollId }).exec();
        if (existingResults && existingResults.detailResult && existingResults.detailResult.length > 0) {
            return { status: 'already_complete', message: 'Tally already completed for this poll' };
        }

        // Check current poll status
        const poll = await this.pollsService.getPollById(pollId);
        if (!poll) {
            throw new Error('Poll not found');
        }

        if ((poll as any).status === 'counting') {
            return { status: 'already_counting', message: 'Tally already in progress' };
        }

        // Set status to counting
        await this.pollsService.updatePollStatus(pollId, 'counting');

        // Run tally in background (don't await)
        this.runTallyInBackground(pollId).catch(error => {
            console.error(`Background tally failed for poll ${pollId}:`, error);
            // On error, set back to ended without results
            this.pollsService.updatePollStatus(pollId, 'ended').catch(e => 
                console.error(`Failed to reset poll status:`, e)
            );
        });

        return { status: 'started', message: 'Tally process started' };
    }

    /**
     * Run tally in background and update status when complete
     */
    private async runTallyInBackground(pollId: string): Promise<void> {
        try {
            await this.tallyVotes(pollId);
            // Update status to ended after successful tally
            await this.pollsService.updatePollStatus(pollId, 'ended');
        } catch (error) {
            console.error(`Tally failed for poll ${pollId}:`, error);
            // Still update to ended, results will be empty
            await this.pollsService.updatePollStatus(pollId, 'ended');
            throw error;
        }
    }

    /**
     * Get tally status for a poll
     */
    async getTallyStatus(pollId: string): Promise<{
        status: 'not_started' | 'counting' | 'completed' | 'error';
        results?: any;
        error?: string;
    }> {
        const poll = await this.pollsService.getPollById(pollId);
        if (!poll) {
            return { status: 'error', error: 'Poll not found' };
        }

        const results = await this.resultsMetaModel.findOne({ pollId }).exec();
        
        if ((poll as any).status === 'counting') {
            return { status: 'counting' };
        }

        if (results && results.detailResult && results.detailResult.length > 0) {
            return { status: 'completed', results };
        }

        return { status: 'not_started' };
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