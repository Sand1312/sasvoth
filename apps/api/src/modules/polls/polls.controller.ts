import { Controller, Get, Patch, Delete, Query } from '@nestjs/common';
import { PollsService } from './polls.service';
import { Post, Req, Res, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

class CreatePollDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  creatorAddress: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startTime: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  endTime: Date;

  @ApiProperty()
  numberOptions: number;
}

class UpdatePollStatusDto {
  @ApiProperty()
  status: string;
}

class AddIdeaDto {
  @ApiProperty()
  ideaId: string;
}

class ApproveIdeaDto {
  @ApiProperty()
  ideaCid: string;
}

class UpdateChainDto {
  @ApiProperty()
  pollIdOnChain: number;

  @ApiProperty({ required: false })
  subgraphUrl?: string;

  @ApiProperty({ required: false })
  maciAddress?: string;  // MACI contract address this poll belongs to
}

/**
 * Polls Controller - RESTful Resource-Oriented
 *
 * Resource: /polls
 * Sub-resource: /polls/:id/ideas
 * Sub-resource: /polls/:id/status
 * Sub-resource: /polls/:id/chain
 *
 * GET    /polls              - List all polls (with optional status filter)
 * POST   /polls              - Create a new poll
 * GET    /polls/:id          - Get a specific poll
 * PATCH  /polls/:id          - Update a poll
 * DELETE /polls/:id          - Delete a poll
 * PATCH  /polls/:id/status   - Update poll status
 * POST   /polls/:id/ideas    - Add idea to poll
 * PATCH  /polls/:id/ideas/:ideaId/approve - Approve idea
 * PATCH  /polls/:id/chain    - Update on-chain ID
 */
import { ResultsMetaService } from '../results-meta/results-meta.service';

@Controller('polls')
@ApiTags('Polls')
export class PollsController {
  constructor(
    private pollsService: PollsService,
    private resultsMetaService: ResultsMetaService,
  ) { }

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * List all polls (with optional status filter)
   * GET /polls or GET /polls?status=X&page=1&limit=10
   */
  @Get()
  @ApiOperation({ summary: 'List all polls' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'activeAt', required: false, description: 'Filter polls active at date (ISO string)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title/description' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field: createdAt, updatedAt, startTime, title' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc' })
  @ApiResponse({ status: 200, description: 'Polls retrieved successfully' })
  async getAll(
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('activeAt') activeAt: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
    @Res() res: Response,
  ) {
    try {
      // If pagination params are provided, use paginated method
      if (page || limit || activeAt || search || sortBy) {
        const result = await this.pollsService.getAllPaginated({
          page: page ? parseInt(page, 10) : 1,
          limit: limit ? parseInt(limit, 10) : 10,
          status: status || undefined,
          activeAt: activeAt ? new Date(activeAt) : undefined,
          search: search || undefined,
          sortBy: (sortBy as 'createdAt' | 'updatedAt' | 'startTime' | 'title') || 'createdAt',
          sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
        });
        return res.status(200).json(result);
      }

      // Legacy: return all polls without pagination
      let polls;
      if (status) {
        polls = await this.pollsService.getPollByStatus(status);
      } else {
        polls = await this.pollsService.getAll();
      }
      return res.status(200).json({ polls });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching polls', error });
    }
  }

