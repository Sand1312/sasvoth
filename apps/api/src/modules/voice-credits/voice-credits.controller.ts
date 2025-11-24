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
import { VoiceCreditsService } from "./voice-credits.service";

class ModifyCreditsDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  pollId: string;

  @ApiProperty()
  credits: number;
}

@ApiTags('Voice Credits')
@ApiBearerAuth()
@Controller('voice-credits')
export class VoiceCreditsController {
    constructor(private readonly voiceCreditsService:VoiceCreditsService) { };

    @Post("buy")
    @ApiOperation({ summary: 'Buy voting credits' })
    @ApiBody({ type: ModifyCreditsDto })
    @ApiResponse({ status: 200, description: 'Credits purchased' })
    async buyCredits(@Req() req: Request, @Res() res: Response) {
        const { userId, pollId, credits } = req.body;
        try {
            const updatedCredits = await this.voiceCreditsService.buyCredits(userId, pollId, credits);
            return res.status(200).json({ credits: updatedCredits });
        } catch (error) {
            return res.status(500).json({ message: 'Error buying credits', error });
        }
    }

    @Post("deduct")
    @ApiOperation({ summary: 'Deduct credits when voting' })
    @ApiBody({ type: ModifyCreditsDto })
    @ApiResponse({ status: 200, description: 'Credits deducted' })
    async sellCredits(@Req() req: Request, @Res() res: Response) {
        const { userId, pollId, credits } = req.body;
        try {
            const updatedCredits = await this.voiceCreditsService.deductCredits(userId, pollId, credits);
            return res.status(200).json({ credits: updatedCredits });
        } catch (error) {
            return res.status(500).json({ message: 'Error deducting credits', error });
        }
    }

    @Get("get")
    @ApiOperation({ summary: 'Get available credits for a user and poll' })
    @ApiQuery({ name: 'userId', required: true })
    @ApiQuery({ name: 'pollId', required: true })
    @ApiResponse({ status: 200, description: 'Credits fetched' })
    async getCredits(@Req() req: Request, @Res() res: Response) {
        const { userId, pollId } = req.query;
        try {
            const credits = await this.voiceCreditsService.getCredits(userId as string, pollId as string);
            return res.status(200).json({ credits });
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching credits', error });
        }
    }
}
