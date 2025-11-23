import {
  Controller,
  Get,
  Req,
  Res,
  Post,
} from "@nestjs/common";
import { Request } from "express";
import { Response } from "express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RewardsService } from "./rewards.service";

class SaveRewardDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  pollId: string;

  @ApiProperty()
  credit_count: number;
}

@ApiTags('Rewards')
@ApiBearerAuth()
@Controller("rewards")
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

    @Get("get")
    @ApiOperation({ summary: 'Retrieve reward details' })
    @ApiQuery({ name: 'userId', required: true })
    @ApiQuery({ name: 'pollId', required: true })
    @ApiResponse({ status: 200, description: 'Reward retrieved' })
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
    @ApiOperation({ summary: 'Save reward entry' })
    @ApiBody({ type: SaveRewardDto })
    @ApiResponse({ status: 201, description: 'Reward saved' })
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
