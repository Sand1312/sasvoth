import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreatePollDto } from "./dto/create-poll.dto";
import { PollStatus } from "./enums/poll-status.enum";
import { Polls, PollsDocument } from "./schemas/polls.schema";

@Injectable()
export class PollsService {
  constructor(
    @InjectModel(Polls.name) private pollsModel: Model<PollsDocument>
  ) {}

  async createPoll(createPollDto: CreatePollDto): Promise<PollsDocument> {
    const { startTime, endTime } = createPollDto;

    if (new Date(endTime) <= new Date(startTime)) {
      throw new BadRequestException("endTime must be later than startTime");
    }

    const poll = new this.pollsModel({
      ...createPollDto,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });

    return poll.save();
  }

  async getPolls(status?: PollStatus): Promise<PollsDocument[]> {
    const filter = status ? { status } : {};
    return this.pollsModel.find(filter).exec();
  }
}
