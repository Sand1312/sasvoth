// MACI Configuration
export const MACI_ADDRESS = '0x427f7F83c465eb7176c98Bf056233329b10c5E1b';
export const COORDINATOR_URL = process.env.MACI_COORDINATOR_URL || 'http://localhost:3001';

// Zkey paths (for Next.js public folder)
export const ZKEY_PATHS = {
  pollJoining: {
    zkey: '/zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey',
    wasm: '/zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm',
  },
};
