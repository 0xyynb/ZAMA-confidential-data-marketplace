const hre = require("hardhat");

async function main() {
  console.log("💰 Checking Wallet Balance...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📝 Wallet Address:", deployer.address);
  
  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInEth = hre.ethers.formatEther(balance);
  
  console.log("💵 Balance:", balanceInEth, "ETH");
  
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(chainId:", network.chainId, ")");
  
  // Check if sufficient funds
  const minRequired = hre.ethers.parseEther("0.05"); // 0.05 ETH minimum
  
  if (balance >= minRequired) {
    console.log("\n✅ Sufficient funds for deployment!");
  } else {
    console.log("\n⚠️  WARNING: Low balance!");
    console.log("   Recommended: At least 0.05 ETH for deployment");
    console.log("   Get test ETH from:");
    console.log("   - https://sepoliafaucet.com/");
    console.log("   - https://faucet.sepolia.dev/");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

