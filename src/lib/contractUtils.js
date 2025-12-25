/**
 * Contract utilities for interacting with InvoiceMarketplace smart contract
 * Using web3.js for blockchain interactions
 */

// Contract ABI - Update this with your deployed contract ABI
export const INVOICE_MARKETPLACE_ABI = [
  {
    inputs: [
      { internalType: "string", name: "invoiceId", type: "string" },
      { internalType: "uint256", name: "price", type: "uint256" },
    ],
    name: "listInvoice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "invoiceId", type: "string" }],
    name: "purchaseInvoice",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "invoiceId", type: "string" }],
    name: "getInvoice",
    outputs: [
      {
        components: [
          { internalType: "string", name: "invoiceId", type: "string" },
          { internalType: "address", name: "msmeOwner", type: "address" },
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "bool", name: "isSold", type: "bool" },
          { internalType: "address", name: "buyer", type: "address" },
          { internalType: "uint256", name: "purchaseTime", type: "uint256" },
        ],
        internalType: "struct InvoiceMarketplace.Invoice",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "invoiceId", type: "string" }],
    name: "isInvoiceAvailable",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "invoiceId", type: "string" }],
    name: "getInvoicePrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "invoiceId", type: "string" }],
    name: "getMsmeOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "invoiceId", type: "string" },
      { indexed: true, internalType: "address", name: "msmeOwner", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
    ],
    name: "InvoiceListed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "string", name: "invoiceId", type: "string" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "address", name: "msmeOwner", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "InvoicePurchased",
    type: "event",
  },
];

// Contract address - Update this after deploying to your network
// For testing, use a testnet address after deployment
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

/**
 * Get Web3 instance
 */
export async function getWeb3() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not available");
  }

  const { Web3 } = await import("web3");
  const web3 = new Web3(window.ethereum);
  return web3;
}

/**
 * Get contract instance
 */
export async function getContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  }

  const web3 = await getWeb3();
  return new web3.eth.Contract(INVOICE_MARKETPLACE_ABI, CONTRACT_ADDRESS);
}

/**
 * Convert USD price to Wei (assuming 1 ETH = $2000 for example)
 * In production, use an oracle or API to get real-time ETH price
 */
export async function usdToWei(usdAmount, ethPriceInUsd = 2000) {
  const web3 = await getWeb3();
  const ethAmount = usdAmount / ethPriceInUsd;
  return web3.utils.toWei(ethAmount.toString(), "ether");
}

/**
 * Convert Wei to USD
 */
export async function weiToUsd(weiAmount, ethPriceInUsd = 2000) {
  const web3 = await getWeb3();
  const ethAmount = parseFloat(web3.utils.fromWei(weiAmount.toString(), "ether"));
  return ethAmount * ethPriceInUsd;
}

/**
 * Purchase invoice on blockchain
 */
export async function purchaseInvoiceOnChain(invoiceId, priceInEth) {
  const web3 = await getWeb3();
  const contract = await getContract();
  const accounts = await web3.eth.getAccounts();

  const priceInWei = web3.utils.toWei(priceInEth.toString(), "ether");

  return contract.methods.purchaseInvoice(invoiceId).send({
    from: accounts[0],
    value: priceInWei,
  });
}


/**
 * List invoice on blockchain (for MSME)
 */
export async function listInvoiceOnChain(invoiceId, priceInEth) {
  const web3 = await getWeb3();
  const contract = await getContract();
  const accounts = await web3.eth.getAccounts();

  const priceInWei = web3.utils.toWei(priceInEth.toString(), "ether");

  return contract.methods.listInvoice(invoiceId, priceInWei).send({
    from: accounts[0],
  });
}


/**
 * Check if invoice is available on chain
 */
export async function checkInvoiceAvailability(invoiceId) {
  try {
    const contract = await getContract();
    return await contract.methods.isInvoiceAvailable(invoiceId).call();
  } catch (error) {
    console.error("Check availability error:", error);
    return false;
  }
}

/**
 * Get invoice details from blockchain
 */
export async function getInvoiceFromChain(invoiceId) {
  try {
    const contract = await getContract();
    const invoice = await contract.methods.getInvoice(invoiceId).call();
    
    // Convert the result to a more readable format
    return {
      invoiceId: invoice.invoiceId,
      msmeOwner: invoice.msmeOwner,
      price: invoice.price,
      isSold: invoice.isSold,
      buyer: invoice.buyer,
      purchaseTime: invoice.purchaseTime,
    };
  } catch (error) {
    console.error("Get invoice error:", error);
    throw error;
  }
}

/**
 * Get invoice price from blockchain
 */
export async function getInvoicePriceFromChain(invoiceId) {
  try {
    const contract = await getContract();
    return await contract.methods.getInvoicePrice(invoiceId).call();
  } catch (error) {
    console.error("Get invoice price error:", error);
    throw error;
  }
}

/**
 * Get MSME owner address from blockchain
 */
export async function getMsmeOwnerFromChain(invoiceId) {
  try {
    const contract = await getContract();
    return await contract.methods.getMsmeOwner(invoiceId).call();
  } catch (error) {
    console.error("Get MSME owner error:", error);
    throw error;
  }
}

