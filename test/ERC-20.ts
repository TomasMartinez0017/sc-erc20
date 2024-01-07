import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC20_Maker, ERC20_Maker__factory } from "../typechain-types";

describe("ERC20_Maker", function () {
  let erc20Maker: ERC20_Maker;
  let owner: any, addr1: any, addr2: any, nonOwner: any;

  beforeEach(async function () {
    // Deploy the contract before each test
    const erc20MakerFactory = await ethers.getContractFactory("ERC20_Maker") as ERC20_Maker__factory;
    erc20Maker = await erc20MakerFactory.deploy() as ERC20_Maker;

    // Wait for the deployment transaction to be mined
    const deploymentTransaction = erc20Maker.deploymentTransaction();
    if (deploymentTransaction) {
      await deploymentTransaction.wait();
    }

    // Get signers
    [owner, addr1, addr2, nonOwner] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await erc20Maker.owner()).to.equal(owner.address);
    });

    it("Should assign the initial supply of tokens to the owner", async function () {
      const ownerBalance = await erc20Maker.balanceOf(owner.address); 
      expect(await erc20Maker.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Minting", function () {
    it("Should allow controller to mint tokens", async function () {
      // First add a controller
      await erc20Maker.addController(addr1.address);

      // Mint 100 tokens to addr2
      await erc20Maker.connect(addr1).mint(addr2.address, 100);
      const addr2Balance = await erc20Maker.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(100);
    });

    it("Should fail if non-controller tries to mint tokens", async function () {
      await expect(erc20Maker.connect(nonOwner).mint(addr2.address, 100)).to.be.revertedWith("Only controllers can mint");
    });
  });

  describe("Burning", function () {
    it("Should allow burning tokens", async function () {
      // Burn 50 tokens from owner (in token wei)
      const burnAmount = BigInt(50) * BigInt(10) ** BigInt(18);
      await erc20Maker.connect(owner).burn(burnAmount);
    
      const ownerBalance = await erc20Maker.balanceOf(owner.address);
      const expectedBalance = (BigInt(1000) * BigInt(10) ** BigInt(18)) - burnAmount;
    
      expect(ownerBalance).to.equal(expectedBalance);
    });

    it("Should allow controllers to burn tokens from other accounts", async function () {
      // Add addr1 as a controller
      await erc20Maker.addController(addr1.address);

      // Transfer 100 tokens to addr2 and approve addr1 to burn them
      await erc20Maker.transfer(addr2.address, 100);
      await erc20Maker.connect(addr2).approve(addr1.address, 100);

      // Burn 50 tokens from addr2 by addr1
      await erc20Maker.connect(addr1).burnFrom(addr2.address, 50);
      const addr2Balance = await erc20Maker.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });

  describe("Controllers Management", function () {
    it("Should allow owner to add a controller", async function () {
      await erc20Maker.addController(addr1.address);
      expect(await erc20Maker.isController(addr1.address)).to.equal(true);
    });

    it("Should allow owner to remove a controller", async function () {
      await erc20Maker.addController(addr1.address);
      await erc20Maker.removeController(addr1.address);
      expect(await erc20Maker.isController(addr1.address)).to.equal(false);
    });
  });

  describe("Allowance Management", function () {
    it("Should allow owner to increase allowance", async function () {
      await erc20Maker.increaseAllowance(addr1.address, 100);
      expect(await erc20Maker.allowance(owner.address, addr1.address)).to.equal(100);
    });

    it("Should allow owner to decrease allowance", async function () {
      await erc20Maker.increaseAllowance(addr1.address, 100);
      await erc20Maker.decreaseAllowance(addr1.address, 50);
      expect(await erc20Maker.allowance(owner.address, addr1.address)).to.equal(50);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens successfully", async function () {
      // Transfer 100 tokens from owner to addr1
      const transferAmount = BigInt(100) * BigInt(10) ** BigInt(18);
      await erc20Maker.connect(owner).transfer(addr1.address, transferAmount);

      const addr1Balance = await erc20Maker.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);
    });

    it("Should fail when transferring more than balance", async function () {
      const largeAmount = BigInt(2000) * BigInt(10) ** BigInt(18);
      await expect(erc20Maker.connect(owner).transfer(addr1.address, largeAmount)).to.be.reverted;
    });

    it("Should fail when transferring to zero address", async function () {
      const transferAmount = BigInt(100) * BigInt(10) ** BigInt(18);
      await expect(erc20Maker.connect(owner).transfer("0x0000000000000000000000000000000000000000", transferAmount)).to.be.reverted;
    });
  });

  describe("Transfer from Account", function () {
    it("Should allow for transfer if allowance is sufficient", async function () {
      // Owner approves addr1 to spend tokens
      const allowanceAmount = BigInt(100) * BigInt(10) ** BigInt(18);
      await erc20Maker.connect(owner).increaseAllowance(addr1.address, allowanceAmount);

      // addr1 transfers tokens from owner to addr2
      await erc20Maker.connect(addr1).transferFrom(owner.address, addr2.address, allowanceAmount);

      const addr2Balance = await erc20Maker.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(allowanceAmount);
    });

    it("Should fail for transferFrom if allowance is insufficient", async function () {
      const transferAmount = BigInt(100) * BigInt(10) ** BigInt(18);
      const lowerAllowance = BigInt(50) * BigInt(10) ** BigInt(18);
      await erc20Maker.connect(owner).increaseAllowance(addr1.address, lowerAllowance);

      await expect(erc20Maker.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)).to.be.reverted;
    });
  });
});
