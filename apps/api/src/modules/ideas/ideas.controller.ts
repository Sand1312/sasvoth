import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Res,
  NotFoundException,
  Patch,
  Put
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Response } from 'express';
import { IdeasService } from './ideas.service';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async createIdea(@Req() req: Request, @Res() res: Response) {
    const ideaData = req.body;
    try {
      const newIdea = await this.ideasService.createIdea(ideaData);
      return res.status(201).json(newIdea);
    } catch (error) {
      return res.status(500).json({ message: 'Error creating idea', error });
    }
  }
  @Patch('updateCID')
  @UseGuards(AuthGuard('jwt'))
  async updateIdeaCID(@Req() req: Request, @Res() res: Response) {
    const { ideaId, idea_cid } = req.body;
    try {
      const updatedIdea = await this.ideasService.updateIdeaCID(ideaId, idea_cid);
      return res.status(200).json(updatedIdea);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating idea CID', error });
    }
  }
  @Get('get/:ideaId')
  async getIdeaById(@Res() res: Response, @Req() req: Request) {
    const ideaId = req.params.ideaId;
    try {
      const idea = await this.ideasService.getIdeaById(ideaId);
      return res.status(200).json(idea);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching idea', error });
    }
  }
  @Put('update/:ideaId')
  @UseGuards(AuthGuard('jwt'))
  async updateIdea(@Req() req: Request, @Res() res: Response) {
    const ideaId = req.params.ideaId;
    const updateData = req.body;
    try {
      const updatedIdea = await this.ideasService.updateIdea(ideaId, updateData);
      return res.status(200).json(updatedIdea);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating idea', error });
    }
  }

}
