# Veylora Wallet integration

Veylora Market's intended wallet companion is the **Veylora Zcash Wallet**, maintained in [Lordprolific/veylora-testnet-wallet](https://github.com/Lordprolific/veylora-testnet-wallet). Its developer lab is [veylora-zcash-dapp-lab.vercel.app](https://veylora-zcash-dapp-lab.vercel.app).

## Current connectivity status

The Market's current wallet sign-in code imports `@noir-wallet/sdk` and calls its injected provider. The standalone Veylora Wallet 0.3.3 toolbar popup launches the full wallet in its own extension tab so WebZjs can initialize in the intended extension-page context. The manifest includes COOP/COEP policies and packaged bridge files, but those facts alone do not prove the bridge is functioning end to end. The separate Veylora developer lab also imports the Noir SDK. Therefore, changing a label or URL alone will not connect the native extension to Market.

**Native Veylora Wallet connection remains unverified end to end.** The launcher/isolation update is not a completed Market integration. Do not represent the wallet as connected until the extension and Market communicate through a real, tested bridge.

## Required bridge

1. Add a versioned dApp protocol shared by the extension and Market, with strict request IDs, origin validation, payload validation and timeouts.
2. Provide explicit connection approval in the Veylora Wallet extension. Support revoke/disconnect and account-change events.
3. Keep account secrets and signing inside the wallet. Never ask the website for a seed phrase, recovery phrase, private key or wallet password.
4. For sends, show network, recipient, amount and memo in the wallet and require explicit wallet approval. A site-originated message must never silently authorize a transaction.
5. Return submission evidence only when the wallet actually reports submission. Confirmations must be checked independently against trusted Zcash testnet infrastructure; a transaction ID alone is not confirmation.
6. Test rejection, locked wallet, unsupported origin, malformed requests, duplicate requests, account changes, disconnect, failed sends and ambiguous submission outcomes.
7. Verify `crossOriginIsolated === true` in the full extension tab, then test provider injection and connection approval on the live Market in Chrome. Complete the remaining end-to-end Zcash testnet checks before enabling or claiming the native connect flow.

## Current extension build

- [Veylora Wallet 0.3.3 release](https://github.com/Lordprolific/veylora-testnet-wallet/releases/tag/wallet-isolated-2026-10-27)
- [Official download instructions](https://github.com/Lordprolific/veylora-testnet-wallet/blob/main/DOWNLOAD.md)
- [Market wallet download page](/wallet-download.html)

## ZcashVerify / network verification references

Use Veylora's own [Market Network Lab](/testnet.html) and [wallet repository](https://github.com/Lordprolific/veylora-testnet-wallet) as the project's integration references. The Market verifier currently checks configured transparent Zcash testnet outputs only; it does not broadcast transactions or verify shielded payment details. Keep mainnet disabled.

## Safety

The wallet and Market are experimental testnet software, not audited and not suitable for real funds. Do not ship a bridge that merely renames the Noir provider or forwards untrusted page messages directly to wallet actions.
