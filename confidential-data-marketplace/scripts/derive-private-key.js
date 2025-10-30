/**
 * Utility to derive private key from mnemonic
 * Run: node scripts/derive-private-key.js
 */

const { ethers } = require("ethers");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔐 Mnemonic to Private Key Converter\n");
console.log("⚠️  WARNING: NEVER share your mnemonic or private key!");
console.log("⚠️  This tool is for LOCAL use only!\n");

rl.question("Enter your 12-word mnemonic phrase: ", (mnemonic) => {
  try {
    // Validate mnemonic
    if (!ethers.Mnemonic.isValidMnemonic(mnemonic)) {
      console.error("❌ Invalid mnemonic phrase!");
      process.exit(1);
    }

    // Derive wallet
    const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());

    console.log("\n✅ Wallet derived successfully!\n");
    console.log("📝 Address:", wallet.address);
    console.log("🔑 Private Key:", wallet.privateKey);
    console.log("\n💡 Add this to your .env file:");
    console.log(`PRIVATE_KEY=${wallet.privateKey}`);
    console.log("\n⚠️  Keep this information SECURE!");
    console.log("⚠️  Never commit .env to Git!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    rl.close();
  }
});

