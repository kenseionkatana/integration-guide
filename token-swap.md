# Guide: Integrating Token Buy & Sell Logic with Viem

This document provides the necessary code snippets and instructions to integrate token buy and sell logic directly into your project using `viem`. This guide is up-to-date and replaces the previous `ethers.js` implementation.

## 1. Prerequisites

- **`viem` Library**: Your project must have the `viem` library installed. It is already included in your `package.json`.
- **ABI Files**: You need the `MemeFactoryV3.json` and `MemeTokenV3.json` files accessible within your project structure.

## 2. Integration Steps

Follow these steps to integrate the trading logic into your application.

### Step 1: Imports and Configuration
In your JavaScript/TypeScript file, import the required functions from `viem` and the ABI files, then set up the required constants.

**Important:** Replace the placeholder values (`YOUR_PRIVATE_KEY`, `TOKEN_TO_TRADE_ADDRESS`) with your actual data. It is highly recommended to use environment variables for sensitive data like private keys.

```javascript
const { createWalletClient, createPublicClient, http, parseEther, formatEther, getAddress, erc20Abi } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { katana } = require("viem/chains"); // Correctly import the chain definition
const memeFactoryAbi = require("./MemeFactoryV3.json");
const memeTokenAbi = require("./MemeTokenV3.json");

// --- Configuration ---
const YOUR_PRIVATE_KEY = "YOUR_PRIVATE_KEY"; // WARNING: Keep this secret!
const RAW_TOKEN_ADDRESS = "0x..."; // The address of the token to trade
const RAW_FACTORY_ADDRESS = "0x8cb780ed7e3e2fba0477058e663c39fd5638";
const MAX_SLIPPAGE_PERCENT = 10;
const ETH_AMOUNT_TO_SPEND = "0.001"; // Example amount
```

### Step 2: Client and Account Initialization
Create the `viem` clients and derive the account from your private key. The script uses the pre-configured `katana` chain definition from `viem` for accuracy.

```javascript
// Checksum addresses to ensure they are in the correct format
const TOKEN_TO_TRADE_ADDRESS = getAddress(RAW_TOKEN_ADDRESS);
const MEME_FACTORY_CONTRACT_ADDRESS = getAddress(RAW_FACTORY_ADDRESS);

// Create Viem Clients and Account
const account = privateKeyToAccount(YOUR_PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: katana,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: katana,
  transport: http(),
});
```

### Step 3: Core Buy/Sell Logic
The following `main` function demonstrates a full buy and sell cycle. It fetches the required data, simulates the transactions to ensure they will succeed, and then sends them to the network.

