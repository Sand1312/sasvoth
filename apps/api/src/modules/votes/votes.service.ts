import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Votes, VotesDocument } from "./schemas/votes.schema";
import { VoteDtoReq } from "@/dto/vote.dto";
import { VoiceCreditsService } from "../voice-credits/voice-credits.service";
import { MaciService } from "../maci/maci.service";

@Injectable()
export class VotesService {
    constructor(@InjectModel(Votes.name) private votesModel: Model<VotesDocument>,
    private readonly voiceCreditsService: VoiceCreditsService,
    private readonly maciService: MaciService,
) {}
    
    async get(pollId: string): Promise<VotesDocument[] | null> {
        return this.votesModel.find({ pollId }).exec();
    };


    async create(voteData: any): Promise<void> {
        try {
        const timestamp = new Date();
        const newVote = new this.votesModel({
            ...voteData,
            timestamp: timestamp
        });
        
        // Coordinator Integration:
        // If message and encPubKey are present, send to Coordinator
        if (voteData.message && voteData.encPubKey) {
            console.log("Found MACI vote data, sending to Coordinator...");
            try {
                // Determine MACI address if not in payload (can be fetched or config)
                // For now pass undefined to use default from MaciService config
                const maciAddress = voteData.maciContractAddress; 
                await this.maciService.publishMessage(voteData.pollId, voteData.message, voteData.encPubKey, maciAddress);
                console.log("Coordinator publishMessage success");
            } catch (e) {
                console.error("Coordinator publishMessage failed", e);
                // Should we fail the whole vote? Maybe not, just log it if hybrid
                // But user wants Coordinator. So maybe throw?
                // Let's throw to be safe so user knows
                throw new Error(`Coordinator failed: ${e.message}`);
            }
        }

        // Deduct voice credits after casting the vote
        // await this.voiceCreditsService.deductCredits(voteData.userId, voteData.pollId, voteData.weight);
         await newVote.save();
    } catch (error) {
        console.log('Error creating vote:', error);
        throw new Error(`Error creating vote: ${error.message}`);
    }
}
}
