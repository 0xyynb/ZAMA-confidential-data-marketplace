import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
// import { createInstance } from '@zama-fhe/relayer-sdk';
import { CONTRACT_ADDRESS, CONTRACT_ABI, FHEVM_CONFIG } from '../config';

/**
 * 智能合约交互 Hook
 */
export function useContract(signer, chainId) {
  const [contract, setContract] = useState(null);
  const [fhevmInstance, setFhevmInstance] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);

  // 初始化合约
  useEffect(() => {
    if (!signer || !chainId) {
      setContract(null);
      return;
    }

    try {
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setContract(contractInstance);
      console.log('✅ 合约已初始化:', CONTRACT_ADDRESS);
    } catch (err) {
      console.error('❌ 初始化合约失败:', err);
      setError(err.message);
    }
  }, [signer, chainId]);

  // 初始化 FHEVM SDK (暂时禁用，用于 UI 演示)
  const initFhevm = useCallback(async (userAddress) => {
    if (!chainId || fhevmInstance) return;

    try {
      setIsInitializing(true);
      setError(null);

      console.log('🔐 FHEVM SDK 初始化跳过（UI 演示模式）');
      
      // Mock instance for UI demo
      setFhevmInstance({ mock: true });
      console.log('✅ Mock FHEVM 实例已创建');

    } catch (err) {
      console.error('❌ 初始化失败:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  }, [chainId, fhevmInstance]);

  // 上传数据集
  const uploadDataset = useCallback(async (name, description, dataArray, pricePerQuery) => {
    if (!contract || !fhevmInstance) {
      throw new Error('Contract or FHEVM SDK not initialized');
    }

    try {
      // Convert price to Wei
      const priceWei = ethers.parseEther(pricePerQuery.toString());
      
      // Mock mode: Send data directly without encryption
      if (fhevmInstance.mock) {
        console.log('📝 Mock mode: Uploading unencrypted data for demo');
        
        // Convert to uint32 array
        const uint32Data = dataArray.map(n => parseInt(n));
        
        // Mock contract expects: name, description, uint32[] data, bytes[] proofs (empty), price
        const tx = await contract.uploadDataset(
          name,
          description,
          uint32Data,
          [], // Empty proofs array for mock
          priceWei
        );

        console.log('📤 Upload transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('✅ Dataset uploaded successfully:', receipt.hash);

        // Extract datasetId from event
        const event = receipt.logs
          .map(log => {
            try {
              return contract.interface.parseLog(log);
            } catch {
              return null;
            }
          })
          .find(e => e && e.name === 'DatasetUploaded');

        return {
          success: true,
          datasetId: event ? Number(event.args.datasetId) : null,
          txHash: receipt.hash,
        };
      }

      // Real FHEVM mode: Encrypt data before upload
      const userAddress = await contract.signer.getAddress();
      const encryptedData = [];
      const inputProofs = [];

      for (const num of dataArray) {
        const encInput = fhevmInstance.createEncryptedInput(
          CONTRACT_ADDRESS,
          userAddress
        );
        encInput.add32(parseInt(num));
        const encrypted = await encInput.encrypt();

        encryptedData.push(encrypted.handles[0]);
        inputProofs.push(encrypted.inputProof);
      }

      // Call contract with encrypted data
      const tx = await contract.uploadDataset(
        name,
        description,
        encryptedData,
        inputProofs,
        priceWei
      );

      console.log('📤 Upload transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Dataset uploaded successfully:', receipt.hash);

      // Extract datasetId from event
      const event = receipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(e => e && e.name === 'DatasetUploaded');

      return {
        success: true,
        datasetId: event ? Number(event.args.datasetId) : null,
        txHash: receipt.hash,
      };

    } catch (err) {
      console.error('❌ Dataset upload failed:', err);
      throw err;
    }
  }, [contract, fhevmInstance]);

  // 购买并执行查询
  const purchaseQuery = useCallback(async (datasetId, queryType, parameter) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // 1. 使用公共RPC获取数据集信息（避免OKX eth_call超时）
      const publicProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      const publicContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicProvider);
      
      console.log('🔍 Fetching dataset price...');
      const datasetResult = await publicContract.getDataset(datasetId);
      const price = datasetResult[5]; // pricePerQuery (index 5 in returned tuple)
      
      console.log('💰 Dataset price:', ethers.formatEther(price), 'ETH');

      // 2. 获取发送者地址
      const signer = contract.runner;
      const fromAddress = await signer.getAddress();

      // 3. 编码交易数据（OKX兼容方式）
      const data = contract.interface.encodeFunctionData('executeQuery', [
        datasetId,
        queryType,
        parameter || 0
      ]);

      console.log('📤 Sending query transaction...');

      // 4. 使用 window.ethereum.request 发送交易（OKX兼容）
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: fromAddress,
          to: CONTRACT_ADDRESS,
          data: data,
          value: '0x' + price.toString(16) // 将price转为hex string
        }]
      });

      console.log('📤 Transaction sent:', txHash);

      // 5. 使用公共RPC轮询确认
      for (let i = 0; i < 60; i++) {
        try {
          const receipt = await publicProvider.getTransactionReceipt(txHash);
          if (receipt && receipt.blockNumber) {
            console.log('✅ Transaction confirmed:', receipt);

            // 6. 解析事件获取 queryId
            const iface = new ethers.Interface(CONTRACT_ABI);
            for (const log of receipt.logs) {
              try {
                const parsed = iface.parseLog({ topics: log.topics, data: log.data });
                if (parsed.name === 'QueryExecuted') {
                  const queryId = Number(parsed.args.queryId.toString());
                  console.log('✅ Query executed, ID:', queryId);
                  
                  return {
                    success: true,
                    queryId: queryId,
                    txHash: receipt.hash,
                  };
                }
              } catch (e) {
                // Skip non-matching logs
              }
            }

            // 如果没找到事件，仍然返回成功（兼容性）
            console.warn('⚠️ QueryExecuted event not found, but transaction confirmed');
            return {
              success: true,
              queryId: null,
              txHash: receipt.hash,
            };
          }
        } catch (e) {
          console.error(`Polling attempt ${i + 1} failed:`, e);
        }

        // 每2秒轮询一次
        await new Promise(r => setTimeout(r, 2000));
      }

      throw new Error('Transaction confirmation timeout after 120 seconds');

    } catch (err) {
      console.error('❌ Query execution failed:', err);
      throw err;
    }
  }, [contract]);

  // 获取数据集列表 - 已废弃，请使用 Marketplace 页面中的实现
  const getActiveDatasets = useCallback(async () => {
    console.warn('⚠️ useContract.getActiveDatasets is deprecated. Use Marketplace page implementation instead.');
    return [];
  }, [contract]);

  // 获取查询结果
  const getQueryResult = useCallback(async (queryId) => {
    if (!contract) {
      throw new Error('合约未初始化');
    }

    try {
      const result = await contract.getQueryResult(queryId);
      return {
        status: Number(result[0]),
        result: Number(result[1]),
        timestamp: Number(result[2]),
      };
    } catch (err) {
      console.error('❌ 获取查询结果失败:', err);
      throw err;
    }
  }, [contract]);

  // 获取提供者统计
  const getProviderStats = useCallback(async (address) => {
    if (!contract) return null;

    try {
      const stats = await contract.getProviderStats(address);
      return {
        totalDatasets: Number(stats[0]),
        totalQueries: Number(stats[1]),
        totalRevenue: stats[2],
      };
    } catch (err) {
      console.error('❌ 获取统计信息失败:', err);
      return null;
    }
  }, [contract]);

  return {
    contract,
    fhevmInstance,
    isInitializing,
    error,
    initFhevm,
    uploadDataset,
    purchaseQuery,
    getActiveDatasets,
    getQueryResult,
    getProviderStats,
  };
}

