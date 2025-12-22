/**
 * Deploy SafeSignupGatekeeper to Arbitrum Sepolia
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-gatekeeper.ts --network arbitrum_sepolia
 * 
 * Environment variables required:
 *   - PRIVATE_KEY: Deployer wallet private key
 *   - MACI_ADDRESS: Address of the deployed MACI contract
 */

import { ethers } from "hardhat";

const EIP712_DOMAIN_NAME = "SaSvoth Gatekeeper";
const EIP712_DOMAIN_VERSION = "1";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying SafeSignupGatekeeper with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get MACI address from environment
  const maciAddress = process.env.MACI_ADDRESS;
  if (!maciAddress) {
    throw new Error("MACI_ADDRESS environment variable is required");
  }
  console.log("Using MACI Address:", maciAddress);

  // Deploy SafeSignupGatekeeper
  const GatekeeperFactory = await ethers.getContractFactory("SafeSignupGatekeeper");
  const gatekeeper = await GatekeeperFactory.deploy(
    maciAddress,
    EIP712_DOMAIN_NAME,
    EIP712_DOMAIN_VERSION
  );

  await gatekeeper.waitForDeployment();
  
  const gatekeeperAddress = await gatekeeper.getAddress();
  console.log("SafeSignupGatekeeper deployed to:", gatekeeperAddress);

  // Log deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("Network: arbitrum_sepolia (chainId: 421614)");
  console.log("Gatekeeper Address:", gatekeeperAddress);
  console.log("MACI Address:", maciAddress);
  console.log("EIP-712 Domain Name:", EIP712_DOMAIN_NAME);
  console.log("EIP-712 Domain Version:", EIP712_DOMAIN_VERSION);

  // Verify contract info
  console.log("\n=== Next Steps ===");
  console.log("1. Set NEXT_PUBLIC_GATEKEEPER_ADDRESS in apps/web/.env:");
  console.log(`   NEXT_PUBLIC_GATEKEEPER_ADDRESS=${gatekeeperAddress}`);
  console.log("\n2. Add relayer address (if different from deployer):");
  console.log(`   await gatekeeper.setRelayer("<relayer_address>", true)`);
  console.log("\n3. Verify contract on Arbiscan:");
  console.log(`   npx hardhat verify --network arbitrum_sepolia ${gatekeeperAddress} "${maciAddress}" "${EIP712_DOMAIN_NAME}" "${EIP712_DOMAIN_VERSION}"`);

  return gatekeeperAddress;
}

main()
  .then(() => {
    console.log("\n✅ Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