```javascript
async function main() {
    try {
        console.log("--- Starting Viem Buy/Sell Transaction Test ---");
        console.log(`Using wallet address: ${account.address}`);

        // --- BUY TRANSACTION ---
        console.log("\n--- Initiating BUY ---");
        const ethBalanceBeforeBuy = await publicClient.getBalance({ address: account.address });
        if (ethBalanceBeforeBuy < parseEther(ETH_AMOUNT_TO_SPEND)) {
            throw new Error("Insufficient ETH balance for buy.");
        }

        const [virtualTokenReserves, virtualCollateralReserves] = await Promise.all([
            publicClient.readContract({ address: TOKEN_TO_TRADE_ADDRESS, abi: memeTokenAbi, functionName: 'virtualTokenReserves' }),
            publicClient.readContract({ address: TOKEN_TO_TRADE_ADDRESS, abi: memeTokenAbi, functionName: 'virtualCollateralReserves' })
        ]);

        const ethAmountInWei = parseEther(ETH_AMOUNT_TO_SPEND);
        const [estimatedAmountOut] = await publicClient.readContract({
            address: TOKEN_TO_TRADE_ADDRESS,
            abi: memeTokenAbi,
            functionName: 'getAmountOutAndFee',
            args: [ethAmountInWei, virtualCollateralReserves, virtualTokenReserves, true]
        });
        
        const amountOutMin = estimatedAmountOut - (estimatedAmountOut * BigInt(MAX_SLIPPAGE_PERCENT * 100) / BigInt(10000));

        const { request: buyRequest } = await publicClient.simulateContract({
            account,
            address: MEME_FACTORY_CONTRACT_ADDRESS,
            abi: memeFactoryAbi,
            functionName: 'buyExactIn',
            args: [TOKEN_TO_TRADE_ADDRESS, amountOutMin],
            value: ethAmountInWei,
        });

        const buyTxHash = await walletClient.writeContract(buyRequest);
        console.log(`Buy transaction sent... Hash: ${buyTxHash}`);
        const buyReceipt = await publicClient.waitForTransactionReceipt({ hash: buyTxHash });
        if (buyReceipt.status !== 'success') throw new Error("Buy transaction failed!");
        console.log("Buy transaction successful!");

        // --- SELL TRANSACTION ---
        console.log("\n--- Initiating SELL ---");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for state to update

        const tokenBalance = await publicClient.readContract({
            address: TOKEN_TO_TRADE_ADDRESS,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [account.address]
        });
        
        const tokenAmountToSell = tokenBalance / BigInt(2); // Sell half
        if (tokenAmountToSell === BigInt(0)) {
            console.log("No tokens to sell.");
            return;
        }

        const allowance = await publicClient.readContract({
            address: TOKEN_TO_TRADE_ADDRESS,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [account.address, MEME_FACTORY_CONTRACT_ADDRESS]
        });

        if (allowance < tokenAmountToSell) {
            console.log("Allowance insufficient. Approving...");
            const { request: approveRequest } = await publicClient.simulateContract({
                account,
                address: TOKEN_TO_TRADE_ADDRESS,
                abi: erc20Abi,
                functionName: 'approve',
                args: [MEME_FACTORY_CONTRACT_ADDRESS, tokenAmountToSell]
            });
            const approveTxHash = await walletClient.writeContract(approveRequest);
            await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
            console.log("Approval successful!");
        }

        const [sellVirtualTokenReserves, sellVirtualCollateralReserves] = await Promise.all([
            publicClient.readContract({ address: TOKEN_TO_TRADE_ADDRESS, abi: memeTokenAbi, functionName: 'virtualTokenReserves' }),
            publicClient.readContract({ address: TOKEN_TO_TRADE_ADDRESS, abi: memeTokenAbi, functionName: 'virtualCollateralReserves' })
        ]);

        const [estimatedEthOut] = await publicClient.readContract({
            address: TOKEN_TO_TRADE_ADDRESS,
            abi: memeTokenAbi,
            functionName: 'getAmountOutAndFee',
            args: [tokenAmountToSell, sellVirtualTokenReserves, sellVirtualCollateralReserves, false]
        });

        const sellAmountOutMin = estimatedEthOut - (estimatedEthOut * BigInt(MAX_SLIPPAGE_PERCENT * 100) / BigInt(10000));

        const { request: sellRequest } = await publicClient.simulateContract({
            account,
            address: MEME_FACTORY_CONTRACT_ADDRESS,
            abi: memeFactoryAbi,
            functionName: 'sellExactIn',
            args: [TOKEN_TO_TRADE_ADDRESS, tokenAmountToSell, sellAmountOutMin],
        });

        const sellTxHash = await walletClient.writeContract(sellRequest);
        console.log(`Sell transaction sent... Hash: ${sellTxHash}`);
        const sellReceipt = await publicClient.waitForTransactionReceipt({ hash: sellTxHash });
        if (sellReceipt.status !== 'success') throw new Error("Sell transaction failed!");
        console.log("Sell transaction successful!");

    } catch (error) {
        console.error("\n--- Test Failed ---", error);
    }
}

// To run the script
main();
```

### Step 4: Running the Script
Save the code above into a `.js` file (e.g., `token-swap-test.js`). Ensure you have filled in your private key and the token address, then run it from your terminal:

```bash
node path/to/your/token-swap-test.js
