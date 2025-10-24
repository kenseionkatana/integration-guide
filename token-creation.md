# Full Guide to Token Creation via API and JavaScript

This technical guide provides a comprehensive overview of how to create a new token using the Kensei backend API and on-chain smart contract. It covers two primary scenarios: creating a token, and creating a token while simultaneously buying an initial supply.

## Process Overview

The creation process is a five-step procedure:

1.  **Login (Backend)**: First, the user must authenticate by signing a message with their wallet. This provides a JWT required for all subsequent API calls.
2.  **Upload Image (Backend)**: Upload the token's logo to the file service using the JWT for authorization. This returns a URL for the image.
3.  **Request a Signature (Backend)**: Send the token's metadata, including the `image_url`, to a backend API (also using the JWT). This API returns a signed payload (`nonce`, `salt`, `signature`) which authorizes the token's creation on the blockchain.
4.  **Execute On-Chain Transaction (Blockchain)**: Use the signed payload from the backend to call one of two functions on the `MemeFactoryV3` smart contract.
5.  **Verify Creation (Backend)**: After the blockchain transaction is confirmed, poll a second backend API endpoint (using the JWT) until it returns the newly created token's contract address.

---

## 1. API Endpoints

### A. Authentication APIs

Authentication is a prerequisite for all other API interactions. It follows the "Sign-In with Ethereum" pattern.

#### 1. Get Nonce

-   **URL**: `https://api.kensei.one/auth/nonce`
-   **Method**: `POST`
-   **Body**: `{ "address": "0xUSER_WALLET_ADDRESS" }`
-   **Success Response**: `{ "nonce": "A unique message to be signed" }`

#### 2. Login

-   **URL**: `https://api.kensei.one/auth/login`
-   **Method**: `POST`
-   **Body**: `{ "address": "0xUSER_WALLET_ADDRESS", "signature": "0xSIGNED_NONCE" }`
-   **Success Response**: `{ "token": "YOUR_JWT_TOKEN" }`
    -   This token must be stored and sent as a `Bearer` token in the `Authorization` header for all subsequent API calls.

### B. File Upload API

Requires authentication. Before requesting a signature, you must upload the token's logo to get a permanent URL.

-   **URL**: `https://api.kensei.one/files/upload`
-   **Method**: `POST`
-   **Body**: `FormData` containing the file.
    -   The key must be `file`, and the value is the `File` object from an input field.
-   **Headers**:
    -   `Authorization`: `Bearer YOUR_JWT_TOKEN`
    -   `Content-Type` is handled automatically by the browser when sending `FormData`.

#### Success Response (200 OK)

The API returns a JSON object containing the URL of the uploaded file.

```json
{
  "url": "https://your-storage-provider.com/path/to/your/image.png"
}
```
You will use this `url` value for the `image_url` parameter in the next step.

### C. Signature Generation API

Requires authentication. After uploading the image, you can request the creation signature.

-   **URL**: `https://api.kensei.one/meme/tokens`
-   **Method**: `POST`
-   **Headers**:
    -   `Authorization`: `Bearer YOUR_JWT_TOKEN`
    -   `Content-Type`: `application/json`

#### Request Body Parameters

| Parameter      | Type     | Required | Description                                                              |
| :------------- | :------- | :------- | :----------------------------------------------------------------------- |
| `chain_id`     | `number` | Yes      | The ID of the target blockchain (e.g., `1` for Ethereum Mainnet).        |
| `name`         | `string` | Yes      | The full name of the token (e.g., "My Awesome Token").                   |
| `symbol`       | `string` | Yes      | The token's symbol (e.g., "MAT").                                        |
| `image_url`    | `string` | Yes      | A URL pointing to the token's logo.                                      |
| `description`  | `string` | No       | A brief description of the token.                                        |
| `x_url`        | `string` | No       | The URL for the token's Twitter/X profile.                               |
| `telegram_url` | `string` | No       | The URL for the token's Telegram group.                                  |
| `website_url`  | `string` | No       | The URL for the token's official website.                                |

#### Success Response (200 OK)

The API returns a JSON object containing the parameters needed for the smart contract call.

```json
{
  "id": "...",
  "salt": "a1b2c3...",
  "nonce": 12345,
  "signature": "0x...",
  "created_at": "...",
  "updated_at": "..."
}
```

-   **`salt`**, **`nonce`**, and **`signature`** are the essential values you must pass to the smart contract.

