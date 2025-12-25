import { Controller, Get, Post, Res, Req, Param } from '@nestjs/common';
import { ResultsMetaService } from './results-meta.service';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

/**
 * Results Controller - RESTful Resource-Oriented
 *
 * Resource: /polls/:pollId/results (poll results as sub-resource)
 *
 * GET    /polls/:pollId/results        - Get poll results
 * POST   /polls/:pollId/results/tally  - Start async tally calculation
 * GET    /polls/:pollId/results/tally-status - Check tally progress
 */
@ApiTags('Poll Results')
@Controller('polls')
export class ResultsMetaController {
  constructor(private readonly resultsMetaService: ResultsMetaService) {}

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * Get poll results
   * GET /polls/:pollId/results
   */
  @Get(':pollId/results')
  @ApiOperation({ summary: 'Get poll results' })
  @ApiParam({ name: 'pollId', type: String })
  @ApiResponse({ status: 200, description: 'Results retrieved successfully' })
  async getResults(@Param('pollId') pollId: string, @Res() res: Response) {
    try {
      const results =
        await this.resultsMetaService.getOutComeByVotingEventId(pollId);
      return res.status(200).json({ results });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching results', error });
    }
  }

  /**
   * Start async tally calculation
   * POST /polls/:pollId/results/tally
   * Returns 202 Accepted immediately, tally runs in background
   */
  @Post(':pollId/results/tally')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start async tally calculation' })
  @ApiParam({ name: 'pollId', type: String })
  @ApiResponse({ status: 202, description: 'Tally process started' })
  @ApiResponse({ status: 200, description: 'Tally already completed or in progress' })
  async tally(@Param('pollId') pollId: string, @Res() res: Response) {
    try {
      const result = await this.resultsMetaService.startTally(pollId);
      
      if (result.status === 'started') {
        return res.status(202).json({ 
          status: 'started',
          message: result.message,
          pollId 
        });
      }
      
      // Already counting or complete
      return res.status(200).json({
        status: result.status,
        message: result.message,
        pollId
      });
    } catch (error: any) {
      return res.status(500).json({ 
        message: 'Error starting tally', 
        error: error?.message || error 
      });
    }
  }

  /**
   * Check tally progress
   * GET /polls/:pollId/results/tally-status
   */
  @Get(':pollId/results/tally-status')
  @ApiOperation({ summary: 'Check tally progress' })
  @ApiParam({ name: 'pollId', type: String })
  @ApiResponse({ status: 200, description: 'Tally status retrieved' })
  async getTallyStatus(@Param('pollId') pollId: string, @Res() res: Response) {
    try {
      const status = await this.resultsMetaService.getTallyStatus(pollId);
      return res.status(200).json(status);
    } catch (error: any) {
      return res.status(500).json({ 
        message: 'Error fetching tally status', 
        error: error?.message || error 
      });
    }
  }
}

/**
 * Legacy Results Controller (Backward Compatibility)
 * @deprecated Use /polls/:pollId/results instead
 */
@ApiTags('Results Meta (Legacy)')
@Controller('results')
export class ResultsMetaLegacyController {
  constructor(private readonly resultsMetaService: ResultsMetaService) {}

  /** @deprecated Use GET /polls/:pollId/results instead */
  @Get(':pollId')
  @ApiOperation({ summary: '[Deprecated] Get result metadata by poll id' })
  @ApiParam({ name: 'pollId', type: String })
  async getResultsMeta(@Param('pollId') pollId: string, @Res() res: Response) {
    try {
      const resultsMeta =
        await this.resultsMetaService.getOutComeByVotingEventId(pollId);
      return res.status(200).json(resultsMeta);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error fetching results meta', error });
    }
  }

  /** @deprecated Use GET /polls with results instead */
  @Get('getAll')
  @ApiOperation({ summary: '[Deprecated] List all result metadata' })
  async getAllResultsMeta(@Res() res: Response) {
    try {
      const resultsMeta = await this.resultsMetaService.getAllResultsMeta();
      return res.status(200).json(resultsMeta);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error fetching all results meta', error });
    }
  }

  /** @deprecated Use POST /polls/:pollId/results/tally instead */
  @Post('tally')
  @ApiOperation({ summary: '[Deprecated] Tally votes' })
  async tallyVotes(@Req() req: Request, @Res() res: Response) {
    try {
      const { pollId } = req.body;
      const tallyResult = await this.resultsMetaService.tallyVotes(pollId);
      return res.status(200).json(tallyResult);
    } catch (error) {
      return res.status(500).json({ message: 'Error tallying votes', error });
    }
  }
}
