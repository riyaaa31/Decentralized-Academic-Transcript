import { ethers } from "hardhat";

async function main() {
  // Get the ContractFactory for AcademicTranscriptRegistry
  const TranscriptRegistry = await ethers.getContractFactory("AcademicTranscriptRegistry");

  // Deploy the contract
  const registry = await TranscriptRegistry.deploy();

  // Wait for it to be deployed
  await registry.waitForDeployment();

  // Print the deployed contract address
  console.log(`✅ Contract deployed at: ${registry.target}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
