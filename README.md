# Veylora Market

Early beta for private RFQs, sealed offers and clear settlement status, designed around shielded Zcash settlement.

## Setup
1. Create a Supabase project.
2. Review and run [supabase/schema.sql](./supabase/schema.sql) in its SQL Editor.
3. Configure email signup, site URL and redirect URLs in Supabase Auth.
4. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase in local .env.local and in a separate Vercel project connected to this repository.
5. Run npm install, npm run dev, then npm run build.
6. Deploy a preview and smoke-test before sharing.

Never expose a Supabase service-role key in a browser bundle. Never put private keys or wallet seed phrases in VITE_* variables.

## Wallet integration status

Veylora Market is intended to work with the **Veylora Zcash Wallet**. The current Market build does **not yet connect to a browser wallet or submit a Zcash transaction**. Installing Veylora Wallet alone will not make a wallet-connect button appear or enable settlement.

The Veylora Wallet repository currently contains a standalone experimental Chrome extension and a separate dApp lab that uses the Noir Wallet SDK. That lab is not evidence that the standalone Veylora extension exposes a compatible dApp provider. Do not install Noir as a prerequisite for Veylora Market.

See [Wallet integration status and implementation plan](./docs/wallet-integration.md) for the required bridge and verification work.

## Current prototype scope
- Responsive dark/silver market interface and labelled sample RFQs.
- Supabase email/password signup and sign-in UI once configured.
- Create a live RFQ in Supabase.
- Insert a bidder's offer under current row-level security policies.
- Feedback UI and GitHub Issues link.
- Settlement receipt distinguishes market outcome, payment submission, network confirmation and completion.

## Critical limits
- Demo bids exist only in browser state and are not persistent.
- Trusted market enforcement is incomplete. Move close-time enforcement, bid validation, winner selection, tie-breaks, rate limits and audit receipts into trusted server-side functions before any valuable trade.
- The schema is a starting point and needs a security review; it does not itself provide complete bid immutability or robust concurrency controls.
- No Zcash transaction is sent or verified by this app. Settlement preview is illustrative; a txid alone is not proof of confirmation.
- Shielded Zcash does not automatically hide app metadata or bids. The platform operator may access stored bid data. This is not operator-blind or zero-knowledge auction execution.
- Do not use this beta for valuable trades.

## Tester checklist
Use at least two separate accounts. Test signup, email confirmation, sign-in/out, RFQ creation, own-bid visibility, attempts to read another user's bid, duplicate/late offers, mobile layout and feedback. Do not advertise live bidding as fully enforced until trusted server-side controls are deployed.
