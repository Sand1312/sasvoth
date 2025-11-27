import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JoinPoll, JoinPollDocument } from "./schemas/join-poll.schema";
import { VoiceCreditsService } from "../voice-credits/voice-credits.service";

@Injectable()
export class JoinPollService {
    constructor(@InjectModel(JoinPoll.name) private joinPollModel: Model<JoinPollDocument>,
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
    async get(voterId: string, pollId: string): Promise<JoinPollDocument | null> {
        return this.joinPollModel.findOne({ voterId, pollId }).exec();
    };

    async create(voteData: any): Promise<void> {
        try {
        const existingVote = await this.joinPollModel.findOne({ voterId: voteData.voterId, pollId: voteData.pollId }).exec();

        if (existingVote) {
            throw new Error("User has already voted in this poll");
        }
        const timestamp = new Date();
        // const voteCommitment = 
        const newVote = new this.joinPollModel({
            ...voteData,
            timestamp: timestamp
        });

        // Deduct voice credits after casting the vote
        // await this.voiceCreditsService.deductCredits(voteData.userId, voteData.pollId, voteData.weight);
         await newVote.save();
    } catch (error) {
        console.log('Error creating vote:', error);
        throw new Error(`Error creating vote: ${error.message}`);
    }
}
}
