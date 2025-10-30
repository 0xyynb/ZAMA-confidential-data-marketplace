/**
 * useContractMode Hook
 * 自动检测并切换 Mock/FHE 模式
 */

import { useMemo } from 'react';
import { useContract } from './useContract';
import useContractFHE from './useContractFHE';
import { isFHEVMNetwork, FHEVM_ENABLED } from '../config';

export default function useContractMode(signer, chainId) {
  // 检测是否应该使用 FHE 模式
  const shouldUseFHE = useMemo(() => {
    // ⚠️ 现在完全由 FHEVM_ENABLED 控制，忽略网络检测
    // 这样可以在 Sepolia 上测试 Mock 模式
    console.log('🔍 模式检测:', { FHEVM_ENABLED, chainId });
    return FHEVM_ENABLED;
  }, [chainId]);

  // Mock 模式 Hook
  const mockHook = useContract(signer, chainId);
  
  // FHE 模式 Hook
  const fheHook = useContractFHE();
  
  // 返回当前模式的 Hook
  return useMemo(() => {
    if (shouldUseFHE) {
      console.log('🔐 使用 FHE 模式');
      return {
        ...fheHook,
        mode: 'FHE',
        isFHEMode: true,
        shouldUseFHE
      };
    } else {
      console.log('📝 使用 Mock 模式');
      return {
        ...mockHook,
        mode: 'Mock',
        isFHEMode: false,
        shouldUseFHE
      };
    }
  }, [shouldUseFHE, mockHook, fheHook]);
}

