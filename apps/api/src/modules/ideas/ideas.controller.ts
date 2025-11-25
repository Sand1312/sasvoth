import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Res,
  Patch,
  Put,
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
  ideaId: string;

  @ApiProperty()
  idea_cid: string;
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

@Controller('ideas')
@ApiTags('Ideas')
@ApiBearerAuth()
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post('create')
  // @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new idea' })
  @ApiBody({ type: CreateIdeaDto })
  @ApiResponse({ status: 201, description: 'Idea created successfully' })
  async createIdea(@Req() req: Request, @Res() res: Response) {
    const ideaData = req.body;
    // console.log('Received idea data:', ideaData);
    try {
      const newIdea = await this.ideasService.createIdea(ideaData.idea);
      return res.status(201).json(newIdea);
    } catch (error) {
      return res.status(500).json({ message: 'Error creating idea', error });
    }
  }
  @Patch('updateCID')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update the IPFS CID for an idea' })
  @ApiBody({ type: UpdateIdeaCidDto })
  @ApiResponse({ status: 200, description: 'Idea CID updated' })
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
  @Get(':ideaId')
  @ApiOperation({ summary: 'Get idea details by ID' })
  @ApiParam({ name: 'ideaId', type: String })
  @ApiResponse({ status: 200, description: 'Idea details retrieved' })
  async getIdeaById(@Res() res: Response, @Param('ideaId') ideaId: string) {
    try {
      const idea = await this.ideasService.getIdeaById(ideaId);
      return res.status(200).json(idea);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching idea', error });
    }
  }
  @Put('update/:ideaId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update an idea' })
  @ApiParam({ name: 'ideaId', type: String })
  @ApiBody({ type: UpdateIdeaDto })
  @ApiResponse({ status: 200, description: 'Idea updated' })
  async updateIdea(@Req() req: Request, @Res() res: Response) {
    const ideaId = req.body.ideaId;
    const updateData = req.body.updateData;
    try {
      const updatedIdea = await this.ideasService.updateIdea(
        ideaId,
        updateData,
      );
      return res.status(200).json(updatedIdea);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating idea', error });
    }
  }
}
