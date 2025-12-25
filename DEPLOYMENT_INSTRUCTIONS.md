# Invoice Marketplace Smart Contract Deployment Guide

## Overview
This guide explains how to deploy the `InvoiceMarketplace.sol` smart contract to enable real Ethereum transactions for invoice purchases.

## Prerequisites
1. MetaMask browser extension installed
2. Testnet ETH (for testing) - Get from faucets:
   - Sepolia: https://sepoliafaucet.com/
   - Goerli: https://goerlifaucet.com/
3. Remix IDE account (or use Hardhat/Truffle)

## Step 1: Deploy Contract on Remix IDE

### 1.1 Open Remix IDE
- Go to https://remix.ethereum.org/
- Create a new file called `InvoiceMarketplace.sol` in the `contracts` folder

### 1.2 Copy Contract Code
- Copy the entire content from `contracts/InvoiceMarketplace.sol`
- Paste it into Remix IDE

### 1.3 Compile Contract
1. Go to the "Solidity Compiler" tab (left sidebar)
2. Select compiler version: `0.8.20` or higher
3. Click "Compile InvoiceMarketplace.sol"
4. Check for any compilation errors and fix them

### 1.4 Deploy Contract
1. Go to the "Deploy & Run Transactions" tab
2. Select environment: "Injected Provider - MetaMask"
3. Connect your MetaMask wallet
4. Select the network (Sepolia testnet recommended for testing)
5. Click "Deploy"
6. Confirm the transaction in MetaMask
7. Wait for deployment confirmation

### 1.5 Save Contract Address
- After deployment, copy the contract address
- This will be used in your Next.js application

## Step 2: Configure Your Application

### 2.1 Install web3.js
```bash
npm install web3
```

### 2.2 Set Environment Variable
Create or update `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 2.3 Update Contract Utils
The contract address in `src/lib/contractUtils.js` will automatically use the environment variable.

## Step 3: Update MSME Dashboard (Optional)

When MSME lists an invoice, you can optionally call `listInvoice` on the blockchain:

```javascript
import { listInvoiceOnChain } from "../../../lib/contractUtils";

// In handleListForSale function
await listInvoiceOnChain(invoice.id, listedPrice);
```

## Step 4: Testing

### 4.1 Test on Testnet
1. Use Sepolia or Goerli testnet
2. Get testnet ETH from faucets
3. Test the purchase flow

### 4.2 Test Functions
- Connect MetaMask
- Browse invoices
- Click "Buy Invoice"
- Confirm transaction in MetaMask
- Verify transaction on Etherscan

## Step 5: Production Deployment

### 5.1 Mainnet Deployment
1. Deploy contract to Ethereum mainnet using Remix or Hardhat
2. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` with mainnet address
3. Ensure all users have mainnet ETH

### 5.2 Security Considerations
- Audit the smart contract before mainnet deployment
- Consider using OpenZeppelin's security patterns
- Implement access controls if needed
- Add pause functionality for emergencies

## Contract Functions

### For Investors:
- `purchaseInvoice(string invoiceId)` - Purchase invoice by sending ETH

### For MSME:
- `listInvoice(string invoiceId, uint256 price)` - List invoice for sale

### View Functions:
- `getInvoice(string invoiceId)` - Get invoice details
- `isInvoiceAvailable(string invoiceId)` - Check if available
- `getInvoicePrice(string invoiceId)` - Get price
- `getMsmeOwner(string invoiceId)` - Get MSME wallet address

## Events

- `InvoiceListed` - Emitted when invoice is listed
- `InvoicePurchased` - Emitted when invoice is purchased

## Gas Optimization

The contract is optimized for gas usage:
- Uses `string` for invoice IDs (can be changed to `bytes32` for lower gas)
- Minimal storage operations
- Efficient transfer patterns

## Troubleshooting

### Common Issues:

1. **"Contract address not configured"**
   - Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local`

2. **"MetaMask not available"**
   - Install MetaMask extension
   - Ensure it's unlocked

3. **"Insufficient funds"**
   - Add ETH to your wallet
   - Check you're on the correct network

4. **"Transaction failed"**
   - Check gas limit
   - Verify contract is deployed
   - Check invoice availability

## Next Steps

1. Deploy contract to testnet
2. Test all functions
3. Get contract audited (for production)
4. Deploy to mainnet
5. Update application with mainnet address

## Support

For issues or questions:
- Check Remix IDE documentation
- Review ethers.js documentation
- Check MetaMask troubleshooting guide

