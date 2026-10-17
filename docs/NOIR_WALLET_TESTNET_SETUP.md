# Noir Wallet setup for Veylora Market beta

Veylora is a web application. Testers do **not** need to install the Noir Wallet SDK or run developer commands. The SDK is a dependency bundled into the Veylora website; testers install a compatible Noir Wallet browser extension and approve the connection when prompted.

## Choose the correct wallet build

Noir Wallet publishes separate extensions for Zcash mainnet and testnet. They use different extension IDs and separate wallet data. The app cannot switch an installed extension between networks.

- **Veylora beta / test ZEC:** install the official **[Testnet] Noir Wallet** build from the [Noir Wallet SDK releases](https://github.com/NoirWallet/noir-wallet-sdk/releases). Choose the official release asset whose filename ends in -testnet.zip, unzip it, open chrome://extensions, enable Developer mode, choose **Load unpacked**, and select the extracted extension directory. Only use releases published by the official NoirWallet GitHub repository.
- **Zcash mainnet / real ZEC:** [Noir Wallet on the Chrome Web Store](https://chromewebstore.google.com/detail/noir-wallet/mfoghjbpfanobmnoemoepenjjcmfpmdn). This is the mainnet extension and is not the correct wallet build for Veylora's testnet settlement flow.

Do not send real ZEC to testnet addresses. Do not enter a recovery phrase, private key, or wallet password into Veylora. The website must never request those secrets.

## Connect and sign in

1. Open Veylora Market in Chrome with the compatible Noir Wallet extension installed and unlocked.
2. Select **Connect Zcash**. Noir Wallet will ask you to approve account access.
3. Veylora starts or resumes a Supabase session, requests a short-lived sign-in challenge, and asks Noir Wallet to sign a message in derived identity mode.
4. The server verifies the signature and consumes the challenge. A wallet identity is linked to that Veylora session only after verification.
5. The app checks the server-side wallet identity record when restoring a session. Editable Supabase user metadata is not used to authorize market actions.

If anonymous Supabase sign-ins are disabled, enable **Authentication → Sign In / Providers → Anonymous Sign-Ins** for the Veylora Supabase project, or sign in with an existing Veylora account and then connect Noir Wallet. The wallet signature is still required for live market actions.

To revoke access later, use Noir Wallet's connected-sites controls or Veylora's disconnect action. Never share your recovery phrase, private keys, or wallet password.

## Important beta gates

The wallet-authentication implementation is on the feature/zcash-wallet-connection review branch and is **not live in production**. Before using it, the database migration supabase/migrations/20261017_wallet_auth.sql must be applied together with the matching application release. Do not apply that migration alone to the live database: it adds wallet-verified requirements to new market and bid inserts.

The existing settlement verifier checks **transparent Zcash testnet outputs only** against the winning offer's recipient and amount, with three confirmations. It does not verify shielded payment details or recipient ownership. A submitted transaction is not proof of payment; do not mark a trade complete without the required independent confirmation.

Before a public launch, verify the migration and RLS policies against a staging database, run build and end-to-end tests for connect/sign/disconnect/account changes, confirm the configured node is testnet and synced, test concurrent awards, add durable rate limiting, and review privacy/security claims. Keep mainnet payments disabled in this beta.
