# Zcash testnet integration contract

## Current state

The /testnet.html Network Lab is a frontend readiness and input-format tool. It does **not** connect to a Zcash node, broadcast a transaction, inspect the chain, or verify a payment. A valid-looking transaction ID is not evidence of existence or confirmation.

The frontend defaults to testnet. The optional VITE_ZCASH_NETWORK setting accepts testnet or mainnet; do not enable mainnet for beta. VITE_ZCASH_EXPLORER_BASE_URL is an optional public explorer base URL used to construct a /tx/{txid} link. Configure only a known explorer that documents this URL format. This is a public URL, not a secret.

## Important protocol distinction

Zcash has transparent and shielded payment paths. The team must select and document which address types and payment flow the beta supports before implementing payment validation. Transparent-chain inspection cannot independently prove the amount and recipient of a shielded payment. Shielded payment verification may require a wallet/service architecture and evidence that the application can verify without exposing protected details.

## Required implementation before real settlement

1. Pick the supported wallet strategy and transaction flow. Do not implement seed-phrase collection in the website.
2. Select a maintained testnet node/lightwallet service and document its availability, privacy, rate limits, authentication and network identity checks.
3. Keep privileged RPC credentials and service credentials server-side. Never place secrets in VITE_* variables or the browser bundle.
4. Implement a server-side adapter with explicit methods for network identity, transaction lookup, confirmation depth and payment-condition verification. The server must reject mainnet txids when the market expects testnet.
5. Verify transaction ID, network, expected recipient/payment condition, amount when provable, confirmation count and reorg/rollback behaviour. Do not treat an explorer URL or a user-provided txid as proof.
6. Make settlement state transitions idempotent and auditable. Separate submitted, pending, confirmed, failed and completed states.
7. Test malformed txids, nonexistent transactions, wrong network, insufficient amount, wrong recipient, duplicate submissions, zero confirmations, reorgs, timeouts and provider errors.
8. Document metadata leakage and avoid claiming operator-blind or end-to-end privacy without a reviewed threat model.

## Public configuration

Example local .env.local values (only after choosing a documented explorer):

    VITE_ZCASH_NETWORK=testnet
    VITE_ZCASH_EXPLORER_BASE_URL=

Leave the explorer URL empty until its exact transaction URL format has been verified. No private keys, RPC credentials, seed phrases or Supabase service-role keys belong in VITE_* variables.

## Official references

- [Zcash testnet guide](https://zcash.readthedocs.io/en/latest/rtd_pages/testnet.html)
- [Zcash payment API](https://github.com/zcash/zcash/blob/master/doc/payment-api.md)
- [Zcash RPC reference](https://zcash.github.io/rpc/)
- [Official Zcash wallet SDK overview](https://z.cash/ecosystem/official-zcash-wallet-sdks/)
