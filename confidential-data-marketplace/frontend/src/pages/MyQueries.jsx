import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatEther, formatTime } from '../utils/format';
import { QUERY_STATUS_NAMES, QUERY_TYPE_NAMES } from '../config';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';
import FeatureInfo from '../components/FeatureInfo';

export default function MyQueries({ contract, account }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyQueries();
  }, [contract, account]);

  const loadMyQueries = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading queries for buyer:', account);

      // 使用公共 RPC 读取
      const publicProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      const publicContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicProvider);

      // 获取所有数据集
      const activeDatasetIds = await publicContract.getActiveDatasets();
      console.log('✅ Found active datasets:', activeDatasetIds.length);

      // 存储所有查询
      const allQueries = [];

      // 遍历每个数据集，获取查询
      for (let i = 0; i < activeDatasetIds.length; i++) {
        const datasetId = Number(activeDatasetIds[i].toString());
        
        try {
          // 获取数据集信息（为了显示名称）
          const datasetResult = await publicContract.getDataset(datasetId);
          const datasetName = datasetResult[2]; // name 是第3个字段

          // 获取该数据集的查询总数
          const totalQueries = Number(datasetResult[6].toString());
          
          if (totalQueries === 0) continue;

          // 遍历该数据集的所有查询
          for (let queryId = 1; queryId <= totalQueries; queryId++) {
            try {
              const queryResult = await publicContract.getQuery(queryId);
              
              // 解析查询对象
              const queryObj = {
                id: Number(queryResult[0].toString()),
                datasetId: Number(queryResult[1].toString()),
                datasetName: datasetName,
                buyer: queryResult[2],
                queryType: Number(queryResult[3].toString()),
                parameter: Number(queryResult[4].toString()),
                result: Number(queryResult[5].toString()),
                paidAmount: queryResult[6],
                timestamp: Number(queryResult[7].toString()),
                status: Number(queryResult[8].toString())
              };

              // 只保存属于当前用户的查询
              if (queryObj.buyer.toLowerCase() === account.toLowerCase()) {
                allQueries.push(queryObj);
                console.log(`✅ Found my query #${queryObj.id} on dataset "${datasetName}"`);
              }
            } catch (err) {
              // 查询可能不存在，跳过
              continue;
            }
          }
        } catch (err) {
          console.error(`❌ Failed to load queries for dataset ${datasetId}:`, err);
        }
      }

      console.log(`✅ Total my queries: ${allQueries.length}`);
      
      // 按时间倒序排列（最新的在前）
      allQueries.sort((a, b) => b.timestamp - a.timestamp);
      
      setQueries(allQueries);

    } catch (err) {
      console.error('❌ Failed to load queries:', err);
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
          <div className="bg-gray-100 p-4 rounded-full inline-block mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Connect Wallet First</h2>
          <p className="text-gray-600">
            Connect your wallet to view your query history
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading query history...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Queries</h1>
        <p className="text-gray-600">View all your query history and results</p>
      </div>

      {/* Feature Info */}
      <FeatureInfo
        title="📜 Your Query History as a Buyer"
        description="Track all queries you've purchased and view results"
        steps={[
          "This page shows queries YOU purchased from other data providers",
          "Each query displays the dataset name, query type, and result",
          "You can see how much you paid for each query",
          "Query results are stored on-chain and accessible anytime",
          "To see your revenue as a data provider, visit the Dashboard page"
        ]}
        examples={[
          "Query #1 on 'Sales Data Q1 2024' - Calculate Mean - Result: 200",
          "Query #2 on 'Temperature Readings' - Count Above 25 - Result: 3",
          "Query #3 on 'User Engagement' - Calculate Variance - Result: 1250"
        ]}
        tips={[
          "Dashboard = You as a DATA PROVIDER (datasets you uploaded, revenue you earned)",
          "My Queries = You as a BUYER (queries you purchased, results you got)",
          "All query results are permanent and can be viewed anytime",
          "Failed queries are automatically refunded",
          "You can purchase multiple queries on the same dataset"
        ]}
        defaultOpen={true}
      />

      {/* Queries List */}
      {queries.length > 0 ? (
        <div className="space-y-4">
          {queries.map((query) => (
            <div key={query.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold">
                      Query #{query.id}
                    </h3>
                    <StatusBadge status={query.status} />
                  </div>
                  
                  {/* Dataset Name */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Dataset:</p>
                    <p className="text-lg font-bold text-blue-600">{query.datasetName}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Query Type</p>
                      <p className="font-semibold">{QUERY_TYPE_NAMES[query.queryType] || 'Unknown'}</p>
                    </div>
                    {query.parameter > 0 && (
                      <div>
                        <p className="text-gray-600">Parameter</p>
                        <p className="font-semibold">{query.parameter}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Payment Amount</p>
                      <p className="font-semibold">{formatEther(query.paidAmount)} ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Query Time</p>
                      <p className="font-semibold">{formatTime(query.timestamp)}</p>
                    </div>
                  </div>
                  
                  {/* Result Display */}
                  {query.status === 2 && (
                    <div className="mt-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2 font-medium">✅ Query Result:</p>
                      <p className="text-4xl font-bold text-green-600">{query.result}</p>
                    </div>
                  )}
                  
                  {/* Pending/Processing */}
                  {(query.status === 0 || query.status === 1) && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                      <p className="text-sm text-yellow-800">⏳ Waiting for result...</p>
                    </div>
                  )}
                  
                  {/* Failed */}
                  {query.status === 3 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-800">❌ Query failed. Please try again.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="bg-gray-100 p-4 rounded-full inline-block mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold mb-3">No Query History Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven't purchased any queries yet. Go to the marketplace to browse datasets and execute queries!
            <br />
            <br />
            💡 <strong>Tip:</strong> This page shows queries <strong>you purchased</strong> as a buyer.
            To see datasets <strong>you uploaded</strong> as a provider, visit the Dashboard.
          </p>
          <Link
            to="/marketplace"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
          >
            Browse Marketplace →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    0: { text: 'Pending', color: 'bg-gray-100 text-gray-600', icon: Clock },
    1: { text: 'Processing', color: 'bg-blue-100 text-blue-600', icon: Loader },
    2: { text: 'Completed', color: 'bg-green-100 text-green-600', icon: CheckCircle },
    3: { text: 'Failed', color: 'bg-red-100 text-red-600', icon: XCircle },
    4: { text: 'Refunded', color: 'bg-yellow-100 text-yellow-600', icon: XCircle },
  };

  const config = statusConfig[status] || statusConfig[0];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <Icon className="w-4 h-4" />
      {config.text}
    </span>
  );
}
