import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {Rewards, RewardsDocument} from './schemas/rewards.schema';
import { generateSignatureForClaim , generateIdClaim , generateSignature } from "../../utils/signature";
import { id } from 'ethers/lib/utils';

@Injectable()
export class RewardsService {
    constructor(@InjectModel(Rewards.name) private rewardsModel: Model<RewardsDocument>) {}

    async saveReward(userId: string, pollId: string,credit_count :number): Promise<void> {
        try{
        const reward = await this.rewardsModel.findOne({ userId: userId, voting_events_id: pollId });
        if(reward){
            throw new Error('Reward already exists for this user and voting event');
        } else  {
            const amountToken = credit_count * 15; 
            const idClaim = generateIdClaim();
            const signature = await generateSignatureForClaim(userId, amountToken, idClaim);
            const newReward = new this.rewardsModel({
                userId: userId,
                pollId: pollId,
                credit_count: credit_count,
                amountToken: amountToken,
                status: "pending",
                _idClaim: idClaim,
                signature: signature
            });
            await newReward.save();

        }
    }catch (error) {
        throw new Error('Error saving reward: ' + error.message);
    }
    }
    async getReward(userId: string, pollId: string): Promise<RewardsDocument | null> {
        return this.rewardsModel.findOne({ userId: userId, pollId: pollId }).exec();
    }

    async test(): Promise<any>{
        const signature = await generateSignature();
        return signature;
    }

}