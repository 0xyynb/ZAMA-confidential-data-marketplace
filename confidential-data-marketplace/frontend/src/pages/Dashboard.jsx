import React, { useState, useEffect } from 'react';
import { Loader, TrendingUp, Database, DollarSign, BarChart } from 'lucide-react';
import { formatEther, formatNumber } from '../utils/format';
import DatasetCard from '../components/DatasetCard';
import FeatureInfo from '../components/FeatureInfo';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

export default function Dashboard({ contract, account }) {
  const [stats, setStats] = useState(null);
  const [myDatasets, setMyDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [contract, account]);

  const loadDashboard = async () => {
    if (!contract || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading dashboard for account:', account);

      // 使用公共 RPC 而不是钱包 provider，避免 eth_call 超时
      const publicProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      const publicContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicProvider);

      // Step 1: 获取所有活跃数据集的ID
      const activeDatasetIds = await publicContract.getActiveDatasets();
      console.log('✅ Found active dataset IDs:', activeDatasetIds.length);

      // Step 2: 逐个获取完整的数据集信息，并筛选出属于当前用户的
      const myDatasetsData = [];
      let totalQueries = 0;
      let totalRevenue = ethers.getBigInt(0);

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

          // 检查是否是当前用户的数据集
          const ownerAddress = datasetObj.owner.toLowerCase();
          const currentAddress = account.toLowerCase();
          
          console.log(`📋 Dataset ${datasetObj.id}: "${datasetObj.name}"`);
          console.log(`   Owner: ${ownerAddress}`);
          console.log(`   Current: ${currentAddress}`);
          console.log(`   Match: ${ownerAddress === currentAddress}`);
          
          if (ownerAddress === currentAddress) {
            myDatasetsData.push(datasetObj);
            totalQueries += datasetObj.totalQueries;
            totalRevenue = totalRevenue + ethers.getBigInt(datasetObj.totalRevenue.toString());
            console.log(`✅ Found my dataset: ${datasetObj.name}`);
          }
        } catch (err) {
          console.error(`❌ Failed to load dataset ${id}:`, err);
        }
      }

      console.log(`✅ Total my datasets: ${myDatasetsData.length}`);
      console.log(`✅ Total queries: ${totalQueries}`);
      console.log(`✅ Total revenue: ${totalRevenue.toString()}`);

      // 设置统计数据
      setStats({
        totalDatasets: myDatasetsData.length,
        totalQueries: totalQueries,
        totalRevenue: totalRevenue
      });

      // 设置我的数据集列表
      setMyDatasets(myDatasetsData);

    } catch (err) {
      console.error('❌ Failed to load dashboard:', err);
      console.error('   Error details:', err.message);
      // 即使失败也显示空数据
      setStats({ totalDatasets: 0, totalQueries: 0, totalRevenue: ethers.getBigInt(0) });
      setMyDatasets([]);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
          <div className="bg-gray-100 p-4 rounded-full inline-block mb-6">
            <BarChart className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Connect Wallet First</h2>
          <p className="text-gray-600">
            Connect your wallet to view your revenue statistics
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Revenue Dashboard</h1>
        <p className="text-gray-600">View your dataset statistics and revenue</p>
      </div>

      {/* Feature Info */}
      <FeatureInfo
        title="📊 Monitor Your Data Business"
        description="Track your datasets, queries, and earnings in real-time"
        steps={[
          "View Your Statistics: See your total datasets, queries received, and revenue earned",
          "Monitor Dataset Performance: Check which datasets are generating the most revenue",
          "Track Query Activity: See how many times each dataset has been queried",
          "Review Revenue: Monitor your total earnings in ETH (95% of query fees)",
          "Manage Datasets: Click on any dataset card to view detailed analytics",
          "Optimize Pricing: Adjust prices based on demand and query patterns"
        ]}
        examples={[
          "Total Revenue: Automatically calculated from all queries across your datasets",
          "Query Count: Each successful query increases your total query count",
          "Dataset Cards: Shows individual performance metrics for each dataset",
          "Revenue Split: You earn 95% of query fees; 5% goes to platform maintenance"
        ]}
        tips={[
          "Upload multiple datasets to diversify your revenue streams",
          "Set competitive prices to attract more buyers (check marketplace for comparison)",
          "Provide clear, detailed descriptions to increase dataset visibility",
          "Monitor which datasets perform best and create similar ones",
          "Revenue is paid instantly on-chain when queries are executed"
        ]}
        defaultOpen={false}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 mb-2">My Datasets</p>
          <p className="text-4xl font-bold text-blue-600">
            {stats?.totalDatasets || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 mb-2">Total Queries</p>
          <p className="text-4xl font-bold text-green-600">
            {formatNumber(stats?.totalQueries || 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-600 mb-2">Total Revenue (ETH)</p>
          <p className="text-4xl font-bold text-yellow-600">
            {formatEther(stats?.totalRevenue || 0)}
          </p>
        </div>
      </div>

      {/* My Datasets */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">My Datasets</h2>
        {myDatasets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myDatasets.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="bg-gray-100 p-4 rounded-full inline-block mb-6">
              <Database className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Datasets Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't uploaded any datasets yet
            </p>
            <a
              href="/upload"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Upload First Dataset
            </a>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-2">💡 Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Upload more datasets to increase revenue</li>
          <li>• Set reasonable prices to attract more buyers</li>
          <li>• Provide quality dataset descriptions</li>
          <li>• Check dataset query statistics regularly</li>
        </ul>
      </div>
    </div>
  );
}
