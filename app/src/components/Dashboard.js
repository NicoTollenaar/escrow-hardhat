function Dashboard({
  chainId,
  connectedAccount,
  escrowContract,
  saleObjectContract,
  currencyContract,
  sellerAddress,
  buyerAddress,
}) {
  return (
    <>
      <div className="flex justify-around border-4 mt-4 mx-6 px-2 py-4">
        <div>
          <h6 className="font-bold text-gray-700 mb-2">
            Connected Account:{" "}
            <span className="font-medium text-orange-500"> </span>
          </h6>
          <h6 className="font-bold text-gray-700 mb-2">
            Escrow contract: <span className="font-medium"> </span>
          </h6>
          <h6 className="font-bold text-gray-700 mb-2">
            ChainId: <span className="font-medium"> </span>
          </h6>
        </div>
        <div>
          <h6 className="font-bold text-gray-700 mb-2">
            Seller:
            <span className="font-medium"> </span>
          </h6>
          <h6 className="font-bold text-gray-700 mb-2">
            Buyer: <span className="font-medium"></span>
          </h6>
          <h6 className="font-bold text-gray-700 mb-2">
            Deployer: <span className="font-medium"></span>
          </h6>
        </div>
        <div>
          <h6 className="font-bold text-gray-700 mb-2">
            Coin balance seller: <span className="font-medium"></span>
          </h6>
          <h6 className="font-bold text-gray-700 mb-2">
            Coin balance buyer:
            <span className="font-medium"></span>
          </h6>
          <h6 className="font-bold text-gray-700 mb-2">
            Coin balance escrow:
            <span className="font-medium"></span>
          </h6>
        </div>
        <div>
          <h6 className="font-bold text-gray-700 mb-2">
            NFT balance seller: <span className="font-medium"></span>
          </h6>
          <h6 className="font-bold text-gray-700 mb-2">
            NFT balance buyer:
            <span className="font-medium"></span>
          </h6>
          <h6 className="font-bold text-gray-700 mb-2">
            NFT balance escrow:
            <span className="font-medium"></span>
          </h6>
        </div>
      </div>
    </>
  );
}
export default Dashboard;
