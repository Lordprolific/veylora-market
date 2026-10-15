# Zcash testnet integration contract

## Current state

The /testnet.html Network Lab now calls two same-origin Vercel serverless endpoints. `/api/zcash/network` requests `getblockchaininfo` and only reports connected when the node returns `chain: test`. `/api/zcash/transaction` checks a txid with `getrawtransaction` and compares a requested transparent output against the expected recipient, amount and minimum confirmation depth. These endpoints do not broadcast transactions, collect keys, award markets, or mark trades complete. A matching transparent output is not a shielded-payment verifier.

The beta frontend and server adapter are locked to testnet. Mainnet is deliberately unsupported. `VITE_ZCASH_EXPLORER_BASE_URL` is an optional public explorer base URL used to construct a `/tx/{txid}` link; leave it empty unless the chosen explorer documents that exact route.

## Important protocol distinction

Zcash has transparent and shielded payment paths. The team must select and document which address types and payment flow the beta supports before implementing payment validation. Transparent-chain inspection cannot independently prove the amount and recipient of a shielded payment. Shielded payment verification may require a wallet/service architecture and evidence that the application can verify without exposing protected details.

## Server-side environment configuration

Set these in Vercel server environment variables only (not `VITE_*`):

- `ZCASH_NETWORK=testnet`
- `SUPABASE_URL` (or the existing `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (used only by server-side award and settlement endpoints)
- `ZCASH_RPC_URL` (HTTPS for remote hosts; localhost is allowed for local development)
- `ZCASH_RPC_USER`
- `ZCASH_RPC_PASSWORD`

The Zcash endpoints return a configuration error until all three RPC values are set. The market award and settlement endpoints also require the server-only Supabase service-role key. Use a dedicated, restricted testnet node account. Do not expose its credentials in browser variables. Node RPC access should be protected by infrastructure-level rate limiting before public beta; the app endpoint must not be treated as a public general-purpose RPC proxy.

The Network Lab transaction endpoint requires an expected transparent recipient and exact amount plus a confirmation threshold. The integrated settlement endpoint does not trust a client-supplied recipient or amount: it loads the winning offer's stored testnet recipient and amount, and requires three confirmations. It does not verify shielded outputs or recipient ownership. Node `getrawtransaction` availability depends on node transaction indexing/mempool visibility. The owner-facing settlement endpoint also stores evidence and moves a market to `settlement_confirmed` only after a matching transparent output reaches three confirmations. A separate owner acknowledgement endpoint then records `completed`. This is a transparent testnet-only flow, not a shielded-payment verifier; it still needs deployed configuration, integration tests, durable rate limits and a concurrency/security review.

## Remaining gates before real settlement

1. Choose and document the wallet strategy and the transparent testnet flow used for this beta. Shielded settlement is not supported by this verifier.
2. Configure a maintained testnet node with private RPC credentials and confirm the node reports testnet and has completed initial block download.
3. Apply `supabase/migrations/20261015_settlement_recipient.sql` to an existing database. New sealed offers must store a valid transparent testnet recipient.
4. Test award authorization, tie-breaking, concurrent award attempts, settlement retries, wrong recipient/amount, pending transactions, wrong network, reorgs, and node/provider failures.
5. Add durable infrastructure-level rate limiting and monitoring. The in-memory throttle is only a best-effort guard and is not sufficient for public production.
6. Review market state changes and settlement evidence with a security reviewer; document privacy metadata and incident response.
7. Keep mainnet disabled and do not use this beta for valuable trades until the remaining gates pass.

## Public configuration

Example local .env.local values (only after choosing a documented explorer):

    VITE_ZCASH_EXPLORER_BASE_URL=

Leave the explorer URL empty until its exact transaction URL format has been verified. No private keys, RPC credentials, seed phrases or Supabase service-role keys belong in VITE_* variables.

## Official references

- [Zcash testnet guide](https://zcash.readthedocs.io/en/latest/rtd_pages/testnet.html)
- [Zcash developer tools and RPC documentation](https://zcash.readthedocs.io/en/latest/rtd_pages/dev_tools.html)
- [getblockchaininfo RPC method](https://github.com/zcash/rpc/blob/master/getblockchaininfo.html)
- [Zcash payment API](https://github.com/zcash/zcash/blob/master/doc/payment-api.md)
- [Zcash RPC reference](https://zcash.github.io/rpc/)
- [Official Zcash wallet SDK overview](https://z.cash/ecosystem/official-zcash-wallet-sdks/)
