# Veylora Market

Veylora Market is an experimental privacy-focused Web3 deal desk for requests for quotation (RFQs) and competing offers. The first supported deal categories are OTC and token deals, DAO procurement, and Web3 services. A buyer publishes a request, suppliers submit offers, the buyer closes and awards the request under the current rule, and Zcash testnet settlement evidence is checked separately.

> **Status: testnet beta.** Wallet connection and signature-based sign-in, persistent RFQ/offer storage, server-side award handling, category-aware Web3 requests, verified-testnet-wallet write policies, and a transparent-output testnet settlement verifier are implemented. The marketplace applies access controls to bid data, but has not been independently audited. Do not use it for valuable trades.

Live app: https://veylora-market.vercel.app/

## Current functionality

- **V2 deal categories:** OTC & token deals, DAO procurement, and Web3 services share one RFQ/offer lifecycle. Liquidity and market-maker sourcing are planned for a later phase. Category selection is stored with each database RFQ; existing requests default to OTC for compatibility.
- **Award-rule limitation:** the current server-side award endpoint selects the lowest eligible offer, breaking ties by earliest commitment, across all categories. It does not score audit quality, provider experience, delivery plans, or qualitative service proposals. Buyers must not treat an automatic award as a quality assessment; category-specific evaluation is future work.
- **Bid access controls:** row-level security policies restrict bid reads through the client-facing database interface to the submitting bidder, and client-side bid updates and deletes are disabled by policy. Protected writes require a server-verified Zcash testnet wallet identity. These are application access controls, not a cryptographic zero-knowledge auction protocol.
- **Wallet connection and identity verification:** connect through a supported injected Noir Wallet-compatible Zcash provider. Veylora requests a short-lived, origin-bound sign-in challenge; the wallet signs it; the server verifies the signature and links the wallet identity to the current Supabase session. This signature proves control of the wallet identity; it does not authorize a payment.
- **Wallet fallback:** when no supported provider is detected, the app links to the official Veylora testnet wallet download page at `/wallet-download.html`. Wallet version 0.3.3 launches its full UI in an extension tab to support WebZjs cross-origin isolation. The extension's direct native connection to the Market remains a separate end-to-end verification gate; the download link does not itself establish a connection.
- **Persistent RFQs and offers:** non-demo requests and offers are written to Supabase. Sample RFQs and transfer/activity previews are demo content and do not represent real transactions.
- **Server-side close and award:** the owner can close a request after its deadline. The server selects the lowest eligible offer, breaking ties by earliest commitment, and records the result. Awarding a request is not the same as paying or completing it.
- **Settlement state handling:** payment submission, network confirmation, and owner-confirmed completion are separate states.
- **Zcash testnet verification:** configured server-side RPC endpoints check network identity and transaction evidence. The market settlement flow checks the winning offer's transparent recipient and amount and requires three confirmations before marking settlement confirmed.
- **Network Lab:** `/testnet.html` provides testnet node health and transparent-output verification tools.
- **Feedback:** the app provides feedback UI and a GitHub Issues fallback.

## Wallet sign-in flow

1. The user connects a supported injected Zcash wallet.
2. The app obtains or creates a Supabase session.
3. The server issues a random, five-minute, same-origin wallet sign-in challenge.
4. The wallet signs the challenge message.
5. The server verifies the signature, public key, address match, challenge expiry, and single-use challenge before linking the identity to the session.
6. The verified session is required for protected marketplace actions.

The website must never request a seed phrase, recovery phrase, private key, or wallet password. Wallet sign-in is separate from transaction signing and payment approval.

## Local development

Requirements: Node.js/npm, a Supabase project, and a Vercel-compatible environment for the serverless API routes.

1. Create a Supabase project.
2. Review and apply `supabase/schema.sql` in the Supabase SQL Editor.
3. Apply the migrations in `supabase/migrations/` in chronological order, including wallet-auth tables, server-role grants, and the V2 category and verified-wallet-write migration, before testing wallet sign-in against the matching application release.
4. Enable Anonymous Sign-Ins in Supabase Auth for wallet-first sessions.
5. Create `.env.local` with the public Supabase settings:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

6. Configure the server-only variables in your local serverless environment and Vercel project as required by the server helpers:

   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ZCASH_RPC_URL`
   - `ZCASH_NETWORK=testnet`
   - `ZCASH_RPC_API_KEY`, or both `ZCASH_RPC_USER` and `ZCASH_RPC_PASSWORD`
   - `VITE_ZCASH_EXPLORER_BASE_URL` is optional and must point to an appropriate testnet explorer.

   The RPC node must be restricted and configured for Zcash testnet. Keep service-role and RPC credentials server-side; never expose them through `VITE_*` variables or the browser bundle.
7. Install dependencies and run the app:

   ```bash
   npm install
   npm run dev
   npm run build
   ```

8. Deploy a Vercel preview and test wallet connection, sign-in, RFQ creation, offer submission, close/award, and settlement checks before sharing it.

## Privacy and security scope

- **Bid confidentiality:** client-facing row-level security policies restrict bid reads to the submitting bidder, and client-side bid updates and deletes are disabled by policy. Verify these policies against the deployed database and test with separate accounts before relying on them in production.
- **Metadata:** Zcash shielded transactions do not automatically shield RFQ details, wallet identity metadata, IP/request logs, or information stored by the application. Avoid including sensitive personal or commercial details in public RFQs.
- **Settlement verification:** the verifier checks transparent transaction outputs only. It does not verify shielded payment details or prove recipient ownership. A transaction ID alone is not proof of payment.
- **Payment flow:** the app does not broadcast settlement payments. Users make payments through a wallet; the server checks the supplied transaction against configured testnet RPC evidence.
- **Testnet only:** testnet assets have no intended monetary value. Mainnet or valuable trades are out of scope.
- **Wallet support:** the Market currently uses `@noir-wallet/sdk` and its injected provider interface. The standalone Veylora extension is a separate project; native extension-to-site connectivity should only be claimed after the bridge and end-to-end browser tests have passed.
- **Anonymous session recovery:** wallet-first sessions use Supabase anonymous sessions. Account recovery or cross-device restoration is not implemented; clearing browser/site data can lose access to that session.
- **Security and operations:** the schema and server routes require ongoing security review, integration testing, durable rate limiting, concurrency testing, monitoring, and a reviewed audit trail before valuable trades.

## Related projects and documentation

- [Veylora Zcash Wallet](https://github.com/Lordprolific/veylora-testnet-wallet)
- [Veylora Wallet 0.3.3 isolated-page release](https://github.com/Lordprolific/veylora-testnet-wallet/releases/tag/wallet-isolated-2026-10-27)
- [Wallet download and installation page](https://veylora-market.vercel.app/wallet-download.html)
- [Wallet integration notes](./docs/VEYLORA-WALLET-INTEGRATION.md)
- [Testnet integration guide](./docs/TESTNET-INTEGRATION.md)
- [Release checklist](./docs/RELEASE-CHECKLIST.md)

## Safety

This project is experimental and unaudited. Do not use it for valuable trades or real funds. Testnet assets have no intended monetary value. Do not expose credentials, request recovery phrases on the website, or describe a payment as confirmed until the configured verifier has checked the required evidence.
