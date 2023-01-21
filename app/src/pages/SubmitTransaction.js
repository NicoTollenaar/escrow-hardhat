import { ethers } from "ethers";
import { useState } from "react";
import Utils from "../Utils/Utils";
import contractAddresses from "../constants/contractAddresses";

function SubmitTransaction() {
  const [escrowContract, setEscrowContract] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [saleObjectContractAddress, setSaleObjectContractAddress] = useState(
    contractAddresses.saleObjectContractAddress
  );
  const [saleObjectQuantity, setSaleObjectQuantity] = useState(1);
  const [saleObjectTokenId, setSaleObjectTokenId] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [currencyContractAddress, setCurrencyContractAddress] = useState(
    contractAddresses.currencyContractAddress
  );
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const deadline = Math.floor(Date.now() / 1000) + 30;
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
    console.log("logging argumebnts deadline:", deadline);
    const contract = await Utils.deployEscrowContract(
      sellerAddress,
      buyerAddress,
      saleObjectContractAddress,
      saleObjectTokenId,
      saleObjectQuantity,
      currencyContractAddress,
      purchasePrice,
      deadline
    );
    setEscrowContract(contract);
  }
  console.log("escrowContract:", escrowContract);

  return (
    <>
      <div>
        <form
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 m-3"
          onSubmit={handleSubmit}
        >
          <div className="flex justify-center">
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="seller"
              >
                Seller
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Seller's address"
                value={sellerAddress}
                onChange={(e) => setSellerAddress(e.target.value)}
              />
            </div>

            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="buyer"
              >
                Buyer
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Buyer's address"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="NFT"
              >
                Sale Object (NFT)
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="NFT contract address"
                value={saleObjectContractAddress}
                onChange={(e) => setSaleObjectContractAddress(e.target.value)}
              />
            </div>
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="NFT"
              >
                TokenId (NFT)
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="number"
                placeholder="TokenId"
                value={saleObjectTokenId}
                onChange={(e) => setSaleObjectTokenId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="purchase price"
              >
                Purchase price
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="number"
                placeholder="Purchase price"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="currency"
              >
                Currency
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Currency contract address"
                value={currencyContractAddress}
                onChange={(e) => setCurrencyContractAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="transaction deadline"
              >
                Transaction deadline
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="date"
                placeholder="Date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
              />
            </div>
            <div className="m-3 w-96">
              <input
                className="mt-[28px]  shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="time"
                placeholder="Time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <button
              className="w-[800px] bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Deploy transaction
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default SubmitTransaction;
