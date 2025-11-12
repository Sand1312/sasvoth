const fs = require('fs')
const path = require('path')

const CIRCUIT_DIR = path.join(__dirname, 'build')

/**
 * Load compiled circuit files and artifacts
 * @returns {Object} Circuit artifacts including verification key, zkey, wasm
 */
function loadCircuit() {
  const files = {
    wasm: path.join(CIRCUIT_DIR, 'VoteProof_js', 'VoteProof.wasm'),
    zkey: path.join(CIRCUIT_DIR, 'VoteProof_0000.zkey'),
    vkey: path.join(CIRCUIT_DIR, 'verification_key.json'),
    r1cs: path.join(CIRCUIT_DIR, 'VoteProof.r1cs'),
  }

  // Verify files exist
  for (const [name, filePath] of Object.entries(files)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Missing circuit file: ${name} at ${filePath}. Run 'npm run build:docker' first.`
      )
    }
  }

  return {
    wasm: fs.readFileSync(files.wasm),
    zkey: fs.readFileSync(files.zkey),
    vkey: JSON.parse(fs.readFileSync(files.vkey, 'utf8')),
    r1cs: fs.readFileSync(files.r1cs),
    paths: files,
  }
}

/**
 * Get verification key for smart contract
 * @returns {Object} Verification key JSON
 */
function getVerificationKey() {
  const vkeyPath = path.join(CIRCUIT_DIR, 'verification_key.json')
  if (!fs.existsSync(vkeyPath)) {
    throw new Error(`Verification key not found at ${vkeyPath}. Run 'npm run build:docker' first.`)
  }
  return JSON.parse(fs.readFileSync(vkeyPath, 'utf8'))
}

/**
 * Get public inputs template for circuit
 * @returns {Object} Template for public inputs
 */
function getPublicInputsTemplate() {
  return {
    voterIndex: '0',
    voteCommitment: '0',
    outcome: '0',
    stateLeaf: '0',
  }
}

/**
 * Get private inputs template for circuit
 * @returns {Object} Template for private inputs
 */
function getPrivateInputsTemplate() {
  return {
    privateKey: '0',
    vote: '0',
    voiceCredits: '0',
    nonce: '0',
    pollId: '0',
    pubkeyX: '0',
    pubkeyY: '0',
    voiceCreditBalance: '0',
  }
}

/**
 * Get circuit info including both public and private inputs
 * @returns {Object} Complete circuit information
 */
function getCircuitInfo() {
  const vkey = getVerificationKey()

  return {
    circuitName: 'VoteProof',
    publicInputs: getPublicInputsTemplate(),
    privateInputs: getPrivateInputsTemplate(),
    verificationKey: vkey,
    verificationKeyPath: path.join(CIRCUIT_DIR, 'verification_key.json'),
    zkeyPath: path.join(CIRCUIT_DIR, 'VoteProof_0000.zkey'),
    wasmPath: path.join(CIRCUIT_DIR, 'VoteProof_js', 'VoteProof.wasm'),
    description: 'Zero-knowledge proof for MACI voting system',
    constraints: {
      description: [
        'Verify state leaf is valid (hashes correctly)',
        'Verify vote commitment is valid',
        'Verify user vote matches winning outcome',
      ],
    },
  }
}

module.exports = {
  loadCircuit,
  getVerificationKey,
  getPublicInputsTemplate,
  getPrivateInputsTemplate,
  getCircuitInfo,
}
