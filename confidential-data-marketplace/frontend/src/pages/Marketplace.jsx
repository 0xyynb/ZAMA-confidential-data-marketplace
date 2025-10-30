import React, { useState, useEffect } from 'react';
import { Loader, Search, Filter } from 'lucide-react';
import DatasetCard from '../components/DatasetCard';
import FeatureInfo from '../components/FeatureInfo';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

export default function Marketplace({ contract, account }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDatasets();
  }, [contract]);

  const loadDatasets = async () => {
    if (!contract) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading datasets from contract...');
      
      // 使用公共 RPC 而不是钱包 provider，避免 eth_call 超时
      const publicProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      const publicContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicProvider);
      
      // Step 1: 获取所有活跃数据集的ID
      const activeDatasetIds = await publicContract.getActiveDatasets();
      console.log('✅ Found active dataset IDs:', activeDatasetIds.length);
      
      // Step 2: 逐个获取完整的数据集信息
      const datasetsData = [];
      for (let i = 0; i < activeDatasetIds.length; i++) {
        const id = Number(activeDatasetIds[i].toString());
        console.log(`🔍 Fetching dataset ${id}...`);
        
        try {
          const result = await publicContract.getDataset(id);
          
          // 将合约返回的元组转换为对象
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
          
          datasetsData.push(datasetObj);
          console.log(`✅ Loaded: ${datasetObj.name}`);
        } catch (err) {
          console.error(`❌ Failed to load dataset ${id}:`, err);
        }
      }
      
      console.log('✅ All datasets loaded:', datasetsData.length);
      setDatasets(datasetsData);
    } catch (err) {
      console.error('❌ Failed to load datasets:', err);
      setDatasets([]); // 确保即使失败也显示空列表
    } finally {
      setLoading(false);
    }
  };

  const filteredDatasets = datasets.filter(dataset =>
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!account) {
    return (
      <div className="text-center py-16">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
          <div className="bg-gray-100 p-4 rounded-full inline-block mb-6">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Connect Wallet First</h2>
          <p className="text-gray-600">
            Connect your wallet to browse and purchase datasets
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading datasets...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Data Marketplace</h1>
        <p className="text-gray-600">Browse and purchase query access to encrypted datasets</p>
      </div>

      {/* Feature Info - High Contrast Colors */}
      <FeatureInfo
        title="🛒 Browse Available Datasets"
        description="Discover encrypted datasets and purchase query access"
        steps={[
          "Browse the list of available datasets in the marketplace",
          "Use the search bar to find specific datasets by name or description",
          "Review dataset information: name, description, price, data points, and query count",
          "Click on any dataset card to view detailed information",
          "On the dataset detail page, you can execute queries to get insights from the data",
          "Each query requires payment (specified price in ETH) which goes to the data provider"
        ]}
        examples={[
          "Dataset: 'Sales Data Q1 2024' - Price: 0.001 ETH per query - 4 data points - 12 queries purchased",
          "Dataset: 'Temperature Readings' - Price: 0.0005 ETH per query - 5 data points - 8 queries purchased",
          "Dataset: 'User Engagement' - Price: 0.002 ETH per query - 6 data points - 15 queries purchased"
        ]}
        tips={[
          "Each dataset card shows the owner's address (the data provider)",
          "More data points generally mean more accurate statistical results",
          "Higher query count indicates popular and trusted datasets",
          "Compare prices before purchasing - some datasets may offer better value",
          "Click 'View Details' to see query options before purchasing"
        ]}
        defaultOpen={false}
      />

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search datasets..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 mb-2">Total Datasets</p>
          <p className="text-3xl font-bold text-blue-600">{datasets.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 mb-2">Active Datasets</p>
          <p className="text-3xl font-bold text-green-600">{datasets.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600 mb-2">Search Results</p>
          <p className="text-3xl font-bold text-gray-900">{filteredDatasets.length}</p>
        </div>
      </div>

      {/* Datasets Grid */}
      {filteredDatasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="bg-gray-100 p-4 rounded-full inline-block mb-6">
            <Filter className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Datasets Found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No matching datasets found' : 'No datasets have been uploaded yet'}
          </p>
        </div>
      )}
    </div>
  );
}
