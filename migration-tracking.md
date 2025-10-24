# Migration Tracking Integration Guide

This guide provides two methods for third-party services to track token migrations from the Kensei platform. When tokens "graduate" from Kensei's bonding curve, they migrate to external DEX pairs, and this integration allows you to monitor these events.

## Overview

Kensei tokens follow a lifecycle where they start on a bonding curve and eventually migrate to external DEX pairs when certain conditions are met. Third-party services can track these migrations using either:

1. **On-chain Event Indexing** - Direct blockchain event monitoring
2. **REST API Polling** - Backend API queries for migrated tokens

## Method 1: On-Chain Event Indexing

### Contract Information
- **Contract Address**: `0x8Cb780Ed7E3e2fBa0477058E663c357c39Fd5638`
- **Contract Name**: MemeFactoryV3
- **Chain**: Katana (Chain ID: 747474)

### Event to Track

The contract emits a `Migrated` event when tokens graduate from the bonding curve:

```solidity
event Migrated(
    address token,              // The token contract address
    uint256 tokensToMigrate,    // Amount of tokens migrated to DEX
    uint256 tokensToBurn,       // Amount of tokens burned in the process
    uint256 collateralToMigrate,// Amount of collateral (ETH) migrated
    uint256 migrationFee,       // Fee charged for migration
    address pair                // The resulting DEX pair address
);
```

### ABI for Indexing

Use this minimal ABI to index only the migration events:

```json
[
  {
    "type": "event",
    "name": "Migrated",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "tokensToMigrate",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "tokensToBurn",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "collateralToMigrate",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "migrationFee",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "pair",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  }
]
```

## Method 2: REST API Integration

### API Endpoint

Query migrated tokens using the Kensei backend API:

```
GET https://api.kensei.one/meme/tokens/featured?query=bonded&limit=10&offset=0
```

### Parameters

| Parameter | Type     | Required | Description                           |
|-----------|----------|----------|---------------------------------------|
| `query`   | `string` | Yes      | Use `"bonded"` to get migrated tokens |
| `limit`   | `number` | No       | Number of results (default: 10)      |
| `offset`  | `number` | No       | Pagination offset (default: 0)       |

### Response Format

```json
{
  "items": [
    {
      "chain_id": 747474,
      "creator": "0x07371dFECbb2497acD5d1f960E072F0d7AA835B5",
      "token": "0xA600A613C967b9EDF2b6019ea300Abc738F88637",
      "name": "BUSHIDO",
      "symbol": "BUSHIDO",
      "description": "Token description...",
      "website_url": "https://example.com",
      "x_url": "https://x.com/example",
      "telegram_url": "https://t.me/example",
      "image_url": "https://images.tentou.tech/kensei/uploads/...",
      "status": "graduated",
      "created_at": 1760724437,
      "total_comments": 35,
      "price_usd": 0.00009487242506010994,
      "market_cap_usd": 94872.42506010993,
      "created_tx_hash": "0x255cd4d4ec1a463073b30c33b01188c5fb78b54013f0a86cd3e89c7da814bad6",
      "migrated_tx_hash": "0x6e6ed96770862b4c46468f48f843149ab58ec720a5e2d9970b2dc24ca5b757ac",
      "pair": "0x53804a1B515C04161f96323E0EFc42d2705842A6",
      "tokens_to_migrated": "200459649202502146635022102",
      "collateral_to_migrated": "4661565247026550365"
    }
  ],
  "total_items": 2
}
```

### Key Fields for Integration

- **`token`**: The token contract address
- **`pair`**: The DEX pair contract address
- **`status`**: Will be `"graduated"` for migrated tokens
- **`migrated_tx_hash`**: Transaction hash of the migration
- **`tokens_to_migrated`**: Amount of tokens sent to DEX pair
- **`collateral_to_migrated`**: Amount of collateral (in wei) sent to DEX pair
- **`price_usd`** & **`market_cap_usd`**: Current market data