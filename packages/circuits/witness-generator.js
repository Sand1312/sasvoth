/**
 * Witness Generator for VoteProof Circuit
 * 
 * This generates input data for the circuit based on user vote details
 * Use this to create witness before calling snarkjs.groth16.prove()
 */

const snarkjs = require('snarkjs')

/**
 * Convert bigint to field element (modulo snark scalar field)
 */
function toBigIntField(value) {
  const SNARK_SCALAR_FIELD = BigInt(
    '21888242871839275222246405745257275088548364400416034343698204186575808495617'
  )
  if (typeof value === 'string') {
    return BigInt(value) % SNARK_SCALAR_FIELD
  }
  return BigInt(value) % SNARK_SCALAR_FIELD
}

/**
 * Hash function for commitment
 */
async function hashCommitment(vote, voiceCredits, nonce, pollId, privateKey) {
  // Simulate Poseidon hash (use poseidon-js in production)
  const inputs = [
    toBigIntField(vote),
    toBigIntField(voiceCredits),
    toBigIntField(nonce),
    toBigIntField(pollId),
    toBigIntField(privateKey),
  ]

  // Simple hash for now (replace with proper Poseidon hash)
  return inputs.reduce((acc, val) => {
    return (acc + val) % toBigIntField(0)
  }, BigInt(0))
}

/**
 * Generate witness object for VoteProof circuit
 */
async function generateWitness(input) {
  const {
    privateKey,
    vote,
    voiceCredits,
    nonce,
    pollId,
    pubkeyX,
    pubkeyY,
    voiceCreditBalance,
    voterIndex,
    voteCommitment,
    outcome,
    stateLeaf,
  } = input

  // Convert all to field elements
  const witness = {
    // Private inputs
    privateKey: toBigIntField(privateKey),
    vote: toBigIntField(vote),
    voiceCredits: toBigIntField(voiceCredits),
    nonce: toBigIntField(nonce),
    pollId: toBigIntField(pollId),
    pubkeyX: toBigIntField(pubkeyX),
    pubkeyY: toBigIntField(pubkeyY),
    voiceCreditBalance: toBigIntField(voiceCreditBalance),

    // Public inputs
    voterIndex: toBigIntField(voterIndex),
    voteCommitment: toBigIntField(voteCommitment),
    outcome: toBigIntField(outcome),
    stateLeaf: toBigIntField(stateLeaf),
  }

  return witness
}

/**
 * Convert witness to array format for snarkjs
 */
function witnessToArray(witness) {
  return [
    witness.privateKey,
    witness.vote,
    witness.voiceCredits,
    witness.nonce,
    witness.pollId,
    witness.pubkeyX,
    witness.pubkeyY,
    witness.voiceCreditBalance,
    witness.voterIndex,
    witness.voteCommitment,
    witness.outcome,
    witness.stateLeaf,
  ]
}

module.exports = {
  generateWitness,
  witnessToArray,
  toBigIntField,
  hashCommitment,
}
