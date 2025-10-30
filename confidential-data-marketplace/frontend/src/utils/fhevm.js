/**
 * FHEVM 工具函数
 * 用于加密数据、解密结果、初始化 FHEVM 实例
 */

import { createInstance } from 'fhevmjs';
import { ethers } from 'ethers';

let fhevmInstance = null;

/**
 * 初始化 FHEVM 实例
 * @param {object} provider - ethers provider
 * @param {string} contractAddress - 合约地址
 * @returns {Promise<object>} FHEVM 实例
 */
export async function initFhevm(provider, contractAddress) {
  console.log('🔐 正在初始化 FHEVM 实例...');
  
  try {
    if (fhevmInstance) {
      console.log('✅ 使用已有的 FHEVM 实例');
      return fhevmInstance;
    }
    
    // 获取网络信息
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    console.log(`📡 网络: ${network.name} (Chain ID: ${chainId})`);
    
    // ⚠️ 注意：Sepolia 上的 FHEVM 可能需要不同的初始化参数
    // 目前使用简化配置
    const config = {
      chainId,
      publicKey: '', // 将由 SDK 自动获取
      gatewayUrl: getGatewayUrl(chainId),
    };
    
    console.log('🔧 FHEVM 配置:', config);
    
    // 创建 FHEVM 实例
    fhevmInstance = await createInstance(config);
    
    console.log('✅ FHEVM 实例初始化成功');
    return fhevmInstance;
  } catch (error) {
    console.error('❌ FHEVM 初始化失败:', error);
    console.error('   错误详情:', error.message);
    
    // 如果初始化失败，返回 null 而不是抛出错误
    // 这样可以在没有 FHEVM 的情况下继续运行
    console.warn('⚠️ 将在无 FHEVM 加密的模式下继续');
    return null;
  }
}

/**
 * 获取 FHEVM 实例
 */
export function getFhevmInstance() {
  if (!fhevmInstance) {
    throw new Error('FHEVM instance not initialized. Call initFhevm() first.');
  }
  return fhevmInstance;
}

/**
 * 加密单个 uint32 值
 * @param {number} value - 要加密的值
 * @param {string} contractAddress - 合约地址
 * @returns {Promise<object>} { data, proof } 加密数据和证明
 */
