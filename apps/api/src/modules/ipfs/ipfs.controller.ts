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
    
    // Simple magic byte detection
    let mime = 'application/octet-stream';
    if (data.length > 4) {
        if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
            mime = 'image/png';
        } else if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
            mime = 'image/jpeg';
        } else if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
            mime = 'image/gif';
        } else if (data.slice(0, 4).toString() === 'RIFF' && data.slice(8, 12).toString() === 'WEBP') {
            mime = 'image/webp';
        } else if (
            (data[0] === 0x3C && data[1] === 0x3F && data[2] === 0x78 && data[3] === 0x6D) || // <?xm
            (data[0] === 0x3C && data[1] === 0x73 && data[2] === 0x76 && data[3] === 0x67)    // <svg
        ) {
            mime = 'image/svg+xml';
        }
    }

    console.log(`[IpfsController] Fetch CID: ${cid}, Length: ${data.length}, Detected Mime: ${mime}, First 4 bytes: ${data[0]?.toString(16)} ${data[1]?.toString(16)} ${data[2]?.toString(16)} ${data[3]?.toString(16)}`);

    res.setHeader('Content-Type', mime);
    res.send(data);
  }
}