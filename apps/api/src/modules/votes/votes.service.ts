import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Votes, VotesDocument } from "./schemas/votes.schema";
import { VoteDtoReq } from "@/dto/vote.dto";
import { VoiceCreditsService } from "../voice-credits/voice-credits.service";

@Injectable()
export class VotesService {
    constructor(@InjectModel(Votes.name) private votesModel: Model<VotesDocument>,
    private readonly voiceCreditsService: VoiceCreditsService
) {}
    
    // private mapToVote(voteDto: any): any {
    //     return {
    //         userId: voteDto.userId,
    //         pollId: voteDto.pollId,
    //         selectedOption: voteDto.selectedOption,
    //         weight: voteDto.weight,
    //         voteCommitment: voteDto.voteCommitment,
    //         timestamp: voteDto.timestamp,
    //     };
    // }
    async get(voterId: string, pollId: string): Promise<VotesDocument | null> {
        return this.votesModel.findOne({ voterId, pollId }).exec();
    };

    async create(voteData: any): Promise<void> {
        try {
            console.log('Creating vote with data:', voteData);
        const existingVote = await this.votesModel.findOne({ voterId: voteData.voterId, pollId: voteData.pollId }).exec();
        console.log('Existing vote check result:', existingVote);
        if (existingVote) {
            throw new Error("User has already voted in this poll");
        }
        const timestamp = new Date();
        // const voteCommitment = 
        const newVote = new this.votesModel({
            ...voteData,
            timestamp: timestamp
        });
        await newVote.save();
        // Deduct voice credits after casting the vote
        await this.voiceCreditsService.deductCredits(voteData.userId, voteData.pollId, voteData.weight);
    } catch (error) {
        console.log('Error creating vote:', error);
        throw new Error(`Error creating vote: ${error.message}`);
    }
}
}
