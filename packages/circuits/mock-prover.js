/**
 * Mock Proof Generator for Development
 * 
 * Since circom/snarkjs full setup requires significant resources,
 * this provides mock proofs for testing frontend integration
 */

const crypto = require('crypto')

/**
 * Generate mock proof for testing
 */
function generateMockProof(input) {
  // In production, this would be: snarkjs.groth16.prove(zkey, witness)
  // For now, generate consistent proof based on input

  const inputHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex')

  const proof = {
    pi_a: [
      `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
      `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
      '0x1',
    ],
    pi_b: [
      [
        `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
        `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
      ],
      [
        `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
        `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
      ],
      ['0x1', '0x0'],
    ],
    pi_c: [
      `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
      `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`,
      '0x1',
    ],
    protocol: 'groth16',
    curve: 'bn128',
  }

  const publicSignals = [inputHash, inputHash, inputHash, inputHash]

  return { proof, publicSignals }
}

/**
 * Verify mock proof
 */
function verifyMockProof(proof, publicSignals) {
  // In production, verify against on-chain
  // For testing, just check structure
  return (
    proof &&
    proof.pi_a &&
    proof.pi_b &&
    proof.pi_c &&
    publicSignals &&
    Array.isArray(publicSignals) &&
    publicSignals.length === 4
  )
}

module.exports = {
  generateMockProof,
  verifyMockProof,
}