### D. Creation Verification API

Requires authentication. After your on-chain transaction is successful, use this endpoint to retrieve the new token's address. You may need to call it multiple times (poll) as the backend needs time to process the on-chain event.

-   **URL**: `https://api.kensei.one/meme/signature/{signature}`
-   **Method**: `GET`
-   **Headers**:
    -   `Authorization`: `Bearer YOUR_JWT_TOKEN`
-   **URL Parameter**:
    -   `{signature}`: The `signature` string received from the Signature Generation API.

#### Success Response (200 OK)

When the backend has indexed the new token, the response will contain the token's contract address in the `token` field.

```json
{
  "id": "...",
  "token": "0x1234567890abcdef1234567890abcdef12345678", // The new token contract address
  "name": "My Awesome Token",
  "symbol": "MAT",
  // ... other token metadata
}
```

If the `token` field is `null`, it means the backend hasn't processed the creation event yet, and you should poll again after a short delay.

---

## 2. Smart Contract Interaction

-   **Contract Address**: `0x8Cb780Ed7E3e2fBa0477058E663c357c39Fd5638`
-   **Contract ABI (Partial)**:

```json
[
  {
    "name": "createMemeToken",
    "type": "function",
    "inputs": [
      { "name": "_name", "type": "string" },
      { "name": "_symbol", "type": "string" },
      { "name": "_nonce", "type": "uint256" },
      { "name": "_salt", "type": "bytes32" },
      { "name": "_signature", "type": "bytes" }
    ],
    "stateMutability": "payable"
  },
  {
    "name": "createMemeTokenAndBuy",
    "type": "function",
    "inputs": [
      { "name": "_name", "type": "string" },
      { "name": "_symbol", "type": "string" },
      { "name": "_nonce", "type": "uint256" },
      { "name": "_tokenAmountMin", "type": "uint256" },
      { "name": "_salt", "type": "bytes32" },
      { "name": "_signature", "type": "bytes" }
    ],
    "stateMutability": "payable"
  }
]
```

### Case 1: `createMemeToken` (Creation Only)

This function creates the token contract.

-   **Parameters**:
    -   `_name`, `_symbol`, `_nonce`, `_signature`: Use values from the backend API response.
    -   `_salt`: Use the `salt` from the API, but it **must be padded to 32 bytes**. In `ethers.js`, use `ethers.utils.hexZeroPad('0x' + salt, 32)`.
-   **Transaction `value`**: A small amount of native currency (e.g., ETH) is required as a creation fee. A safe value is `1000000` wei (`0.000001` ETH).

### Case 2: `createMemeTokenAndBuy` (Creation + Initial Purchase)

This function creates the token and immediately executes a buy order.

-   **Parameters**:
    -   All parameters from `createMemeToken`.
    -   `_tokenAmountMin`: A slippage protection parameter. Set to `0` to accept any amount of tokens for your purchase.
-   **Transaction `value`**: The total `value` must be the **amount of native currency you want to spend** on the buy, **plus** the creation fee.
    -   Example: `value = buyAmountInWei + 1000000`.

---

## 3. Full JavaScript Example

This code handles the complete flow: login, file upload, token creation (both cases), and result verification.

