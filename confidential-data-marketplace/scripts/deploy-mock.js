const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying DataMarketplaceMock Contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deployer Address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("📦 Compiling and deploying contract...");
  const DataMarketplaceMock = await hre.ethers.getContractFactory("DataMarketplaceMock");
  const marketplace = await DataMarketplaceMock.deploy();
  
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  
  console.log("✅ DataMarketplaceMock deployed to:", marketplaceAddress);

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(chainId:", network.chainId, ")\n");

  // Save deployment info
  const deploymentInfo = {
    contractName: "DataMarketplaceMock",
    contractAddress: marketplaceAddress,
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    type: "Mock Version (for standard EVM networks)",
    note: "This is a mock version without actual FHE encryption. For production, deploy full FHEVM version to Zama network."
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `mock-${network.name}-${network.chainId}.json`
  );
  
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to:", deploymentFile);

  // Verify contract configuration
  console.log("\n📊 Contract Configuration:");
  console.log("  - Platform Fee:", await marketplace.PLATFORM_FEE_PERCENT(), "%");
  console.log("  - Minimum Price:", hre.ethers.formatEther(await marketplace.MIN_PRICE()), "ETH");
  console.log("  - Max Data Size:", Number(await marketplace.MAX_DATA_SIZE()), "data points");

  console.log("\n✨ Deployment Complete!");
  
  // Verification instructions
  if (network.name === "sepolia" || network.name === "goerli") {
    console.log("\n🔍 Verify Contract (optional):");
    console.log(`npx hardhat verify --network ${network.name} ${marketplaceAddress}`);
  }

  // Frontend configuration
  console.log("\n📝 Frontend Configuration:");
  console.log("Add this address to frontend/src/config.js:");
  console.log(`export const CONTRACT_ADDRESS = "${marketplaceAddress}";`);
  
  console.log("\n⚠️  IMPORTANT:");
  console.log("This is a MOCK version for UI testing on standard EVM networks.");
  console.log("For production with real FHE encryption, deploy to Zama FHEVM network.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

