import { Injectable, Logger } from '@nestjs/common';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import mockIpfs from './mock-ipfs.client';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly ipfs?: IPFSHTTPClient;
  private readonly useMock: boolean;

  constructor() {
    this.useMock = process.env.USE_MOCK_IPFS === 'true';

    if (!this.useMock) {
      try {
        this.ipfs = create({ host: 'localhost', port: 5001, protocol: 'http' });
      } catch (err) {
        this.logger.warn('Failed to create real IPFS client, falling back to mock IPFS');
        this.ipfs = undefined;
      }
    } else {
      this.logger.log('USE_MOCK_IPFS=true, using mock IPFS client');
    }
  }

  private usingMock(): boolean {
    return this.useMock || !this.ipfs;
  }

  async addFile(file: Buffer, filename?: string): Promise<string> {
    if (this.usingMock()) {
      // mockIpfs returns a bare CID string (no ipfs://)
      const cid = await mockIpfs.add(file, filename);
      return cid;
    }

    try {
  const { cid } = await this.ipfs!.add(file);
      return cid.toString();
    } catch (err) {
      this.logger.warn('Real IPFS add failed, falling back to mock: ' + (err as Error).message);
      const cid = await mockIpfs.add(file, filename);
      return cid;
    }
  }

  async getFile(cid: string): Promise<Buffer> {
    if (this.usingMock()) {
      return mockIpfs.cat(cid);
    }

    try {
      const chunks: Uint8Array[] = [];
  for await (const chunk of this.ipfs!.cat(cid)) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (err) {
      this.logger.warn('Real IPFS cat failed, falling back to mock: ' + (err as Error).message);
      return mockIpfs.cat(cid);
    }
  }
}