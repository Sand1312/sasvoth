import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Polls, PollsDocument } from './schemas/polls';

@Injectable()
export class PollsService {
  constructor(
    @InjectModel(Polls.name) private pollsModel: Model<PollsDocument>,
  ) { }

  /**
   * Sync poll status based on time and deployment
   */
  private async syncPollStatus(poll: PollsDocument | null): Promise<PollsDocument | null> {
    if (!poll) return poll;

    const now = new Date();
    const start = new Date(poll.startTime);
    const end = new Date(poll.endTime);
    // Check deployment status
    const isDeployed =
      poll.pollIdOnChain !== undefined &&
      poll.pollIdOnChain !== null &&
      String(poll.pollIdOnChain) !== "";

    let newStatus = poll.status;

    // Logic:
    // 1. If explicitly Cancelled check. 
    // If it's NOT deployed and cancelled, we assume it was auto-cancelled or manual.
    // If it IS deployed, we might want to "un-cancel" it if it was a mistake (like the pollId 0 bug).
    // So only return early if NOT deployed.
    if (!isDeployed && poll.status === 'cancelled') {
      return poll;
    }

    // 2. If it is Deployed
    if (isDeployed) {
      if (now < start) {
        // Deployed but waiting for start
        newStatus = 'waiting';
      } else if (now >= start && now <= end) {
        // In Progress
        // Do not override 'counting' if it was set explicitly during voting phase (unlikely but safe)
        // Do not override 'ended' 
        if (newStatus !== 'counting' && newStatus !== 'ended') {
          newStatus = 'in_progress';
        }
      } else if (now > end) {
        // Ended
        // "known that calling talling take times"
        // If status is 'counting', keep it. 
        // If 'in_progress', move to 'ended' (or 'counting' if that was auto? No user said manual trigger)
        // Let's default to 'ended' if time is up, unless it's explicitly 'counting'.
        if (newStatus !== 'counting' && newStatus !== 'ended') {
          newStatus = 'ended';
        }
      }
    }
    // 3. Not Deployed
    else {
      if (now > start) {
        // "if poll not deploy after start time turn into cancelled should be auto trigger"
        newStatus = 'cancelled';
      } else {
        // Before start time available
        newStatus = 'prepare';
      }
    }

    if (newStatus !== poll.status) {
      poll.status = newStatus;
      return poll.save();
    }
    return poll;
  }

  async getPollById(pollId: string): Promise<PollsDocument | null> {
    const poll = await this.pollsModel.findById(pollId).exec();
    return this.syncPollStatus(poll);
  }
  async createPoll(pollData: Partial<Polls>): Promise<PollsDocument> {
    console.log('Creating poll with data:', pollData);
    const newPoll = new this.pollsModel(pollData);
    return newPoll.save();
  }
  async getPollByStatus(status: string): Promise<PollsDocument[]> {
    const polls = await this.pollsModel.find({ status }).exec();
    // Sync status for all found polls
    const synced = await Promise.all(polls.map(p => this.syncPollStatus(p)));
    // Filter out nulls and match status
    return synced.filter((p): p is PollsDocument => p !== null && p.status === status);
  }
  async updatePollStatus(
    pollId: string,
    status: string,
  ): Promise<PollsDocument | null> {
    const updated = await this.pollsModel
      .findByIdAndUpdate(pollId, { status }, { new: true })
      .exec();
    return this.syncPollStatus(updated);
  }
  async addIdeaToPoll(
    pollId: string,
    ideaId: string,
  ): Promise<PollsDocument | null> {
    let poll = await this.pollsModel.findById(pollId).exec();
    if (!poll) {
      throw new BadRequestException('Poll not found');
    }
    poll.ideas.push(ideaId);
    return poll.save();
  }

  async approveIdeaInPoll(
    pollId: string,
    ideaId: string,
    ideaCid: string,
  ): Promise<PollsDocument | null> {
    let poll = await this.pollsModel.findById(pollId).exec();
    if (!poll) {
      throw new BadRequestException('Poll not found');
    }
    poll.ideas = poll.ideas.filter((id) => id !== ideaId);
    poll.options.push(ideaCid);
    return poll.save();
  }
  async savePollOnChainId(
    pollId: string,
    pollIdOnChain: number,
    subgraphUrl?: string,
    maciAddress?: string,
    startBlock?: number,
  ): Promise<PollsDocument | null> {
    const update: any = { pollIdOnChain };
    if (subgraphUrl) {
      update.subgraphUrl = subgraphUrl;
    }
    if (maciAddress) {
      update.maciAddress = maciAddress;
    }
    if (startBlock) {
      update.startBlock = startBlock;
    }
    // After saving, we should probably sync status too
    let poll = await this.pollsModel
      .findByIdAndUpdate(pollId, update, { new: true })
      .exec();
    return this.syncPollStatus(poll);
  }

  async updateStatusByOnChainId(
    pollIdOnChain: number,
    status: string,
  ): Promise<PollsDocument | null> {
    const updated = await this.pollsModel
      .findOneAndUpdate(
        { pollIdOnChain: pollIdOnChain },
        { status },
        { new: true },
      )
      .exec();
    return this.syncPollStatus(updated);
  }

  // async getOptionsByPollId(pollId: string): Promise<any[]|any> {
  //     const poll = await this.pollsModel.findById(pollId).exec();
  //     if (!poll) {
  //         throw new BadRequestException('Poll not found');
  //     }

  async getAll(): Promise<PollsDocument[]> {
    const polls = await this.pollsModel.find().exec();
    const synced = await Promise.all(polls.map(p => this.syncPollStatus(p)));
    return synced.filter((p): p is PollsDocument => p !== null);
  }

  /**
   * Get all polls with pagination and filtering
   */
  async getAllPaginated(options: {
    page?: number;
    limit?: number;
    status?: string;
    activeAt?: Date; // Filter polls where startTime <= activeAt <= endTime
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'startTime' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ polls: PollsDocument[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      activeAt,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const query: any = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Active at date filter (polls that would be in_progress at this date)
    if (activeAt) {
      query.startTime = { $lte: activeAt };
      query.endTime = { $gte: activeAt };
    }

    // Search filter (title or description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [polls, total] = await Promise.all([
      this.pollsModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.pollsModel.countDocuments(query).exec(),
    ]);

    // Sync status for all found polls
    const synced = await Promise.all(polls.map(p => this.syncPollStatus(p)));
    const filteredPolls = synced.filter((p): p is PollsDocument => p !== null);

    return {
      polls: filteredPolls,
      total,
      page,
      limit,
    };
  }

  /**
   * Find poll that contains the given CID in options[]
   */
  async getPollByOptionCid(optionCid: string): Promise<PollsDocument | null> {
    const poll = await this.pollsModel.findOne({ options: optionCid }).exec();
    return this.syncPollStatus(poll);
  }

  /**
   * Update poll
   */
  async updatePoll(
    pollId: string,
    updateData: Partial<Polls>,
  ): Promise<PollsDocument | null> {
    const poll = await this.pollsModel
      .findByIdAndUpdate(pollId, updateData, { new: true })
      .exec();
    return this.syncPollStatus(poll);
  }

  /**
   * Delete poll
   */
  async deletePoll(pollId: string): Promise<PollsDocument | null> {
    return this.pollsModel.findByIdAndDelete(pollId).exec();
  }
}
