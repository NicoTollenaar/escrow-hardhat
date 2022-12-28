const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("DvPEscrow", function () {
  let buyer, seller, transactionDeadline;
  let escrowContract, currencyContract, saleObjectContract;
  let saleObjectTokenId, saleObjectQuantity, purchasePrice;
  const contractFunding = ethers.utils.parseEther("0.1");
  beforeEach(async () => {
    seller = ethers.provider.getSigner(0);
    buyer = ethers.provider.getSigner(1);
    const escrowFactory = await ethers.getContractFactory("DvPEscrow");
    contract = await escrowFactory.deploy(
      seller,
      buyer,
      saleObjectContractAddress,
      saleObjectTokenId,
      saleObjectQuantity,
      currencyContractAddress,
      purchasePrice,
      transactionDeadline
      {
        value: ethers.utils.parseEther("0.1"),
      }
    );
    await contract.deployed();
  });

  it("should be funded initially", async function () {
    let balance = await ethers.provider.getBalance(contract.address);
    expect(balance).to.eq(deposit);
  });

  describe("after approval from address other than the arbiter", () => {
    it("should revert", async () => {
      await expect(contract.connect(beneficiary).approve()).to.be.reverted;
    });
  });

  describe("after approval from the arbiter", () => {
    it("should transfer balance to beneficiary", async () => {
      const before = await ethers.provider.getBalance(beneficiary.getAddress());
      const approveTxn = await contract.connect(arbiter).approve();
      await approveTxn.wait();
      const after = await ethers.provider.getBalance(beneficiary.getAddress());
      expect(after.sub(before)).to.eq(deposit);
    });
  });
});
