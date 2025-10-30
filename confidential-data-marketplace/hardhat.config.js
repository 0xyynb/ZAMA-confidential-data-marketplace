require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Clash proxy configuration
const HttpsProxyAgent = require('https-proxy-agent');
const proxyAgent = new HttpsProxyAgent.HttpsProxyAgent('http://127.0.0.1:7897');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
      // FHEVM 需要的 viaIR 优化（用于 FHE 运算）
      viaIR: process.env.FHEVM_MODE === 'true',
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      httpHeaders: {
        // Add proxy agent
      },
      timeout: 60000, // 60 seconds timeout
    },
    // Zama Devnet（用于 FHEVM 部署）
    zamaDevnet: {
      url: process.env.ZAMA_RPC_URL || "https://devnet.zama.ai",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8009,
      timeout: 120000, // FHE 合约需要更长时间
      gasPrice: "auto",
    },
    // Zama Local (用于本地 FHEVM 测试)
    zamaLocal: {
      url: "http://localhost:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 9000,
      timeout: 120000,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  // Configure proxy for HTTP requests
  mocha: {
    timeout: 60000
  }
};
