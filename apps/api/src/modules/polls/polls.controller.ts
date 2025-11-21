import {Controller, Get, Patch} from '@nestjs/common';
import { PollsService } from './polls.service';
import { create } from 'domain';
import { Post, Req, Res , Param } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller('polls')
export class PollsController {
    constructor(private pollsService :PollsService ) {};

    @Post("create")
    async createPoll(@Req() req: Request, @Res() res: Response) {
        const pollData = req.body;
        try {
            const newPoll = await this.pollsService.createPoll(pollData);
            return res.status(201).json(newPoll);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating poll', error });
        }
    }

    @Get("get/:status")
    async getPollsByStatus(@Param("status") status: string, @Res() res: Response) {
        try {
            const polls = await this.pollsService.getPollByStatus(status);
            return res.status(200).json(polls);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching polls', error });
        }
    }
    @Patch("updateStatus")
    async updatePollStatus( @Req() req: Request, @Res() res: Response) {
        const { pollId, status } = req.body;
        try {
            const updatedPoll = await this.pollsService.updatePollStatus(pollId, status);
            return res.status(200).json(updatedPoll);
        } catch (error) {
            return res.status(500).json({ message: 'Error updating poll status', error });
        }
    }

    @Patch("addIdea")
    async addIdeaToPoll( @Req() req: Request, @Res() res: Response) {
        const { pollId, ideaId } = req.body;
        try {
            const updatedPoll = await this.pollsService.addIdeaToPoll(pollId, ideaId);
            return res.status(200).json(updatedPoll);
        } catch (error) {
            return res.status(500).json({ message: 'Error adding idea to poll', error });
        }
    }
    @Patch("approveIdea")
    async approveIdeaInPoll( @Req() req: Request, @Res() res: Response) {
        const { pollId, ideaId } = req.body;
        try {
            const updatedPoll = await this.pollsService.approveIdeaInPoll(pollId, ideaId);
            return res.status(200).json(updatedPoll);
        } catch (error) {
            return res.status(500).json({ message: 'Error approving idea in poll', error });
        }
    }
    @Patch("saveOnChain")
    async savePollOnChainId( @Req() req: Request, @Res() res: Response) {
        const { pollId, pollIdOnChain, pollAddressOnchain } = req.body;
        
        try {
            const updatedPoll = await this.pollsService.savePollOnChainId(pollId, pollIdOnChain,pollAddressOnchain);
            return res.status(200).json(updatedPoll);
        } catch (error) {
            return res.status(500).json({ message: 'Error saving poll on-chain ID', error });
        }
    }


}