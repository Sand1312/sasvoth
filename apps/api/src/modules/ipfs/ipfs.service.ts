import { Injectable, Logger } from '@nestjs/common';
import { create, IPFSHTTPClient } from 'ipfs-http-client';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly ipfs: IPFSHTTPClient;

  constructor() {
    try {
      this.ipfs = create({
        host: 'localhost',
        port: 5001,
        protocol: 'http',
      });

      this.logger.log('Connected to IPFS node on 127.0.0.1:5001');
    } catch (err) {
      this.logger.error('Failed to connect to IPFS node', err);
      throw err;
    }
  }

  /** Upload file to IPFS */
  async addFile(file: Buffer): Promise<string> {
    try {
      const { cid } = await this.ipfs.add(file);
      return cid.toString();
    } catch (err) {
      this.logger.error('Error uploading file to IPFS', err);
      throw err;
    }
  }

  /** Fetch file from IPFS */
  async getFile(cid: string): Promise<Buffer> {
    try {
      const chunks: Uint8Array[] = [];

      for await (const chunk of this.ipfs.cat(cid)) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (err) {
      this.logger.error('Error fetching file from IPFS', err);
      throw err;
    }
  }
}