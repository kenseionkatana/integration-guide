## Configuration on Galxe

Follow this guide to configure tasks on Galxe:
https://docs.galxe.com/quest/credential-api/rest-cred/single-config

## API Configurationss

### Buy any memecoin on Kensei for $20

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
