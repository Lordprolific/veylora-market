# Veylora Wallet integration

Veylora Market's intended wallet companion is the **Veylora Zcash Wallet**, maintained in [Lordprolific/veylora-testnet-wallet](https://github.com/Lordprolific/veylora-testnet-wallet). Its developer lab is [veylora-zcash-dapp-lab.vercel.app](https://veylora-zcash-dapp-lab.vercel.app).

## Current connectivity status

The Market's current wallet sign-in code imports `@noir-wallet/sdk` and calls its injected provider. The standalone Veylora Wallet extension currently opens its own wallet page; its manifest/background do not expose a website-facing provider or a dApp approval protocol. The separate Veylora developer lab also imports the Noir SDK. Therefore, changing a label or URL alone will not connect the native extension to Market.

**Native Veylora Wallet connection is not yet complete.** Do not represent the wallet as connected until the extension and Market communicate through a real, tested bridge.

## Required bridge

1. Add a versioned dApp protocol shared by the extension and Market, with strict request IDs, origin validation, payload validation and timeouts.
2. Provide explicit connection approval in the Veylora Wallet extension. Support revoke/disconnect and account-change events.
3. Keep account secrets and signing inside the wallet. Never ask the website for a seed phrase, recovery phrase, private key or wallet password.
4. For sends, show network, recipient, amount and memo in the wallet and require explicit wallet approval. A site-originated message must never silently authorize a transaction.
5. Return submission evidence only when the wallet actually reports submission. Confirmations must be checked independently against trusted Zcash testnet infrastructure; a transaction ID alone is not confirmation.
6. Test rejection, locked wallet, unsupported origin, malformed requests, duplicate requests, account changes, disconnect, failed sends and ambiguous submission outcomes.
7. Verify the packaged extension in Chrome and complete an end-to-end test on Zcash testnet before enabling the Market's native connect flow.

## ZcashVerify / network verification references

Use Veylora's own [Market Network Lab](/testnet.html) and [wallet repository](https://github.com/Lordprolific/veylora-testnet-wallet) as the project's integration references. The Market verifier currently checks configured transparent Zcash testnet outputs only; it does not broadcast transactions or verify shielded payment details. Keep mainnet disabled.

## Safety

The wallet and Market are experimental testnet software, not audited and not suitable for real funds. Do not ship a bridge that merely renames the Noir provider or forwards untrusted page messages directly to wallet actions.
