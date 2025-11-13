const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch (e) {}
}

function makeCid(content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `Qm${hash.slice(0,44)}`;
}

async function add(content, filename) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const cid = makeCid(buf);
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
