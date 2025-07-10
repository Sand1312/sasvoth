import "@nomicfoundation/hardhat-toolbox";
import { config as envConfig } from "dotenv";

import path from "path";

import type { HardhatUserConfig } from "hardhat/config";

import { DEFAULT_ETH_SK, DEFAULT_ETH_PROVIDER } from "./ts/utils/defaults";

envConfig({ path: path.resolve(__dirname, '../../.env') });

const parentDir = __dirname.includes("build") ? ".." : "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || DEFAULT_ETH_PROVIDER;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || DEFAULT_ETH_SK;
console.log("SEPOLIA_RPC_URL:", process.env.SEPOLIA_RPC_URL);
console.log("SEPOLIA_PRIVATE_KEY:", process.env.SEPOLIA_PRIVATE_KEY);
const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: process.env.ETH_PROVIDER || DEFAULT_ETH_PROVIDER,
      accounts: [process.env.ETH_SK || DEFAULT_ETH_SK],
      loggingEnabled: false,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [SEPOLIA_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  solidity: "0.8.19",
  paths: {
    sources: path.resolve(__dirname, parentDir, "../../packages/contracts/contracts"),
    artifacts: path.resolve(__dirname, parentDir, "../../packages/contracts/artifacts"),
  },
};

export default config;