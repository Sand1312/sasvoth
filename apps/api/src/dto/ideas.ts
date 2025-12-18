export class IdeasDTOReq {
    title: string;
    description: string;
    descriptionMore: string[];
    imgSrc: string;
    imgsSrc: string[];
    userAddress: string;
    ageLimit?: number;
}