// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract DvPEscrow {
    address public seller;
    address public buyer;
    address public deployer;

    address public saleObjectContractAddress;
    uint public saleObjectTokenId;
    uint public saleObjectQuantity;
    address public currencyContractAddress;
    uint public purchasePrice;
    uint transactionDeadline;

    bool public isPurchasePricePaid;
    bool public isSaleObjectTransferred;
    bool public hasTransactionClosed;

    constructor(
        address _seller,
        address _buyer,
        address _saleObjectContractAddress,
        uint _saleObjectTokenId,
        uint _saleObjectQuantity,
        address _currencyContractAddress,
        uint _purchasePrice,
        uint _transactionDeadline
    ) payable {
        require(
            msg.sender == seller || msg.sender == buyer,
            "deployer must be seller or buyer"
        );
        require(
            msg.value >= 0.1 ether,
            "insufficient ETH sent to fund the escrow contract"
        );
        deployer = msg.sender;
        seller = _seller;
        buyer = _buyer;
        saleObjectContractAddress = _saleObjectContractAddress;
        saleObjectTokenId = _saleObjectTokenId;
        saleObjectQuantity = _saleObjectQuantity;
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
        require(msg.sender == seller, "only seller can transfer asset");
        require(
            block.timestamp < transactionDeadline,
            "transaction deadline expire"
        );
        require(
            isPurchasePricePaid,
            "purchase price not yet paid into escrow, something went wrong at deployment"
        );
        bool success = transferSaleObjectToEscrow();
        require(success, "transferring sale object to escrow failed");
        closeTransaction();
    }

    function depositPurchasePriceInEscrow() external {
        require(msg.sender == buyer, "only buyer can transfer asset");
        require(
            block.timestamp < transactionDeadline,
            "transaction deadline expire"
        );
        require(
            isSaleObjectTransferred,
            "sale object not transferred, something went wrong at deployment"
        );
        bool success = transferPurchasePriceToEscrow();
        require(success, "transferring purchase price to escrow failed");
        closeTransaction();
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
        isPurchasePricePaid = true;
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
        isSaleObjectTransferred = true;
        return success;
    }

    function closeTransaction() private {
        require(
            isPurchasePricePaid && isSaleObjectTransferred,
            "both transaction legs not yet performed"
        );
        bool cashLegSettled = transferPurchasePriceToSeller();
        bool assetLegSettled = transferSaleObjectToBuyer();
        require(cashLegSettled && assetLegSettled);
        hasTransactionClosed = true;
        transferAccruedInterestToBuyer();
        transferResidualETHToDeployer();
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
        require(
            !hasTransactionClosed,
            "transaction closed successfully, nothing to withdraw"
        );
        require(msg.sender == buyer, "only buyer can withdraw purchase price");
        (bool success, ) = currencyContractAddress.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                buyer,
                purchasePrice
            )
        );
        require(success, "withdrawal of purchase price failed");
        transferAccruedInterestToBuyer();
        transferResidualETHToDeployer();
    }

    function withdrawSaleObject() external {
        require(
            block.timestamp > transactionDeadline,
            "transaction deadline not yet expired"
        );
        require(
            !hasTransactionClosed,
            "transaction closed successfully, nothing to withdraw"
        );
        require(msg.sender == seller, "only seller can withdraw sale object");
        (bool success, ) = saleObjectContractAddress.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                seller,
                saleObjectTokenId
            )
        );
        require(success, "withdrawal of purchase price failed");
        transferResidualETHToDeployer();
    }

    function transferAccruedInterestToBuyer() private {
        (bool success1, bytes memory accruedInterest) = currencyContractAddress
            .call(abi.encodeWithSignature("balanceOf(address)", address(this)));
        require(success1, "getting balance accrued interest failed");
        (bool success2, ) = currencyContractAddress.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                buyer,
                accruedInterest
            )
        );
        require(success2, "transfer of accrued interest to buyer failed");
    }

    function transferResidualETHToDeployer() private {
        (bool success, ) = payable(deployer).call{value: address(this).balance}(
            ""
        );
        require(success, "transfer of remaining ether to deployer failed");
    }

    receive() external payable {}
}
