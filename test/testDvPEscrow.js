const { ethers, network } = require("hardhat");
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
let saleObjectTokenId;
const saleObjectQuantity = 1;
const transactionPeriod = 6000;
const transactionDeadline = Math.floor(Date.now() / 1000) + transactionPeriod;
const contractFunding = ethers.utils.parseEther("1");

describe("DvPEscrow", function () {
  let deployerSigner,
    deployerAddress,
    sellerSigner,
    sellerAddress,
    buyerSigner,
    buyerAddress;
  let escrowContract, currencyContract, saleObjectContract;
  let tx;
  let chainId;
  let snapshot;
  beforeEach(async () => {
    // console.log("BEFORE-EACH LAYER1 (set up)");
    try {
      const network = await ethers.provider.getNetwork();
      chainId = network.chainId;
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
      saleObjectTokenId = await saleObjectContract.tokenByIndex(0);

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

      tx = await saleObjectContract
        .connect(sellerSigner)
        .approve(escrowContract.address, saleObjectTokenId);
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

    it("should transfer ETH amount in contract funding to escrow contract", async function () {
      const ETHBalance = await ethers.provider.getBalance(
        escrowContract.address
      );
      assert(
        Number(ethers.utils.formatUnits(ETHBalance, 18)) ===
          Number(ethers.utils.formatUnits(contractFunding, 18))
      );
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
      const approvedAddress = await saleObjectContract.getApproved(
        saleObjectTokenId
      );
      assert(approvedAddress === escrowContract.address);
    });
  });

  describe("testing transferPurchasePriceIntoEscrow()", () => {
    beforeEach(async function () {
      // console.log("BEFORE-EACH - LAYER2 (transfer purchase price)");
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

    describe("withdrawPurchasePrice() after transferring purchase price", async function () {
      let currencyBalanceEscrowContract;
      after(async function () {
        if (chainId === 31337) await snapshot.restore();
      });
      it("should revert if withdrawal is attempted before expiry", async function () {
        await expect(
          escrowContract.connect(buyerSigner).withdrawPurchasePrice()
        ).to.be.revertedWith("transaction deadline not yet expired");
        await expect(
          escrowContract.connect(deployerSigner).withdrawPurchasePrice()
        ).to.be.revertedWith("transaction deadline not yet expired");
      });

      it("should withdraw purchasePrice after expiry", async function () {
        if (chainId === 31337) {
          snapshot = await takeSnapshot();
          await time.increase(transactionPeriod + 100000);
          tx = await escrowContract
            .connect(buyerSigner)
            .withdrawPurchasePrice();
          await tx.wait();
          currencyBalanceEscrowContract = await currencyContract.balanceOf(
            escrowContract.address
          );
          const currencyBalanceBuyer = await currencyContract.balanceOf(
            buyerAddress
          );
          assert(currencyBalanceBuyer.toNumber() === BUYERINITIALFUNDS);
          assert(currencyBalanceEscrowContract.toNumber() < purchasePrice);
        }
      });
    });
    describe("transfer sale object after transferring purchase price", async function () {
      let ETHBalanceDeployerBefore;
      beforeEach(async function () {
        // console.log("BEFORE-EACH - LAYER3 (transfer sale object)");
        ETHBalanceDeployerBefore = await ethers.provider.getBalance(
          deployerAddress
        );
        tx = await escrowContract
          .connect(sellerSigner)
          .transferSaleObjectIntoEscrow({ gasLimit: 30000000 });
        await tx.wait();
      });
      it("should transfer the sale object into escrow", async function () {
        const balanceSaleObjectSeller = await saleObjectContract.balanceOf(
          sellerAddress
        );
        assert(balanceSaleObjectSeller.toNumber() === 0);
      });
      it("should close the transaction", async function () {
        const currencyBalanceSeller = await currencyContract.balanceOf(
          sellerAddress
        );

        const AnyNFTbalanceBuyer = await saleObjectContract.balanceOf(
          buyerAddress
        );

        const addressOwnerAnyNFT = await saleObjectContract.ownerOf(
          saleObjectTokenId
        );
        const AnyNFTBalanceEscrow = await saleObjectContract.balanceOf(
          escrowContract.address
        );
        assert(AnyNFTBalanceEscrow.toNumber() === 0);
        assert(currencyBalanceSeller.toNumber() === 100);
        assert(AnyNFTbalanceBuyer.toNumber() === 1);
        assert(addressOwnerAnyNFT === buyerAddress);
      });
      it("should transfer remaining currency and ETH to deployer", async function () {
        const currencyBalanceEscrow = await currencyContract.balanceOf(
          escrowContract.address
        );
        // const currencyBalanceDeployer = await currencyContract.balanceOf(
        //   deployerAddress
        // );
        const ETHBalanceEscrow = await ethers.provider.getBalance(
          escrowContract.address
        );
        const ETHBalanceDeployerAfter = await ethers.provider.getBalance(
          deployerAddress
        );
        const ETHAddedDeployer = ETHBalanceDeployerAfter.sub(
          ETHBalanceDeployerBefore
        );
        assert(currencyBalanceEscrow.toNumber() === 0);
        assert(ETHBalanceEscrow.toNumber() === 0);
        assert(ethers.utils.formatEther(ETHAddedDeployer) > 0);
      });
    });
  });

  describe("testing transferSaleObjectIntoEscrow()", () => {
    beforeEach(async function () {
      // console.log("BEFORE-EACH - LAYER2 (transfer sale object)");
      tx = await escrowContract
        .connect(sellerSigner)
        .transferSaleObjectIntoEscrow();
      await tx.wait();
    });

    it("should transfer sale object into escrow", async () => {
      const saleObjectBalanceEscrowContract =
        await saleObjectContract.balanceOf(escrowContract.address);
      assert(saleObjectBalanceEscrowContract.toNumber() === 1);
    });

    it("should revert if transferring sale object is attempted again", async function () {
      await expect(
        escrowContract.connect(sellerSigner).transferSaleObjectIntoEscrow()
      ).to.be.revertedWith("sale object already transferred");
    });

    describe("withdrawSaleObject() after transferring sale object", async function () {
      let saleObjectBalanceEscrowContract;
      after(async function () {
        if (chainId === 31337) await snapshot.restore();
      });
      it("should revert if withdrawal is attempted before expiry", async function () {
        await expect(
          escrowContract.connect(sellerSigner).withdrawSaleObject()
        ).to.be.revertedWith("transaction deadline not yet expired");
        await expect(
          escrowContract.connect(deployerSigner).withdrawSaleObject()
        ).to.be.revertedWith("transaction deadline not yet expired");
      });

      it("should withdraw sale object after expiry", async function () {
        if (chainId === 31337) {
          snapshot = await takeSnapshot();
          await time.increase(transactionPeriod + 100000);
          tx = await escrowContract.connect(sellerSigner).withdrawSaleObject();
          await tx.wait();
          saleObjectBalanceEscrowContract = await saleObjectContract.balanceOf(
            escrowContract.address
          );
          const saleObjectBalanceSeller = await saleObjectContract.balanceOf(
            sellerAddress
          );
          assert(saleObjectBalanceSeller.toNumber() === 1);
          assert(saleObjectBalanceEscrowContract.toNumber() === 0);
        }
      });
    });
    describe("transfer purchase price after transferring sale object", async function () {
      let ETHBalanceDeployerBefore;
      beforeEach(async function () {
        // console.log("BEFORE-EACH - LAYER3 (transfer purchase price)");
        ETHBalanceDeployerBefore = await ethers.provider.getBalance(
          deployerAddress
        );
        tx = await escrowContract
          .connect(buyerSigner)
          .transferPurchasePriceIntoEscrow({ gasLimit: 30000000 });
        await tx.wait();
      });
      it("should transfer the purchase price into escrow", async function () {
        const balanceCurrencyBuyer = await currencyContract.balanceOf(
          buyerAddress
        );
        // const balanceCurrencyEscrow = await currencyContract.balanceOf(
        //   escrowContract.address
        // );
        assert(
          balanceCurrencyBuyer.toNumber() === BUYERINITIALFUNDS - purchasePrice
        );
        // assert(balanceCurrencyEscrow.toNumber() === purchasePrice);
      });
      it("should close the transaction", async function () {
        const currencyBalanceSeller = await currencyContract.balanceOf(
          sellerAddress
        );

        const AnyNFTbalanceBuyer = await saleObjectContract.balanceOf(
          buyerAddress
        );

        const addressOwnerAnyNFT = await saleObjectContract.ownerOf(
          saleObjectTokenId
        );
        const AnyNFTBalanceEscrow = await saleObjectContract.balanceOf(
          escrowContract.address
        );
        assert(AnyNFTBalanceEscrow.toNumber() === 0);
        assert(currencyBalanceSeller.toNumber() === purchasePrice);
        assert(AnyNFTbalanceBuyer.toNumber() === 1);
        assert(addressOwnerAnyNFT === buyerAddress);
      });
      it("should transfer remaining currency and ETH to deployer", async function () {
        const currencyBalanceEscrow = await currencyContract.balanceOf(
          escrowContract.address
        );
        // const currencyBalanceDeployer = await currencyContract.balanceOf(
        //   deployerAddress
        // );
        const ETHBalanceEscrow = await ethers.provider.getBalance(
          escrowContract.address
        );
        const ETHBalanceDeployerAfter = await ethers.provider.getBalance(
          deployerAddress
        );
        const ETHAddedDeployer = ETHBalanceDeployerAfter.sub(
          ETHBalanceDeployerBefore
        );
        assert(currencyBalanceEscrow.toNumber() === 0);
        assert(ETHBalanceEscrow.toNumber() === 0);
        assert(ethers.utils.formatEther(ETHAddedDeployer) > 0);
      });
    });
  });
});