  /**
   * Create a new poll
   * POST /polls
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new poll' })
  @ApiBody({ type: CreatePollDto })
  @ApiResponse({ status: 201, description: 'Poll created successfully' })
  async create(@Req() req: Request, @Res() res: Response) {
    const pollData = req.body;
    try {
      const newPoll = await this.pollsService.createPoll(pollData);
      return res.status(201).json({ poll: newPoll });
    } catch (error) {
      return res.status(500).json({ message: 'Error creating poll', error });
    }
  }

  /**
   * Get poll by option CID (idea CID in options[])
   * GET /polls/by-option/:optionCid
   */
  @Get('by-option/:optionCid')
  @ApiOperation({ summary: 'Get poll by option CID' })
  @ApiParam({
    name: 'optionCid',
    type: String,
    description: 'Idea CID in poll options',
  })
  @ApiResponse({ status: 200, description: 'Poll retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async getByOptionCid(
    @Param('optionCid') optionCid: string,
    @Res() res: Response,
  ) {
    try {
      const poll = await this.pollsService.getPollByOptionCid(optionCid);
      if (!poll) {
        return res
          .status(404)
          .json({ message: 'Poll not found for this option' });
      }
      return res.status(200).json({ poll });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error fetching poll by option', error });
    }
  }

  /**
   * Get a specific poll by ID
   * GET /polls/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get poll by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Poll retrieved successfully' })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      const poll = await this.pollsService.getPollById(id);
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }

      let results: any[] = [];
      try {
        // IMPORTANT: Results are saved with the On-Chain Poll ID (e.g., "0"), not the Mongo ID
        const onChainId = (poll as any).pollIdOnChain;
        if (onChainId !== undefined && onChainId !== null) {
          const resultsMeta =
            await this.resultsMetaService.getOutComeByVotingEventId(
              onChainId.toString(),
            );
          if (resultsMeta && resultsMeta.detailResult) {
            const counts = resultsMeta.detailResult;
            const total = counts.reduce(
              (a: number, b: number) => a + (b || 0),
              0,
            );
            const p = poll as any;

            // Determine options list for mapping labels
            const optionsList =
              p.options && p.options.length
                ? p.options
                : p.approvedIdeaIds && p.approvedIdeaIds.length
                  ? p.approvedIdeaIds
                  : p.ideas || [];

            // Map counts to result objects
            results = counts.map((votes: number, index: number) => {
              const opt = optionsList[index];
              // If opt is object (Populated Idea), use title. If string (CID/ID), use it.
              const label =
                opt && typeof opt === 'object' && opt.title
                  ? opt.title
                  : typeof opt === 'string'
                    ? `Option ${index + 1} (${opt.substring(0, 6)}...)`
                    : `Option ${index + 1}`;

              const rId =
                opt && typeof opt === 'object' && opt._id
                  ? opt._id
                  : typeof opt === 'string'
                    ? opt
                    : index.toString();

              return {
                id: rId,
                label: label,
                votes: votes || 0,
                percentage: total === 0 ? 0 : Math.round((votes / total) * 100),
                author: 'Community',
              };
            });

            // Sort by votes desc
            results.sort((a, b) => b.votes - a.votes);
          }
        }
      } catch (e) {
        // Results not found or error, just return empty results
      }

      const pollObj = (poll as any).toObject ? (poll as any).toObject() : poll;
      pollObj.results = results;

      return res.status(200).json({ poll: pollObj });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching poll', error });
    }
  }

  /**
   * Update a poll
   * PATCH /polls/:id
   */
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a poll' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Poll updated successfully' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const updatedPoll = await this.pollsService.updatePoll(id, req.body);
      return res.status(200).json({ poll: updatedPoll });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating poll', error });
    }
  }

  /**
   * Delete a poll
   * DELETE /polls/:id
   */
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a poll' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Poll deleted successfully' })
  async delete(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.pollsService.deletePoll(id);
      return res.status(200).json({ message: 'Poll deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting poll', error });
    }
  }

  /**
   * Update poll status
   * PATCH /polls/:id/status
   */
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update poll status' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePollStatusDto })
  @ApiResponse({ status: 200, description: 'Poll status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { status } = req.body;
    try {
      const updatedPoll = await this.pollsService.updatePollStatus(id, status);
      return res.status(200).json({ poll: updatedPoll });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error updating poll status', error });
    }
  }

  /**
   * Add idea to poll
   * POST /polls/:id/ideas
   */
  @Post(':id/ideas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add idea to poll' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AddIdeaDto })
  @ApiResponse({ status: 200, description: 'Idea added to poll successfully' })
  async addIdea(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { ideaId } = req.body;
    try {
      const updatedPoll = await this.pollsService.addIdeaToPoll(id, ideaId);
      return res.status(200).json({ poll: updatedPoll });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error adding idea to poll', error });
    }
  }

  /**
   * Approve idea in poll
   * PATCH /polls/:pollId/ideas/:ideaId/approve
   */
  @Patch(':pollId/ideas/:ideaId/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve idea in poll' })
  @ApiParam({ name: 'pollId', type: String })
  @ApiParam({ name: 'ideaId', type: String })
  @ApiBody({ type: ApproveIdeaDto })
  @ApiResponse({ status: 200, description: 'Idea approved successfully' })
  async approveIdea(
    @Param('pollId') pollId: string,
    @Param('ideaId') ideaId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { ideaCid } = req.body;
    try {
      const updatedPoll = await this.pollsService.approveIdeaInPoll(
        pollId,
        ideaId,
        ideaCid,
      );
      return res.status(200).json({ poll: updatedPoll });
    } catch (error) {
      return res.status(500).json({ message: 'Error approving idea', error });
    }
  }

  /**
   * Update on-chain ID
   * PATCH /polls/:id/chain
   */
  @Patch(':id/chain')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update on-chain poll ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateChainDto })
  @ApiResponse({ status: 200, description: 'On-chain ID updated successfully' })
  async updateChainId(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { pollIdOnChain, subgraphUrl, maciAddress } = req.body;
    try {
      const updatedPoll = await this.pollsService.savePollOnChainId(
        id,
        pollIdOnChain,
        subgraphUrl,
        maciAddress,
      );
      return res.status(200).json({ poll: updatedPoll });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error updating on-chain ID', error });
    }
  }

  // ========================================
  // Legacy Endpoints (Backward Compatibility)
  // ========================================

  /** @deprecated Use POST /polls instead */
  @Post('create')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Deprecated] Create a poll' })
  async createPoll(@Req() req: Request, @Res() res: Response) {
    return this.create(req, res);
  }

  /** @deprecated Use GET /polls?status=X instead */
  @Get('/status/:status')
  @ApiOperation({ summary: '[Deprecated] List polls by status' })
  async getPollsByStatus(
    @Param('status') status: string,
    @Res() res: Response,
  ) {
    try {
      const polls = await this.pollsService.getPollByStatus(status);
      return res.status(200).json(polls);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching polls', error });
    }
  }

  /** @deprecated Use PATCH /polls/:id/status instead */
  @Patch('updateStatus')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Deprecated] Update poll status' })
  async updatePollStatus(@Req() req: Request, @Res() res: Response) {
    const { pollId, status } = req.body;
    try {
      const updatedPoll = await this.pollsService.updatePollStatus(
        pollId,
        status,
      );
      return res.status(200).json(updatedPoll);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error updating poll status', error });
    }
  }

  /** @deprecated Use POST /polls/:id/ideas instead */
  @Patch('addIdea')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Deprecated] Add idea to poll' })
  async addIdeaToPoll(@Req() req: Request, @Res() res: Response) {
    const { pollId, ideaId } = req.body;
    try {
      const updatedPoll = await this.pollsService.addIdeaToPoll(pollId, ideaId);
      return res.status(200).json(updatedPoll);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error adding idea to poll', error });
    }
  }

  /** @deprecated Use PATCH /polls/:pollId/ideas/:ideaId/approve instead */
  @Patch('approveIdea')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Deprecated] Approve idea in poll' })
  async approveIdeaInPoll(@Req() req: Request, @Res() res: Response) {
    const { pollId, ideaId, ideaCid } = req.body;
    try {
      const updatedPoll = await this.pollsService.approveIdeaInPoll(
        pollId,
        ideaId,
        ideaCid,
      );
      return res.status(200).json(updatedPoll);
    } catch (error) {
      return res.status(500).json({ message: 'Error approving idea', error });
    }
  }

  /** @deprecated Use PATCH /polls/:id/chain instead */
  @Patch('saveOnChain')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Deprecated] Save on-chain ID' })
  async savePollOnChainId(@Req() req: Request, @Res() res: Response) {
    const { pollId, pollIdOnChain } = req.body;
    try {
      const updatedPoll = await this.pollsService.savePollOnChainId(
        pollId,
        pollIdOnChain,
      );
      return res.status(200).json(updatedPoll);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error saving on-chain ID', error });
    }
  }
}
