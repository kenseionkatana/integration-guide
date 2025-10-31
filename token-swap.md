# Guide: Integrating Token Buy & Sell Logic

This document provides the necessary code snippets and instructions to integrate token buy and sell logic directly into your project using Ethers.js.

## 1. Prerequisites

- **`ethers` Library**: Your project must have the `ethers` library installed.
- **ABI Files**: You need the `MemeFactoryV3.json` and `MemeTokenV3.json` files accessible within your project structure.

## 2. Integration Steps

Follow these steps to integrate the trading logic into your application.

### Step 1: Imports and Configuration
In your JavaScript/TypeScript file, import `ethers` and the ABI files, then set up the required constants.

**Important:** Replace the placeholder values (`YOUR_PRIVATE_KEY`, `YOUR_RPC_URL`, `TOKEN_TO_TRADE_ADDRESS`) with your actual data.

```javascript
// For ES Modules (import/export)
import { ethers } from "ethers";
import memeFactoryAbi from "./path/to/MemeFactoryV3.json";
import memeTokenAbi from "./path/to/MemeTokenV3.json";

// --- Configuration ---
const YOUR_PRIVATE_KEY = "YOUR_PRIVATE_KEY"; // WARNING: Keep this secret!
const YOUR_RPC_URL = "https://rpc.katana.network";
const TOKEN_TO_TRADE_ADDRESS = "0x..."; // The address of the token to trade

const MEME_FACTORY_CONTRACT_ADDRESS = "0x8Cb780Ed7E3e2fBa0477058E663c357c39Fd5638";
const MAX_SLIPPAGE_PERCENT = 10; // 10%

// --- Ethers.js Initialization ---
const provider = new ethers.providers.JsonRpcProvider(YOUR_RPC_URL);
const wallet = new ethers.Wallet(YOUR_PRIVATE_KEY, provider);
const factoryContract = new ethers.Contract(MEME_FACTORY_CONTRACT_ADDRESS, memeFactoryAbi, wallet);
const tokenContract = new ethers.Contract(TOKEN_TO_TRADE_ADDRESS, memeTokenAbi, provider);
const tokenContractWithSigner = new ethers.Contract(TOKEN_TO_TRADE_ADDRESS, memeTokenAbi, wallet);
```

### Step 2: Copy the Core Functions
Copy the following asynchronous functions into your file. These functions handle the core logic for fetching data, buying, and selling. They are designed to return transaction receipts upon success or throw an error upon failure.

```javascript
async function getRequiredData() {
    try {
        const [
            virtualTokenReserves,
            virtualCollateralReserves,
            ethBalance,
            userTokenBalance,
            allowance
        ] = await Promise.all([
            tokenContract.virtualTokenReserves(),
            tokenContract.virtualCollateralReserves(),
            provider.getBalance(wallet.address),
            tokenContract.balanceOf(wallet.address),
            tokenContract.allowance(wallet.address, MEME_FACTORY_CONTRACT_ADDRESS)
        ]);
        return { virtualTokenReserves, virtualCollateralReserves, ethBalance, userTokenBalance, allowance };
    } catch (error) {
        throw error;
    }
}

async function performBuy(ethAmountToSpend) {
    const reserves = await getRequiredData();
    const ethAmountInWei = ethers.utils.parseEther(ethAmountToSpend);

    if (reserves.ethBalance.lt(ethAmountInWei)) {
        throw new Error("Insufficient ETH balance.");
    }

    const [estimatedAmountOut] = await tokenContract.getAmountOutAndFee(ethAmountInWei, reserves.virtualCollateralReserves, reserves.virtualTokenReserves, true);

    const amountOutMin = estimatedAmountOut.sub(estimatedAmountOut.mul(ethers.BigNumber.from(MAX_SLIPPAGE_PERCENT * 100)).div(ethers.BigNumber.from(10000)));

    try {
        const tx = await factoryContract.buyExactIn(TOKEN_TO_TRADE_ADDRESS, amountOutMin, { value: ethAmountInWei, gasLimit: 10000000 });
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        throw error;
    }
}

async function performSell(tokenAmountToSell) {
    const data = await getRequiredData();
    const tokenAmountInWei = ethers.utils.parseEther(tokenAmountToSell);

    if (data.userTokenBalance.lt(tokenAmountInWei)) {
        throw new Error("Insufficient token balance.");
    }

    if (data.allowance.lt(tokenAmountInWei)) {
        try {
            const approveTx = await tokenContractWithSigner.approve(MEME_FACTORY_CONTRACT_ADDRESS, ethers.constants.MaxUint256);
            await approveTx.wait();
        } catch (error) {
            throw error;
        }
    }

    const [estimatedEthOut] = await tokenContract.getAmountOutAndFee(tokenAmountInWei, data.virtualTokenReserves, data.virtualCollateralReserves, false);

    const amountOutMin = estimatedEthOut.sub(estimatedEthOut.mul(ethers.BigNumber.from(MAX_SLIPPAGE_PERCENT * 100)).div(ethers.BigNumber.from(10000)));

    try {
        const tx = await factoryContract.sellExactIn(TOKEN_TO_TRADE_ADDRESS, tokenAmountInWei, amountOutMin, { gasLimit: 10000000 });
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        throw error;
    }
}
```

### Step 3: Usage Example
Once the functions are integrated, you can call them within your application's logic. Use a `try...catch` block to handle potential transaction failures.

```javascript
async function executeTrade() {
    try {
        // To BUY tokens:
        const ethAmountToSpend = "0.01";
        const buyReceipt = await performBuy(ethAmountToSpend);
        // On success, you can use the buyReceipt object (e.g., buyReceipt.transactionHash)

        // To SELL tokens:
        // const tokenAmountToSell = "12345";
        // const sellReceipt = await performSell(tokenAmountToSell);
        // On success, you can use the sellReceipt object
        
    } catch (error) {
        // Handle any errors from the buy/sell process here
        // For example, update the UI to show a failure message
    }
}

// Example of how to run the trade function
executeTrade();
