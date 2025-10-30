import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataUpload from '../components/DataUpload';
import FeatureInfo from '../components/FeatureInfo';
import { AlertCircle } from 'lucide-react';

export default function UploadPage({ contract, fhevmInstance, account, isFHEMode, uploadDataset }) {
  const navigate = useNavigate();
  
  console.log('🎨 UploadPage: mode =', isFHEMode ? 'FHE' : 'Mock');

  const handleUploadSuccess = (result) => {
    console.log('✅ Upload success! Dataset ID:', result.datasetId);
    
    // ✅ 详情页已修复，现在可以直接跳转了
    if (result.datasetId !== null && result.datasetId !== 0) {
      console.log(`🎯 Navigating to dataset detail page: /dataset/${result.datasetId}`);
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        navigate(`/dataset/${result.datasetId}`);
      }, 2000);
    } else {
      // 如果 datasetId 无效，跳转到 marketplace
      console.log('⚠️ Invalid dataset ID, navigating to marketplace');
      setTimeout(() => {
        navigate('/marketplace');
      }, 2000);
    }
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <div className="bg-white rounded-xl shadow-lg p-12 max-w-md mx-auto">
          <div className="bg-yellow-100 p-4 rounded-full inline-block mb-6">
            <AlertCircle className="w-12 h-12 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Connect Wallet First</h2>
          <p className="text-gray-600">
            Connect your wallet to upload datasets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FeatureInfo
        title="📤 Upload Encrypted Dataset"
        description="Share your data securely and earn from every query"
        steps={[
          "Fill in Dataset Information: Choose a descriptive name and description for your dataset",
          "Enter Data: Provide comma-separated numbers (e.g., 100, 200, 150, 300)",
          "Set Price: Determine the cost per query in ETH (e.g., 0.001 ETH)",
          "Click 'Upload Dataset' and confirm the transaction in your wallet",
          "Wait for blockchain confirmation (~15 seconds on Sepolia)",
          "Your dataset will appear in the Marketplace for buyers to query"
        ]}
        examples={[
          "Name: 'Sales Data Q1 2024' - Description: 'Monthly sales figures in thousands' - Data: '120, 135, 148, 162' - Price: 0.001",
          "Name: 'Temperature Readings' - Description: 'Daily average temperatures' - Data: '22, 24, 23, 25, 26' - Price: 0.0005",
          "Name: 'User Engagement Metrics' - Description: 'Daily active users' - Data: '1200, 1350, 1420, 1380' - Price: 0.002"
        ]}
        tips={[
          `In ${isFHEMode ? 'FHE' : 'Mock'} Mode: Your data is ${isFHEMode ? 'encrypted on-chain for maximum privacy' : 'stored for testing purposes'}`,
          "You earn 95% of every query fee; 5% goes to platform maintenance",
          "Larger datasets (more data points) may attract more buyers",
          "Set competitive prices - check similar datasets in the Marketplace",
          "Dataset name and description are public; only the data values are protected"
        ]}
        defaultOpen={true}
      />
      
      <DataUpload
        contract={contract}
        fhevmInstance={fhevmInstance}
        onUploadSuccess={handleUploadSuccess}
        isFHEMode={isFHEMode}
        uploadDataset={uploadDataset}
      />
    </div>
  );
}

