import { Injectable, Logger } from '@nestjs/common';
import { create, IPFSHTTPClient } from 'ipfs-http-client';

@Injectable()
export class IpfsService {
  private readonly logger = new Logger(IpfsService.name);
  private readonly ipfs?: IPFSHTTPClient;
  private readonly useMock: boolean;
  private readonly mockStorage = new Map<string, Buffer>(); // Mock storage

  constructor() {
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

  /** Upload file to IPFS */
  async addFile(file: Buffer, filename?: string): Promise<string> {
    if (!this.usingMock()) {
      try {
        const { cid } = await this.ipfs!.add(file);
        return cid.toString();
      } catch (err) {
        this.logger.warn(
          `Real IPFS add failed, switching to mock: ${(err as Error).message}`,
        );
      }
    }

    const fakeCid = `mock-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    this.mockStorage.set(fakeCid, file);
    this.logger.log(`Stored file in mock IPFS with CID: ${fakeCid}`);
    return fakeCid;
  }

  /** Fetch file from IPFS */
  async getFile(cid: string): Promise<Buffer> {
    if (!this.usingMock()) {
      try {
        const chunks: Uint8Array[] = [];

        for await (const chunk of this.ipfs!.cat(cid)) {
          chunks.push(chunk);
        }

        return Buffer.concat(chunks);
      } catch (err) {
        this.logger.warn(
          `Real IPFS cat failed, switching to mock: ${(err as Error).message}`,
        );
      }
    }

    // MOCK fallback
    const data = this.mockStorage.get(cid);
    if (!data) {
      throw new Error(`Mock IPFS: CID ${cid} not found`);
    }

    return data;
  }
}
