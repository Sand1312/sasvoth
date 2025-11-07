import {Controller, Get} from '@nestjs/common';
import { PollsService } from './polls.service';
import { create } from 'domain';
import { Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('polls')
export class PollsController {
    constructor(private pollsService :PollsService ) {};

    @Post("createPoll")
    async createPoll(@Req() req: Request, @Res() res: Response) {
        const pollData = req.body;
        try {
            const newPoll = await this.pollsService.createPoll(pollData);
            return res.status(201).json(newPoll);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating poll', error });
        }
    }

    @Get("getPollsByType")
    async getPollsByType(@Req() req: Request, @Res() res: Response) {
        const status = req.query.status as string;
        try {
            const polls = await this.pollsService.getPollByType(status);
            return res.status(200).json(polls);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching polls', error });
        }
    }
}