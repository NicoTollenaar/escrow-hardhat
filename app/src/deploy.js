import { ethers } from "hardhat";
import currencyContractArtifacts from "./artifacts/contracts/EURDC.sol/EURDC.json";
import saleObjectContractArtifacts from "./artifacts/contracts/AnyNFT.sol/AnyNFT.json";

export default async function deploy() {
  let signer = await ethers.provider.getSigner();
  let factory = new ethers.ContractFactory(
    currencyContractArtifacts.abi,
    currencyContractArtifacts.bytecode,
    signer
  );
  const currencyContract = await factory.deploy();
  await currencyContract.deployTransaction.wait();
  factory = new ethers.ContractFactory(
    saleObjectContractArtifacts.abi,
    saleObjectContractArtifacts.bytecode,
    signer
  );
  const saleObjectContract = await factory.deploy();
  await saleObjectContract.deployTransaction.wait();
  console.log("currencyContract.address:", currencyContract.address);
  console.log("saleObjectContract.address:", saleObjectContract.address);
}
