export type ZcashNetwork = 'testnet' | 'mainnet'

export type ZcashNetworkConfig = {
  network: ZcashNetwork
  displayName: string
  currency: 'TAZ' | 'ZEC'
  explorerBaseUrl: string | null
  configured: boolean
}

const cleanBaseUrl = (value?: string): string | null => {
  if (!value?.trim()) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

/** Public frontend configuration only. Never put RPC credentials or keys in VITE_* variables. */
export function getZcashNetworkConfig(env: Record<string, string | undefined> = import.meta.env): ZcashNetworkConfig {
  const network = 'testnet'
  const explorerBaseUrl = cleanBaseUrl(env.VITE_ZCASH_EXPLORER_BASE_URL)
  return { network, displayName: network === 'testnet' ? 'Zcash Testnet' : 'Zcash Mainnet', currency: network === 'testnet' ? 'TAZ' : 'ZEC', explorerBaseUrl, configured: Boolean(explorerBaseUrl) }
}

/** Format validation only. A well-formed txid is not proof that a transaction exists or is confirmed. */
export function isTransactionIdFormat(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value.trim())
}

/** Basic address-shape guard, not cryptographic or network validation. */
export function looksLikeZcashAddress(value: string): boolean {
  const address = value.trim()
  return /^(tm|t2)[a-km-zA-HJ-NP-Z1-9]{25,40}$/.test(address)
    || /^ztestsapling1[a-z0-9]{20,120}$/.test(address)
    || /^utest1[a-z0-9]{20,120}$/.test(address)
}

export function transactionExplorerUrl(config: ZcashNetworkConfig, txid: string): string | null {
  if (!config.explorerBaseUrl || !isTransactionIdFormat(txid)) return null
  return config.explorerBaseUrl + '/tx/' + encodeURIComponent(txid.trim())
}
