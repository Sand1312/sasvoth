import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultsMetaService } from './results-meta.service';
import { ResultsMetaController } from './results-meta.controller';
import { ResultsMeta, ResultsMetaSchema } from './schemas/results-meta.schema';
import { VotesModule } from '../votes/votes.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { PollsModule } from '../polls/polls.module';

@Module({
    imports: [
        VotesModule,
        MongooseModule.forFeature([{name: 'ResultsMeta', schema: ResultsMetaSchema}]),
        IpfsModule,
        forwardRef(() => PollsModule),
    ],
    controllers: [ResultsMetaController],
    providers: [ResultsMetaService],
    exports: [ResultsMetaService]
})
export class ResultsMetaModule {

}

