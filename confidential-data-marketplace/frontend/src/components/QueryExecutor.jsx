import React, { useState } from 'react';
import { useDecryption } from '../hooks/useDecryption';
import { Calculator, TrendingUp, BarChart, Loader, CheckCircle } from 'lucide-react';
import { formatEther } from '../utils/format';
import { QUERY_TYPES, QUERY_TYPE_NAMES } from '../config';

const QUERY_OPTIONS = [
  { 
    type: QUERY_TYPES.COMPUTE_MEAN, 
    name: 'Calculate Mean', 
    icon: Calculator, 
    desc: 'Calculate average value of dataset',
    needsParam: false
  },
  { 
    type: QUERY_TYPES.COMPUTE_VARIANCE, 
    name: 'Calculate Variance', 
    icon: TrendingUp, 
    desc: 'Measure data volatility',
    needsParam: false
  },
  { 
    type: QUERY_TYPES.COUNT_ABOVE, 
    name: 'Count Above', 
    icon: BarChart, 
    desc: 'Count values above threshold',
    needsParam: true
  },
  { 
    type: QUERY_TYPES.COUNT_BELOW, 
    name: 'Count Below', 
    icon: BarChart, 
    desc: 'Count values below threshold',
    needsParam: true
  }
];

export default function QueryExecutor({ dataset, contract, purchaseQuery, onQueryComplete, isFHEMode, executeQuery }) {
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [parameter, setParameter] = useState('');
  const [executing, setExecuting] = useState(false);
  
  // ⚠️ 添加本地状态来存储查询结果
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  
  console.log('🎨 QueryExecutor: mode =', isFHEMode ? 'FHE' : 'Mock', 'executeQuery =', !!executeQuery);

  const {
    status,
    progress,
    result,
    error,
    waitForQueryResult,
    reset
  } = useDecryption(contract);

  // 📝 Mock 模式查询
  const handleMockQuery = async () => {
    try {
      console.log('📝 Mock Mode: Executing query...');
      
      // 1. Purchase query
      console.log('💰 Purchasing query...');
      const purchaseResult = await purchaseQuery(
        dataset.id,
        selectedQuery,
        parameter || 0
      );

      if (!purchaseResult.success || !purchaseResult.queryId) {
        throw new Error('Query execution failed');
      }

      console.log('✅ Query executed, QueryID:', purchaseResult.queryId);

      // 2. Wait for decryption result (Mock mode: result is immediate)
      console.log('⏳ Fetching query result...');
      const decryptResult = await waitForQueryResult(purchaseResult.queryId);

      console.log('🎉 Query completed:', decryptResult);
      console.log('🔧 Setting queryResult state with:', decryptResult);
      
      // ⚠️ 直接设置本地状态
      setQueryResult(decryptResult);
      
      console.log('✅ queryResult state has been set');

      if (onQueryComplete) {
        onQueryComplete(decryptResult);
      }
    } catch (err) {
      throw err;
    }
  };

  // 🔐 FHE 模式查询
  const handleFHEQuery = async () => {
    try {
      console.log('🔐 FHE Mode: Executing encrypted query...');
      console.log('📊 Parameters:', {
        datasetId: dataset.id,
        queryType: selectedQuery,
        parameter: parameter || 0
      });
      
      // 调用 executeQuery（来自 useContractFHE）
      const result = await executeQuery(
        dataset.id,
        selectedQuery,
        parameter || 0
      );
      
      console.log('✅ FHE query result:', result);
      
      // 设置结果
      setQueryResult(result);
      
      if (onQueryComplete) {
        onQueryComplete(result);
      }
    } catch (err) {
      throw err;
    }
  };

  // 🎯 主执行函数
  const handleExecuteQuery = async () => {
    // 基础检查
    if (selectedQuery === null) {
      alert('Please select a query type first');
      return;
    }
    
    // FHE 模式检查
    if (isFHEMode && !executeQuery) {
      alert('FHE query function not available. Please try again later.');
      return;
    }
    
    // Mock 模式检查
    if (!isFHEMode && !purchaseQuery) {
      alert('Query function not available. Please connect wallet.');
      return;
    }

    try {
      setExecuting(true);
      setQueryResult(null);
      setQueryError(null);
      reset();

      console.log(`🚀 Starting query (Mode: ${isFHEMode ? 'FHE' : 'Mock'})`);
      
      // 根据模式选择不同的执行逻辑
      if (isFHEMode) {
        await handleFHEQuery();
      } else {
        await handleMockQuery();
      }

    } catch (err) {
      console.error('❌ Query failed:', err);
      setQueryError(err.message);
      alert('Query failed: ' + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const selectedQueryOption = QUERY_OPTIONS.find(q => q.type === selectedQuery);
  
  // ⚠️ 添加调试日志
  console.log('🔍 QueryExecutor render - queryResult:', queryResult, 'executing:', executing);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Execute Query</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isFHEMode 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {isFHEMode ? '🔐 FHE Mode' : '📝 Mock Mode'}
        </span>
      </div>

      {/* Query Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {QUERY_OPTIONS.map((query) => {
          const Icon = query.icon;
          return (
            <button
              key={query.type}
              onClick={() => setSelectedQuery(query.type)}
              disabled={executing}
              className={`p-4 rounded-lg border-2 transition text-left ${
                selectedQuery === query.type
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${
                  selectedQuery === query.type ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className="font-semibold">{query.name}</span>
              </div>
              <p className="text-sm text-gray-600">
                {query.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Parameter Input */}
      {selectedQueryOption?.needsParam && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Threshold Parameter
          </label>
          <input
            type="number"
            value={parameter}
            onChange={(e) => setParameter(e.target.value)}
            placeholder="Enter value..."
            disabled={executing}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            {selectedQuery === QUERY_TYPES.COUNT_ABOVE && 'Count data points greater than this value'}
            {selectedQuery === QUERY_TYPES.COUNT_BELOW && 'Count data points less than this value'}
          </p>
        </div>
      )}

      {/* Price Info */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Query Price: <span className="font-bold text-blue-600 text-lg">
                {formatEther(dataset.pricePerQuery)} ETH
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Includes 5% platform fee, rest goes to data provider
            </p>
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecuteQuery}
        disabled={selectedQuery === null || executing || status === 'processing'}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        {executing || status === 'processing' ? 'Querying...' : 'Execute Query'}
      </button>

      {/* Progress Display */}
      {(executing || status !== 'idle') && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Query Progress</span>
            <span className="text-sm font-semibold text-blue-600">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {status === 'processing' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Waiting for Gateway decryption...</span>
            </div>
          )}
        </div>
      )}

      {/* Result Display - 使用本地状态 */}
      {queryResult && queryResult.result !== undefined && (
        <div className="mt-6 p-6 bg-green-50 rounded-lg border-2 border-green-200 fade-in">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h4 className="text-lg font-bold text-green-900">
              Query Completed
            </h4>
          </div>
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-green-600 mb-2">
              {queryResult.result}
            </p>
            <p className="text-sm text-gray-600">
              {QUERY_TYPE_NAMES[selectedQuery]} result (decrypted)
            </p>
          </div>
        </div>
      )}
      
      {/* 临时调试信息 */}
      {queryResult && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-600">
            Debug: queryResult = {JSON.stringify(queryResult)}
          </p>
        </div>
      )}

      {/* Error Display - 使用本地状态 */}
      {queryError && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-600">
            ❌ Query failed: {queryError}
          </p>
        </div>
      )}
    </div>
  );
}
