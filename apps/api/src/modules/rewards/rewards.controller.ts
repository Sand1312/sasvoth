import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Post,
  NotFoundException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { Response } from "express";
import { RewardsService } from "./rewards.service";

@Controller("rewards")
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

    @Get("get")
    // @UseGuards(AuthGuard("jwt"))
    async getReward(@Req() req: Request, @Res() res: Response) {
        const userId = req.query.userId as string;
        const pollId = req.query.pollId as string;
        try{
            const reward = await this.rewardsService.getReward(userId, pollId);
            if(!reward){
                return res.status(400).json({ message: 'Reward not found' });
            }
            return res.status(200).json(reward);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving reward', error: error.message });
    }
    }
    
    @Post("save")
    // @UseGuards(AuthGuard("jwt"))
    async saveReward(@Req() req: Request, @Res() res: Response) {
        const { userId, pollId, credit_count } = req.body;
        try {
            await this.rewardsService.saveReward(userId, pollId, credit_count);
            return  res.status(201).json({ message: 'Reward saved successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'Error saving reward', error: error.message });
        }
    }

}