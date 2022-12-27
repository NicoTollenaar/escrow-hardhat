const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const { any } = require("hardhat/internal/core/params/argumentTypes");

describe("AnyNFT", function () {
  let signer0, contract;
  beforeEach(async () => {
    signer0 = ethers.provider.getSigner(0);
    const factory = await ethers.getContractFactory("AnyNFT");
    contract = await factory.deploy();
    await contract.deployed();
    console.log("contract deployed at address:", contract.address);
  });

  it("should be deployed", async function () {
    assert(contract.address !== null);
  });

  describe("testing _mint() function", () => {
    it("should mint a token to the deployer", async () => {
      const signer0Address = await signer0.getAddress();
      console.log("signer0Address:", signer0Address);
      const tx = await contract.mint(signer0Address);
      await tx.wait();
      const balance = await contract.balanceOf(signer0Address);
      assert(balance.toNumber() === 1);
    });
  });
});
