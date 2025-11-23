// scripts/runProofTest.js
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    // Resolve the package's built index.js relative to this script's directory
    const modPath = path.join(__dirname, '..', 'dist', 'index.js');
    if (!fs.existsSync(modPath)) {
      throw new Error(`Built module not found at ${modPath}. Please run: pnpm --filter @sasvoth/circuits build`);
    }

    // Try require first (CommonJS), fallback to dynamic import if needed
    let mod;
    try {
      mod = require(modPath);
    } catch (e) {
      mod = await import(modPath);
    }

    const { VoteProofGenerator } = mod;
    if (!VoteProofGenerator) throw new Error('VoteProofGenerator not found in module');

    const pkgMain = modPath; // already resolved
    const pkgDir = path.dirname(pkgMain);
    console.log('pkgDir ->', pkgDir);

    // load example input from package root (packages/circuits/input.json)
    const inputPath = path.join(__dirname, '..', 'input.json');
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found at ${inputPath}`);
    }

    console.log('inputPath ->', inputPath);
    const rawInput = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log('Loaded input keys:', Object.keys(rawInput));

    // Sanitize input: convert numeric values to strings and normalize hex keys
    // circom/snarkjs expects BigInts as decimal strings or '0x' prefixed hex strings
    function sanitize(v, keyName) {
      if (Array.isArray(v)) return v.map((x) => sanitize(x, keyName));
      if (v && typeof v === 'object') {
        const out = {};
        for (const k of Object.keys(v)) out[k] = sanitize(v[k], k);
        return out;
      }
      // numbers -> decimal strings
      if (typeof v === 'number') return String(v);
      // if it's a string that looks like hex (contains a-f and only hex chars),
      // prefix with 0x so BigInt can parse it (BigInt supports 0x... hex literals)
      if (typeof v === 'string') {
        const s = v.trim();
        if (s.startsWith('0x') || s.startsWith('0X')) return s;
        // heuristic: if string contains any hex letter and is all hex chars, treat as hex
        if (/^[0-9a-fA-F]+$/.test(s) && /[a-fA-F]/.test(s)) return '0x' + s;
        // special-case keys named privateKey to ensure hex/private keys are parsed
        if (keyName === 'privateKey' && /^[0-9a-fA-F]+$/.test(s)) return '0x' + s;
        return s;
      }
      return v;
    }

    const input = sanitize(rawInput);
    try { console.log('[Sanitized input]', JSON.stringify(input)); } catch(e) { console.log('[Sanitized input] cannot stringify'); }

    const gen = new VoteProofGenerator(pkgDir);
    console.log('Generator constructed.');

    const start = Date.now();
    const result = await gen.generateVoteProof(input);
    console.log('Result:', result);
    console.log('Elapsed ms:', Date.now() - start);
  } catch (err) {
    console.error('Run test failed:', err && (err.stack || err));
    process.exit(1);
  }
})();