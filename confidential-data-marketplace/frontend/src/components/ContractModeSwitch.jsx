/**
 * 合约模式切换组件
 * 
 * 功能：
 * 1. 显示当前使用的合约（Mock / FHE）
 * 2. 允许用户手动切换
 * 3. 显示合约地址和状态
 */

import React from 'react';
import { Shield, Zap, AlertTriangle } from 'lucide-react';

export default function ContractModeSwitch({ mode, switchMode, mockAddress, fheAddress, isAutoFallback }) {
  const isMock = mode === 'mock';
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-4 min-w-[300px]">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Contract Mode
          </h3>
          {isAutoFallback && (
            <span className="text-xs text-yellow-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Auto Fallback
            </span>
          )}
        </div>
        
        {/* 当前模式显示 */}
        <div className={`p-3 rounded-lg mb-3 ${
          isMock 
            ? 'bg-gray-100 dark:bg-gray-700' 
            : 'bg-purple-100 dark:bg-purple-900'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isMock ? (
              <Zap className="w-5 h-5 text-gray-600" />
            ) : (
              <Shield className="w-5 h-5 text-purple-600" />
            )}
            <span className="font-bold">
              {isMock ? '📝 Mock Mode' : '🔐 FHE Mode'}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {isMock 
              ? 'Plaintext data for demo' 
              : 'Encrypted data with FHE'}
          </p>
          <p className="text-xs font-mono mt-1 text-gray-500 truncate">
            {isMock ? mockAddress : fheAddress}
          </p>
        </div>
        
        {/* 切换按钮 */}
        <div className="space-y-2">
          <button
            onClick={() => switchMode('mock')}
            disabled={isMock}
            className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition ${
              isMock
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700'
            }`}
          >
            📝 Switch to Mock
          </button>
          <button
            onClick={() => switchMode('fhe')}
            disabled={!isMock}
            className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition ${
              !isMock
                ? 'bg-purple-200 text-purple-400 cursor-not-allowed'
                : 'bg-white border-2 border-purple-300 hover:border-purple-400 text-purple-700'
            }`}
          >
            🔐 Switch to FHE
          </button>
        </div>
        
        {/* 提示信息 */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">
            {isMock ? (
              <>
                <strong>Mock:</strong> Fast demo, plaintext storage
              </>
            ) : (
              <>
                <strong>FHE:</strong> Privacy-preserving, encrypted
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