```javascript
// --- Configuration ---
const memeFactoryAbi = [{"name":"createMemeToken","type":"function","inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_nonce","type":"uint256"},{"name":"_salt","type":"bytes32"},{"name":"_signature","type":"bytes"}],"stateMutability":"payable"},{"name":"createMemeTokenAndBuy","type":"function","inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_nonce","type":"uint256"},{"name":"_tokenAmountMin","type":"uint256"},{"name":"_salt","type":"bytes32"},{"name":"_signature","type":"bytes"}],"stateMutability":"payable"}];
const memeFactoryAddress = "0x8Cb780Ed7E3e2fBa0477058E663c357c39Fd5638";
const backendApiUrl = "https://api.kensei.one";
const CREATION_FEE = ethers.BigNumber.from("1000000"); // 0.000001 ETH in wei

// --- Authentication Helper ---
let jwtToken = null; // Store JWT in memory for the example

async function loginAndGetToken(signer) {
  if (jwtToken) return jwtToken; // Return stored token if already logged in

  const userAddress = await signer.getAddress();
  
  // 1. Get Nonce
  const nonceResponse = await fetch(`${backendApiUrl}/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: userAddress }),
  });
  if (!nonceResponse.ok) throw new Error("Failed to get nonce.");
  const { nonce } = await nonceResponse.json();

  // 2. Sign Nonce
  const message = `${nonceData.message}`
  const signature = await signer.signMessage(message);

  // 3. Login with Signature
  const loginResponse = await fetch(`${backendApiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: userAddress, signature }),
  });
  if (!loginResponse.ok) throw new Error("Login failed.");
  const { token } = await loginResponse.json();
  
  jwtToken = token; // Store the token
  console.log("Login successful. JWT obtained.");
  return jwtToken;
}


/**
 * Main function to create a token.
 * @param {string} tokenName - The name of the token.
 * @param {string} tokenSymbol - The symbol of the token.
 * @param {File} imageFile - The image file from an <input type="file"> element.
 * @param {string} [buyAmountEth] - Optional. The amount of ETH to buy with (e.g., "0.1").
 */
async function createTokenFlow(tokenName, tokenSymbol, imageFile, buyAmountEth) {
  // --- 1. Connect Wallet & Login ---
  if (!window.ethereum) throw new Error("MetaMask is not installed!");
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = provider.getSigner();
  const { chainId } = await provider.getNetwork();

  console.log("Logging in...");
  const authToken = await loginAndGetToken(signer);

  // --- 2. Upload Image File ---
  console.log("Uploading image file...");
  const formData = new FormData();
  formData.append("file", imageFile);
  const uploadResponse = await fetch(`${backendApiUrl}/files/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: formData,
  });
  if (!uploadResponse.ok) throw new Error(`File upload failed: ${(await uploadResponse.json()).message}`);
  const { url: imageUrl } = await uploadResponse.json();
  console.log("Image uploaded successfully. URL:", imageUrl);

  // --- 3. Get Signature for Creation ---
  console.log("Requesting creation signature from backend...");
  const apiResponse = await fetch(`${backendApiUrl}/meme/tokens`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      chain_id: chainId,
      name: tokenName,
      symbol: tokenSymbol,
      image_url: imageUrl,
      description:'',
      image_url: '',
      x_url: '',
      telegram_url: '',
      website_url: '',
    }),
  });
  if (!apiResponse.ok) throw new Error(`Backend API error: ${(await apiResponse.json()).message}`);
  const signatureData = await apiResponse.json();
  console.log("Creation signature data received:", signatureData);

  // --- 4. Execute On-Chain Transaction ---
  const factoryContract = new ethers.Contract(memeFactoryAddress, memeFactoryAbi, signer);
  const salt = ethers.utils.hexZeroPad(`0x${signatureData.salt}`, 32);
  let tx;

  if (buyAmountEth && parseFloat(buyAmountEth) > 0) {
    // Case: Create and Buy
    const buyAmountWei = ethers.utils.parseEther(buyAmountEth);
    const totalValue = buyAmountWei.add(CREATION_FEE);
    tx = await factoryContract.createMemeTokenAndBuy(tokenName, tokenSymbol, signatureData.nonce, 0, salt, signatureData.signature, { value: totalValue });
  } else {
    // Case: Create Only
    tx = await factoryContract.createMemeToken(tokenName, tokenSymbol, signatureData.nonce, salt, signatureData.signature, { value: CREATION_FEE });
  }

  console.log(`Transaction sent. Hash: ${tx.hash}. Waiting for confirmation...`);
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw new Error("Blockchain transaction failed.");
  console.log("Transaction confirmed!");

  // --- 5. Verify Result by Polling ---
  console.log("Polling backend to get the new token address...");
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const verifyResponse = await fetch(`${backendApiUrl}/meme/signature/${signatureData.signature}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (verifyResponse.ok) {
      const tokenData = await verifyResponse.json();
      if (tokenData && tokenData.token) {
        console.log("SUCCESS! Token created.", tokenData);
        return tokenData;
      }
    }
  }

  throw new Error("Polling timed out. Could not retrieve token address.");
}

// --- How to Execute ---
//
// // 1. Get the file from your input element: <input type="file" id="logoUploader">
// const logoFile = document.getElementById('logoUploader').files[0];
//
// // 2. Check if a file was selected
// if (logoFile) {
//   // To create a token without buying:
//   createTokenFlow("My Final Token", "MFT", logoFile)
//     .then(info => alert(`Token created! Address: ${info.token}`))
//     .catch(console.error);
// } else {
//   alert("Please select a logo file first.");
// }
