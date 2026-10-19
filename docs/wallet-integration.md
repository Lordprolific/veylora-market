# Veylora Wallet integration status

## Intended user experience

Veylora Market should guide users toward the **Veylora Zcash Wallet** as its own wallet companion. Users should not be told to install Noir Wallet to use Veylora-branded functionality.

## Verified repository state

At the time of this change:

- The Market app has no wallet-provider integration and does not send or verify Zcash transactions.
- The Veylora Wallet repository has a standalone Manifest V3 extension. Its manifest registers a background service worker, but the inspected manifest does not register a content script or declare a website-to-extension connection contract.
- The extension background script currently opens the wallet page when the toolbar icon is clicked; it does not implement a dApp request/approval protocol.
- The separate `demo/` app imports `@noir-wallet/sdk` and calls the Noir provider API. It is a compatibility/developer lab, not proof that the standalone Veylora extension can connect to Market.
- Therefore, changing copy alone cannot make the Veylora Wallet connect. The missing part is a real, reviewed dApp bridge.

## Required implementation before calling it connected

1. Define a versioned, typed dApp API shared by the extension and Market.
2. Expose only the required origins and message types. Validate origin, source, payload shape, request IDs and timeouts. Do not accept arbitrary page messages as authorization.
3. Add an explicit connection approval screen in the wallet. Share only the minimum account data after the user approves, and support disconnect/revocation and account changes.
4. Keep transaction construction and signing inside the wallet. Market must show recipient, amount, network and memo details, then wait for explicit wallet approval. Never request a seed phrase, recovery phrase, private key or wallet password from the website.
5. Return a transaction ID only after the wallet reports submission. Verify confirmation independently against a trusted testnet source; a returned ID alone is not confirmation.
6. Add tests for unknown origins, malformed requests, duplicate request IDs, locked wallet, rejected approval, disconnect, account changes, send failures and ambiguous submission errors.
7. Verify the built extension in real Chrome and run an end-to-end test on Zcash testnet before describing the integration as available.

## Current user-facing wording

Use: “Veylora Wallet integration is in development. The current Market beta does not connect to a wallet or submit Zcash transactions yet.”

Do not use: “Connected,” “payment sent,” “settled,” or “confirmed” unless the corresponding state has actually been observed and verified.

## Safety boundary

This is experimental testnet software, not audited and not suitable for real funds. Do not ship a bridge that merely renames the Noir provider or forwards untrusted page messages to wallet actions. A Veylora-branded connection must be backed by the actual Veylora extension and explicit user approval.
