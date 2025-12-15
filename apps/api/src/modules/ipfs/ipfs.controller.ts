import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IpfsService } from './ipfs.service';
import { Response } from 'express';

@Controller('ipfs')
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  /** Upload a file */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    const cid = await this.ipfsService.addFile(file.buffer);
    return { cid };
  }

  /** Get a file back from IPFS */
  @Get(':cid')
  async fetch(@Param('cid') cid: string, @Res() res: Response) {
    const data = await this.ipfsService.getFile(cid);
    res.send(data);
  }
}