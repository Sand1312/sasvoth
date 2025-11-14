import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VotingEvents, VotingEventsDocument } from './schemas/voting-events.schema';

@Injectable()
export class VotingEventsService {
    constructor(@InjectModel(VotingEvents.name) private votingEventsModel: Model<VotingEventsDocument>) {}

    async getPollById(pollId: string): Promise<VotingEventsDocument | null> {
        return this.votingEventsModel.findById(pollId).exec();
    }
    async createPoll(pollData: Partial<VotingEvents>): Promise<VotingEventsDocument> {
        const newPoll = new this.votingEventsModel(pollData);
        return newPoll.save();
    }
    async getPollByStatus(status: string): Promise<VotingEventsDocument[]> {
        return this.votingEventsModel.find({ status }).exec();
    }
}