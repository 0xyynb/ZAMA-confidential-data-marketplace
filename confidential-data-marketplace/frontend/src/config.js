/**
 * Application Configuration
 * Update based on deployment environment
 */

// ==================== 🔧 配置模式 ====================
// 🎯 双合约切换支持！用户可以手动选择 Mock 或 FHE
// 从 localStorage 读取用户选择，默认 Mock
function getUserContractMode() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const mode = localStorage.getItem('contractMode');
      console.log('📋 localStorage contractMode:', mode);
      return mode || 'mock';
    }
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  return 'mock';
}

// ⚠️ 临时强制使用 Mock 模式（用于调试）
// 设置为 true 启用 FHE 模式，false 使用 Mock 模式
export const FHEVM_ENABLED = false; // ← 强制 Mock 模式

// Contract Address (根据模式自动选择)
// Mock 模式: Sepolia Testnet
export const CONTRACT_ADDRESS_MOCK = "0x9e138064d8B68E027c8Fe0C4da03325C91cecaeb";

// FHE 模式: Sepolia (✅ 已部署)
export const CONTRACT_ADDRESS_FHE = import.meta.env.VITE_FHE_CONTRACT_ADDRESS || "0x39adb32637D1E16C1Cd7159EE3a24C13c161FE69";

// 当前使用的合约地址（根据用户选择）
export const CONTRACT_ADDRESS = FHEVM_ENABLED ? CONTRACT_ADDRESS_FHE : CONTRACT_ADDRESS_MOCK;

// Simplified Contract ABI (Essential functions only)
export const CONTRACT_ABI = [
  // Dataset Management
  "function uploadDataset(string name, string description, uint256[] dataArray, uint256 pricePerQuery) returns (uint256)",
  "function updateDataset(uint256 datasetId, uint256 newPrice, bool active)",
  "function getDataset(uint256 datasetId) view returns (uint256 id, address owner, string name, string description, uint256 dataSize, uint256 pricePerQuery, uint256 totalQueries, uint256 totalRevenue, uint256 createdAt, bool active)",
  "function getActiveDatasets() view returns (uint256[])",
  "function getProviderDatasets(address provider) view returns (uint256[])",
  "function getDatasetCount() view returns (uint256)",
  
  // Query Execution
  "function executeQuery(uint256 datasetId, uint8 queryType, uint256 parameter) payable returns (uint256)",
  "function getQuery(uint256 queryId) view returns (uint256 id, uint256 datasetId, address buyer, uint8 queryType, uint256 parameter, uint256 result, uint8 status, uint256 price, uint256 timestamp)",
  "function getBuyerQueries(address buyer) view returns (uint256[])",
  "function getQueryCount() view returns (uint256)",
  
  // Platform Stats
  "function getPlatformStats() view returns (uint256 totalDatasets, uint256 totalQueries, uint256 totalPlatformFees)",
  "function platformBalance() view returns (uint256)",
  
  // Constants
  "function MIN_PRICE() view returns (uint256)",
  "function MAX_DATA_SIZE() view returns (uint256)",
  "function PLATFORM_FEE_PERCENT() view returns (uint256)",
  
  // Events
  "event DatasetCreated(uint256 indexed datasetId, address indexed owner, string name, uint256 pricePerQuery)",
  "event DatasetUpdated(uint256 indexed datasetId, uint256 newPrice, bool active)",
  "event QueryExecuted(uint256 indexed queryId, uint256 indexed datasetId, address indexed buyer, uint8 queryType, uint256 result)",
  "event QueryRefunded(uint256 indexed queryId, address indexed buyer, uint256 amount)",
  "event RevenueWithdrawn(address indexed provider, uint256 amount)",
  "event PlatformFeeWithdrawn(address indexed owner, uint256 amount)"
];

// Query Types Enum (matches contract)
export const QUERY_TYPES = {
  COMPUTE_MEAN: 0,
  COMPUTE_VARIANCE: 1,
  COUNT_ABOVE: 2,
  COUNT_BELOW: 3
};

// Keep legacy name for compatibility
export const QueryType = QUERY_TYPES;

// Query Type Display Names
export const QUERY_TYPE_NAMES = {
  0: 'Calculate Mean',
  1: 'Calculate Variance',
  2: 'Count Above Threshold',
  3: 'Count Below Threshold'
};

// Query Status Enum (matches contract)
export const QUERY_STATUS = {
  PENDING: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  FAILED: 3,
  REFUNDED: 4
};

// Keep legacy name for compatibility
export const QueryStatus = QUERY_STATUS;

// Query Status Display Names
export const QUERY_STATUS_NAMES = {
  0: 'Pending',
  1: 'Processing',
  2: 'Completed',
  3: 'Failed',
  4: 'Refunded'
};

