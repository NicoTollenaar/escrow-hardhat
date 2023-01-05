const { ethers } = require("hardhat");
const currencyContractArtifacts = require("../app/src/artifacts/contracts/EURDC.sol/EURDC.json");
const saleObjectContractArtifacts = require("../app/src/artifacts/contracts/AnyNFT.sol/AnyNFT.json");
const fs = require("fs");
const annualInterestRate = 0.1; //percentage per year, e.g. 0.1 for 10% compounding annually
const secondsPerYear = 60 * 60 * 24 * 365;
const effectiveRatePerSecond = (1 + annualInterestRate) ** (1 / secondsPerYear); //effective rate per second, compouding per second
const rateInRay = effectiveRatePerSecond * 10 ** 27;
const rateInRayFormatted = ethers.BigNumber.from(
  rateInRay.toLocaleString("fullwide", { useGrouping: false })
);

async function deployCurrencyAndSaleObjectContracts() {
  try {
    const defaultSigner = ethers.provider.getSigner();
    let factory = new ethers.ContractFactory(
      currencyContractArtifacts.abi,
      currencyContractArtifacts.bytecode,
      defaultSigner
    );
    const currencyContract = await factory.deploy(rateInRayFormatted);
    await currencyContract.deployTransaction.wait();

    console.log("currencyContract.address:", currencyContract.address);

    factory = new ethers.ContractFactory(
      saleObjectContractArtifacts.abi,
      saleObjectContractArtifacts.bytecode,
      defaultSigner
    );

    const saleObjectContract = await factory.deploy();
    await saleObjectContract.deployTransaction.wait();

    console.log("saleObjectContract.address:", saleObjectContract.address);

    const contractAddresses = {
      currencyContractAddress: currencyContract.address,
      saleObjectContractAddress: saleObjectContract.address,
    };

    const data = `export default contractAddresses = {currencyContractAddress: "${currencyContract.address}", saleObjectContractAddress: "${saleObjectContract.address}"}`;

    fs.writeFileSync("./constants/contractAddresses.js", data, "utf-8");
    const checkFs = fs.readFileSync(
      "./constants/contractAddresses.js",
      "utf-8"
    );
    console.log("checkFs", checkFs);
  } catch (error) {
    console.log(error);
  }
}

deployCurrencyAndSaleObjectContracts();
