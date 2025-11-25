import { Injectable, Logger } from '@nestjs/common';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import mockIpfs from '@sasvoth/ipfs-service/src/ipfs/mock-ipfs.client';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly ipfs?: IPFSHTTPClient;
  private readonly useMock: boolean;

  constructor() {
    this.useMock = process.env.USE_MOCK_IPFS === 'true';

    if (!this.useMock) {
      try {
        this.ipfs = create({
          host: 'localhost',
          port: 5001,
          protocol: 'http',
        });
    this.useMock = process.env.USE_MOCK_IPFS === 'true';

    if (!this.useMock) {
      try {
        this.ipfs = create({
          host: 'localhost',
          port: 5001,
          protocol: 'http',
        });

        this.logger.log('Connected to IPFS node on 127.0.0.1:5001');
      } catch (err) {
        this.logger.warn(
          `Failed to connect to IPFS node, falling back to mock: ${(err as Error).message}`,
        );
      }
    } else {
      this.logger.log('USE_MOCK_IPFS=true, using mock IPFS client');
    }
  }

  private usingMock(): boolean {
    return this.useMock || !this.ipfs;
  }

  private usingMock(): boolean {
    return this.useMock || !this.ipfs;
  }

  /** Upload file to IPFS */
  async addFile(file: Buffer, filename?: string): Promise<string> {
    if (this.usingMock()) {
      return mockIpfs.add(file, filename);
    }

    try {
      const { cid } = await this.ipfs!.add(file);
      return cid.toString();
    } catch (err) {
      this.logger.warn(
        `Real IPFS add failed, falling back to mock: ${(err as Error).message}`,
      );
      return mockIpfs.add(file, filename);
    }
  }

  /** Fetch file from IPFS */
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
      this.logger.warn(
        `Real IPFS cat failed, falling back to mock: ${(err as Error).message}`,
      );
      return mockIpfs.cat(cid);
    }

    return data;
  }
}
