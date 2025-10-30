import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

/**
 * 解密进度跟踪 Hook
 * 轮询合约以获取查询结果状态（Mock模式：结果立即可用）
 */
export function useDecryption(contract) {
  const [status, setStatus] = useState('idle'); // idle, processing, completed, failed
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 重置状态
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  // 等待查询完成（Mock模式：查询结果立即可用）
  const waitForQueryResult = useCallback(async (queryId, maxAttempts = 10, interval = 2000) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      setStatus('processing');
      setProgress(10);
      setError(null);

      console.log('📊 Fetching query result for QueryID:', queryId);

      // 使用公共RPC获取查询结果（避免OKX eth_call超时）
      const publicProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      const publicContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicProvider);

      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          // ⚠️ 修复：使用正确的方法名 getQuery（不是 getQueryResult）
          const queryData = await publicContract.getQuery(queryId);
          
          // 合约返回：[id, datasetId, buyer, queryType, parameter, result, status, price, timestamp]
          const queryStatus = Number(queryData[6].toString()); // status 是第7个（index 6）
          const queryResult = Number(queryData[5].toString()); // result 是第6个（index 5）

          console.log(`📊 Query ${queryId} status:`, queryStatus, 'result:', queryResult);

          // 更新进度
          const currentProgress = Math.min(10 + (attempts / maxAttempts) * 80, 90);
          setProgress(currentProgress);

          // 查询状态: 0=PENDING, 1=PROCESSING, 2=COMPLETED, 3=FAILED, 4=REFUNDED
          if (queryStatus === 2) {
            // 完成
            console.log('✅ Query completed! Result:', queryResult);
            setProgress(100);
            setStatus('completed');
            setResult({
              status: queryStatus,
              result: queryResult,
              timestamp: Number(queryData[8].toString()),
            });
            return {
              success: true,
              result: queryResult,
            };
          } else if (queryStatus === 3 || queryStatus === 4) {
            // 失败或退款
            throw new Error(queryStatus === 3 ? 'Query failed' : 'Query refunded');
          }

          // Mock合约：查询在executeQuery时立即完成，不需要等待
          // 如果第一次查询时状态就是COMPLETED，直接返回
          // 如果是PENDING/PROCESSING，继续轮询
          console.log(`⏳ Query status: ${queryStatus}, waiting... (attempt ${attempts + 1}/${maxAttempts})`);

          // 继续等待
          await new Promise(resolve => setTimeout(resolve, interval));
          attempts++;

        } catch (err) {
          console.error(`⚠️ Error fetching query result (attempt ${attempts + 1}):`, err);
          
          // 如果是合约调用错误，可能是查询还不存在或权限问题
          if (attempts < maxAttempts - 1) {
            // 继续重试
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
          } else {
            throw err;
          }
        }
      }

      // 超时
      throw new Error('Query timeout. Please try again or request refund.');

    } catch (err) {
      console.error('❌ Failed to get query result:', err);
      setStatus('failed');
      setError(err.message);
      throw err;
    }
  }, [contract]);

  // 请求解密（实际上是购买查询并等待结果）
  const requestDecryption = useCallback(async (queryId) => {
    return waitForQueryResult(queryId);
  }, [waitForQueryResult]);

  return {
    status,
    progress,
    result,
    error,
    requestDecryption,
    waitForQueryResult,
    reset,
  };
}

