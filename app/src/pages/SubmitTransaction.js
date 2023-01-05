import { ethers } from "ethers";
import { useState } from "react";
import { Utils } from "../Utils/Utils";
import contractAddresses from "../../../constants/contractAddresses";

function SubmitTransaction() {
  const [escrowContract, setEscrowContract] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [saleObjectAddress, setSaleObjectAddress] = useState(
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
    const contract = await Utils.deployEscrowContract(
      sellerAddress,
      buyerAddress,
      saleObjectAddress,
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
                for="seller"
              >
                Seller
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Seller's address"
              />
            </div>

            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="buyer"
                value={(e) => setSellerAddress(e.target.value)}
              >
                Buyer
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Buyer's address"
                value={(e) => setBuyerAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="NFT"
              >
                Sale Object (NFT)
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="NFT contract address"
                value={(e) => setSaleObjectAddress(e.target.value)}
              />
            </div>
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="NFT"
              >
                TokenId (NFT)
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="number"
                placeholder="TokenId"
                value={(e) => setSaleObjectTokenId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="purchase price"
              >
                Purchase price
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="number"
                placeholder="Purchase price"
                value={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="currency"
              >
                Currency
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder="Currency contract address"
                value={(e) => setCurrencyContractAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="m-3 w-96">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                for="transaction deadline"
              >
                Transaction deadline
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="date"
                placeholder="Date"
                value={(e) => setDeadlineDate(e.target.value)}
              />
            </div>
            <div className="m-3 w-96">
              <input
                className="mt-[28px]  shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="time"
                placeholder="Time"
                value={(e) => setDeadlineTime(e.target.value)}
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
