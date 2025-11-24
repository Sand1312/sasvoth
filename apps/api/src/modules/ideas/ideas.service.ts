import { IdeasDTOReq } from '@/dto/ideas';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';


@Injectable()
export class IdeasService {
    constructor(@InjectModel("Ideas") private ideasModel:Model<any>) {}

    async createIdea(idea:any  ): Promise<any> {
        const newIdea = new this.ideasModel({
            ...idea,
            createdAt: new Date(),
            idea_cid: '',
        });
        return newIdea.save();
}
    async updateIdeaCID(ideaId:string, idea_cid:string):Promise<any>{
        return this.ideasModel.findByIdAndUpdate(ideaId, { idea_cid }, { new: true }).exec();
    }
    async getIdeaById(ideaId:string):Promise<any>{
        console.log('Fetching idea with ID:', ideaId);
        const idea = await this.ideasModel.findById(ideaId).exec();
        console.log('Fetched idea:', idea);
        return idea;
    }
    async updateIdea(ideaId:string, updateData:any):Promise<any>{
        console.log('Updating idea with ID:', ideaId, 'with data:', updateData);
        return this.ideasModel.findByIdAndUpdate(ideaId, updateData, { new: true }).exec();
    }
}
