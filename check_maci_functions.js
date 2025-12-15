const ethers = require("ethers");

const MACI_ADDRESS = "0x3733a522f55126EB592520A2A6A8473172954cF6";
const RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc";

// MACI ABI for checking
const MACI_ABI = [
  "function nextPollId() view returns (uint256)",
  "function totalSignups() view returns (uint256)",
  "function getPoll(uint256) view returns (address poll, address messageProcessor, address tally)",
  "function stateTreeDepth() view returns (uint8)",
];

async function check() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  console.log("Checking contract:", MACI_ADDRESS);

  const contract = new ethers.Contract(MACI_ADDRESS, MACI_ABI, provider);

  try {
    const nextPollId = await contract.nextPollId();
    console.log("nextPollId():", nextPollId.toString());
  } catch (e) {
    console.log("nextPollId() failed:", e.reason || e.message);
  }

  try {
    const totalSignups = await contract.totalSignups();
    console.log("totalSignups():", totalSignups.toString());
  } catch (e) {
    console.log("totalSignups() failed:", e.reason || e.message);
  }

  try {
    const depth = await contract.stateTreeDepth();
    console.log("stateTreeDepth():", depth.toString());
  } catch (e) {
    console.log("stateTreeDepth() failed:", e.reason || e.message);
  }

  try {
    const poll = await contract.getPoll(0);
    console.log("getPoll(0):", poll);
  } catch (e) {
    console.log("getPoll(0) failed:", e.reason || e.message);
  }
}

check();
