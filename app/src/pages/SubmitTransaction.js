import { ethers } from "ethers";
import { useState } from "react";
import { Utils } from "../Utils/Utils";

function SubmitTransaction() {
  const [sellerAddress, setSellerAddress] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [saleObjectAddress, setSaleObjectAddress] = useState("");
  const [saleObjectQuantity, setSaleObjectQuantity] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [currencyContractAddress, setCurrencyContractAddress] = useState("");
  const [transactionDeadlineDate, setTransactionDeadlineDate] = "";
  const [transactionDeadlineTime, setTransactionDeadlineTime] = "";

  async function handleSubmit(e) {
    e.preventDefault();
    const escrowContract = await Utils.deployEscrowContract(
      sellerAddress,
      buyerAddress,
      saleObjectAddress,
      saleObjectTokenId,
      saleObjectQuantity,
      currencyContractAddress,
      purchasePrice,
      transactionDeadline
    );
  }

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
                Quantity (NFT)
              </label>
              <input
                className="shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="number"
                placeholder="Quantity"
                value={(e) => setSaleObjectQuantity(e.target.value)}
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
                value={(e) => setTransactionDeadlineDate(e.target.value)}
              />
            </div>
            <div className="m-3 w-96">
              <input
                className="mt-[28px]  shadow appearance-none border rounded w-96 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="time"
                placeholder="Time"
                value={(e) => setTransactionDeadlineTime(e.target.value)}
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
        {/* <p className="text-center text-gray-500 text-xs">
          &copy;2020 Acme Corp. All rights reserved.
        </p> */}
      </div>
    </>
  );
}

export default SubmitTransaction;
