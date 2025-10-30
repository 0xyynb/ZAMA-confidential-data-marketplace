import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Wallet } from 'lucide-react';
import { formatAddress } from '../utils/format';

export default function Header({ account, isConnecting, onConnect, onDisconnect, chainId }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: '首页' },
    { path: '/marketplace', label: '数据市场' },
    { path: '/upload', label: '上传数据' },
    { path: '/my-queries', label: '我的查询' },
    { path: '/dashboard', label: '收益面板' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                加密数据市场
              </h1>
              <p className="text-xs text-gray-500">
                Confidential Data Marketplace
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition ${
                  isActive(link.path)
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Wallet Connect */}
          <div className="flex items-center gap-4">
            {chainId && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  {chainId === 11155111 ? 'Sepolia' : `Chain ${chainId}`}
                </span>
              </div>
            )}

            {account ? (
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-blue-50 rounded-lg text-blue-600 font-medium text-sm">
                  {formatAddress(account)}
                </div>
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
                >
                  断开
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? '连接中...' : '连接钱包'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <nav className="flex items-center gap-4 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium whitespace-nowrap transition ${
                  isActive(link.path)
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-2'
                    : 'text-gray-600 hover:text-blue-600 pb-2'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

