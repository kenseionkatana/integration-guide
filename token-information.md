# Token Information API Guide

This guide explains how to retrieve detailed information about a specific token on the Kensei platform using the REST API.

## Overview

The Token Information API provides comprehensive metadata and current state information for any token launched on Kensei. This includes token details, creator information, social links, migration status, and real-time market data.

## API Endpoint

```
GET https://api.kensei.one/meme/token
```

### Parameters

| Parameter | Type     | Required | Description                                    |
|-----------|----------|----------|------------------------------------------------|
| `token`   | `string` | Yes      | The token contract address (checksummed or lowercase) |

### Example Request

```bash
curl "https://api.kensei.one/meme/token?token=0xA600A613C967b9EDF2b6019ea300Abc738F88637"
```

## Response Format

### Success Response (200 OK)

```json
{
  "chain_id": 747474,
  "creator": "0x07371dFECbb2497acD5d1f960E072F0d7AA835B5",
  "token": "0xA600A613C967b9EDF2b6019ea300Abc738F88637",
  "name": "BUSHIDO",
  "symbol": "BUSHIDO",
  "description": "BUSHIDO is a community-driven memecoin by Levrex Finance, launched on Katana through Kensei. Inspired by the samurai code, it channels all rewards and fees into $KAT accumulation, liquidity growth, and vKAT governance, making each transaction strengthen the Katana ecosystem with honor and precision ⚔️",
  "website_url": "https://levrex.finance/",
  "x_url": "https://x.com/levrexfinance",
  "telegram_url": "https://t.me/+CgMrFokP2sBmOTg1",
  "image_url": "https://images.tentou.tech/kensei/uploads/2025/10/17/0a927af1-7858-4043-81f2-d0c966133fd3.png",
  "status": "graduated",
  "created_at": 1760724437,
  "total_comments": 37,
  "price_usd": 0.00009487242506010994,
  "market_cap_usd": 94872.42506010993,
  "created_tx_hash": "0x255cd4d4ec1a463073b30c33b01188c5fb78b54013f0a86cd3e89c7da814bad6",
  "migrated_tx_hash": "0x6e6ed96770862b4c46468f48f843149ab58ec720a5e2d9970b2dc24ca5b757ac",
  "pair": "0x53804a1B515C04161f96323E0EFc42d2705842A6",
  "tokens_to_migrated": "200459649202502146635022102",
  "collateral_to_migrated": "4661565247026550365"
}
```

## Response Fields

### Basic Token Information

| Field       | Type     | Description                                    |
|-------------|----------|------------------------------------------------|
| `chain_id`  | `number` | The blockchain chain ID (747474 for Katana)   |
| `creator`   | `string` | Address of the wallet that created the token  |
| `token`     | `string` | The token contract address                     |
| `name`      | `string` | Full name of the token                         |
| `symbol`    | `string` | Token ticker symbol                            |
| `description` | `string` | Token description provided by creator        |

### Social & Media Links

| Field          | Type     | Description                          |
|----------------|----------|--------------------------------------|
| `website_url`  | `string` | Official website URL (if provided)   |
| `x_url`        | `string` | Twitter/X profile URL (if provided)  |
| `telegram_url` | `string` | Telegram group URL (if provided)     |
| `image_url`    | `string` | URL to the token's logo image        |

### Status & Timestamps

| Field         | Type     | Description                                           |
|---------------|----------|-------------------------------------------------------|
| `status`      | `string` | Token status: `"trading"` (on bonding curve) or `"graduated"` (migrated to DEX) |
| `created_at`  | `number` | Unix timestamp of token creation                      |

### Community Engagement

| Field            | Type     | Description                               |
|------------------|----------|-------------------------------------------|
| `total_comments` | `number` | Total number of comments on token page    |

### Market Data

| Field           | Type     | Description                                    |
|-----------------|----------|------------------------------------------------|
| `price_usd`     | `number` | Current token price in USD                     |
| `market_cap_usd`| `number` | Current market capitalization in USD           |

### Transaction History

| Field              | Type     | Description                                      |
|--------------------|----------|--------------------------------------------------|
| `created_tx_hash`  | `string` | Transaction hash of token creation               |
| `migrated_tx_hash` | `string` | Transaction hash of migration (if graduated)     |

### Migration Data (Only for Graduated Tokens)

| Field                    | Type     | Description                                          |
|--------------------------|----------|------------------------------------------------------|
| `pair`                   | `string` | DEX pair contract address (if graduated)             |
| `tokens_to_migrated`     | `string` | Amount of tokens migrated to DEX pair (in wei)       |
| `collateral_to_migrated` | `string` | Amount of collateral migrated to DEX pair (in wei)   |

## Error Handling

### Common Error Responses

| Status Code | Description                                      |
|-------------|--------------------------------------------------|
| `400`       | Bad Request - Invalid token address format       |
| `404`       | Not Found - Token doesn't exist in Kensei        |
| `500`       | Internal Server Error - API issue                |

## Best Practices

1. **Cache responses**: Token data doesn't change frequently (except price/market cap), consider caching for short periods
2. **Handle missing fields**: Not all tokens have social links or migration data
3. **Validate addresses**: Ensure token addresses are valid before making requests
4. **Rate limiting**: Implement reasonable request intervals if polling multiple tokens
5. **Error handling**: Always handle network errors and invalid responses gracefully

## Integration Tips

- **Real-time prices**: Price and market cap data is updated regularly but may have slight delays
- **Graduated tokens**: Check the `status` field to determine if a token has migrated to a DEX
- **Social links**: Fields like `website_url`, `x_url`, and `telegram_url` may be empty strings if not provided
- **Large numbers**: `tokens_to_migrated` and `collateral_to_migrated` are returned as strings to preserve precision (they represent wei amounts)

## Related Guides

- [Migration Tracking](./migration-tracking.md) - Track when tokens migrate to DEX pairs
- [Token Creation](./token-creation.md) - How to create new tokens on Kensei