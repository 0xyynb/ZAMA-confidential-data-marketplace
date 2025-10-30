import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Network Warning Component
 * Displays warning when user is on wrong network
 */
export default function NetworkWarning({ currentChainId, expectedChainId, onSwitchNetwork }) {
  const NETWORK_NAMES = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    8009: 'Zama Devnet',
    9000: 'Zama Local'
  };

  const currentNetworkName = NETWORK_NAMES[currentChainId] || `Chain ID: ${currentChainId}`;
  const expectedNetworkName = NETWORK_NAMES[expectedChainId] || `Chain ID: ${expectedChainId}`;

  const handleSwitch = async () => {
    try {
      await onSwitchNetwork(expectedChainId);
    } catch (error) {
      // 如果网络不存在，尝试添加网络
      if (error.code === 4902) {
        await addNetwork(expectedChainId);
      } else {
        console.error('Failed to switch network:', error);
        alert('Failed to switch network. Please switch manually in your wallet.');
      }
    }
  };

  const addNetwork = async (chainId) => {
    const NETWORK_CONFIGS = {
      11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Testnet',
        nativeCurrency: {
          name: 'Sepolia ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
      }
    };

    const config = NETWORK_CONFIGS[chainId];
    if (!config) {
      alert('Network configuration not found. Please add the network manually.');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [config]
      });
    } catch (error) {
      console.error('Failed to add network:', error);
      alert('Failed to add network. Please add it manually in your wallet.');
    }
  };

  return (
    <div className="fixed top-20 left-0 right-0 z-50 mx-auto max-w-4xl px-4">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl shadow-2xl p-6 animate-pulse">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="p-3 bg-yellow-500 rounded-full">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Wrong Network Detected | 检测到错误的网络
            </h3>
            
            <div className="space-y-2 mb-4">
              <p className="text-gray-800 font-medium">
                <span className="text-red-600">Current Network:</span> {currentNetworkName}
              </p>
              <p className="text-gray-800 font-medium">
                <span className="text-green-600">Required Network:</span> {expectedNetworkName}
              </p>
            </div>

            <p className="text-gray-700 mb-4">
              Please switch to <strong>{expectedNetworkName}</strong> to use this application.
              <br />
              请切换到 <strong>{expectedNetworkName}</strong> 以使用此应用。
            </p>

            {/* Switch Button */}
            <button
              onClick={handleSwitch}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Switch to {expectedNetworkName} | 切换到 {expectedNetworkName}
            </button>
          </div>

          {/* Close indicator */}
          <div className="flex-shrink-0 text-gray-400 text-sm">
            This warning will persist until you switch networks
            <br />
            切换网络后此警告将消失
          </div>
        </div>
      </div>
    </div>
  );
}

