const { ethers } = require('ethers');

const rpcUrls = [
  { name: 'Sepolia (Default)', url: 'https://rpc.sepolia.org' },
  { name: 'Alchemy Public', url: 'https://eth-sepolia.g.alchemy.com/v2/demo' },
  { name: 'Ankr', url: 'https://rpc.ankr.com/eth_sepolia' },
  { name: 'PublicNode', url: 'https://ethereum-sepolia.publicnode.com' },
  { name: 'Chainstack', url: 'https://ethereum-sepolia-rpc.publicnode.com' }
];

async function testRPCs() {
  console.log('🔍 Testing Sepolia RPC URLs...\n');
  
  let workingRPC = null;
  
  for (const rpc of rpcUrls) {
    try {
      console.log(`Testing: ${rpc.name}`);
      console.log(`URL: ${rpc.url}`);
      
      const provider = new ethers.JsonRpcProvider(rpc.url, {
        name: 'sepolia',
        chainId: 11155111
      });
      
      // Set timeout
      provider._getConnection().timeout = 10000; // 10 seconds
      
      const blockNumber = await provider.getBlockNumber();
      const network = await provider.getNetwork();
      
      console.log(`✅ SUCCESS!`);
      console.log(`   Block Number: ${blockNumber}`);
      console.log(`   Chain ID: ${network.chainId}`);
      console.log(`   \n📝 Add this to your .env file:`);
      console.log(`   SEPOLIA_RPC_URL=${rpc.url}\n`);
      
      workingRPC = rpc;
      break;
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }
  }
  
  if (!workingRPC) {
    console.log('\n⚠️  All RPC URLs failed!');
    console.log('\n📌 Recommendations:');
    console.log('1. Check your internet connection');
    console.log('2. Try using a VPN');
    console.log('3. Get a free API key from:');
    console.log('   - Alchemy: https://www.alchemy.com/');
    console.log('   - Infura: https://infura.io/');
    console.log('4. Use local Hardhat network for testing:');
    console.log('   npx hardhat node');
  }
}

testRPCs().catch(console.error);

