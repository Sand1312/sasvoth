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
import { VoiceCreditsService } from "./voice-credits.service";
@Controller('voice-credits')
export class VoiceCreditsController {
    constructor(private readonly voiceCreditsService:VoiceCreditsService) { };

    @Post("buy")
    async buyCredits(@Req() req: Request, @Res() res: Response) {
        const { userId, pollId, credits } = req.body;
        try {
            const updatedCredits = await this.voiceCreditsService.buyCredits(userId, pollId, credits);
            return res.status(200).json({ credits: updatedCredits });
        } catch (error) {
            return res.status(500).json({ message: 'Error buying credits', error });
        }
    }

    @Post("sell")
    async sellCredits(@Req() req: Request, @Res() res: Response) {
        const { userId, pollId, credits } = req.body;
        try {
            const updatedCredits = await this.voiceCreditsService.sellCredits(userId, pollId, credits);
            return res.status(200).json({ credits: updatedCredits });
        } catch (error) {
            return res.status(500).json({ message: 'Error selling credits', error });
        }
    }

    @Get("get")
    async getCredits(@Req() req: Request, @Res() res: Response) {
        const { userId, pollId } = req.query;
        try {
            const credits = await this.voiceCreditsService.getCredits(userId as string, pollId as string);
            return res.status(200).json({ credits });
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching credits', error });
        }
    }

    @Post("block")
    async blockCredits(@Req() req: Request, @Res() res: Response) {
        const { userId, pollId } = req.body;
        try {
            await this.voiceCreditsService.blockCredits(userId, pollId);
            return res.status(200).json({ message: 'Credits blocked successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'Error blocking credits', error });
        }
    }
}