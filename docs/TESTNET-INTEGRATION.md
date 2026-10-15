# Zcash testnet integration contract

## Current state

The /testnet.html Network Lab now calls two same-origin Vercel serverless endpoints. `/api/zcash/network` requests `getblockchaininfo` and only reports connected when the node returns `chain: test`. `/api/zcash/transaction` checks a txid with `getrawtransaction` and compares a requested transparent output against the expected recipient, amount and minimum confirmation depth. These endpoints do not broadcast transactions, collect keys, award markets, or mark trades complete. A matching transparent output is not a shielded-payment verifier.

The beta frontend and server adapter are locked to testnet. Mainnet is deliberately unsupported. `VITE_ZCASH_EXPLORER_BASE_URL` is an optional public explorer base URL used to construct a `/tx/{txid}` link; leave it empty unless the chosen explorer documents that exact route.

## Important protocol distinction

Zcash has transparent and shielded payment paths. The team must select and document which address types and payment flow the beta supports before implementing payment validation. Transparent-chain inspection cannot independently prove the amount and recipient of a shielded payment. Shielded payment verification may require a wallet/service architecture and evidence that the application can verify without exposing protected details.

## Server-side environment configuration\n\nSet these in Vercel server environment variables only (not `VITE_*`):\n\n- `ZCASH_NETWORK=testnet`\n- `SUPABASE_URL` (or the existing `VITE_SUPABASE_URL`)\n- `SUPABASE_SERVICE_ROLE_KEY` (used only by server-side award and settlement endpoints)\n- `ZCASH_RPC_URL` (HTTPS for remote hosts; localhost is allowed for local development)\n- `ZCASH_RPC_USER`\n- `ZCASH_RPC_PASSWORD`\n\nThe Zcash endpoints return a configuration error until all three RPC values are set. The market award and settlement endpoints also require the server-only Supabase service-role key. Use a dedicated, restricted testnet node account. Do not expose its credentials in browser variables. Node RPC access should be protected by infrastructure-level rate limiting before public beta; the app endpoint must not be treated as a public general-purpose RPC proxy.\n\nThe Network Lab transaction endpoint requires an expected transparent recipient and exact amount plus a confirmation threshold. The integrated settlement endpoint does not trust a client-supplied recipient or amount: it loads the winning offer's stored testnet recipient and amount, and requires three confirmations. It does not verify shielded outputs or recipient ownership. Node `getrawtransaction` availability depends on node transaction indexing/mempool visibility. The owner-facing settlement endpoint also stores evidence and moves a market to `settlement_confirmed` only after a matching transparent output reaches three confirmations. A separate owner acknowledgement endpoint then records `completed`. This is a transparent testnet-only flow, not a shielded-payment verifier; it still needs deployed configuration, integration tests, durable rate limits and a concurrency/security review.\n\n## Required implementation before real settlement

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

- [Zcash testnet guide](https://zcash.readthedocs.io/en/latest/rtd_pages/testnet.html)\n- [Zcash developer tools and RPC documentation](https://zcash.readthedocs.io/en/latest/rtd_pages/dev_tools.html)\n- [getblockchaininfo RPC method](https://github.com/zcash/rpc/blob/master/getblockchaininfo.html)
- [Zcash payment API](https://github.com/zcash/zcash/blob/master/doc/payment-api.md)
- [Zcash RPC reference](https://zcash.github.io/rpc/)
- [Official Zcash wallet SDK overview](https://z.cash/ecosystem/official-zcash-wallet-sdks/)
