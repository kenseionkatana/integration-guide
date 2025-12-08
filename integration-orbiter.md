# Orbiter Integration Guide

## API Configurations

### Trade a memecoin on Kensei with 10$ volume

> **Test address:** `0xe85e55D67eaAE41Ae8C2912687e9619F42f636f3`

#### - Endpoint

```
https://quest.kensei.one/orbiter/verify-meme-token-trade?address=$address
```

#### - Request Type

`GET`

#### - Headers

```
Authorization: Bearer <API_KEY>
```

#### - Response:

```json
{
    "isValid": true,
    "message": "Verification succeeded",
    "result": {
        "items": [
            {
                "account": "0xe85e55D67eaAE41Ae8C2912687e9619F42f636f3",
                "token": "0x94D21CACF34Cb4a2Fe6b1F29DBAEf2948C4495ce",
                "block_number": "14041037",
                "tx_hash": "0x5e1821d4429d3a497653c3f19fe1b92ce8bd7a01d238c6c163e1c50a6ed17720",
                "direction": "sell",
                "collateral_amount": "5458369192534456",
                "collateral_amount_usd": 17.22863276823998
            }
        ]
    }
}
```


### Create a meme on Kensei

> **Test address:** `0x79Cb07c3225422891CE81FA0D9Ff42aEC1f7a8AA`

#### - Endpoint

```
https://quest.kensei.one/orbiter/verify-meme-token-create?address=$address
```

#### - Request Type

`GET`

#### - Headers

```
Authorization: Bearer <API_KEY>
```

#### - Response:

```json
{
    "isValid": true,
    "message": "Verification succeeded",
    "result": {
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


