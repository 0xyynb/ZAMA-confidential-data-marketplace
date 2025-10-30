import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Moon, Sun, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import DatasetDetail from './pages/DatasetDetail';
import UploadPage from './pages/UploadPage';
import MyQueries from './pages/MyQueries';
import Dashboard from './pages/Dashboard';
import NetworkWarning from './components/NetworkWarning';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import useContractMode from './hooks/useContractMode';
import { formatAddress } from './utils/format';
import { isFHEVMNetwork, getNetworkName, FHEVM_ENABLED } from './config';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();
  
  const {
    account,
    signer,
    chainId,
    isConnecting,
    connect,
    disconnect,
    switchNetwork
  } = useWallet();

  // 🔄 使用模式切换 Hook（自动检测 Mock/FHE）
  const {
    contract,
    fhevmInstance,
    fhevmReady,
    isInitializing,
    loading,
    error,
    initFhevm,
    initContract,
    uploadDataset,
    executeQuery,
    purchaseQuery,
    mode,
    isFHEMode
  } = useContractMode(signer, chainId);

  // 显示当前模式
  const networkInfo = useMemo(() => {
    if (!chainId) return null;
    
    console.log('🔍 Network Info Debug:', {
      chainId,
      isFHEMode,
      networkName: getNetworkName(chainId)
    });
    
    return {
      name: getNetworkName(chainId),
      isFHEVM: isFHEVMNetwork(chainId),
      mode: isFHEMode ? 'FHE' : 'Mock'
    };
  }, [chainId, isFHEMode]);

  // 初始化合约（Mock 或 FHE 模式）
  useEffect(() => {
    if (signer && chainId) {
      if (isFHEMode) {
        // FHE 模式：需要初始化 FHEVM
        if (!fhevmReady && !isInitializing && initContract) {
          console.log('🔐 初始化 FHEVM...');
          const provider = signer.provider;
          initContract(provider, signer);
        }
      } else {
        // Mock 模式：使用传统初始化
        if (!fhevmInstance && !isInitializing && initFhevm && account) {
          console.log('📝 初始化 Mock FHEVM...');
          initFhevm(account);
        }
      }
    }
  }, [signer, chainId, account, isFHEMode, fhevmReady, fhevmInstance, isInitializing, initContract, initFhevm]);

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      {/* 导航栏 - 暗黑主题优化 */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Confidential Data Marketplace
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Privacy-Preserving Data Trading
                </p>
              </div>
            </Link>

            {/* 导航链接 */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Home
              </Link>
              <Link
                to="/marketplace"
                className={`text-sm font-medium transition-colors ${
                  isActive('/marketplace') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Marketplace
              </Link>
              <Link
                to="/upload"
                className={`text-sm font-medium transition-colors ${
                  isActive('/upload') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Upload Data
              </Link>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                Dashboard
              </Link>
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center space-x-3">
              {/* 🎯 双合约切换 */}
              {account && (
                <select
                  value={localStorage.getItem('contractMode') || 'mock'}
                  onChange={(e) => {
                    const newMode = e.target.value;
                    console.log(`🔄 切换合约模式: ${localStorage.getItem('contractMode') || 'mock'} → ${newMode}`);
                    localStorage.setItem('contractMode', newMode);
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-colors
                    bg-white dark:bg-gray-700 
                    border-gray-300 dark:border-gray-600 
                    text-gray-700 dark:text-gray-300
                    hover:border-blue-400 dark:hover:border-blue-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    cursor-pointer"
                  title="Switch between Mock and FHE contracts"
                >
                  <option value="mock">📝 Mock Mode</option>
                  <option value="fhe">🔐 FHE Mode</option>
                </select>
              )}
              
              {/* 暗黑模式切换 */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="切换主题"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>

              {/* 网络显示 + 模式指示 */}
              {networkInfo && (
                <div className="hidden md:flex items-center gap-2">
                  {/* 网络名称 */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${networkInfo.isFHEVM ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {networkInfo.name}
                    </span>
                  </div>
                  
                  {/* 模式指示 */}
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    networkInfo.mode === 'FHE' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }`}>
                    {networkInfo.mode === 'FHE' ? '🔐 FHE' : '📝 Mock'}
                  </div>
                </div>
              )}

              {/* 钱包连接 */}
              {account ? (
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium text-sm">
                    {formatAddress(account)}
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Network Warning - Show if wrong network */}
      {account && chainId && chainId !== 11155111 && (
        <NetworkWarning
          currentChainId={chainId}
          expectedChainId={11155111}
          onSwitchNetwork={switchNetwork}
        />
      )}

      {/* 主内容 */}
      <main>
        <Routes>
          <Route path="/" element={<Home account={account} darkMode={darkMode} />} />
          <Route 
            path="/marketplace" 
            element={
              <Marketplace 
                contract={contract} 
                account={account}
              />
            } 
          />
          <Route 
            path="/dataset/:id" 
            element={
              <DatasetDetail 
                contract={contract} 
                account={account}
                purchaseQuery={purchaseQuery}
                isFHEMode={isFHEMode}
                executeQuery={executeQuery}
              />
            } 
          />
          <Route 
            path="/upload" 
            element={
              <UploadPage 
                contract={contract} 
                fhevmInstance={fhevmInstance}
                account={account}
                isFHEMode={isFHEMode}
                uploadDataset={uploadDataset}
              />
            } 
          />
          <Route 
            path="/my-queries" 
            element={
              <MyQueries 
                contract={contract} 
                account={account}
              />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                contract={contract} 
                account={account}
              />
            } 
          />
        </Routes>
      </main>

      {/* 页脚 - 暗黑主题优化 */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8 mt-16 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            © 2025 Confidential Data Marketplace | Privacy-Preserving Platform Powered by FHEVM
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Built with <a href="https://www.zama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Zama</a> Technology
          </p>
        </div>
      </footer>
    </div>
  );
}

