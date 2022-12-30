const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const {
  time,
  takeSnapshot,
} = require("@nomicfoundation/hardhat-network-helpers");
const annualInterestRate = 0.1; //percentage per year, e.g. 0.1 for 10% compounding annually
const secondsPerYear = 60 * 60 * 24 * 365;
const effectiveRatePerSecond = (1 + annualInterestRate) ** (1 / secondsPerYear); //effective rate per second, compouding per second
const rateInRay = effectiveRatePerSecond * 10 ** 27;
const rateInRayFormatted = ethers.BigNumber.from(
  rateInRay.toLocaleString("fullwide", { useGrouping: false })
);
const BUYERINITIALFUNDS = 1000;
const purchasePrice = 100;
const saleObjectTokenId = 1;
const saleObjectQuantity = 1;
const transactionDeadline = Math.floor(Date.now() / 1000) + 600;
const contractFunding = ethers.utils.parseEther("0.1");

describe("DvPEscrow", function () {
  let deployerSigner,
    deployerAddress,
    sellerSigner,
    sellerAddress,
    buyerSigner,
    buyerAddress;
  let escrowContract, currencyContract, saleObjectContract;
  let tokenId;
  let tx;
  beforeEach(async () => {
    // console.log("BEFORE-EACH LAYER1");
    try {
      deployerSigner = ethers.provider.getSigner(0);
      deployerAddress = await deployerSigner.getAddress();
      sellerSigner = ethers.provider.getSigner(1);
      sellerAddress = await sellerSigner.getAddress();
      buyerSigner = ethers.provider.getSigner(2);
      buyerAddress = await buyerSigner.getAddress();
      const currencyFactory = await ethers.getContractFactory("EURDC");
      currencyContract = await currencyFactory.deploy(rateInRayFormatted);
      await currencyContract.deployed();

      tx = await currencyContract.issue(buyerAddress, BUYERINITIALFUNDS);
      await tx.wait();

      const saleObjectFactory = await ethers.getContractFactory("AnyNFT");
      saleObjectContract = await saleObjectFactory.deploy();
      await saleObjectContract.deployed();

      tx = await saleObjectContract.mint(sellerAddress);
      await tx.wait();

      const escrowFactory = await ethers.getContractFactory("DvPEscrow");
      escrowContract = await escrowFactory.deploy(
        sellerAddress,
        buyerAddress,
        saleObjectContract.address,
        saleObjectTokenId,
        saleObjectQuantity,
        currencyContract.address,
        purchasePrice,
        transactionDeadline,
        {
          value: contractFunding,
        }
      );
      await escrowContract.deployed();

      tx = await currencyContract
        .connect(buyerSigner)
        .approve(escrowContract.address, purchasePrice);
      await tx.wait();

      tokenId = await saleObjectContract.tokenByIndex(0);
      tx = await saleObjectContract
        .connect(sellerSigner)
        .approve(escrowContract.address, tokenId);
      await tx.wait();
    } catch (error) {
      console.log("in catch block logging error:", error);
    }
  });

  describe("initial deployment and setup", function () {
    it("should deploy all three contracts", async function () {
      assert(escrowContract.address !== undefined);
      assert(currencyContract.address !== undefined);
      assert(saleObjectContract.address !== undefined);
    });

    it("should transfer 0.1 ETH to escrow contract", async function () {
      const ETHBalance = await ethers.provider.getBalance(
        escrowContract.address
      );
      assert(Number(ethers.utils.formatUnits(ETHBalance, 18)) == 0.1);
    });

    it("should mint 1000 EURDC to buyer", async function () {
      const initialEURDCBalance = await currencyContract.balanceOf(
        buyerAddress
      );
      assert(initialEURDCBalance.toNumber() === 1000);
    });

    it("should mint 1 AnyNFT to seller", async function () {
      const initialAnyNFTBalance = await saleObjectContract.balanceOf(
        sellerAddress
      );
      assert.equal(initialAnyNFTBalance.toNumber(), 1);
    });

    it("should approve transfer of purchase price", async function () {
      const allowanceEscrowContract = await currencyContract.allowance(
        buyerAddress,
        escrowContract.address
      );
      assert(allowanceEscrowContract.toNumber() === purchasePrice);
    });

    it("should approve transfer of sale object", async function () {
      const approvedAddress = await saleObjectContract.getApproved(tokenId);
      assert(approvedAddress === escrowContract.address);
    });
  });

  describe("testing transferPurchasePriceIntoEscrow()", () => {
    beforeEach(async function () {
      // console.log("BEFORE-EACH - LAYER2");
      tx = await escrowContract
        .connect(buyerSigner)
        .transferPurchasePriceIntoEscrow();
      await tx.wait();
    });

    it("should transfer purchase price into escrow", async () => {
      const currencyBalanceEscrowContract = await currencyContract.balanceOf(
        escrowContract.address
      );
      assert(currencyBalanceEscrowContract.toNumber() === purchasePrice);
    });

    it("should revert if transferring purchase price is attempted again", async function () {
      await expect(
        escrowContract.connect(buyerSigner).transferPurchasePriceIntoEscrow()
      ).to.be.revertedWith("purchase price already paid");
    });

    describe("testing withdrawPurchasePrice() after transfer", async function () {
      let currencyBalanceEscrowContract, snapshot;
      after(async function () {
        await snapshot.restore();
      });
      it("should revert if withdrawal is attempted before expiry", async function () {
        await expect(
          escrowContract.connect(buyerSigner).withdrawPurchasePrice()
        ).to.be.revertedWith("transaction deadline not yet expired");
      });
      it("should withdraw purchasePrice after expiry", async function () {
        snapshot = await takeSnapshot();
        await time.increase(3000);
        tx = await escrowContract.connect(buyerSigner).withdrawPurchasePrice();
        await tx.wait();
        currencyBalanceEscrowContract = await currencyContract.balanceOf(
          escrowContract.address
        );
        const currencyBalanceBuyer = await currencyContract.balanceOf(
          buyerAddress
        );
        assert(currencyBalanceBuyer.toNumber() === BUYERINITIALFUNDS);
        assert(currencyBalanceEscrowContract.toNumber() < purchasePrice);
      });
    });
  });

  describe("testing transferSaleObjectIntoEscrow()", () => {
    beforeEach(async function () {});

    it("should do nothing for now", async () => {});
  });
});
