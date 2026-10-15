import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleAlert, ExternalLink, ShieldCheck, TestTube2, Wifi, RefreshCw } from 'lucide-react'
import { getZcashNetworkConfig, isTransactionIdFormat, looksLikeZcashAddress, transactionExplorerUrl } from './lib/zcash-testnet'
import './testnet.css'

type NetworkResult = { ok: boolean; network?: string; chain?: string; blocks?: number | null; headers?: number | null; synced?: boolean; error?: string; checkedAt?: string }
type TransactionResult = { ok: boolean; verified: boolean; network?: string; state?: string; txid?: string; confirmations?: number; requiredConfirmations?: number; recipientMatched?: boolean; amountMatched?: boolean; checkedAt?: string; error?: string; message?: string; note?: string }

export default function TestnetGuide() {
  const config = useMemo(() => getZcashNetworkConfig(), [])
  const [address, setAddress] = useState('')
  const [txid, setTxid] = useState('')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [network, setNetwork] = useState<NetworkResult | null>(null)
  const [checkingNetwork, setCheckingNetwork] = useState(false)
  const [transaction, setTransaction] = useState<TransactionResult | null>(null)
  const [checkingTransaction, setCheckingTransaction] = useState(false)
  const [minimumConfirmations, setMinimumConfirmations] = useState('1')
  const validTxid = isTransactionIdFormat(txid)
  const txUrl = transactionExplorerUrl(config, txid)
  const addressShapeLooksValid = looksLikeZcashAddress(address)

  const checkNetwork = async () => {
    setCheckingNetwork(true)
    try {
      const response = await fetch('/api/zcash/network', { headers: { accept: 'application/json' }, cache: 'no-store' })
      const result = await response.json() as NetworkResult
      setNetwork(result)
    } catch {
      setNetwork({ ok: false, network: 'testnet', error: 'Could not reach the Veylora testnet verification endpoint.' })
    } finally {
      setCheckingNetwork(false)
    }
  }

  useEffect(() => { void checkNetwork() }, [])

  const verifyTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validTxid || !recipient.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return
    setCheckingTransaction(true)
    setTransaction(null)
    try {
      const response = await fetch('/api/zcash/transaction', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ txid: txid.trim(), recipient: recipient.trim(), amount: Number(amount), minConfirmations: Number(minimumConfirmations) }),
      })
      const result = await response.json() as TransactionResult
      setTransaction(result)
    } catch {
      setTransaction({ ok: false, verified: false, error: 'Could not reach the Veylora testnet verification endpoint.' })
    } finally {
      setCheckingTransaction(false)
    }
  }

  return <main className="testnet-shell">
    <header className="testnet-header"><a href="/" className="back-link"><ArrowLeft size={15}/> Veylora Market</a><span className="testnet-mark"><ShieldCheck size={16}/> NETWORK LAB</span></header>
    <section className="testnet-hero"><div className="testnet-eyebrow"><TestTube2 size={14}/> DEVELOPMENT ENVIRONMENT</div><h1>Test the network.<br/><em>Trust the evidence.</em></h1><p>A testnet-only workspace for checking node availability and verifying transparent payment outputs. It never requests wallet keys or broadcasts a payment. Shielded payment details require a separate wallet-aware verification flow.</p>
      <div className="network-status"><span className={'status-dot'+(network?.ok?' connected':'')}/><div><b>{network?.ok?'Zcash Testnet connected':network?.error?'Verifier not configured':'Checking testnet node…'}</b><small>{network?.ok?'Block '+(network.blocks ?? 'unknown')+' · '+(network.synced?'node reports synced':'sync status not confirmed'):network?.error||'Checking the server-side node configuration'}</small></div><span className="network-token">TAZ</span><button className="network-refresh" onClick={()=>void checkNetwork()} disabled={checkingNetwork} aria-label="Refresh network status"><RefreshCw size={14}/></button></div>
      {network?.checkedAt&&<div className="network-checked">Last checked {new Date(network.checkedAt).toLocaleString()}</div>}
    </section>
    <section className="testnet-grid">
      <article className="testnet-card"><div className="card-index">01 / ADDRESS CHECK</div><h2>Check an address shape</h2><p>Paste a public address to run a basic format check. This is not a network lookup and cannot prove the address is valid or belongs to a user.</p><label htmlFor="zcash-address">Zcash address</label><input id="zcash-address" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Paste a public testnet address" autoComplete="off" spellCheck={false}/>{address.trim() && <div className={addressShapeLooksValid ? 'inline-result good' : 'inline-result caution'}>{addressShapeLooksValid ? <CheckCircle2 size={15}/> : <CircleAlert size={15}/>} {addressShapeLooksValid ? 'Address resembles a supported Zcash address format. Network verification is still required.' : 'Format not recognised. Confirm the network and address type.'}</div>}<div className="card-footnote">Never paste a seed phrase, private key or viewing key here.</div></article>
      <article className="testnet-card"><div className="card-index">02 / TRANSACTION VERIFICATION</div><h2>Verify a transparent payment</h2><p>Checks the txid against the configured testnet node and compares an expected transparent recipient, amount and confirmation threshold. This does not verify shielded outputs.</p>
        <form className="verification-form" onSubmit={verifyTransaction}>
          <label htmlFor="zcash-txid">Transaction ID</label><input id="zcash-txid" value={txid} onChange={e=>{setTxid(e.target.value);setTransaction(null)}} placeholder="64-character transaction ID" autoComplete="off" spellCheck={false} maxLength={128} required/>
          {txid.trim() && <div className={validTxid ? 'inline-result good' : 'inline-result caution'}>{validTxid ? <CheckCircle2 size={15}/> : <CircleAlert size={15}/>} {validTxid ? 'ID format is valid. Node verification is still required.' : 'Transaction IDs must contain 64 hexadecimal characters.'}</div>}
          <label htmlFor="zcash-recipient">Expected transparent recipient</label><input id="zcash-recipient" value={recipient} onChange={e=>{setRecipient(e.target.value);setTransaction(null)}} placeholder="Public testnet address" autoComplete="off" spellCheck={false} required/>
          <label htmlFor="zcash-amount">Expected amount (TAZ)</label><input id="zcash-amount" type="number" min="0.00000001" step="0.00000001" value={amount} onChange={e=>{setAmount(e.target.value);setTransaction(null)}} placeholder="0.00000000" required/>
          <label htmlFor="zcash-confirmations">Required confirmations</label><select id="zcash-confirmations" value={minimumConfirmations} onChange={e=>setMinimumConfirmations(e.target.value)}><option value="1">1 confirmation · test only</option><option value="3">3 confirmations</option><option value="6">6 confirmations</option></select>
          <button className="testnet-button" type="submit" disabled={!validTxid||!recipient.trim()||!amount||Number(amount)<=0||checkingTransaction}>{checkingTransaction?'Checking node…':'Verify on testnet'} <Wifi size={14}/></button>
        </form>
        {transaction&&<div className={'verification-result '+(transaction.verified?'good':'caution')} role="status"><b>{transaction.verified?'Payment conditions matched':transaction.state==='pending'||transaction.state==='confirming'?'Transaction found · pending confirmation':'Not verified'}</b><p>{transaction.message||transaction.error||'No verification result returned.'}</p>{transaction.confirmations!==undefined&&<p>Confirmations: {transaction.confirmations} / {transaction.requiredConfirmations??Number(minimumConfirmations)}</p>}{transaction.txid&&<p className="txid-result">TXID: {transaction.txid}</p>}{transaction.note&&<p>{transaction.note}</p>}</div>}
        {txUrl ? <a className="testnet-button secondary" href={txUrl} target="_blank" rel="noreferrer">Open configured explorer <ExternalLink size={14}/></a> : <button className="testnet-button disabled" disabled>{config.configured ? 'Enter a valid transaction ID' : 'Optional explorer URL not configured'}</button>}
        <div className="card-footnote">A matching transparent output is not proof of shielded payment details, recipient ownership, or a complete trade.</div>
      </article>
    </section>
    <section className="integration-checklist"><div className="card-index">03 / SETTLEMENT STATES</div><h2>Evidence before completion</h2><div className="gate-list">{[['Awarded','A market decision has been recorded by trusted server logic.'],['Submitted','A txid has been supplied; payment is not yet proven.'],['Confirmed','The configured testnet node confirms the expected transparent output and depth.'],['Completed','The trusted settlement workflow records completion idempotently.']].map(([title,desc],i)=><div className="gate-row" key={title}><span>{String(i+1).padStart(2,'0')}</span><div><b>{title}</b><p>{desc}</p></div><span className="gate-state">{i===2?'NODE-VERIFIED WHEN CONFIGURED':'BACKEND GATE'}</span></div>)}</div></section>
    <section className="integration-checklist"><div className="card-index">04 / BETA SAFETY</div><h2>Keep the boundaries explicit</h2><div className="gate-list">{[['Testnet only','The server refuses to verify unless the node reports chain = test.'],['No key custody','Never enter a seed phrase, private key or viewing key.'],['Transparent outputs only','Shielded payment conditions need a wallet-aware verification design.'],['Backend completion gate','A UI result must not itself award a market or mark a trade complete.']].map(([title,desc],i)=><div className="gate-row" key={title}><span>{String(i+1).padStart(2,'0')}</span><div><b>{title}</b><p>{desc}</p></div><span className="gate-state">ENFORCED / DOCUMENTED</span></div>)}</div></section>
    <footer className="testnet-footer"><span>VEYLORA / NETWORK LAB</span><span>NO FUNDS MOVED BY THIS PAGE</span><a href="https://zcash.readthedocs.io/en/latest/rtd_pages/dev_tools.html" target="_blank" rel="noreferrer">Official Zcash developer tools <ArrowUpRight size={13}/></a></footer>
  </main>
}
