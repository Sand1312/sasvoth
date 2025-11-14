const fs = require('fs').promises;
const path = require('path');
const { sha256 } = require('multiformats/hashes/sha2');
const { CID } = require('multiformats/cid');
const raw = require('multiformats/codecs/raw');

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch (e) {}
}

async function makeCid(buf) {
  const digest = await sha256.digest(buf);
  const cid = CID.createV1(raw.code, digest);
  return cid.toString();
}

async function add(content, filename) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const cid = await makeCid(buf);
  const fileName = filename ? `${cid}-${filename}` : cid;
  const filePath = path.join(process.cwd(), 'mock_ipfs_storage', fileName);
  const stored = { cid, filename: filename ?? null, storedAt: new Date().toISOString(), content: buf.toString('utf8') };
  await fs.writeFile(filePath, JSON.stringify(stored, null, 2), 'utf8');
  return cid;
}

(async () => {
  const base = process.cwd();
  const files = ['mock-vote-options.json','mock-vote-batches.json','mock-tally-results.json'].map(f=>path.join(base,f));
  await ensureDir(path.join(process.cwd(),'mock_ipfs_storage'));
  for (const p of files) {
    try {
      const content = await fs.readFile(p);
      const cid = await add(content, path.basename(p));
      console.log(p, '->', 'ipfs://' + cid);
    } catch (err) {
      console.error('ERROR pinning', p, err.message);
    }
  }
})();
