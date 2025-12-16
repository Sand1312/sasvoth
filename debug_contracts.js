const contracts = require('./packages/maci-contracts/build/ts/index.js');
console.log('EPolicies:', contracts.EPolicies);
if (contracts.EPolicies && contracts.EPolicies.EAS) {
  console.log('EPolicies.EAS:', contracts.EPolicies.EAS);
  console.log('SUCCESS: EPolicies is exported and has EAS.');
} else {
  console.error('FAILURE: EPolicies is missing or incomplete.');
}
