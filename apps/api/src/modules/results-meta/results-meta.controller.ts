import { Controller } from "@nestjs/common";
import { ResultsMetaService } from "./results-meta.service";
import {Get, Post, Body, Param, Res, Req} from "@nestjs/common";
import { Request, Response } from "express";
@Controller('results-meta')
export class ResultsMetaController {
    constructor(private readonly resultsMetaService: ResultsMetaService) {};

    @Post("save")
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
    async getResultsMeta(@Param("pollId") pollId: string, @Res() res: Response) {
        try {
            const resultsMeta = await this.resultsMetaService.getOutComeByVotingEventId(pollId);
            return res.status(200).json(resultsMeta);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching results meta', error });
        }
    }
    @Get("getAll")
    async getAllResultsMeta(@Res() res: Response) {
        try {
            const resultsMeta = await this.resultsMetaService.getAllResultsMeta();
            return res.status(200).json(resultsMeta);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching all results meta', error });
        }
    }
}