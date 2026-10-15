# Veylora Market beta quality checklist

This checklist deliberately separates frontend readiness from backend and chain readiness.

## Frontend / client
- [ ] npm run build succeeds from a clean install.
- [ ] Main landing page and /testnet.html load directly on Vercel.
- [ ] Mobile layout checked at 320px, 375px, tablet and desktop widths.
- [ ] Keyboard navigation, visible focus, labels and reduced-motion behaviour checked.
- [ ] All sample market and activity data is visibly labelled as demo/simulated.
- [ ] Invalid form, loading, empty, expired and provider-error states are understandable.
- [ ] No seed phrase, private key or service credential is ever requested or logged.
- [ ] Explorer links are disabled until a documented explorer base URL is configured.

## Backend owner / integration gate
- [ ] Supabase Auth sessions and email confirmation verified.
- [ ] RLS and participant/operator access assumptions reviewed.
- [ ] Trusted bid validation, market close, winner selection and settlement transitions implemented server-side.
- [ ] Rate limits, duplicate submission protection, concurrency and audit trail implemented.
- [ ] Server-only credentials are not exposed in Vite build output.

## Zcash testnet gate
- [ ] Wallet strategy and supported transparent/shielded flow documented.
- [ ] Network identity is independently checked as testnet.
- [ ] Test funds sourced through an official/community-supported testnet process.
- [ ] Transaction submission tested with a wallet; no app-held seed phrase.
- [ ] Confirmation verification checks expected payment conditions, not only txid existence.
- [ ] Wrong-network, nonexistent txid, pending, failed, duplicate and reorg scenarios tested.
- [ ] Transaction/provider logs do not expose sensitive user or shielded payment metadata.

## Release gate
- [ ] Unit, integration and end-to-end tests pass.
- [ ] Security review and privacy threat model completed.
- [ ] Monitoring, backups and incident response documented.
- [ ] Mainnet stays disabled until testnet acceptance and explicit release review.