export async function encryptUint32(value, contractAddress) {
  console.log(`🔐 加密数据: ${value}`);
  
  try {
    const instance = getFhevmInstance();
    
    // 使用 FHEVM 实例加密
    const encrypted = instance.encrypt32(value);
    
    // 生成输入证明（用于合约验证）
    const proof = instance.generateInputProof(encrypted.handles, contractAddress);
    
    return {
      data: encrypted.handles[0],
      proof: proof,
    };
  } catch (error) {
    console.error('❌ 加密失败:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * 批量加密 uint32 数组
 * @param {number[]} values - 要加密的值数组
 * @param {string} contractAddress - 合约地址
 * @returns {Promise<object[]>} 加密数据和证明数组
 */
export async function encryptUint32Array(values, contractAddress) {
  console.log(`🔐 批量加密 ${values.length} 个数据...`);
  
  const encrypted = [];
  for (let i = 0; i < values.length; i++) {
    try {
      const result = await encryptUint32(values[i], contractAddress);
      encrypted.push(result);
      
      if ((i + 1) % 10 === 0) {
        console.log(`   进度: ${i + 1}/${values.length}`);
      }
    } catch (error) {
      console.error(`❌ 第 ${i + 1} 个数据加密失败:`, error);
      throw error;
    }
  }
  
  console.log(`✅ 批量加密完成: ${encrypted.length} 个数据`);
  return encrypted;
}

/**
 * 请求解密（通过 Gateway）
 * @param {object} contract - 合约实例
 * @param {string} queryId - 查询 ID
 * @returns {Promise<number>} 解密后的结果
 */
export async function requestDecryption(contract, queryId) {
  console.log(`🔓 请求解密查询 #${queryId}...`);
  
  try {
    // 轮询查询状态，直到解密完成
    const maxAttempts = 60; // 最多等待 60 次（约 2 分钟）
    const pollInterval = 2000; // 每 2 秒检查一次
    
    for (let i = 0; i < maxAttempts; i++) {
      const query = await contract.getQuery(queryId);
      const status = query.status; // QueryStatus enum
      
      console.log(`   尝试 ${i + 1}/${maxAttempts}: 状态=${status}`);
      
      // 状态枚举: 0=PENDING, 1=PROCESSING, 2=COMPLETED, 3=FAILED, 4=REFUNDED
      if (status === 2) { // COMPLETED
        console.log(`✅ 解密完成: ${query.result}`);
        return {
          success: true,
          result: Number(query.result),
          status: 'completed',
        };
      } else if (status === 3) { // FAILED
        throw new Error('Query failed');
      } else if (status === 4) { // REFUNDED
        throw new Error('Query refunded');
      }
      
      // 等待后再次检查
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    // 超时
    throw new Error('Decryption timeout (2 minutes)');
  } catch (error) {
    console.error('❌ 解密失败:', error);
    throw error;
  }
}

/**
 * 获取 ACL 地址（Access Control List）
 * @param {number} chainId - 链 ID
 * @returns {Promise<string>} ACL 合约地址
 */
async function getACLAddress(chainId) {
  // FHEVM ACL 地址（根据 Zama 官方文档）
  const ACL_ADDRESSES = {
    11155111: '0x8Ba5FdfF9021E819c7F870Db8B03f2A0963c6643', // Sepolia (✅ 官方地址)
    8009: '0x2Fb4341bc8f6e96f1f50Ed44FfC0B5c4FC4F2529', // Zama Devnet
    9000: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Local
  };
  
  return ACL_ADDRESSES[chainId] || ACL_ADDRESSES[11155111]; // 默认使用 Sepolia
}

/**
 * 获取 KMS Verifier 地址
 * @param {number} chainId - 链 ID
 * @returns {Promise<string>} KMS Verifier 合约地址
 */
async function getKMSVerifierAddress(chainId) {
  // FHEVM KMS Verifier 地址（根据 Zama 官方文档）
  const KMS_VERIFIER_ADDRESSES = {
    11155111: '0x9D6891A6240D6130c54ae243d8005063D05fE14b', // Sepolia (✅ 官方地址)
    8009: '0x32E8A4F0F2189e02e2a06f1E89B4F0E0f4f4f4f4', // Zama Devnet (示例)
    9000: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Local
  };
  
  return KMS_VERIFIER_ADDRESSES[chainId] || KMS_VERIFIER_ADDRESSES[11155111]; // 默认使用 Sepolia
}

/**
 * 获取 Gateway URL
 * @param {number} chainId - 链 ID
 * @returns {string} Gateway URL
 */
function getGatewayUrl(chainId) {
  // Gateway URLs（根据 Zama 官方文档）
  const GATEWAY_URLS = {
    11155111: 'https://gateway.sepolia.zama.ai', // Sepolia (✅ 官方 Gateway)
    8009: 'https://gateway.zama.ai', // Zama Devnet
    9000: 'http://localhost:8545', // Local
  };
  
  return GATEWAY_URLS[chainId] || GATEWAY_URLS[11155111]; // 默认使用 Sepolia
}

/**
 * 检查是否为 FHEVM 网络
 * @param {number} chainId - 链 ID
 * @returns {boolean}
 */
export function isFHEVMNetwork(chainId) {
  // ⚠️ 重要：Sepolia (11155111) 支持 FHEVM！
  // Zama 官方在 Sepolia 上部署了 FHEVM 基础设施
  const FHEVM_CHAIN_IDS = [
    11155111, // Sepolia (✅ 当前可用)
    8009,     // Zama Devnet (⏳ 未来)
    9000      // Zama Local (本地测试)
  ];
  return FHEVM_CHAIN_IDS.includes(chainId);
}

/**
 * 获取网络名称
 * @param {number} chainId - 链 ID
 * @returns {string}
 */
export function getNetworkName(chainId) {
  const NETWORK_NAMES = {
    8009: 'Zama Devnet',
    9000: 'Zama Local',
    11155111: 'Sepolia Testnet',
    31337: 'Hardhat Network',
  };
  return NETWORK_NAMES[chainId] || `Unknown Network (${chainId})`;
}

/**
 * 格式化 FHE 错误信息
 * @param {Error} error - 错误对象
 * @returns {string} 格式化的错误信息
 */
export function formatFHEError(error) {
  const message = error.message || error.toString();
  
  // 常见错误映射
  const errorMappings = {
    'FHEVM instance not initialized': '❌ FHEVM 未初始化，请先连接钱包',
    'Encryption failed': '❌ 数据加密失败，请检查输入值',
    'Decryption timeout': '❌ Gateway 解密超时，请稍后重试',
    'Query failed': '❌ 查询执行失败，请联系管理员',
    'insufficient funds': '❌ 余额不足，请充值后重试',
  };
  
  for (const [key, value] of Object.entries(errorMappings)) {
    if (message.includes(key)) {
      return value;
    }
  }
  
  return `❌ ${message}`;
}

export default {
  initFhevm,
  getFhevmInstance,
  encryptUint32,
  encryptUint32Array,
  requestDecryption,
  isFHEVMNetwork,
  getNetworkName,
  formatFHEError,
};

