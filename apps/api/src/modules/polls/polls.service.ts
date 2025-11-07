import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Polls, PollsDocument } from './schemas/polls.schema';

@Injectable()
export class PollsService {
    constructor(@InjectModel(Polls.name) private pollsModel: Model<PollsDocument>) {}

    async createPoll(pollData: Partial<Polls>): Promise<PollsDocument> {
        const newPoll = new this.pollsModel(pollData);
        return newPoll.save();
    }
    async getPollByType(status: string): Promise<PollsDocument[]> {
        return this.pollsModel.find({ status }).exec();
    }
}