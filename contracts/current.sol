// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title InvoiceMarketplace
 * @dev MSMEs list invoices, investors buy them using ETH
 */
contract InvoiceMarketplace {

    struct Invoice {
        string invoiceId;
        address payable msmeOwner;
        uint256 price;        // in wei
        bool isSold;
        address buyer;
        uint256 purchaseTime;
    }

    mapping(string => Invoice) private invoices;
    mapping(string => bool) private invoiceExists;

    event InvoiceListed(
        string invoiceId,
        address indexed msmeOwner,
        uint256 price
    );

    event InvoicePurchased(
        string invoiceId,
        address indexed buyer,
        address indexed msmeOwner,
        uint256 price,
        uint256 timestamp
    );

    modifier onlyExistingInvoice(string memory invoiceId) {
        require(invoiceExists[invoiceId], "Invoice does not exist");
        _;
    }

    modifier notSold(string memory invoiceId) {
        require(!invoices[invoiceId].isSold, "Invoice already sold");
        _;
    }

    /**
     * @notice List an invoice for sale
     */
    function listInvoice(string memory invoiceId, uint256 price) external {
        require(bytes(invoiceId).length > 0, "Invalid invoice ID");
        require(price > 0, "Price must be greater than zero");
        require(!invoiceExists[invoiceId], "Invoice already listed");

        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            msmeOwner: payable(msg.sender),
            price: price,
            isSold: false,
            buyer: address(0),
            purchaseTime: 0
        });

        invoiceExists[invoiceId] = true;

        emit InvoiceListed(invoiceId, msg.sender, price);
    }

    /**
     * @notice Buy an invoice by paying ETH
     */
    function purchaseInvoice(string memory invoiceId)
        external
        payable
        onlyExistingInvoice(invoiceId)
        notSold(invoiceId)
    {
        Invoice storage invoice = invoices[invoiceId];

        require(msg.sender != invoice.msmeOwner, "Cannot buy own invoice");
        require(msg.value == invoice.price, "Incorrect ETH amount");

        invoice.isSold = true;
        invoice.buyer = msg.sender;
        invoice.purchaseTime = block.timestamp;

        // Transfer ETH to MSME
        invoice.msmeOwner.transfer(invoice.price);

        emit InvoicePurchased(
            invoiceId,
            msg.sender,
            invoice.msmeOwner,
            invoice.price,
            block.timestamp
        );
    }

    /**
     * @notice Get invoice details
     */
    function getInvoice(string memory invoiceId)
        external
        view
        onlyExistingInvoice(invoiceId)
        returns (
            string memory,
            address,
            uint256,
            bool,
            address,
            uint256
        )
    {
        Invoice memory inv = invoices[invoiceId];
        return (
            inv.invoiceId,
            inv.msmeOwner,
            inv.price,
            inv.isSold,
            inv.buyer,
            inv.purchaseTime
        );
    }

    /**
     * @notice Check availability
     */
    function isInvoiceAvailable(string memory invoiceId)
        external
        view
        returns (bool)
    {
        if (!invoiceExists[invoiceId]) return false;
        return !invoices[invoiceId].isSold;
    }
}
