// MACI Configuration
export const MACI_ADDRESS = '0xD665e6E57e73fb926c5A6Cd78CDd07e5f05a65A2';
export const COORDINATOR_URL = process.env.MACI_COORDINATOR_URL || 'http://localhost:3001';

// Zkey paths (for Next.js public folder)
export const ZKEY_PATHS = {
  pollJoining: {
    zkey: '/zkeys/PollJoining_10_test/PollJoining_10_test.0.zkey',
    wasm: '/zkeys/PollJoining_10_test/PollJoining_10_test_js/PollJoining_10_test.wasm',
  },
};
