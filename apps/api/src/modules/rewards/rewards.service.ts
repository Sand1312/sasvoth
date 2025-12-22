import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';
import {Rewards, RewardsDocument} from './schemas/rewards.schema';
import { generateSignatureForClaim , generateIdClaim  } from "../../utils/signature";
// import { id } from 'ethers/lib/utils';
import * as path from 'path';

// don't import default; dynamically import the workspace package at runtime

@Injectable()
export class RewardsService {
    constructor(@InjectModel(Rewards.name) private rewardsModel: Model<RewardsDocument>) {}

    async saveReward(userAddress: string, pollId: string,credit_count :number): Promise<any> {
        try{
        const reward = await this.rewardsModel.findOne({ userAddress: userAddress, pollId: pollId });
        if(reward){
            throw new Error('Reward already exists for this user and voting event');
        } else  {
            const tokenAmount = credit_count * 15; // Number of tokens
            const amountToken = (BigInt(tokenAmount) * BigInt(10 ** 18)).toString(); // Convert to wei
            const idClaim = generateIdClaim();
            const signature = await generateSignatureForClaim(userAddress, amountToken, idClaim);
            const newReward = new this.rewardsModel({
                userAddress: userAddress,
                pollId: pollId,
                credit_count: credit_count,
                amountToken: amountToken,
                status: "pending",
                _idClaim: idClaim,
                signature: signature
            });
            await newReward.save();
            return newReward;
        }
    }catch (error:any) {
        throw new Error('Error saving reward: ' + error.message);
    }
    }
    async getReward(userAddress: string, pollId: string): Promise<RewardsDocument | null> {
        return this.rewardsModel.findOne({ userAddress: userAddress, pollId: pollId }).exec();
    }

    async generateProof(input: any): Promise<any> {
        try {
            // Sanitize input: convert numeric values to strings (circom expects big ints as strings)
            function sanitize(v: any): any {
                if (Array.isArray(v)) return v.map(sanitize);
                if (v && typeof v === 'object') {
                    const out: any = {};
                    for (const k of Object.keys(v)) out[k] = sanitize(v[k]);
                    return out;
                }
                if (typeof v === 'number') return String(v);
                return v;
            }

            const sanitizedInput = sanitize(input);

            // dynamically import the circuits package (runtime)
            // @ts-ignore
            const mod = await import('@sasvoth/circuits').catch(async () => await import('../../../../packages/circuits/dist'));

            const VoteProofGenerator = mod?.VoteProofGenerator;
            if (!VoteProofGenerator) {
                throw new Error('VoteProofGenerator not found in @sasvoth/circuits');
            }

            // resolve package main to compute a stable assets directory
            let pkgMain: string;
            try {
                pkgMain = require.resolve('@sasvoth/circuits');
            } catch (e) {
                pkgMain = path.join(__dirname, '../../../../packages/circuits/dist/index.js');
            }
            const pkgDir = path.dirname(pkgMain);

            const generator = new VoteProofGenerator(pkgDir);
            const result = await generator.generateVoteProof(sanitizedInput);
            return result;
        } catch (error) {
            throw new Error('Error generating proof: ' + (error?.message ?? String(error)));
        }
    }
       

}