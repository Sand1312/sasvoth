import { Controller, Get, Post, UploadedFile, UseInterceptors, Param, Res, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IpfsService } from './ipfs.service';
import { Response } from 'express';
import mockIpfs from './mock-ipfs.client';
import * as path from 'path';

@Controller('ipfs')
export class IpfsController {
  constructor(private readonly ipfsService: IpfsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const cid = await this.ipfsService.addFile(file.buffer);
    return { cid };
  }

  @Get(':cid')
  async getFile(@Param('cid') cid: string, @Res() res: Response) {
    const file = await this.ipfsService.getFile(cid);
    res.send(file);
  }

  // --- Mock IPFS endpoints (use the singleton mock client) ---
  @Post('mock/add')
  @UseInterceptors(FileInterceptor('file'))
  async mockAddFile(@UploadedFile() file?: Express.Multer.File, @Body() body?: any) {
    // support multipart upload or raw JSON body with `content` and optional `filename`
    if (file && file.buffer) {
      const cid = await mockIpfs.add(file.buffer, file.originalname);
      return { cid: `ipfs://${cid}` };
    }
    const content = body?.content ?? JSON.stringify(body ?? {});
    const filename = body?.filename;
    const cid = await mockIpfs.add(content, filename);
    return { cid: `ipfs://${cid}` };
  }

  @Get('mock/cat/:cid')
  async mockCat(@Param('cid') cid: string, @Res() res: Response) {
    // accept cid with or without ipfs:// prefix
    const normalized = cid.startsWith('ipfs://') ? cid.replace('ipfs://', '') : cid;
    try {
      const data = await mockIpfs.cat(normalized);
      res.type('application/json').send(data);
    } catch (err) {
      res.status(404).send({ error: (err as Error).message });
    }
  }

  @Get('mock/list')
  async mockList() {
    const list = await mockIpfs.list();
    return { cids: list.map((c) => `ipfs://${c}`) };
  }

  @Post('mock/pin-existing')
  async mockPinExisting() {
    // pin the three mock files created earlier in workspace
    const base = process.cwd();
    const files = [
      path.join(base, 'mock-vote-options.json'),
      path.join(base, 'mock-vote-batches.json'),
      path.join(base, 'mock-tally-results.json'),
    ];
    const result = await mockIpfs.pinExisting(files);
    // return ipfs:// prefixed values
    const mapped: Record<string, string> = {};
    for (const p of Object.keys(result)) {
      const v = result[p];
      mapped[p] = v.startsWith('Qm') ? `ipfs://${v}` : v;
    }
    return mapped;
  }
}