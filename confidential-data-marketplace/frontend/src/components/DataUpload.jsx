import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { ethers } from 'ethers';

export default function DataUpload({ contract, fhevmInstance, onUploadSuccess, isFHEMode, uploadDataset }) {
  const [step, setStep] = useState(1); // 1: Input, 2: Encrypt, 3: Upload
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    data: '',
    price: '0.01'
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [encryptProgress, setEncryptProgress] = useState(0); // 加密进度（FHE 模式）
  
  console.log('🎨 DataUpload: mode =', isFHEMode ? 'FHE' : 'Mock', 'uploadDataset =', !!uploadDataset);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 基础检查
    if (!contract) {
      setError('Please connect wallet first');
      return;
    }

    // FHE 模式检查
    if (isFHEMode && !uploadDataset) {
      setError('FHE upload function not available. Please try again later.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setEncryptProgress(0);
      setStep(2);

      // 1. Parse data
      const numbers = formData.data
        .split(',')
        .map(n => n.trim())
        .filter(n => n !== '')
        .map(n => parseInt(n))
        .filter(n => !isNaN(n));

      if (numbers.length === 0) {
        throw new Error('Please enter valid numeric data');
      }

      if (numbers.length > 1000) {
        throw new Error('Cannot exceed 1000 data points');
      }

      console.log(`📝 Data points count: ${numbers.length} (Mode: ${isFHEMode ? 'FHE' : 'Mock'})`);

      // 2. 根据模式选择不同的上传逻辑
      if (isFHEMode) {
        // 🔐 FHE 模式：使用加密上传
        console.log('🔐 Using FHE encrypted upload...');
        await handleFHEUpload(numbers);
      } else {
        // 📝 Mock 模式：使用现有逻辑
        console.log('📝 Using Mock plaintext upload...');
        await handleMockUpload(numbers);
      }
    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
      setStep(1);
    }
  };

  // 📝 Mock 模式上传
  const handleMockUpload = async (numbers) => {
    try {
      setStep(3);

      // Convert price from ETH to Wei
      const priceWei = ethers.parseEther(formData.price.toString());
      
      console.log('📝 Mock mode: Uploading unencrypted data for demo');
      console.log('📝 Price in Wei:', priceWei.toString());
      console.log('📝 Contract address:', contract.target);
      
      // 🔑 获取当前钱包地址 (OKX 钱包兼容性关键!)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const fromAddress = accounts[0];
      console.log('📝 From address:', fromAddress);
      
      // 🔧 使用底层 window.ethereum.request 方法 (文档推荐)
      // 编码函数调用数据
      const data = contract.interface.encodeFunctionData('uploadDataset', [
        formData.name,
        formData.description,
        numbers,
        priceWei
      ]);
      
      console.log('🔄 准备交易参数...');
      console.log('   - from:', fromAddress);
      console.log('   - to:', contract.target);
      console.log('   - data length:', data.length);
      
      console.log('💡 使用 window.ethereum.request 发送交易 (OKX 钱包兼容)');
      console.log('⏰ 等待 OKX 钱包弹出...');
      
      // 添加超时检测
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Transaction request timed out after 60 seconds. Wallet may not be responding.')), 60000);
      });
      
      // 使用 window.ethereum.request 发送交易 (显式添加 from 字段)
      const txPromise = window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: fromAddress,  // 🔑 关键：显式添加 from 字段
          to: contract.target,
          data: data,
          value: '0x0'  // 不发送 ETH
        }]
      });
      
      const txHash = await Promise.race([txPromise, timeoutPromise]);
      
      console.log('✅ Transaction sent:', txHash);
      console.log('⏳ Waiting for confirmation...');
      console.log('📍 OKX Explorer:', `https://web3.okx.com/zh-hans/explorer/sepolia/tx/${txHash}`);
      console.log('📍 Etherscan:', `https://sepolia.etherscan.io/tx/${txHash}`);
      
      // 🔧 使用公共 RPC 查询（绕过 OKX 钱包，避免兼容性问题）
      console.log('💡 使用公共 RPC 查询交易状态（推荐方式）');
      const publicProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      
      let receipt = null;
      let attempts = 0;
      const maxAttempts = 60; // 最多尝试 60 次（约 120 秒）
      
      while (!receipt && attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`🔄 检查交易状态... (${attempts}/${maxAttempts})`);
          
          // 使用公共 RPC 直接查询（不依赖钱包）
          receipt = await publicProvider.getTransactionReceipt(txHash);
          
          if (receipt && receipt.blockNumber) {
            // 交易已确认！
            console.log('✅ Transaction confirmed!');
            console.log('📦 Block:', receipt.blockNumber);
            console.log('📦 Status:', receipt.status === 1 ? 'Success' : 'Failed');
            console.log('📦 Receipt:', receipt);
            break;
          }
          
          // 等待 2 秒后重试
          console.log('⏳ 交易还在队列中，2秒后重试...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          console.warn('⚠️ 查询失败，重试中...', err.message);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      if (!receipt) {
        throw new Error(`Transaction timeout. Please check manually:\n${txHash}`);
      }
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed on blockchain!');
      }
      
      console.log('🎉 Transaction fully confirmed!');
      
      // Extract datasetId from event
      console.log('📋 解析事件日志...');
      console.log('📋 Logs count:', receipt.logs?.length || 0);
      
      let datasetId = null;
      
      if (receipt.logs && receipt.logs.length > 0) {
        for (let i = 0; i < receipt.logs.length; i++) {
          try {
            const log = receipt.logs[i];
            console.log(`📋 Log ${i}:`, log);
            
            const parsedLog = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            
            console.log(`📋 Parsed log ${i}:`, parsedLog);
            
            if (parsedLog && parsedLog.name === 'DatasetCreated') {
              console.log('📋 Event args:', parsedLog.args);
              console.log('📋 Raw datasetId:', parsedLog.args.datasetId);
              console.log('📋 datasetId type:', typeof parsedLog.args.datasetId);
              console.log('📋 datasetId toString:', parsedLog.args.datasetId?.toString());
              
              // 尝试多种转换方式
              const rawId = parsedLog.args.datasetId;
              datasetId = rawId ? Number(rawId.toString()) : null;
              
              console.log('✅ 找到 DatasetCreated 事件! Dataset ID:', datasetId);
              break;
            }
          } catch (err) {
            console.log(`⚠️ 无法解析 log ${i}:`, err.message);
          }
        }
      }
      
      const result = {
        success: true,
        datasetId: datasetId,
        txHash: typeof receipt.hash === 'string' ? receipt.hash : txHash
      };

      console.log('✅ Result:', result);
      console.log('🎉 Upload complete! Dataset ID:', result.datasetId);

      // 显示成功提示（优先显示，确保用户看到成功）
      alert(`🎉 Dataset uploaded successfully!

Dataset ID: ${result.datasetId}
Transaction: ${txHash}

View on OKX Explorer:
https://web3.okx.com/zh-hans/explorer/sepolia/tx/${txHash}

View on Etherscan:
https://sepolia.etherscan.io/tx/${txHash}`);

      // Reset form
      setFormData({ name: '', description: '', data: '', price: '0.01' });
      setStep(1);

      // 调用回调（如果出错不影响用户体验）
      if (onUploadSuccess) {
        try {
          onUploadSuccess(result);
        } catch (callbackErr) {
          console.warn('⚠️ onUploadSuccess callback error:', callbackErr);
          // 回调错误不影响上传成功的事实
        }
      }

    } catch (err) {
      console.error('❌ Upload failed:', err);
      setError(err.message || 'Upload failed, please retry');
      setStep(1);
    } finally {
      setUploading(false);
    }
  };

  // 🔐 FHE 模式上传
  const handleFHEUpload = async (numbers) => {
    try {
      console.log('🔐 FHE Mode: Starting encrypted upload...');
      
      // Step 1: 显示加密准备
      setEncryptProgress(10);
      console.log('🔐 Step 1: 准备加密数据...');
      console.log('📊 Data points:', numbers.length);
      console.log('💰 Price:', formData.price, 'ETH');
      
      // Step 2: 调用 uploadDataset prop（来自 useContractFHE）
      setEncryptProgress(30);
      console.log('🔐 Step 2: 调用 uploadDataset 函数...');
      console.log('📦 Parameters:', {
        name: formData.name,
        description: formData.description,
        dataCount: numbers.length,
        price: formData.price
      });
      
      setStep(3); // 切换到上传阶段
      setEncryptProgress(50);
      
      // 调用 uploadDataset（这个函数在 useContractFHE 中实现）
      const result = await uploadDataset(
        formData.name,
        formData.description,
        numbers,
        formData.price
      );
      
      setEncryptProgress(100);
      console.log('✅ FHE upload success:', result);
      
      // 显示成功提示
      alert(`🎉 Dataset uploaded successfully (FHE Mode)!

Dataset ID: ${result.datasetId}
Transaction: ${result.txHash}

Your data is now encrypted on-chain!`);

      // Reset form
      setFormData({ name: '', description: '', data: '', price: '0.01' });
      setStep(1);
      setEncryptProgress(0);
      
      // 通知父组件
      if (onUploadSuccess) {
        try {
          onUploadSuccess(result);
        } catch (callbackErr) {
          console.warn('⚠️ onUploadSuccess callback error:', callbackErr);
        }
      }
      
      setUploading(false);
      
    } catch (err) {
      console.error('❌ FHE upload failed:', err);
      throw err; // 抛回给外层 handleSubmit 处理
    }
  };

  const stepIndicators = [
    { num: 1, title: 'Input Data' },
    { num: 2, title: isFHEMode ? 'Encrypt' : 'Prepare' },
    { num: 3, title: 'Upload' }
  ];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 fade-in">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold">Upload {isFHEMode ? 'Encrypted' : ''} Dataset</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isFHEMode 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {isFHEMode ? '🔐 FHE Mode' : '📝 Mock Mode'}
        </span>
      </div>
      <p className="text-gray-600 mb-6">
        {isFHEMode 
          ? 'Your data will be encrypted with FHE and stored on-chain. No one can see the raw data.'
          : 'Demo mode: Data is stored on-chain for testing purposes.'}
      </p>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {stepIndicators.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                step >= s.num
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s.num ? <CheckCircle className="w-6 h-6" /> : s.num}
              </div>
              <p className="text-xs mt-2 text-gray-600">{s.title}</p>
            </div>
            {idx < stepIndicators.length - 1 && (
              <div className={`flex-1 h-1 mx-2 transition ${
                step > s.num ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Upload Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {!uploading && step === 1 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., 2024 Sales Data"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the dataset content and usage..."
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data (comma-separated numbers) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
              placeholder="e.g., 100,200,150,300,250,180,220"
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Each number will be encrypted and stored on-chain separately (max 1000 data points)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Per Query (ETH) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum price: 0.001 ETH
            </p>
          </div>

          <button
            type="submit"
            disabled={!formData.name || !formData.data || !contract || !fhevmInstance}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {!contract || !fhevmInstance ? 'Connect Wallet First' : 'Start Upload'}
          </button>
        </form>
      )}

      {/* Processing */}
      {uploading && step > 1 && (
        <div className="text-center py-12">
          <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-bold mb-2">
            {step === 2 && (isFHEMode ? 'Preparing encryption...' : 'Preparing data...')}
            {step === 3 && (isFHEMode ? 'Encrypting and uploading...' : 'Uploading to blockchain...')}
          </h3>
          {isFHEMode && encryptProgress > 0 && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{encryptProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${encryptProgress}%` }}
                />
              </div>
            </div>
          )}
          <p className="text-gray-600 mt-4">
            {isFHEMode 
              ? 'Encrypting your data with FHE technology...' 
              : 'This may take a few minutes, please be patient'}
          </p>
        </div>
      )}
    </div>
  );
}


