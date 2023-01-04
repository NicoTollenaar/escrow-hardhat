import { ethers } from "ethers";
import artifacts from "../artifacts/contracts/DvPEscrow.sol/DvPEscrow.json";

class Utils {
  static provider = new ethers.providers.Web3Provider(window.ethereum);

  static async getDeployerSigner() {
    const [deployerAddress] = await window.ethereum.request(
      "eth_requestAccounts"
    );
    const deployerSigner = this.provider.getSigner(deployerAddress);
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
