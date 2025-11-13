import { Controller, Get, Query, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { PollStatus } from './enums/poll-status.enum';
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post('create')
  async createPoll(@Req() req: Request, @Res() res: Response) {
    const pollData = req.body;
    try {
      const newPoll = await this.pollsService.createPoll(pollData);
      return res.status(201).json(newPoll);
    } catch (error) {
      return res.status(500).json({ message: 'Error creating poll', error });
    }
  }

  @Get()
  getPolls(@Query('status') status?: PollStatus) {
    return this.pollsService.getPolls(status);
  }
}
