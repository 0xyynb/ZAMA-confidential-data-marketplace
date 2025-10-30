/**
 * 双合约切换 Hook
 * 
 * 用途：在同一网络（Sepolia）上，允许用户手动切换 Mock 合约和 FHE 合约
 * 
 * 架构原则：
 * - Mock 合约：明文测试，快速演示
 * - FHE 合约：真实加密，生产环境
 * - 用户可手动切换
 * - Gateway 离线时自动降级到 Mock
 */

import { useState, useEffect } from 'react';
import { useContract } from './useContract';
import { useContractFHE } from './useContractFHE';

export function useContractSwitch(account, signer, chainId) {
  // 用户选择的模式：'mock' 或 'fhe'
  const [selectedMode, setSelectedMode] = useState(() => {
    // 从 localStorage 读取用户上次的选择
    return localStorage.getItem('contractMode') || 'mock';
  });
  
  const [isAutoFallback, setIsAutoFallback] = useState(false);
  
  // Mock 合约 Hook
  const mockContract = useContract(account, signer, chainId);
  
  // FHE 合约 Hook
  const fheContract = useContractFHE(account, signer, chainId);
  
  // 根据选择的模式返回相应的合约
  const activeContract = selectedMode === 'fhe' ? fheContract : mockContract;
  
  // 切换模式
  const switchMode = (mode) => {
    console.log(`🔄 手动切换合约模式: ${selectedMode} → ${mode}`);
    setSelectedMode(mode);
    localStorage.setItem('contractMode', mode);
    setIsAutoFallback(false);
  };
  
  // 自动降级到 Mock（当 Gateway 不可用时）
  const fallbackToMock = () => {
    if (selectedMode === 'fhe') {
      console.warn('⚠️ Gateway 不可用，自动降级到 Mock 模式');
      setSelectedMode('mock');
      setIsAutoFallback(true);
    }
  };
  
  // 检查 Gateway 状态
  useEffect(() => {
    if (selectedMode === 'fhe' && chainId === 11155111) {
      // 检查 Gateway 是否可用
      fetch('https://gateway.sepolia.zama.ai/health', { method: 'HEAD' })
        .then(res => {
          if (!res.ok) {
            console.warn('⚠️ Gateway 健康检查失败，建议使用 Mock 模式');
          }
        })
        .catch(() => {
          console.warn('⚠️ 无法连接到 Gateway，建议使用 Mock 模式');
        });
    }
  }, [selectedMode, chainId]);
  
  return {
    // 当前模式
    mode: selectedMode,
    isFHEMode: selectedMode === 'fhe',
    isMockMode: selectedMode === 'mock',
    isAutoFallback,
    
    // 合约实例和方法
    contract: activeContract.contract,
    fhevmInstance: activeContract.fhevmInstance,
    uploadDataset: activeContract.uploadDataset,
    purchaseQuery: activeContract.purchaseQuery,
    executeQuery: activeContract.executeQuery,
    
    // 模式切换
    switchMode,
    switchToMock: () => switchMode('mock'),
    switchToFHE: () => switchMode('fhe'),
    fallbackToMock,
    
    // 合约地址
    mockAddress: mockContract.contract?.target,
    fheAddress: fheContract.contract?.target,
    
    // 调试信息
    debug: {
      selectedMode,
      mockReady: !!mockContract.contract,
      fheReady: !!fheContract.contract,
      fhevmReady: !!fheContract.fhevmInstance
    }
  };
}

