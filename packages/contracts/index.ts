
const CLAIMING_ABI = require('./abi/contracts/Claiming.json');
const TOKEN_ABI = require('./abi/contracts/Token.json');
const MACI_ABI = require('./abi/contracts/Maci.json');
const MESSAGE_PROCESSOR_FACTORY_ABI = require('./abi/contracts/MessageProcessorFactory.json');
const POLL_FACTORY_ABI = require('./abi/contracts/PollFactory.json');
const TALLY_FACTORY_ABI = require('./abi/contracts/TallyFactory.json');
const VERIFIER_ABI = require('./abi/contracts/Verifier.json');
const VERIFYING_KEYS_REGISTRY_ABI = require('./abi/contracts/VerifyingKeysRegistry.json');
const VOTE_VERIFIER_ABI = require('./abi/contracts/VoteVerifier.json');
const CONSTANT_INITIAL_VOICE_CREDIT_PROXY_FACTORY_ABI = require('./abi/proxy/ConstantInitialVoiceCreditProxyFactory.json');
const POSEIDON_T3_ABI = require('./abi/poseidon/PoseidonT3.json');
const POSEIDON_T4_ABI = require('./abi/poseidon/PoseidonT4.json');
const POSEIDON_T5_ABI = require('./abi/poseidon/PoseidonT5.json');
const POSEIDON_T6_ABI = require('./abi/poseidon/PoseidonT6.json');
const POLL_ABI = require('./abi/contracts/Poll.json');
const TALLY_ABI = require('./abi/contracts/Tally.json');
const MESSAGE_PROCESSOR_ABI = require('./abi/contracts/MessageProcessor.json');
const VERIFY_VOTE_ABI = require('./abi/contracts/VerifyVote.json');


const CLAIM_CONTRACT_ADDRESS = "0x1FDc22E49e39054f38479fccC17D17813EF73B11";
const TOKEN_CONTRACT_ADDRESS = "0xDa52d3Fb44fECd1eB69b7206d9c73b91CFAFA4a8";
const VERIFY_VOTE = "0xB01489a6Cb3A66AC56bCE486777307516E20ED32";
// export const FreeForAllPolicy= "0xD60c63e972271ad39Ab8b5B62dc74f59588487d0";
// export const  FreeForAllChecker ="0xC169891E4Bb0e663a66931343b0BD0A44fDADc8d";
//  export const FreeForAllPolicyFactory= "0x6199f7AB05F9ADB820461254AB77D286FD7aD443";
//  export const FreeForAllCheckerFactory= "0x9a8AA22489e9F6C0b2dBB1500176DddD43646c24";
//  export const Verifier ="0x5Ea877C2719BEC9d8bC9aC4d6F9CEF80244EB75A";
//  export const PoseidonT3 ="0x5b501E3c7Df21A51b5a79D1d9239bbD72a6Bb9d9";
//  export const PoseidonT4="0x28CD21C820F987c0A66aDb55122Dc9b49f96390d";
//  export const PoseidonT5 ="0xB5880A57f7081838f86374c03c934bcCc5f6dBB7";
//  export const PoseidonT6 ="0xE109F95F8be0fFC6a24E17bE51Bffe301C1C88Fe";
// export const  PollFactory= "0xAcEe9e6d3227E6414fa95b7Bf82870A8BD7087B7";
//  export const MessageProcessorFactory= "0x0A49d667Fa907054BdC21643D95482Bb9D0d76E2";
//  export const TallyFactory= "0x7FFaA584A6770a1bab2a0f7C63D80Bf6b5e06E03";
//  export const VerifyingKeysRegistry ="0xFccFC5704a281Bf5Ffe10543Aa1d7eF9394a7C45";
//  export const MACI= "0xF6dd97A2359Cb3F9ADff5bbBd7849Cf995c50A20";
//  export const ConstantInitialVoiceCreditProxyFactory= "0xAe0B998B50c26239fB0902CC3878366B485F0B9b"

const FreeForAll = "0x884507D6461B8Af6569E676a2df7DDf935F73dA4";
const Verifier = "0x6E7ED23F8E76DE166dBc7bAdCB8380fdd2553E05";
const VerifyingKeysRegistry = "0x0D8D601e90fD052466dd30da6E8a481aA5015D70";
const MACI = "0x427f7F83c465eb7176c98Bf056233329b10c5E1b";

module.exports = {
  VERIFY_VOTE_ABI,
  CLAIMING_ABI,
  TOKEN_ABI,
  MACI_ABI,
  MESSAGE_PROCESSOR_FACTORY_ABI,
  POLL_FACTORY_ABI,
  TALLY_FACTORY_ABI,
  VERIFIER_ABI,
  VERIFYING_KEYS_REGISTRY_ABI,
  VOTE_VERIFIER_ABI,
  CONSTANT_INITIAL_VOICE_CREDIT_PROXY_FACTORY_ABI,
  POSEIDON_T3_ABI,
  POSEIDON_T4_ABI,
  POSEIDON_T5_ABI,
  POSEIDON_T6_ABI,
  POLL_ABI,
  TALLY_ABI,
  MESSAGE_PROCESSOR_ABI,
  CLAIM_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
  VERIFY_VOTE,
  FreeForAll,
  Verifier,
  VerifyingKeysRegistry,
  MACI,
};