## Configuration on Galxe

Follow this guide to configure tasks on Galxe:
https://docs.galxe.com/quest/credential-api/rest-cred/single-config

## API Configurationss

### Buy any memecoin on Kensei for $10

#### - Endpoint

```
https://quest.kensei.one/galxe/buy-meme-token?walletAddress=$address
```

#### - Request Type

`GET`

#### - Headers

```
x-api-key: API_KEY
```

#### - Response:

```json
{
  "error": false,
  "data": {
    "items": [
      {
        "account": "0xe85e55D67eaAE41Ae8C2912687e9619F42f636f3",
        "token": "0x94D21CACF34Cb4a2Fe6b1F29DBAEf2948C4495ce",
        "block_number": "14041002",
        "tx_hash": "0x9123376d7eac23f871ff6af7bac1fcd0877420140f20e4b430ff499f1a86d56e",
        "direction": "buy",
        "collateral_amount": "5568639277232122",
        "collateral_amount_usd": 21.332176284042497
      }
    ]
  }
}
```

#### - Expression

```js
function(resp) {
  if (resp.data.items != null && resp.data.items.length > 0) {
    return 1
  }
  return 0
}
```

### Create a memecoin

#### - Endpoint

```
https://quest.kensei.one/galxe/create-meme-token?walletAddress=$address
```

#### - Request Type

`GET`

#### - Headers

```
x-api-key: API_KEY
```

#### - Response:

```json
{
  "error": false,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Kitsu 9",
        "token_address": "0xFBa805659E5050544e185cccdf592FD77f8c7210",
        "created_tx_hash": "0x4589b2ecf07443dcc2dcc2153e31bea583f36dfde22376f18218d50c3a72e5d1",
        "creator_address": "0x79Cb07c3225422891CE81FA0D9Ff42aEC1f7a8AA"
      }
    ]
  }
}
```

#### - Expression

```js
function(resp) {
  if (resp.data.items != null && resp.data.items.length > 0) {
    return 1
  }
  return 0
}
```

### Buy one of the graduated coin for $10

> **Note:** Adjust minimum buy amount by changing `minAmountUsd=10` in endpoint.

> **Test address:** `0x93f8e7ec7e054b476d7de8e6bb096e56cd575beb`

#### - Endpoint

```
https://quest.kensei.one/galxe/buy-graduated-token?walletAddress=$address&minAmountUsd=10
```

#### - Request Type

`GET`

#### - Headers

```
x-api-key: API_KEY
```

#### - Response:

```json
{
  "error": false,
  "data": {
    "items": [
      {
        "amount0": "-2808494.840302115550844656",
        "amount1": "0.026194979995706738",
        "amountUSD": "100.3595019536839342373886785768318",
        "id": "0x63e32730c6dad2b2c5554494c1d21e02e3d46270ac3b04ca286d698a6f894bb9#69",
        "origin": "0x93f8e7ec7e054b476d7de8e6bb096e56cd575beb",
        "pool": {
          "id": "0x53804a1b515c04161f96323e0efc42d2705842a6",
          "token0": {
            "id": "0xa600a613c967b9edf2b6019ea300abc738f88637",
            "name": "BUSHIDO",
            "symbol": "BUSHIDO"
          },
          "token1": {
            "id": "0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62",
            "name": "Vault Bridge ETH",
            "symbol": "vbETH"
          }
        },
        "recipient": "0xd2b37ade14708bf18904047b1e31f8166d39612b",
        "sender": "0xd2b37ade14708bf18904047b1e31f8166d39612b",
        "timestamp": "1761878810",
        "transaction": {
          "blockNumber": "15135999",
          "id": "0x63e32730c6dad2b2c5554494c1d21e02e3d46270ac3b04ca286d698a6f894bb9"
        }
      }
    ]
  }
}
```

#### - Expression

```js
function(resp) {
  if (resp.data.items != null && resp.data.items.length > 0) {
    return 1
  }
  return 0
}
```

