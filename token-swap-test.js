// To run this script, you need to have viem installed
// Then, run the script using Node.js:
// node trade-guide/token-swap-test.js

const { createWalletClient, createPublicClient, http, parseEther, formatEther, getAddress, erc20Abi } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { katana } = require("viem/chains");
const memeFactoryAbi = require("./MemeFactoryV3.json");
const memeTokenAbi = require("./MemeTokenV3.json");

// --- Configuration ---
const YOUR_PRIVATE_KEY = ""; //add private key of your wallet
const RAW_TOKEN_ADDRESS = ""; //add token address
const RAW_FACTORY_ADDRESS = "0x8cb780ed7e3e2fba0477058e663c357c39fd5638";
const MAX_SLIPPAGE_PERCENT = 10;
const ETH_AMOUNT_TO_SPEND = "0.001";

async function main() {
    try {
        console.log("--- Starting Viem Buy/Sell Transaction Test ---");

        // 1. Checksum addresses inside the async context
        const TOKEN_TO_TRADE_ADDRESS = getAddress(RAW_TOKEN_ADDRESS);
        const MEME_FACTORY_CONTRACT_ADDRESS = getAddress(RAW_FACTORY_ADDRESS);

        // 2. Create Viem Clients and Account
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

        console.log(`Using wallet address: ${account.address}`);

        // --- BUY TRANSACTION ---
        console.log("\n--- Initiating BUY ---");
        const ethBalanceBeforeBuy = await publicClient.getBalance({ address: account.address });
        console.log(`Initial ETH Balance: ${formatEther(ethBalanceBeforeBuy)} ETH`);
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
        console.log(`Attempting to spend ${ETH_AMOUNT_TO_SPEND} ETH for a minimum of ${formatEther(amountOutMin)} tokens.`);

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
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s for state to update

        const tokenBalance = await publicClient.readContract({
            address: TOKEN_TO_TRADE_ADDRESS,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [account.address]
        });
        
        const tokenAmountToSell = tokenBalance / BigInt(2); // Sell half of the balance
        if (tokenAmountToSell === BigInt(0)) {
            console.log("No tokens to sell. Skipping sell transaction.");
            console.log("\n--- Viem Test Finished ---");
            return;
        }
        console.log(`Attempting to sell ${formatEther(tokenAmountToSell)} tokens...`);

        const allowance = await publicClient.readContract({
            address: TOKEN_TO_TRADE_ADDRESS,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [account.address, MEME_FACTORY_CONTRACT_ADDRESS]
        });

        if (allowance < tokenAmountToSell) {
            console.log("Allowance is insufficient. Approving factory contract...");
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

        console.log("\n--- Viem Test Successful ---");

    } catch (error) {
        console.error("\n--- Test Failed ---");
        console.error(error);
        console.error("-------------------");
    }
}

main();
