// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InvoiceMarketplace
 * @dev Smart contract for buying invoice NFTs with Ethereum
 * @notice Investors can purchase invoices by paying ETH to MSME owners
 */
contract InvoiceMarketplace {
    // Invoice structure
    struct Invoice {
        string invoiceId;        // UUID from Supabase
        address msmeOwner;       // MSME wallet address
        uint256 price;           // Price in Wei
        bool isSold;             // Purchase status
        address buyer;           // Investor who purchased
        uint256 purchaseTime;    // Block timestamp of purchase
    }

    // Mapping from invoice UUID to Invoice struct
    mapping(string => Invoice) public invoices;
    
    // Mapping to track if invoice exists
    mapping(string => bool) public invoiceExists;
    
    // Events
    event InvoiceListed(
        string indexed invoiceId,
        address indexed msmeOwner,
        uint256 price
    );
    
    event InvoicePurchased(
        string indexed invoiceId,
        address indexed buyer,
        address indexed msmeOwner,
        uint256 price,
        uint256 timestamp
    );

    // Modifier to check if invoice exists
    modifier invoiceExistsCheck(string memory invoiceId) {
        require(invoiceExists[invoiceId], "Invoice does not exist");
        _;
    }

    // Modifier to check if invoice is not sold
    modifier notSold(string memory invoiceId) {
        require(!invoices[invoiceId].isSold, "Invoice already sold");
        _;
    }

    /**
     * @dev List an invoice for sale (called by MSME)
     * @param invoiceId UUID of the invoice from Supabase
     * @param price Price in Wei that investor must pay
     */
    function listInvoice(string memory invoiceId, uint256 price) external {
        require(bytes(invoiceId).length > 0, "Invalid invoice ID");
        require(price > 0, "Price must be greater than 0");
        require(!invoiceExists[invoiceId], "Invoice already listed");

        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            msmeOwner: msg.sender,
            price: price,
            isSold: false,
            buyer: address(0),
            purchaseTime: 0
        });

        invoiceExists[invoiceId] = true;

        emit InvoiceListed(invoiceId, msg.sender, price);
    }

    /**
     * @dev Purchase an invoice NFT (called by investor)
     * @param invoiceId UUID of the invoice to purchase
     */
    function purchaseInvoice(string memory invoiceId) 
        external 
        payable 
        invoiceExistsCheck(invoiceId)
        notSold(invoiceId)
    {
        Invoice storage invoice = invoices[invoiceId];
        
        require(msg.value >= invoice.price, "Insufficient payment");
        require(msg.sender != invoice.msmeOwner, "Cannot buy your own invoice");

        // Mark as sold
        invoice.isSold = true;
        invoice.buyer = msg.sender;
        invoice.purchaseTime = block.timestamp;

        // Transfer ETH to MSME owner
        (bool success, ) = invoice.msmeOwner.call{value: invoice.price}("");
        require(success, "Transfer to MSME owner failed");

        // Refund excess payment if any
        if (msg.value > invoice.price) {
            uint256 excess = msg.value - invoice.price;
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }

        emit InvoicePurchased(
            invoiceId,
            msg.sender,
            invoice.msmeOwner,
            invoice.price,
            block.timestamp
        );
    }

    /**
     * @dev Get invoice details
     * @param invoiceId UUID of the invoice
     * @return Invoice struct with all details
     */
    function getInvoice(string memory invoiceId) 
        external 
        view 
        invoiceExistsCheck(invoiceId)
        returns (Invoice memory)
    {
        return invoices[invoiceId];
    }

    /**
     * @dev Check if invoice is available for purchase
     * @param invoiceId UUID of the invoice
     * @return bool True if available, false otherwise
     */
    function isInvoiceAvailable(string memory invoiceId) 
        external 
        view 
        returns (bool)
    {
        if (!invoiceExists[invoiceId]) return false;
        return !invoices[invoiceId].isSold;
    }

    /**
     * @dev Get invoice price
     * @param invoiceId UUID of the invoice
     * @return uint256 Price in Wei
     */
    function getInvoicePrice(string memory invoiceId) 
        external 
        view 
        invoiceExistsCheck(invoiceId)
        returns (uint256)
    {
        return invoices[invoiceId].price;
    }

    /**
     * @dev Get MSME owner address for an invoice
     * @param invoiceId UUID of the invoice
     * @return address MSME owner's wallet address
     */
    function getMsmeOwner(string memory invoiceId) 
        external 
        view 
        invoiceExistsCheck(invoiceId)
        returns (address)
    {
        return invoices[invoiceId].msmeOwner;
    }
}

