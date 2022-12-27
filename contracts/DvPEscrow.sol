// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract DvPEscrow {
    address public seller;
    address public buyer;
    address public arbiter;

    address public saleObjectContractAddress;
    uint public saleObjectTokenId;
    uint public quantity;
    address public currencyContractAddress;
    uint public purchasePrice;
    uint transactionDeadline;

    bool public isPurchasePricePaid;
    bool public isSaleObjectTransfered;

    bool public isApproved;

    constructor(
        address _seller,
        address _buyer,
        address _saleObjectContractAddress,
        uint _saleObjectTokenId,
        uint _quantity,
        address _currencyContractAddress,
        uint _purchasePrice,
        uint _transactionDeadline
    ) payable {
        require(
            msg.sender == seller || msg.sender == buyer,
            "deployer must be seller or buyer"
        );
        seller = _seller;
        buyer = _buyer;
        saleObjectContractAddress = _saleObjectContractAddress;
        saleObjectTokenId = _saleObjectTokenId;
        quantity = _quantity;
        currencyContractAddress = _currencyContractAddress;
        purchasePrice = _purchasePrice;
        transactionDeadline = _transactionDeadline;
        if (msg.sender == seller) {
            transferSaleObjectToEscrow();
        } else if (msg.sender == buyer) {
            transferPurchasePriceToEscrow();
        }
    }

    function depositSaleObjectInEscrow() external {
        require(
            block.timestamp < transactionDeadline,
            "transaction deadline expire"
        );
        require(msg.sender == seller, "only seller can transfer asset");
        transferSaleObjectToEscrow();
        isSaleObjectTransfered = true;
        if (isPurchasePricePaid) closeTransaction();
    }

    function depositPurchasePriceInEscrow() external {
        require(
            block.timestamp < transactionDeadline,
            "transaction deadline expire"
        );
        require(msg.sender == buyer, "only buyer can transfer asset");
        bool success = transferPurchasePriceToEscrow();
        require(success, "transferring purchase price to escrow failed");
        isPurchasePricePaid = true;
        if (isSaleObjectTransfered) closeTransaction();
    }

    function transferPurchasePriceToEscrow() private returns (bool) {
        (bool success, ) = currencyContractAddress.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                purchasePrice
            )
        );
        require(success, "transferring purchase price to escrow failed");
        return success;
    }

    function transferSaleObjectToEscrow() private returns (bool) {
        (bool success, ) = saleObjectContractAddress.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                saleObjectTokenId
            )
        );
        require(success, "transferring sale object to escrow failed");
        return success;
    }

    function closeTransaction() private {
        bool cashLegSettled = transferPurchasePriceToSeller();
        bool assetLegSettled = transferSaleObjectToBuyer();
        require(cashLegSettled && assetLegSettled);
    }

    function transferPurchasePriceToSeller() private returns (bool) {
        (bool success, ) = currencyContractAddress.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                seller,
                purchasePrice
            )
        );
        require(success, "transferring purchase price to seller failed");
        return success;
    }

    function transferSaleObjectToBuyer() private returns (bool) {
        (bool success, ) = currencyContractAddress.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                buyer,
                saleObjectTokenId
            )
        );
        require(success, "transferring sale object to buyer failed");
        return success;
    }

    function withdrawPurchasePrice() external {
        require(
            block.timestamp > transactionDeadline,
            "transaction deadline not yet expired"
        );
        require(msg.sender == buyer);
        (bool success, ) = currencyContractAddress.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                buyer,
                purchasePrice
            )
        );
        require(success, "withdrawal of purchase price failed");
        isPurchasePricePaid = false;
    }

    function withdrawSaleObject() external {
        require(
            block.timestamp > transactionDeadline,
            "transaction deadline not yet expired"
        );
        require(msg.sender == seller);
        (bool success, ) = saleObjectContractAddress.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                seller,
                saleObjectTokenId
            )
        );
        require(success, "withdrawal of purchase price failed");
        isSaleObjectTransfered = false;
    }

    receive() external payable {}
}
