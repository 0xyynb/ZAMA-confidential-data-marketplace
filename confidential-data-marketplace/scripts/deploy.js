const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 开始部署 DataMarketplace 合约...\n");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 部署账户:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH\n");

  // 部署合约
  console.log("📦 正在编译和部署合约...");
  const DataMarketplace = await hre.ethers.getContractFactory("DataMarketplace");
  const marketplace = await DataMarketplace.deploy();
  
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  
  console.log("✅ DataMarketplace 已部署到:", marketplaceAddress);

  // 获取网络信息
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 网络:", network.name, "(chainId:", network.chainId, ")\n");

  // 保存部署信息
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: marketplaceAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${network.name}-${network.chainId}.json`
  );
  
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 部署信息已保存到:", deploymentFile);

  // 验证合约配置
  console.log("\n📊 合约配置:");
  console.log("  - 平台手续费:", await marketplace.platformFeePercent(), "%");
  console.log("  - 最低价格:", hre.ethers.formatEther(await marketplace.MIN_PRICE()), "ETH");
  console.log("  - 最大数据量:", Number(await marketplace.MAX_DATA_SIZE()), "个数据点");
  console.log("  - Gas Limit:", Number(await marketplace.CALLBACK_GAS_LIMIT()));
  console.log("  - 解密超时:", Number(await marketplace.DECRYPTION_TIMEOUT()) / 60, "分钟");

  console.log("\n✨ 部署完成！");
  
  // 如果在测试网，提示验证合约
  if (network.name === "sepolia" || network.name === "goerli") {
    console.log("\n🔍 验证合约（可选）:");
    console.log(`npx hardhat verify --network ${network.name} ${marketplaceAddress}`);
  }

  console.log("\n📝 前端配置:");
  console.log("将以下地址添加到前端配置文件:");
  console.log(`CONTRACT_ADDRESS="${marketplaceAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });

