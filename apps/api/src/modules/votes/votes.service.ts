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
    async get(userId: string, pollId: string): Promise<VotesDocument | null> {
        return this.votesModel.findOne({ userId, pollId }).exec();
    };

    async create(voteData: VoteDtoReq): Promise<void> {
        try {
        const existingVote = await this.votesModel.findOne({ userId: voteData.userId, pollId: voteData.pollId }).exec();
        if (existingVote) {
            throw new Error("User has already voted in this poll");
        }
        const newVote = new this.votesModel(voteData);
        await newVote.save();
        // Deduct voice credits after casting the vote
        await this.voiceCreditsService.deductCredits(voteData.userId, voteData.pollId, voteData.weight);
    } catch (error) {
        throw new Error(`Error creating vote: ${error.message}`);
    }
}
}