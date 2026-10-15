# Veylora Market

Early beta for private RFQs, sealed offers and clear settlement status, designed around shielded Zcash settlement.

## Setup
1. Create a Supabase project.
2. Review and run [supabase/schema.sql](./supabase/schema.sql) in its SQL Editor.
3. Configure email signup, site URL and redirect URLs in Supabase Auth.
4. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase in local .env.local and in a separate Vercel project connected to this repository.
5. Run npm install, npm run dev, then npm run build.
6. Deploy the branch to a Vercel preview and smoke-test before sharing.

Never expose a Supabase service-role key in a browser bundle. Never put private keys or wallet seed phrases in VITE_* variables.

## Current prototype scope
- Responsive dark/silver market interface and labelled sample RFQs.
- Supabase email/password signup and sign-in UI once configured.
- Create a live RFQ in Supabase.
- Insert a bidder's offer under current row-level security policies.
- Feedback UI and GitHub Issues link.
- Settlement receipt distinguishes market outcome, payment submission, network confirmation and completion.
- A separate Network Lab at /testnet.html with a server-side testnet node health check and transparent-output transaction verification when a restricted Zcash testnet RPC node is configured.

## Testnet Network Lab
See [docs/TESTNET-INTEGRATION.md](./docs/TESTNET-INTEGRATION.md) for the verifier contract. The Vercel API checks `getblockchaininfo` and rejects any node not reporting `chain: test`; transaction checks compare a transparent output against an expected address, amount and confirmation threshold. Configure `ZCASH_RPC_URL`, `ZCASH_RPC_USER`, `ZCASH_RPC_PASSWORD`, and `ZCASH_NETWORK=testnet` as server-only Vercel variables. The verifier never broadcasts funds and does not verify shielded payment details. `VITE_ZCASH_EXPLORER_BASE_URL` is optional.

## Critical limits
- Demo bids exist only in browser state and are not persistent.
- The server-side close-and-award and testnet settlement endpoints are now scaffolded, but require server-only Supabase service-role and restricted testnet RPC configuration plus integration testing. Durable rate limiting, atomic database transactions and a reviewed audit trail remain required before any valuable trade.
- The schema is a starting point and needs a security review; it does not itself provide complete bid immutability or robust concurrency controls.
- The app can query a configured testnet node for transparent-output evidence, and the owner can record completion only after three-confirmation verification. It does not send transactions or verify shielded payment details. A txid alone is not proof of payment.
- Shielded Zcash does not automatically hide app metadata or bids. The platform operator may access stored bid data. This is not operator-blind or zero-knowledge auction execution.
- Do not use this beta for valuable trades.

## Tester checklist
Use at least two separate accounts. Test signup, email confirmation, sign-in/out, RFQ creation, own-bid visibility, attempts to read another user's bid, duplicate/late offers, mobile layout and feedback. Do not advertise live bidding as fully enforced until trusted server-side controls are deployed.

## Release checklist
See [docs/RELEASE-CHECKLIST.md](./docs/RELEASE-CHECKLIST.md) for frontend, backend integration, testnet, privacy and launch gates.
