import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, TrendingUp, Zap, ArrowRight, Search, Database, Users, DollarSign } from 'lucide-react';

export default function Home({ account, darkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const features = [
    {
      icon: Shield,
      title: 'Data Never Exposed',
      description: 'Using FHEVM homomorphic encryption, data is stored on-chain in ciphertext form, invisible to anyone'
    },
    {
      icon: Lock,
      title: 'Limited Computation Types',
      description: 'Buyers can only execute predefined queries (mean, variance, statistics), unable to access raw data'
    },
    {
      icon: TrendingUp,
      title: 'Automatic Micropayments',
      description: 'Automatic settlement after successful queries, no need to trust third parties, transparent fee distribution'
    },
    {
      icon: Zap,
      title: 'Fast & Convenient',
      description: 'Easy-to-use interface, upload datasets or purchase query permissions in minutes'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section - 优化渐变设计 */}
      <section className="relative py-20 overflow-hidden">
        {/* 背景渐变效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          {/* Icon */}
          <div className="inline-block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mb-6 shadow-2xl animate-pulse">
            <Shield className="w-20 h-20 text-white" />
          </div>
          
          {/* Title */}
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Data Usable, Not Visible
            </span>
          </h1>
          <p className="text-2xl text-gray-700 dark:text-gray-300 mb-3">
            Confidential Data Marketplace
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Unlock Data Value While Preserving Privacy<br />
            Encrypted Data Trading Platform Powered by FHEVM
          </p>

          {/* 搜索栏 - 渐变设计 */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-full shadow-2xl p-2 flex items-center">
                <Search className="w-6 h-6 text-gray-400 ml-4" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:opacity-90 transition">
                Search
              </button>
              </div>
            </div>
          </div>

          {/* CTA 按钮 */}
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/marketplace"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
            >
              Browse Datasets
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {account ? (
              <Link
                to="/upload"
                className="px-8 py-4 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-lg hover:bg-blue-50 dark:hover:bg-gray-800 hover:scale-105 transition-all"
              >
                Upload Data
              </Link>
            ) : (
              <button
                disabled
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 rounded-xl font-bold text-lg cursor-not-allowed opacity-50"
              >
                Connect Wallet to Upload
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 平台统计 - 新增渐变卡片 */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition"></div>
            <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all">
              <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
                1,234
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Datasets</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition"></div>
            <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all">
              <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent mb-2">
                5,678
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Queries</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition"></div>
            <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all">
              <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent mb-2">
                12.5 ETH
              </h3>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Total Revenue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - 渐变卡片优化 */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Core Features
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Privacy-Preserving Data Trading Powered by FHEVM Technology
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const gradients = [
              'from-blue-600 to-blue-400',
              'from-purple-600 to-purple-400',
              'from-pink-600 to-pink-400',
              'from-green-600 to-green-400'
            ];
            return (
              <div
                key={idx}
                className="relative group fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${gradients[idx]} rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition`}></div>
                <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
                  <div className={`bg-gradient-to-r ${gradients[idx]} p-4 rounded-xl inline-block mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works - 渐变优化 */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-10"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12">
            <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center group">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
                    1
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Provider Uploads
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Encrypt and upload data on-chain, set query pricing and allowed computation types
                </p>
              </div>
              <div className="text-center group">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
                    2
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Buyer Executes Query
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Pay fees and execute statistical queries on encrypted data, receive computation results
                </p>
              </div>
              <div className="text-center group">
                <div className="relative mx-auto mb-6 w-20 h-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-green-600 rounded-full blur-md opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative bg-gradient-to-r from-pink-600 to-green-600 text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
                    3
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Automatic Settlement
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Automatic payment to data providers after successful queries, transparent and trustless
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - 渐变优化 */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl"></div>
          <div className="relative p-16 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-10 opacity-90">
              Upload your data or browse existing datasets now
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all"
            >
              Explore Marketplace
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

