/**
 * useContractFHE Hook
 * 用于 FHEVM 模式的合约交互
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import {
  initFhevm,
  encryptUint32Array,
  requestDecryption,
  isFHEVMNetwork,
  getNetworkName,
  formatFHEError,
} from '../utils/fhevm';

export default function useContractFHE() {
  const [contract, setContract] = useState(null);
  const [fhevmReady, setFhevmReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);

  /**
   * 初始化合约和 FHEVM
   */
  const initContract = useCallback(async (provider, signer) => {
    console.log('🚀 初始化 FHEVM 合约...');
    setLoading(true);
    setError(null);

    try {
      // 1. 创建合约实例
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      
      // 2. 获取网络信息
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const networkName = getNetworkName(chainId);
      
      console.log(`📡 网络: ${networkName} (Chain ID: ${chainId})`);
      
      setNetworkInfo({
        chainId,
        name: networkName,
        isFHEVM: isFHEVMNetwork(chainId),
      });
      
      // 3. 检查是否为 FHEVM 网络
      if (!isFHEVMNetwork(chainId)) {
        throw new Error(
          `当前网络不支持 FHEVM。\n` +
          `请切换到支持的网络：\n` +
          `- Sepolia Testnet (Chain ID: 11155111) ✅ 推荐\n` +
          `- Zama Devnet (Chain ID: 8009)\n` +
          `- Zama Local (Chain ID: 9000)`
        );
      }
      
      // 4. 初始化 FHEVM 实例
      console.log('🔐 初始化 FHEVM 实例...');
      await initFhevm(provider, CONTRACT_ADDRESS);
      
      setContract(contractInstance);
      setFhevmReady(true);
      
      console.log('✅ FHEVM 合约初始化成功');
      return contractInstance;
    } catch (err) {
      console.error('❌ 初始化失败:', err);
      setError(formatFHEError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 上传加密数据集
   * @param {string} name - 数据集名称
   * @param {string} description - 数据集描述
   * @param {number[]} dataArray - 数据数组
   * @param {string} priceInEth - 价格（ETH）
   */
  const uploadDataset = useCallback(async (name, description, dataArray, priceInEth) => {
    console.log('\n📤 上传加密数据集...');
    console.log(`   名称: ${name}`);
    console.log(`   描述: ${description}`);
    console.log(`   数据量: ${dataArray.length} 个`);
    console.log(`   价格: ${priceInEth} ETH`);
    
    if (!contract || !fhevmReady) {
      throw new Error('合约未初始化或 FHEVM 未准备好');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 1. 加密数据
      console.log('🔐 Step 1: 加密数据...');
      const encryptedData = await encryptUint32Array(dataArray, CONTRACT_ADDRESS);
      
      // 2. 提取证明
      const inputProofs = encryptedData.map(item => item.proof);
      console.log(`✅ 加密完成，生成 ${inputProofs.length} 个证明`);
      
      // 3. 转换价格
      const priceWei = ethers.parseEther(priceInEth);
      console.log(`💰 价格: ${priceInEth} ETH = ${priceWei} Wei`);
      
      // 4. 调用合约
      console.log('📡 Step 2: 调用合约 uploadDataset...');
      const tx = await contract.uploadDataset(
        name,
        description,
        inputProofs,
        priceWei,
        {
          gasLimit: 5000000, // FHE 操作需要更多 Gas
        }
      );
      
      console.log(`⏳ 交易已发送: ${tx.hash}`);
      console.log('   等待区块确认...');
      
      const receipt = await tx.wait();
      console.log(`✅ 交易已确认 (区块 #${receipt.blockNumber})`);
      
      // 5. 解析事件
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'DatasetCreated';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        const datasetId = Number(parsedEvent.args.datasetId.toString());
        
        console.log(`🎉 数据集创建成功！ID: ${datasetId}`);
        
        return {
          success: true,
          datasetId,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
        };
      } else {
        throw new Error('未找到 DatasetCreated 事件');
      }
    } catch (err) {
      console.error('❌ 上传失败:', err);
      setError(formatFHEError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract, fhevmReady]);

  /**
   * 执行查询
   * @param {number} datasetId - 数据集 ID
   * @param {number} queryType - 查询类型 (0-3)
   * @param {number|null} parameter - 参数（可选）
   * @param {string} priceInEth - 支付金额
   */
  const executeQuery = useCallback(async (datasetId, queryType, parameter, priceInEth) => {
    console.log('\n🔍 执行查询...');
    console.log(`   数据集 ID: ${datasetId}`);
    console.log(`   查询类型: ${queryType}`);
    console.log(`   参数: ${parameter || 'N/A'}`);
    console.log(`   支付: ${priceInEth} ETH`);
    
    if (!contract || !fhevmReady) {
      throw new Error('合约未初始化或 FHEVM 未准备好');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 1. 加密参数（如果需要）
      let parameterProof = '0x';
      if (parameter !== null && parameter !== undefined) {
        console.log('🔐 加密参数...');
        const encrypted = await encryptUint32(parameter, CONTRACT_ADDRESS);
        parameterProof = encrypted.proof;
      }
      
      // 2. 转换支付金额
      const valueWei = ethers.parseEther(priceInEth);
      
      // 3. 调用合约
      console.log('📡 调用合约 executeQuery...');
      const tx = await contract.executeQuery(
        datasetId,
        queryType,
        parameterProof,
        {
          value: valueWei,
          gasLimit: 3000000, // FHE 查询需要大量 Gas
        }
      );
      
      console.log(`⏳ 交易已发送: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ 交易已确认`);
      
      // 4. 解析查询 ID
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed && parsed.name === 'QueryExecuted';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        const queryId = Number(parsedEvent.args.queryId.toString());
        
        console.log(`🎉 查询已提交！ID: ${queryId}`);
        console.log('⏳ 等待 Gateway 解密（这可能需要 30-60 秒）...');
        
        // 5. 等待解密完成
        const result = await requestDecryption(contract, queryId);
        
        return {
          success: true,
          queryId,
          result: result.result,
          txHash: tx.hash,
        };
      } else {
        throw new Error('未找到 QueryExecuted 事件');
      }
    } catch (err) {
      console.error('❌ 查询失败:', err);
      setError(formatFHEError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract, fhevmReady]);

  return {
    contract,
    fhevmReady,
    loading,
    error,
    networkInfo,
    initContract,
    uploadDataset,
    executeQuery,
  };
}

