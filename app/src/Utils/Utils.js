import { ethers } from "ethers";
import artifacts from "../artifacts/contracts/DvPEscrow.sol/DvPEscrow.json";

class Utils {
  static provider = new ethers.providers.Web3Provider(window.ethereum);

  static async getDeployerSigner() {
    const [deployerAddress] = await window.ethereum.request(
      "eth_requestAccounts"
    );
    console.log(
      "in getDeployerSigner logging deployerAddress:",
      deployerAddress
    );
    const deployerSigner = this.provider.getSigner(deployerAddress);
    console.log("in getDeployerSigner logging this.provider:", this.provider);
    console.log("in getDeployerSigner logging deployerSigner:", deployerSigner);
    return deployerSigner;
  }

  static async deployEscrowContract(
    sellerAddress,
    buyerAddress,
    saleObjectContractAddress,
    saleObjectTokenId,
    saleObjectQuantity,
    currencyContractAddress,
    purchasePrice,
    transactionDeadline
  ) {
    console.log("logging argumebnts sellerAddress:", sellerAddress);
    console.log("logging argumebnts buyerAddress:", buyerAddress);
    console.log(
      "logging argumebnts saleObjectContractAddress:",
      saleObjectContractAddress
    );
    console.log("logging argumebnts saleObjectTokenId:", saleObjectTokenId);
    console.log("logging argumebnts saleObjectQuantity:", saleObjectQuantity);
    console.log(
      "logging argumebnts currencyContractAddress:",
      currencyContractAddress
    );
    console.log("logging argumebnts purchasePrice:", purchasePrice);
    console.log("logging argumebnts transactionDeadline:", transactionDeadline);
    const deployerSigner = await this.getDeployerSigner();
    const factory = new ethers.ContractFactory(
      artifacts.abi,
      artifacts.bytecode,
      deployerSigner
    );
    const escrowContract = await factory.deploy(
      sellerAddress,
      buyerAddress,
      saleObjectContractAddress,
      saleObjectTokenId,
      saleObjectQuantity,
      currencyContractAddress,
      purchasePrice,
      transactionDeadline
    );
    await escrowContract.deployTransaction.wait();
    return escrowContract;
  }
}

export default Utils;