// Network Configuration
export const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: "Hardhat",
    rpcUrl: "http://127.0.0.1:8545",
    blockExplorer: null,
    isFHEVM: false
  },
  sepolia: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    isFHEVM: true,  // ⚠️ Sepolia 支持 FHEVM（使用 SepoliaZamaFHEVMConfig）
    gatewayUrl: "https://gateway.sepolia.zama.ai"
  },
  zamaDevnet: {
    chainId: 8009,
    name: "Zama Devnet",
    rpcUrl: "https://devnet.zama.ai",
    blockExplorer: "https://explorer.zama.ai",
    isFHEVM: true
  },
  zamaLocal: {
    chainId: 9000,
    name: "Zama Local",
    rpcUrl: "http://localhost:8545",
    blockExplorer: null,
    isFHEVM: true
  }
};

// Current Network (auto-detect or set manually)
export const CURRENT_NETWORK = "hardhat";

// FHEVM Gateway Configuration (for future FHEVM version)
export const FHEVM_CONFIG = {
  localhost: {
    chainId: 31337,
    gatewayUrl: "http://localhost:8545",
    aclAddress: null
  },
  sepolia: {
    chainId: 11155111,
    gatewayUrl: "https://gateway.sepolia.zama.ai",
    aclAddress: null
  }
};

// Application Settings
export const APP_CONFIG = {
  name: "Confidential Data Marketplace",
  description: "Privacy-Preserving Data Trading Platform",
  version: "1.0.0",
  isMockVersion: !FHEVM_ENABLED, // 根据 FHEVM_ENABLED 自动判断
  maxDatasetSize: 1000,
  minPrice: "0.001", // ETH
  platformFee: 5 // percent
};

// ==================== 🔐 FHE 相关配置 ====================

/**
 * 检查当前链是否为 FHEVM 网络
 * @param {number} chainId - 链 ID
 * @returns {boolean}
 */
export function isFHEVMNetwork(chainId) {
  // ⚠️ 重要：Sepolia (11155111) 支持 FHEVM！
  // Zama 官方在 Sepolia 上部署了 FHEVM 基础设施
  // 使用 SepoliaZamaFHEVMConfig 即可在 Sepolia 上使用 FHE
  const FHEVM_CHAIN_IDS = [
    11155111, // Sepolia (✅ 当前可用)
    8009,     // Zama Devnet (⏳ 未来)
    9000      // Zama Local (本地测试)
  ];
  return FHEVM_CHAIN_IDS.includes(chainId);
}

/**
 * 获取网络配置
 * @param {number} chainId - 链 ID
 * @returns {object|null}
 */
export function getNetworkConfig(chainId) {
  return Object.values(NETWORKS).find(network => network.chainId === chainId) || null;
}

/**
 * 获取网络名称
 * @param {number} chainId - 链 ID
 * @returns {string}
 */
export function getNetworkName(chainId) {
  const config = getNetworkConfig(chainId);
  return config ? config.name : `Unknown Network (${chainId})`;
}

/**
 * 获取当前应该使用的合约 ABI
 * @param {boolean} isFHEVM - 是否为 FHEVM 模式
 * @returns {array}
 */
export function getContractABI(isFHEVM) {
  if (isFHEVM) {
    // FHE 合约 ABI（参数不同）
    return [
      // Dataset Management (FHE version)
      "function uploadDataset(string name, string description, bytes32[] inputHandles, bytes[] inputProofs, uint256 pricePerQuery) returns (uint256)",
      "function getDataset(uint256 datasetId) view returns (uint256 id, address owner, string name, string description, uint256 dataSize, uint256 pricePerQuery, uint256 totalQueries, uint256 totalRevenue, uint256 createdAt, bool active)",
      "function getActiveDatasets() view returns (uint256[])",
      "function getDatasetCount() view returns (uint256)",
      
      // Query Execution (FHE version)
      "function executeQuery(uint256 datasetId, uint8 queryType, bytes32 parameterHandle, bytes parameterProof) payable returns (uint256)",
      "function getQuery(uint256 queryId) view returns (uint256 id, uint256 datasetId, address buyer, uint8 queryType, uint256 parameter, uint32 result, uint8 status, uint256 price, uint256 timestamp)",
      "function getQueryCount() view returns (uint256)",
      
      // Events
      "event DatasetCreated(uint256 indexed datasetId, address indexed owner, string name, uint256 dataSize, uint256 pricePerQuery)",
      "event QueryExecuted(uint256 indexed queryId, uint256 indexed datasetId, address indexed buyer, uint8 queryType, uint256 price)",
      "event DecryptionRequested(uint256 indexed requestId, uint256 indexed queryId, uint256 timestamp)",
      "event QueryCompleted(uint256 indexed queryId, uint32 result)"
    ];
  } else {
    // Mock 合约 ABI（当前版本）
    return CONTRACT_ABI;
  }
}
