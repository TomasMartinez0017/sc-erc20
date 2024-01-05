import { ethers } from "hardhat";

async function main() {
  // Fetch the contract to deploy
  const ERC20Maker = await ethers.getContractFactory("ERC20_Maker");

  // Deploy the contract
  const erc20Maker = await ERC20Maker.deploy();

  // The contract instance is expected to have an 'address' property
  const contractAddress = (erc20Maker as any).address;

  console.log("ERC20_Maker deployed to:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });