export class VoteDtoReq{
    readonly voterId: string;
    readonly pollId: string;
    readonly selectedOption: string
    readonly timestamp: Date;
    readonly weight: number;
    readonly userId: string;
    readonly voteCommitment: string;
}