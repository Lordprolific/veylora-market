# Veylora Market: privacy-first Zcash architecture

## Status and scope

Veylora is a testnet beta. This document is the implementation contract for evolving it from email-authenticated RFQs with wallet-connect UI into a wallet-first, privacy-conscious Zcash marketplace.

**Do not describe the current beta as fully shielded or operator-blind.** The existing application still uses Supabase email/password sessions for market creation and bids. The Noir wallet connection currently grants address access only; connection is not authentication. The current settlement verifier checks transparent Zcash testnet outputs and does not verify shielded payment details or recipient ownership.

## Protocol facts to preserve

- Zcash transparent and shielded transactions have different privacy properties. Transparent outputs and their relationships can be publicly visible.
- Wallet connections must be initiated by a deliberate user action. Restore an existing connection silently through the SDK's account-read method.
- Noir Wallet mainnet and testnet builds are separate extensions with isolated wallet data. The SDK does not switch the installed wallet's network at runtime.
- Use the Noir Wallet SDK documented in the official developer guide. Never request seed phrases or private keys.
- Prefer shielded funding for the privacy-first settlement path when supported by the user's wallet and the recipient. Do not silently fall back to transparent funding.
- A transaction ID, wallet success response, or matching transparent output must not be described as proof of a shielded recipient or shielded amount.

## Target architecture

### 1. Wallet-first identity

1. User selects **Connect Noir Wallet** through a direct interaction.
2. The app requests wallet account access and retains addresses in client memory only when feasible. Do not send shielded addresses, account lists, balances, or history to analytics.
3. The server creates a short-lived, cryptographically random, single-use challenge bound to the canonical application origin, requested action, issue time, expiry, and nonce.
4. The wallet signs the exact challenge using Noir's documented message-signing API and an identity mode that minimizes linkage where supported.
5. The server verifies the signature using a supported, tested Zcash signature-verification implementation. Never accept an address or a client-supplied \`verified: true\` as proof.
6. The server consumes the nonce atomically and creates a short-lived authenticated session. Reject replayed, expired, wrong-origin, wrong-action, and wrong-key challenges.
7. If a hardware wallet does not support arbitrary message signing, explain that limitation and offer a separately designed, explicitly reviewed alternative. Do not silently downgrade to unverified address login.

Implementation note: the exact signature encoding, public-key/address binding, and verification algorithm must be confirmed against the currently installed Noir SDK and its supported signature scheme before building the verifier. Do not invent a cryptographic verifier or use string equality as signature verification.

### 2. Private market activity

- Replace all market/bid authorization based on \`auth.users\` with a stable internal wallet identity/session model only after server-side identity verification is working.
- Keep market and bid access policies server-enforced. Competitors must not read bid amounts, notes, settlement recipients, or private identity mappings.
- Explicitly document operator visibility. Supabase service-role access means the application operator may be able to read stored bids; sealed from competitors is not the same as encrypted from the operator.
- Minimize stored wallet addresses and linkable metadata. Do not persist shielded addresses unless a defined workflow requires them.
- Avoid storing IPs, balances, or transaction history without a documented need and retention policy.
- Preserve owner authorization, closing-time checks, deterministic tie-breaks, idempotency, and protection against concurrent awards.

### 3. Shielded settlement

- The user must review and approve each payment in Noir Wallet. Veylora must never request seed phrases or private keys and must not imply it can send without wallet approval.
- Request \`sendTransaction({ to, amount, fundingSource: 'shielded' })\` where supported and when the agreed market payment is intended to be shielded. Amounts must be validated decimal strings, not floating-point calculations.
- The recipient flow must support valid shielded-capable Zcash addresses (including supported Unified Addresses); do not use a transparent-address-only regular expression as the general recipient validator.
- Keep testnet-only behavior explicit. Testnet and mainnet wallet builds are separate; do not rely on a runtime network switch.
- Separate payment states: \`not_started\`, \`wallet_approval_requested\`, \`submitted\`, \`confirming\`, \`confirmed\`, \`failed\`, and \`needs_review\`. Never mark a market complete based only on the wallet returning a txid.
- A shielded transaction cannot be verified by the existing transparent-output matching code. Define an appropriate verifier and privacy-preserving proof/evidence model before claiming settlement confirmation. If independent shielded verification is not available for the beta, label settlement as user-submitted/unverified and do not mark it cryptographically confirmed.
- Handle reorgs, retries, wrong network, wrong amount/recipient where verifiable, duplicate submissions, pending transactions, and provider failures.

### 4. Production security gates

Before public production promotion:
- Signature verification is tested against known-good and invalid vectors.
- Nonces are random, short-lived, origin/action-bound, atomically single-use, and replay-resistant.
- Session cookies/tokens are secure, short-lived, revocable, and never logged.
- RLS and server authorization tests prove that another bidder cannot read or mutate private bids.
- Awarding is server-side, atomic, idempotent, and safe under concurrent requests.
- Durable infrastructure rate limiting and monitoring are configured; in-memory per-instance throttling is not sufficient.
- Secrets and RPC credentials remain server-only, never in \`VITE_*\` variables.
- Testnet-only guards are validated end-to-end.
- CI, typecheck, build, integration tests, desktop/mobile wallet flows, and a manual test plan pass.
- The public privacy statement describes the actual threat model, metadata leaks, operator access, and unsupported paths.

## Same-day beta plan

1. Audit the live production branch and database policies.
2. Verify the Noir SDK version and exact identity/signature API in the repository.
3. Implement wallet challenge/signature authentication with tests before replacing email-based authorization.
4. Update RLS and server endpoints together; do not partially switch identity models.
5. Integrate wallet-approved shielded testnet payment requests and accurately label settlement verification limits.
6. Run a multi-account end-to-end test and mobile/desktop smoke tests.
7. Promote only the commit that passed checks. Keep mainnet disabled.

## Official references

- Zcash documentation: https://zcash.readthedocs.io/en/latest/
- Zcash payment API: https://zcash.readthedocs.io/en/latest/rtd_pages/payment_api.html
- Noir Wallet developer docs: https://docs.zknoir.com/developers/
- Noir Wallet SDK integration: https://docs.zknoir.com/noir-sdk-integration/
- Noir Wallet provider API: https://docs.zknoir.com/developers/provider-api/
