import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {Rewards, RewardsDocument} from './schemas/rewards.schema';

@Injectable()
export class RewardsService {
    constructor(@InjectModel(Rewards.name) private rewardsModel: Model<RewardsDocument>) {}

    async saveReward(userId: string, pollId: string, rewardData: Partial<Rewards>): Promise<void> {
        let reward = await this.rewardsModel.findOne({ userId, pollId }).exec();
}