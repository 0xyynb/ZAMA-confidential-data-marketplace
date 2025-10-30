import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Database, TrendingUp } from 'lucide-react';
import QueryExecutor from '../components/QueryExecutor';
import FeatureInfo from '../components/FeatureInfo';
import { formatEther, formatAddress, formatTime, formatNumber } from '../utils/format';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

export default function DatasetDetail({ contract, account, purchaseQuery, isFHEMode, executeQuery }) {
  const { id } = useParams();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  console.log('🎨 DatasetDetail: mode =', isFHEMode ? 'FHE' : 'Mock');

  useEffect(() => {
    loadDataset();
  }, [id, contract]);

  const loadDataset = async () => {
    console.log('📋 loadDataset called');
    console.log('   - Dataset ID:', id);
    console.log('   - Contract:', contract);
    
    // 检查 ID 是否有效
    if (!id || id === '0' || Number(id) === 0) {
      console.error('❌ Invalid dataset ID:', id);
      setError('Invalid dataset ID. Please check the URL.');
      setLoading(false);
      return;
    }
    
    if (!contract) {
      console.log('⚠️ No contract, setting loading to false');
      setError('Contract not initialized. Please connect your wallet.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Calling contract.getDataset...');
      
      // 使用公共 RPC 查询（避免 OKX 钱包的 eth_call 问题）
      console.log('💡 使用公共 RPC 查询数据集信息');
      const publicProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      const publicContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        publicProvider
      );
      
      console.log('📋 Public contract created');
      const result = await publicContract.getDataset(id);
      
      console.log('✅ Dataset info received:', result);
      
      // ⚠️ 重要：合约返回的顺序是 [id, owner, name, description, dataSize, pricePerQuery, totalQueries, totalRevenue, createdAt, active]
      const datasetObj = {
        id: Number(result[0].toString()),
        owner: result[1],
        name: result[2],
        description: result[3],
        dataSize: Number(result[4].toString()),
        pricePerQuery: result[5],
        totalQueries: Number(result[6].toString()),
        totalRevenue: result[7],
        createdAt: Number(result[8].toString()),
        active: result[9]
      };
      
      console.log('📦 Dataset object:', datasetObj);
      
      // 检查数据集是否真的存在（owner 不为空）
      if (datasetObj.owner === '0x0000000000000000000000000000000000000000' || !datasetObj.name) {
        console.error('❌ Dataset does not exist or is invalid');
        setError('Dataset not found. It may not exist or has been removed.');
        setLoading(false);
        return;
      }
      
      setDataset(datasetObj);
    } catch (err) {
      console.error('❌ Failed to load dataset:', err);
      console.error('   Error details:', err.message);
      console.error('   Error stack:', err.stack);
      setError(err.message || 'Failed to load dataset. Please try again.');
    } finally {
      setLoading(false);
      console.log('✅ Loading set to false');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="spinner mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading dataset...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-900 mb-4">Error Loading Dataset</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md mx-auto">
          <div className="text-gray-400 text-5xl mb-4">📂</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dataset Not Found</h2>
          <p className="text-gray-600 mb-6">The dataset you're looking for doesn't exist.</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dataset Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h1 className="text-3xl font-bold mb-4">{dataset.name}</h1>
            <p className="text-gray-600 mb-6">{dataset.description}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b">
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Database className="w-4 h-4" />
                  <span className="text-sm">Data Points</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(dataset.dataSize)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Queries</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(dataset.totalQueries)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatEther(dataset.totalRevenue)} ETH</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Created</span>
                </div>
                <p className="text-sm font-medium">{formatTime(dataset.createdAt)}</p>
              </div>
            </div>

            {/* Owner Info */}
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Data Provider</span>
              </div>
              <p className="text-lg font-mono">{formatAddress(dataset.owner)}</p>
            </div>
          </div>

          {/* Query Feature Info */}
          <FeatureInfo
            title="🔍 Execute Queries on Encrypted Data"
            description="Perform computations without accessing raw data"
            steps={[
              "Choose a query type from the available options below",
              "For 'Count Above' or 'Count Below' queries, enter a threshold value",
              "Review the query price (displayed in the sidebar)",
              "Click 'Execute Query' button",
              "Confirm the payment transaction in your wallet",
              `Wait for the result (${isFHEMode ? '30-60 seconds for FHE decryption' : '1-2 seconds in Mock mode'})`,
              "The result will be displayed on the page after computation"
            ]}
            examples={[
              "Calculate Mean: For data [100, 200, 150, 300, 250], result is 200",
              "Calculate Variance: Measures how spread out the values are (higher = more variability)",
              "Count Above 200: For data [100, 200, 150, 300, 250], result is 2 (values: 300, 250)",
              "Count Below 200: For data [100, 200, 150, 300, 250], result is 2 (values: 100, 150)"
            ]}
            tips={[
              "Payment is automatically split: 95% to data provider, 5% to platform",
              "Query results are returned without exposing the raw dataset",
              "Each query is recorded on-chain and cannot be undone",
              "Mean and Variance queries don't require additional parameters",
              "Threshold queries are useful for quality control and benchmarking"
            ]}
            defaultOpen={true}
          />

          {/* Query Executor */}
          {account ? (
            <QueryExecutor
              dataset={dataset}
              contract={contract}
              purchaseQuery={purchaseQuery}
              onQueryComplete={null}
              isFHEMode={isFHEMode}
              executeQuery={executeQuery}
            />
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-600">Connect wallet first to execute queries</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">Query Price</h3>
            <div className="text-center py-6 bg-blue-50 rounded-lg">
              <p className="text-4xl font-bold text-blue-600 mb-2">
                {formatEther(dataset.pricePerQuery)}
              </p>
              <p className="text-sm text-gray-600">ETH / query</p>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>• Includes 5% platform fee</p>
              <p>• Supported query types:</p>
              <ul className="ml-6 mt-2 space-y-1">
                <li>- Calculate mean</li>
                <li>- Calculate variance</li>
                <li>- Count above/below</li>
              </ul>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2">🔐 Privacy Protected</h3>
            <p className="text-sm text-gray-700">
              All data is stored encrypted on-chain. Your query results come from FHEVM homomorphic computation. Raw data is never exposed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
