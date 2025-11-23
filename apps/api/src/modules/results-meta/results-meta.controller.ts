import { Controller, Get, Post, Res, Req, Param } from "@nestjs/common";
import { ResultsMetaService } from "./results-meta.service";
import { Request, Response } from "express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

class SaveResultsMetaDto {
  @ApiProperty()
  pollId: string;

  @ApiProperty()
  result_cid: string;

  @ApiProperty()
  outCome: string;
}

@ApiTags('Results Meta')
@Controller('results-meta')
export class ResultsMetaController {
    constructor(private readonly resultsMetaService: ResultsMetaService) {};

    @Post("save")
    @ApiOperation({ summary: 'Save voting result metadata' })
    @ApiBody({ type: SaveResultsMetaDto })
    @ApiBearerAuth()
    @ApiResponse({ status: 201, description: 'Result metadata saved' })
    async saveResultsMeta(@Req() req:Request, @Res() res: Response) {
        try {
            const {pollId, result_cid, outCome} = req.body;
            const savedMeta = await this.resultsMetaService.saveResultsMeta(pollId, result_cid, outCome);
            return res.status(201).json(savedMeta);
        } catch (error) {
            return res.status(500).json({ message: 'Error saving results meta', error });
        }
    }

    @Get("get/:pollId")
    @ApiOperation({ summary: 'Get result metadata by poll id' })
    @ApiParam({ name: 'pollId', type: String })
    @ApiResponse({ status: 200, description: 'Result metadata retrieved' })
    async getResultsMeta(@Param("pollId") pollId: string, @Res() res: Response) {
        try {
            const resultsMeta = await this.resultsMetaService.getOutComeByVotingEventId(pollId);
            return res.status(200).json(resultsMeta);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching results meta', error });
        }
    }
    @Get("getAll")
    @ApiOperation({ summary: 'List all result metadata entries' })
    @ApiResponse({ status: 200, description: 'All results metadata retrieved' })
    async getAllResultsMeta(@Res() res: Response) {
        try {
            const resultsMeta = await this.resultsMetaService.getAllResultsMeta();
            return res.status(200).json(resultsMeta);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching all results meta', error });
        }
    }
}
