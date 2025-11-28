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
@Controller('polls')
@ApiTags('Polls')
export class PollsController {
  constructor(private pollsService: PollsService) {}

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * List all polls (with optional status filter)
   * GET /polls or GET /polls?status=X
   */
  @Get()
  @ApiOperation({ summary: 'List all polls' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiResponse({ status: 200, description: 'Polls retrieved successfully' })
  async getAll(@Query('status') status: string, @Res() res: Response) {
    try {
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
      return res.status(200).json({ poll });
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
    const { pollIdOnChain } = req.body;
    try {
      const updatedPoll = await this.pollsService.savePollOnChainId(
        id,
        pollIdOnChain,
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
