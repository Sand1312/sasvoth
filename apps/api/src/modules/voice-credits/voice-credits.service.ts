import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { VoiceCredits, VoiceCreditsDocument } from "./schemas/voice-credis.schema";


@Injectable()
export class VoiceCreditsService {
    constructor(@InjectModel(VoiceCredits.name)
    private voiceCreditsModel: Model<VoiceCreditsDocument>) {}

    
}