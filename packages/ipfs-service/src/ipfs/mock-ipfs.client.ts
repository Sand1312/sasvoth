import { promises as fs } from 'fs';
import * as path from 'path';
// Note: we avoid static imports from `multiformats` to prevent
// CJS import issues. We dynamically import the ESM-only modules inside
// makeCid() so the code works whether Node loads this file as CJS or ESM.

/**
 * Mock IPFS client implemented as a singleton using real CIDv1 generation
 * (multiformats). Files are stored under <project>/mock_ipfs_storage as
 * `<cid>-<originalFilename>` and the stored file contains a small wrapper
 * with metadata for easy inspection.
 */
export class MockIpfsClient {
  private static instance: MockIpfsClient;
  private storageDir: string;

  private constructor() {
    this.storageDir = path.resolve(process.cwd(), 'mock_ipfs_storage');
  }

  static getInstance(): MockIpfsClient {
    if (!MockIpfsClient.instance) {
      MockIpfsClient.instance = new MockIpfsClient();
    }
    return MockIpfsClient.instance;
  }

  private async ensureStorageDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (err) {
      // ignore
    }
  }

  private async makeCid(content: Buffer): Promise<string> {
    // dynamic import to avoid package export issues when running under CJS
    const { sha256 } = await import('multiformats/hashes/sha2');
    const raw = await import('multiformats/codecs/raw');
    const { CID } = await import('multiformats/cid');
    const digest = await sha256.digest(content);
    const cid = CID.createV1(raw.code, digest);
    return cid.toString();
  }

  async add(content: Buffer | string, filename?: string): Promise<string> {
    await this.ensureStorageDir();
    const buf = typeof content === 'string' ? Buffer.from(content) : content;
    const cid = await this.makeCid(buf);
    const fileName = filename ? `${cid}-${filename}` : cid;
    const filePath = path.join(this.storageDir, fileName);
    const stored = {
      cid,
      filename: filename ?? null,
      storedAt: new Date().toISOString(),
      content: buf.toString('utf8'),
    };
    await fs.writeFile(filePath, JSON.stringify(stored, null, 2), 'utf8');
    return cid;
  }

  async cat(cid: string): Promise<Buffer> {
    await this.ensureStorageDir();
    const normalized = cid.startsWith('ipfs://') ? cid.replace('ipfs://', '') : cid;
    const files = await fs.readdir(this.storageDir);
    const match = files.find((f) => f.startsWith(normalized));
    if (!match) throw new Error(`CID not found: ${normalized}`);
    const data = await fs.readFile(path.join(this.storageDir, match), 'utf8');
    return Buffer.from(data, 'utf8');
  }

  async list(): Promise<string[]> {
    await this.ensureStorageDir();
    const files = await fs.readdir(this.storageDir);
    return files.map((f) => {
      const idx = f.indexOf('-');
      return idx === -1 ? f : f.slice(0, idx);
    });
  }

  async pinExisting(filePaths: string[]): Promise<Record<string, string>> {
    await this.ensureStorageDir();
    const results: Record<string, string> = {};
    for (const p of filePaths) {
      try {
        const content = await fs.readFile(p);
        const cid = await this.add(content, path.basename(p));
        results[p] = cid;
      } catch (err) {
        results[p] = `ERROR: ${(err as Error).message}`;
      }
    }
    return results;
  }
}

export default MockIpfsClient.getInstance();
