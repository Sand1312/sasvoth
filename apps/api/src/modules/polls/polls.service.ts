import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Polls, PollsDocument } from './schemas/polls';

@Injectable()
export class PollsService {
    constructor(@InjectModel(Polls.name) private pollsModel: Model<PollsDocument>) {}

    async getPollById(pollId: string): Promise<PollsDocument | null> {
        return this.pollsModel.findById(pollId).exec();
    }
    async createPoll(pollData: Partial<Polls>): Promise<PollsDocument> {
        const newPoll = new this.pollsModel(pollData);
        return newPoll.save();
    }
    async getPollByStatus(status: string): Promise<PollsDocument[]> {
        return this.pollsModel.find({ status }).exec();
    }
    async updatePollStatus(pollId: string, status: string): Promise<PollsDocument | null> {
        return this.pollsModel.findByIdAndUpdate(pollId, { status }, { new: true }).exec();
    }   
    async addIdeaToPoll(pollId: string, ideaId: string): Promise<PollsDocument | null> {
        let poll = await this.pollsModel.findById(pollId).exec();
        if (!poll) {
            throw new BadRequestException('Poll not found');
        }
        poll.ideas.push(ideaId);
        return poll.save();
    }

    async approveIdeaInPoll(pollId: string, ideaId: string): Promise<PollsDocument | null> {
        let poll = await this.pollsModel.findById(pollId).exec();
        if (!poll) {
            throw new BadRequestException('Poll not found');
        }
        poll.ideas = poll.ideas.filter(id => id !== ideaId);
        poll.options.push(ideaId);
        return poll.save();
    }
    async savePollOnChainId(pollId: string, pollIdOnChain: number): Promise<PollsDocument | null> {
        return this.pollsModel.findByIdAndUpdate(pollId, { pollIdOnChain }, { new: true }).exec();
    }

    // async getOptionsByPollId(pollId: string): Promise<any[]|any> {
    //     const poll = await this.pollsModel.findById(pollId).exec();
    //     if (!poll) {
    //         throw new BadRequestException('Poll not found');
    //     }

}