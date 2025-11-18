import { IdeasDTOReq } from '@/dto/ideas';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';


@Injectable()
export class IdeasService {
    constructor(@InjectModel("Ideas") private ideasModel:Model<any>) {}

    async createIdea(idea:IdeasDTOReq  ): Promise<any> {
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
        return this.ideasModel.findById(ideaId).exec();
    }
    async updateIdea(ideaId:string, updateData:Partial<IdeasDTOReq>):Promise<any>{
        return this.ideasModel.findByIdAndUpdate(ideaId, updateData, { new: true }).exec();
    }
}
