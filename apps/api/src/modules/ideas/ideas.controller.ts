import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Res,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdeasService } from './ideas.service';

class CreateIdeaDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  creatorAddress: string;

  @ApiProperty()
  imgSrc: string;
}

class UpdateIdeaCidDto {
  @ApiProperty()
  cid: string;
}

class UpdateIdeaDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  descriptionMore?: string;

  @ApiPropertyOptional()
  imgSrc?: string;

  @ApiPropertyOptional()
  creatorIdea?: string;
}

/**
 * Ideas Controller - RESTful Resource-Oriented
 *
 * Resource: /ideas
 *
 * GET    /ideas          - List all ideas
 * POST   /ideas          - Create a new idea
 * GET    /ideas/:id      - Get a specific idea
 * PATCH  /ideas/:id      - Update an idea
 * DELETE /ideas/:id      - Delete an idea
 * PATCH  /ideas/:id/cid  - Update idea's CID
 */
@Controller('ideas')
@ApiTags('Ideas')
@ApiBearerAuth()
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * List all ideas
   * GET /ideas
   */
  @Get()
  @ApiOperation({ summary: 'List all ideas' })
  @ApiResponse({ status: 200, description: 'Ideas retrieved successfully' })
  async getAll(@Res() res: Response) {
    try {
      const ideas = await this.ideasService.getAllIdeas();
      return res.status(200).json({ ideas });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching ideas', error });
    }
  }

  /**
   * Create a new idea
   * POST /ideas
   */
  @Post()
  @ApiOperation({ summary: 'Create a new idea' })
  @ApiBody({ type: CreateIdeaDto })
  @ApiResponse({ status: 201, description: 'Idea created successfully' })
  async create(@Req() req: Request, @Res() res: Response) {
    const ideaData = req.body;
    try {
      // Support both direct payload and nested { idea: {...} } format
      const data = ideaData.idea || ideaData;
      const newIdea = await this.ideasService.createIdea(data);
      return res.status(201).json({ idea: newIdea });
    } catch (error) {
      return res.status(500).json({ message: 'Error creating idea', error });
    }
  }

  /**
   * Get a specific idea by ID
   * GET /ideas/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get idea by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Idea retrieved successfully' })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      const idea = await this.ideasService.getIdeaById(id);
      return res.status(200).json({ idea });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching idea', error });
    }
  }

  /**
   * Update an idea
   * PATCH /ideas/:id
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update an idea' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateIdeaDto })
  @ApiResponse({ status: 200, description: 'Idea updated successfully' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const updateData = req.body.updateData || req.body;
    try {
      const updatedIdea = await this.ideasService.updateIdea(id, updateData);
      return res.status(200).json({ idea: updatedIdea });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating idea', error });
    }
  }

  /**
   * Delete an idea
   * DELETE /ideas/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete an idea' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Idea deleted successfully' })
  async delete(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.ideasService.deleteIdea(id);
      return res.status(200).json({ message: 'Idea deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting idea', error });
    }
  }

  /**
   * Update idea's CID
   * PATCH /ideas/:id/cid
   */
  @Patch(':id/cid')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update idea CID' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateIdeaCidDto })
  @ApiResponse({ status: 200, description: 'Idea CID updated successfully' })
  async updateCid(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { cid } = req.body;
    try {
      const updatedIdea = await this.ideasService.updateIdeaCID(id, cid);
      return res.status(200).json({ idea: updatedIdea });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error updating idea CID', error });
    }
  }

  // ========================================
  // Legacy Endpoints (Backward Compatibility)
  // ========================================

  /** @deprecated Use POST /ideas instead */
  @Post('create')
  @ApiOperation({ summary: '[Deprecated] Create a new idea' })
  @ApiBody({ type: CreateIdeaDto })
  async createIdea(@Req() req: Request, @Res() res: Response) {
    return this.create(req, res);
  }

  /** @deprecated Use PATCH /ideas/:id/cid instead */
  @Patch('updateCID')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '[Deprecated] Update idea CID' })
  async updateIdeaCID(@Req() req: Request, @Res() res: Response) {
    const { ideaId, idea_cid } = req.body;
    try {
      const updatedIdea = await this.ideasService.updateIdeaCID(
        ideaId,
        idea_cid,
      );
      return res.status(200).json(updatedIdea);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error updating idea CID', error });
    }
  }

  /** @deprecated Use GET /ideas/:id instead */
  @Get(':ideaId')
  @ApiOperation({ summary: '[Deprecated] Get idea by ID' })
  @ApiParam({ name: 'ideaId', type: String })
  async getIdeaById(@Res() res: Response, @Param('ideaId') ideaId: string) {
    return this.getById(ideaId, res);
  }
}
