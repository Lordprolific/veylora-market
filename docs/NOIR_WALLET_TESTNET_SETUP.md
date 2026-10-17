# Noir Wallet setup for Veylora Market beta

Veylora is a web application. Testers do **not** need to install the Noir Wallet SDK or run developer commands. The SDK is a dependency bundled into the Veylora website; testers install a compatible Noir Wallet browser extension and approve the connection when prompted.

## Choose the correct wallet build

Noir Wallet publishes separate extensions for Zcash mainnet and testnet. They use different extension IDs and separate wallet data. The app cannot switch an installed extension between networks.

- **Veylora beta / test ZEC:** install the official **[Testnet] Noir Wallet** build from the [Noir Wallet SDK releases](https://github.com/NoirWallet/noir-wallet-sdk/releases). Choose the official release asset whose filename ends in `-testnet.zip`, unzip it, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the extracted extension directory. Only use releases published by the official NoirWallet GitHub repository.
- **Zcash mainnet / real ZEC:** [Noir Wallet on the Chrome Web Store](https://chromewebstore.google.com/detail/noir-wallet/mfoghjbpfanobmnoemoepenjjcmfpmdn). This is the mainnet extension and is not the correct wallet build for Veylora's testnet beta.

Do not send real ZEC to testnet addresses. Do not enter a recovery phrase, private key, or wallet password into Veylora. The website must never request those secrets.

## Connect

1. Open Veylora Market in Chrome with the compatible Noir Wallet extension installed and unlocked.
2. Select **Connect Zcash** and review the origin/account approval in Noir Wallet.
3. If the wallet is not detected, confirm the correct build is installed and refresh Veylora.
4. To revoke access later, use the wallet's connected-sites controls or Veylora's disconnect action.

## Current beta boundaries

Wallet connection currently exposes the authorized transparent and shielded addresses to the page. **Wallet connection is not, by itself, Veylora account authentication**, and the existing marketplace actions still use Supabase email/password authentication. Do not treat the connected address as a verified bidder identity until wallet-signature authentication is implemented and tested.

The existing settlement verifier checks **transparent Zcash testnet outputs only** against the winning offer's recipient and amount, with three confirmations. It does not verify shielded payment details or recipient ownership. A submitted transaction is not proof of payment; do not mark a trade complete without the required independent confirmation.

Before a public launch, test connect/disconnect and account changes, ensure the configured node is testnet and synced, run database/RLS and concurrent-award tests, add durable rate limiting, and review privacy/security claims. Keep mainnet payments disabled in this beta.
