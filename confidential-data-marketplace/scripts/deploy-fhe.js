/**
 * 部署 DataMarketplaceFHE 合约脚本
 * 用于部署真正的 FHE 版本到 Zama 网络
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 开始部署 DataMarketplaceFHE 合约...\n");
  
  // 获取网络信息
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log(`📡 部署网络: ${network} (Chain ID: ${chainId})`);
  
  // ⚠️ 检查是否为支持 FHEVM 的网络
  const FHEVM_NETWORKS = ['sepolia', 'zamaDevnet', 'zamaLocal'];
  
  if (!FHEVM_NETWORKS.includes(network)) {
    console.warn('\n⚠️  警告：当前网络不支持 FHEVM！');
    console.warn('   DataMarketplaceFHE 合约需要 FHEVM 支持。');
    console.warn('   支持的网络：');
    console.warn('     - sepolia (✅ 推荐，使用 SepoliaZamaFHEVMConfig)');
    console.warn('     - zamaDevnet (⏳ 未来)');
    console.warn('     - zamaLocal (本地测试)');
    console.warn('   推荐使用: npx hardhat run scripts/deploy-fhe.js --network sepolia\n');
    process.exit(1);
  }
  
  console.log(`✅ 目标网络支持 FHEVM`);
  if (network === 'sepolia') {
    console.log('   📍 使用 SepoliaZamaFHEVMConfig (Zama 官方 FHEVM 基础设施)');
    console.log('   🌐 Gateway: https://gateway.sepolia.zama.ai');
  }
  
  // 保留原有的交互逻辑（如果需要的话）
  if (false) { // 禁用交互提示
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('是否继续部署？ (yes/no): ', resolve);
    });
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ 部署已取消');
      process.exit(0);
    }
  }
  
  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 部署账户: ${deployer.address}`);
  
  // 检查账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 账户余额: ${hre.ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    console.error('\n❌ 错误：账户余额为 0，请先充值！');
    console.log('   Zama Devnet 水龙头: https://faucet.zama.ai');
    process.exit(1);
  }
  
  console.log('\n📝 开始编译合约...');
  
  // 编译合约
  await hre.run('compile');
  
  console.log('\n🔧 准备部署 DataMarketplaceFHE...');
  
  // 部署合约
  const DataMarketplaceFHE = await hre.ethers.getContractFactory("DataMarketplaceFHE");
  
  console.log('⏳ 部署中（这可能需要几分钟，FHE 合约较大）...');
  
  const startTime = Date.now();
  const marketplace = await DataMarketplaceFHE.deploy();
  
  // 等待部署确认
  await marketplace.waitForDeployment();
  
  const deployTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const address = await marketplace.getAddress();
  
  console.log('\n✅ DataMarketplaceFHE 部署成功！\n');
  console.log(`📍 合约地址: ${address}`);
  console.log(`⏱️  部署耗时: ${deployTime} 秒`);
  console.log(`🔗 区块链浏览器: https://explorer.zama.ai/address/${address}`);
  
  // 验证合约部署
  console.log('\n🔍 验证合约...');
  try {
    const datasetCount = await marketplace.getDatasetCount();
    const queryCount = await marketplace.getQueryCount();
    const platformFee = await marketplace.PLATFORM_FEE_PERCENT();
    
    console.log(`   ✅ Dataset Count: ${datasetCount}`);
    console.log(`   ✅ Query Count: ${queryCount}`);
    console.log(`   ✅ Platform Fee: ${platformFee}%`);
  } catch (error) {
    console.log(`   ⚠️  无法验证合约: ${error.message}`);
  }
  
  // 保存部署信息
  const deployment = {
    network: network,
    chainId: chainId,
    contractName: "DataMarketplaceFHE",
    address: address,
    deployer: deployer.address,
    deployTime: new Date().toISOString(),
    deployDuration: deployTime,
    txHash: marketplace.deploymentTransaction().hash,
    blockNumber: (await hre.ethers.provider.getBlockNumber()).toString(),
    fhevmEnabled: true,
    gatewayIntegrated: true
  };
  
  // 保存到文件
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `fhe-${network}-${chainId}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  
  console.log(`\n💾 部署信息已保存到: ${filepath}`);
  
  // 生成前端配置
  console.log('\n📝 生成前端配置...');
  
  const frontendConfig = `// FHEVM 模式配置
export const FHE_CONTRACT_ADDRESS = "${address}";
export const FHE_NETWORK = "${network}";
export const FHE_CHAIN_ID = ${chainId};
export const FHEVM_ENABLED = true;

// 替换 frontend/src/config.js 中的 CONTRACT_ADDRESS
`;
  
  const configPath = path.join(__dirname, '../frontend-fhe-config.txt');
  fs.writeFileSync(configPath, frontendConfig);
  
  console.log(`   💾 已生成: ${configPath}`);
  
  // 下一步说明
  console.log('\n📋 下一步操作：\n');
  console.log('1. 更新前端配置：');
  console.log(`   cd frontend && npm install @zama-fhe/relayer-sdk`);
  console.log('');
  console.log('2. 修改 frontend/src/config.js：');
  console.log(`   export const CONTRACT_ADDRESS = "${address}";`);
  console.log(`   export const FHEVM_ENABLED = true;`);
  console.log('');
  console.log('3. 测试合约：');
  console.log(`   npx hardhat run scripts/test-fhe-contract.js --network ${network}`);
  console.log('');
  console.log('4. 启动前端：');
  console.log('   cd frontend && npm run dev');
  console.log('');
  
  // 保存下一步说明
  const nextStepsPath = path.join(__dirname, '../NEXT_STEPS_FHE.md');
  const nextStepsContent = `# FHE 合约部署成功 - 下一步操作

## ✅ 已完成

- ✅ DataMarketplaceFHE 合约已部署
- ✅ 地址: \`${address}\`
- ✅ 网络: ${network} (Chain ID: ${chainId})
- ✅ 部署时间: ${deployment.deployTime}

## 📋 下一步（按顺序执行）

### Step 1: 安装前端 SDK

\`\`\`bash
cd frontend
npm install @zama-fhe/relayer-sdk --save
\`\`\`

### Step 2: 更新前端配置

编辑 \`frontend/src/config.js\`：

\`\`\`javascript
// 切换到 FHE 模式
export const CONTRACT_ADDRESS = "${address}";
export const FHEVM_ENABLED = true;
export const NETWORK_NAME = "${network}";
export const CHAIN_ID = ${chainId};
\`\`\`

### Step 3: 更新 useContract Hook

修改 \`frontend/src/hooks/useContract.js\` 以使用真正的 FHEVM SDK。

### Step 4: 测试合约功能

\`\`\`bash
# 在项目根目录运行
npx hardhat run scripts/test-fhe-contract.js --network ${network}
\`\`\`

### Step 5: 启动前端测试

\`\`\`bash
cd frontend
npm run dev
\`\`\`

### Step 6: 端到端测试

1. 连接钱包到 Zama Devnet
2. 上传测试数据集（使用 FHE 加密）
3. 执行查询并等待 Gateway 解密
4. 验证结果显示

## 🔗 有用的链接

- 合约地址: https://explorer.zama.ai/address/${address}
- Zama 文档: https://docs.zama.ai/fhevm
- Gateway 状态: https://gateway.zama.ai/status
- 水龙头: https://faucet.zama.ai

## ⚠️ 注意事项

1. Gateway 解密可能需要 30-60 秒
2. 确保账户有足够的 Gas
3. FHE 运算比普通运算消耗更多 Gas
4. 第一次上传数据可能较慢

## 🆘 遇到问题？

参考 \`FHEVM_开发标准与解决方案手册.md\` 第 8-11 章。
`;
  
  fs.writeFileSync(nextStepsPath, nextStepsContent);
  console.log(`📄 详细说明已保存到: ${nextStepsPath}\n`);
  
  console.log('🎉 部署完成！开始参赛之旅吧！\n');
}

// 执行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ 部署失败:\n');
    console.error(error);
    process.exit(1);
  });

