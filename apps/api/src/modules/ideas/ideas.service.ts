import { IdeasDTOReq } from '@/dto/ideas';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class IdeasService {
  constructor(@InjectModel('Ideas') private ideasModel: Model<any>) {}

  /**
   * Get all ideas
   */
  async getAllIdeas(): Promise<any[]> {
    return this.ideasModel.find().exec();
  }

  /**
   * Create a new idea
   */
  async createIdea(idea: any): Promise<any> {
    const newIdea = new this.ideasModel({
      ...idea,
      createdAt: new Date(),
      idea_cid: '',
    });
    return newIdea.save();
  }

  /**
   * Get idea by ID
   */
  async getIdeaById(ideaId: string): Promise<any> {
    console.log('Fetching idea with ID:', ideaId);
    const idea = await this.ideasModel.findById(ideaId).exec();
    console.log('Fetched idea:', idea);
    return idea;
  }

  /**
   * Update idea
   */
  async updateIdea(ideaId: string, updateData: any): Promise<any> {
    console.log('Updating idea with ID:', ideaId, 'with data:', updateData);
    return this.ideasModel
      .findByIdAndUpdate(ideaId, updateData, { new: true })
      .exec();
  }

  /**
   * Delete idea
   */
  async deleteIdea(ideaId: string): Promise<any> {
    return this.ideasModel.findByIdAndDelete(ideaId).exec();
  }

  /**
   * Update idea CID
   */
  async updateIdeaCID(ideaId: string, idea_cid: string): Promise<any> {
    return this.ideasModel
      .findByIdAndUpdate(ideaId, { idea_cid }, { new: true })
      .exec();
  }
}
