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

    bool public isPurchasePriceWithdrawn;
    bool public isSaleObjectWithdrawn;

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
    }

    function transferSaleObjectIntoEscrow() external {
        require(msg.sender == seller, "only seller can transfer asset");
        require(
            block.timestamp < transactionDeadline,
            "transaction deadline expire"
        );
        require(!isSaleObjectTransferred, "sale object already transferred");
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
        if (isPurchasePricePaid) closeTransaction();
    }

    function transferPurchasePriceIntoEscrow() external {
        require(msg.sender == buyer, "only buyer can transfer asset");
        require(
            block.timestamp < transactionDeadline,
            "transaction deadline expire"
        );
        require(!isPurchasePricePaid, "purchase price already paid");

        if (isSaleObjectTransferred) closeTransaction();
    }

    function closeTransaction() private {
        require(
            isPurchasePricePaid && isSaleObjectTransferred,
            "transaction legs not yet both performed"
        );
        bool cashLegSettled = transferPurchasePriceToSeller();
        bool assetLegSettled = transferSaleObjectToBuyer();
        require(cashLegSettled && assetLegSettled);
        hasTransactionClosed = true;
        transferAccruedInterestToDeployer();
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
            isPurchasePricePaid,
            "purchase price not paid, nothing to withdraw"
        );
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
        isPurchasePriceWithdrawn = true;
        transferAccruedInterestToDeployer();
        if (!isSaleObjectTransferred || isSaleObjectWithdrawn)
            transferResidualETHToDeployer();
    }

    function withdrawSaleObject() external {
        require(
            isSaleObjectTransferred,
            "sale object not transferred into escrow, nothing to withdraw"
        );
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
        if (!isPurchasePricePaid || isPurchasePriceWithdrawn)
            transferResidualETHToDeployer();
    }

    function transferAccruedInterestToDeployer() private {
        uint accruedInterest = getBalanceOfCurrency();
        (bool success, ) = currencyContractAddress.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                deployer,
                accruedInterest
            )
        );
        require(success, "transfer of accrued interest to deployer failed");
    }

    function transferResidualETHToDeployer() public {
        bool isEscrowExpiredAndEmpty = checkEscrowExpiredAndEmpty();
        require(
            hasTransactionClosed || isEscrowExpiredAndEmpty,
            "escrow not yet completed or expired and empty"
        );
        (bool success, ) = payable(deployer).call{value: address(this).balance}(
            ""
        );
        require(success, "transfer of remaining ether to deployer failed");
    }

    function checkEscrowExpiredAndEmpty() private returns (bool) {
        return
            (block.timestamp > transactionDeadline) &&
            (getBalanceOfCurrency() + getBalanceOfSaleObject() == 0);
    }

    function getBalanceOfCurrency() private returns (uint) {
        (bool success, bytes memory balanceCurrency) = currencyContractAddress
            .call(abi.encodeWithSignature("balanceOf(address)", address(this)));
        require(success, "getting balance currency failed");
        return uint(bytes32(balanceCurrency));
    }

    function getBalanceOfSaleObject() private returns (uint) {
        (
            bool success,
            bytes memory balanceSaleObject
        ) = saleObjectContractAddress.call(
                abi.encodeWithSignature("balanceOf(address)", address(this))
            );
        require(success, "getting balance of SaleObject failed");
        return uint(bytes32(balanceSaleObject));
    }

    receive() external payable {}
}
