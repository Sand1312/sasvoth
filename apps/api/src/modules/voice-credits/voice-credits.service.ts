import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { VoiceCredits, VoiceCreditsDocument } from "./schemas/voice-credis.schema";


@Injectable()
export class VoiceCreditsService {
    constructor(@InjectModel(VoiceCredits.name)
    private voiceCreditsModel: Model<VoiceCreditsDocument>) {}

    async buyCredits(userId: string, pollId: string, credits: number): Promise<number> {
        let voiceCredits = await this.voiceCreditsModel.findOne({ userId, pollId }).exec();
        if (!voiceCredits) {
            voiceCredits = new this.voiceCreditsModel({ userId, pollId, credits, isActive: true });
        } else {
            voiceCredits.credits += credits;
        }
        await voiceCredits.save();
        return voiceCredits.credits;
    }
    async sellCredits(userId: string, pollId: string, credits: number): Promise<number> {
        const voiceCredits = await this.voiceCreditsModel.findOne({ userId, pollId }).exec();
        if (!voiceCredits || voiceCredits.credits < credits) {
            throw new Error("Insufficient credits");
        }
        voiceCredits.credits -= credits;
        await voiceCredits.save();
        return voiceCredits.credits;
    }
    
    async getCredits(userId: string, pollId: string): Promise<number> {
        const voiceCredits = await this.voiceCreditsModel.findOne({ userId, pollId }).exec();
        return voiceCredits ? voiceCredits.credits : 0;
    }
    async blockCredits(userId: string, pollId: string): Promise<void> {
        const voiceCredits = await this.voiceCreditsModel.findOne({ userId, pollId }).exec();
        if (voiceCredits) {
            voiceCredits.isActive = false;
            await voiceCredits.save();
        }
}
}