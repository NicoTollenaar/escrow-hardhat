const { ethers } = require("hardhat");
const { expect, assert } = require("chai");
const annualInterestRate = 0.1; //percentage per year, e.g. 0.1 for 10% compounding annually
const secondsPerYear = 60 * 60 * 24 * 365;
const effectiveRatePerSecond = (1 + annualInterestRate) ** (1 / secondsPerYear); //effective rate per second, compouding per second
const rateInRay = effectiveRatePerSecond * 10 ** 27;
const rateInRayFormatted = ethers.BigNumber.from(
  rateInRay.toLocaleString("fullwide", { useGrouping: false })
);
const BUYERINITIALFUNDS = ethers.utils.parseUnits("1000", 18);
const purchasePrice = ethers.utils.parseUnits("100", 18);
const saleObjectTokenId = ethers.utils.parseUnits("1", 18);
const saleObjectQuantity = ethers.utils.parseUnits("1", 18);
const transactionDeadline = Math.floor(Date.now() / 1000) + 30 * 1000;

describe("DvPEscrow", function () {
  let deployerSigner,
    deployerAddress,
    sellerSigner,
    sellerAddress,
    buyerSigner,
    buyerAddress;
  let escrowContract, currencyContract, saleObjectContract;
  let tx;
  const contractFunding = ethers.utils.parseEther("0.1");
  before(async () => {
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
    } catch (error) {
      console.log("in catch block logging error:", error);
    }
  });

  describe("initial deployment and setup", function () {
    it("should deploy all three contract", async function () {
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
      assert(
        Number(ethers.utils.formatUnits(initialEURDCBalance.toString(), 18)) ===
          1000
      );
    });

    it("should mint 1 AnyNFT to buyer", async function () {
      const initialAnyNFTBalance = await saleObjectContract.balanceOf(
        sellerAddress
      );
      assert.equal(initialAnyNFTBalance.toNumber(), 1);
    });
  });

  describe("testing transferPurchasePriceIntoEscrow()", () => {
    beforeEach(async function () {});

    it("should do nothing for now", async () => {});
  });

  describe("testing transferSaleObjectIntoEscrow()", () => {
    beforeEach(async function () {});

    it("should do nothing for now", async () => {});
  });
});
