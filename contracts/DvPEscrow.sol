// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";

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

    event Deployed(
        address indexed _escrowContractAddress,
        address indexed _seller,
        address indexed _buyer
    );

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
            msg.value >= 0.001 ether,
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
        emit Deployed(address(this), seller, buyer);
    }

    event TransferredSaleObjectIntoEscrow(
        address indexed _escrowContractAddress,
        address indexed _seller,
        address indexed _saleObjectContractAddress
    );

    function transferSaleObjectIntoEscrow() external {
        require(msg.sender == seller, "only seller can transfer asset");
        require(
            block.timestamp < transactionDeadline,
            "transaction deadline expired"
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
        emit TransferredSaleObjectIntoEscrow(
            address(this),
            seller,
            saleObjectContractAddress
        );
    }

    event TransferredPurchasePriceIntoEscrow(
        address indexed _escrowContractAddress,
        address indexed _buyer,
        address indexed _currencyContractAddress
    );

    function transferPurchasePriceIntoEscrow() external {
        require(msg.sender == buyer, "only buyer can transfer asset");
        require(
            block.timestamp < transactionDeadline,
            "transaction deadline has expired"
        );
        require(!isPurchasePricePaid, "purchase price already paid");
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
        if (isSaleObjectTransferred) closeTransaction();
        emit TransferredPurchasePriceIntoEscrow(
            address(this),
            buyer,
            currencyContractAddress
        );
    }

    event TransactionClosed(
        address indexed _escrowContractAddress,
        address indexed _seller,
        address indexed _buyer
    );

    function closeTransaction() private {
        require(
            isPurchasePricePaid && isSaleObjectTransferred,
            "transaction legs not yet both performed"
        );
        bool cashLegSettled = transferPurchasePriceToSeller();
        bool assetLegSettled = transferSaleObjectToBuyer();
        require(cashLegSettled, "transfer of purchase price to seller failed");
        require(assetLegSettled, "transfer of sale object to buyer failed");
        hasTransactionClosed = true;
        transferAccruedInterestToDeployer();
        transferResidualETHToDeployer();
        emit TransactionClosed(address(this), seller, buyer);
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
        (bool success, ) = saleObjectContractAddress.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                address(this),
                buyer,
                saleObjectTokenId
            )
        );
        require(success, "transferring sale object to buyer failed");
        return success;
    }

    event PurchasePriceWithdrawn(
        address indexed _escrowContractAddress,
        address indexed _buyer,
        address indexed _currencyContractAddress
    );

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
        require(
            msg.sender == buyer || msg.sender == deployer,
            "only buyer or deployer can withdraw purchase price"
        );
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
        emit PurchasePriceWithdrawn(
            address(this),
            buyer,
            currencyContractAddress
        );
    }

    event SaleObjectWithdrawn(
        address indexed _escrowContractAddress,
        address indexed _seller,
        address indexed _saleObjectContractAddress
    );

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
        require(
            msg.sender == seller || msg.sender == deployer,
            "only seller  or deployer can withdraw sale object"
        );
        (bool success, ) = saleObjectContractAddress.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                address(this),
                seller,
                saleObjectTokenId
            )
        );
        require(success, "withdrawal of sale object failed");
        if (!isPurchasePricePaid || isPurchasePriceWithdrawn)
            transferResidualETHToDeployer();
        emit SaleObjectWithdrawn(
            address(this),
            seller,
            saleObjectContractAddress
        );
    }

    event AccruedInterestPaidOut(
        address indexed _escrowContractAddress,
        address indexed _deployer,
        address indexed _currencyContractAddress
    );

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
        emit AccruedInterestPaidOut(
            address(this),
            deployer,
            currencyContractAddress
        );
    }

    event ResidualETHReturned(
        address indexed _escrowContractAddress,
        address indexed _deployer,
        uint indexed _residualETHAmount
    );

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
        emit ResidualETHReturned(
            address(this),
            deployer,
            address(this).balance
        );
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
