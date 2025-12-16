import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JoinPoll, JoinPollDocument } from './schemas/join-poll.schema';
import { VoiceCreditsService } from '../voice-credits/voice-credits.service';
import { MaciService } from '../maci/maci.service';

@Injectable()
export class JoinPollService {
  constructor(
    @InjectModel(JoinPoll.name) private joinPollModel: Model<JoinPollDocument>,
    private readonly voiceCreditsService: VoiceCreditsService,
    private readonly maciService: MaciService,
  ) {}

  // ...

  async get(voterId: string, pollId: string): Promise<JoinPollDocument | null> {
    return this.joinPollModel.findOne({ voterId, pollId }).exec();
  }

  async create(voteData: any): Promise<void> {
    try {
      const existingVote = await this.joinPollModel
        .findOne({ voterId: voteData.voterId, pollId: voteData.pollId })
        .exec();

      // Note: We might want allow re-joining if it's just a sync?
      // But for DB consistency, let's keep the check but maybe just log warning for Coordinator
      if (existingVote) {
        console.warn(
          'User has already joined/voted in DB. Proceeding with Coordinator check if needed.',
        );
        // throw new Error("User has already voted in this poll");
        // Allow proceed to ensure Coordinator gets the signup if missing?
      }

      // Coordinator Integration removed (Signup handled client-side)
      /*
      if (voteData.pubKey) {
          // ... legacy logic removed
      }
      */

      if (existingVote) return; // Don't save duplicate to DB

      const timestamp = new Date();
      // const voteCommitment =
      const newVote = new this.joinPollModel({
        ...voteData,
        timestamp: timestamp,
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
