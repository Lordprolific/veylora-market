import { useEffect, useMemo, useState } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Activity, ArrowDownLeft, ArrowUpRight, BriefcaseBusiness, ChevronRight, CircleDollarSign, Clock3, FileText, LayoutDashboard, LockKeyhole, RefreshCw, Search, ShieldCheck, Wallet, Zap } from 'lucide-react'
import './dashboard.css'

type MarketRow = { id:string; title:string; quantity:string; status:string; closes_at:string; created_at:string; owner_id:string; is_demo:boolean; category:string }
type BidRow = { id:string; market_id:string; amount:number; created_at:string; bidder_id:string }
type Section = 'Overview'|'My Requests'|'My Offers'|'Positions'|'Funds & Settlement'|'Activity'
const nav: {name:Section; icon:typeof LayoutDashboard}[] = [
 {name:'Overview',icon:LayoutDashboard},{name:'My Requests',icon:FileText},{name:'My Offers',icon:ArrowUpRight},{name:'Positions',icon:BriefcaseBusiness},{name:'Funds & Settlement',icon:Wallet},{name:'Activity',icon:Activity}
]
const dateLabel=(value?:string)=>value?new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—'
export default function Dashboard(){
 const [db,setDb]=useState<SupabaseClient|null>(null),[section,setSection]=useState<Section>('Overview'),[markets,setMarkets]=useState<MarketRow[]>([]),[bids,setBids]=useState<BidRow[]>([]),[userId,setUserId]=useState<string|null>(null),[identity,setIdentity]=useState(''),[verified,setVerified]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState('')
 const load=async(client:SupabaseClient)=>{
  setLoading(true);setError('')
  try{
   const sessionResult=await client.auth.getSession()
   const session=sessionResult.data.session
   if(!session?.access_token){setUserId(null);setIdentity('');setVerified(false);setMarkets([]);setBids([]);return}
   const userResult=await client.auth.getUser()
   if(userResult.error)throw userResult.error
   const user=userResult.data.user
   if(!user){setUserId(null);return}
   setUserId(user.id)
   const statusResponse=await fetch('/api/auth/wallet/status',{headers:{authorization:'Bearer '+session.access_token,accept:'application/json'},cache:'no-store'})
   const status=await statusResponse.json() as {ok?:boolean;verified?:boolean;identity?:{identity_address:string;network:string}|null}
   const isVerified=!!(status.ok&&status.verified&&status.identity?.network==='testnet')
   setVerified(isVerified);setIdentity(isVerified&&status.identity?status.identity.identity_address:'')
   const [owned,submitted]=await Promise.all([
    client.from('markets').select('id,title,quantity,status,closes_at,created_at,owner_id,is_demo,category').eq('owner_id',user.id).order('created_at',{ascending:false}).limit(100),
    client.from('bids').select('id,market_id,amount,created_at,bidder_id').eq('bidder_id',user.id).order('created_at',{ascending:false}).limit(100)
   ])
   if(owned.error)throw owned.error
   if(submitted.error)throw submitted.error
   setMarkets((owned.data??[]) as MarketRow[]);setBids((submitted.data??[]) as BidRow[])
  }catch(e){setError(e instanceof Error?e.message:'Unable to load account data.');}
  finally{setLoading(false)}
 }
 useEffect(()=>{const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;if(!url||!key){setError('Account services are not configured.');setLoading(false);return}const client=createClient(url,key);setDb(client);void load(client);const {data}=client.auth.onAuthStateChange(()=>{void load(client)});return()=>data.subscription.unsubscribe()},[])
 const filteredMarkets=useMemo(()=>markets.filter(m=>(m.title+' '+m.quantity+' '+m.status).toLowerCase().includes(query.toLowerCase())),[markets,query])
 const filteredBids=useMemo(()=>bids.filter(b=>{const m=markets.find(x=>x.id===b.market_id);return (m?.title||'Request').toLowerCase().includes(query.toLowerCase())}),[bids,markets,query])
 const awarded=markets.filter(m=>['awarded','settlement_submitted','settlement_confirmed','completed'].includes(m.status))
 const open=markets.filter(m=>m.status==='open'&&new Date(m.closes_at).getTime()>Date.now())
 const displayName=identity?'Wallet '+identity.slice(0,7)+'…'+identity.slice(-5):'Your workspace'
 return <div className="vy-dashboard">
  <aside className="vy-dash-sidebar">
   <a className="vy-dash-brand" href="/" aria-label="Veylora home"><img src="/veylora-mark.svg" alt=""/><span><b>VEYLORA</b><small>MARKET WORKSPACE</small></span></a>
   <div className="vy-dash-label">WORKSPACE</div>
   <nav>{nav.map(item=>{const Icon=item.icon;return <button key={item.name} className={section===item.name?'active':''} onClick={()=>setSection(item.name)}><Icon size={16}/><span>{item.name}</span>{section===item.name&&<i/>}</button>})}</nav>
   <div className="vy-dash-side-bottom"><div className="vy-dash-network"><span/><div><b>TESTNET ENVIRONMENT</b><small>Zcash · Testnet only</small></div></div><a href="/marketplace"><Search size={15}/> Explore markets <ChevronRight size={14}/></a><a href="/"><ArrowDownLeft size={15}/> Back to homepage</a></div>
  </aside>
  <main className="vy-dash-main">
   <header className="vy-dash-top"><div className="vy-dash-breadcrumb"><span>Veylora</span><ChevronRight size={13}/><b>{section}</b></div><div className="vy-dash-top-actions"><span className={'vy-dash-wallet-state '+(verified?'is-verified':'') }><i/>{verified?'Wallet verified':'Wallet not verified'}</span><a href="/marketplace" className="vy-dash-explore">Explore markets <ArrowUpRight size={14}/></a></div></header>
   <section className="vy-dash-content">
    <div className="vy-dash-heading"><div><div className="vy-dash-eyebrow"><span/> PERSONAL MARKET WORKSPACE</div><h1>{section==='Overview'?'Your market, at a glance':section}</h1><p>{section==='Overview'?'Requests, offers and market outcomes in one considered workspace.':section==='Funds & Settlement'?'Review wallet verification and settlement status without confusing testnet data with real funds.':section==='Positions'?'Track awarded requests and their settlement progress.':section==='My Requests'?'Manage the requests you have published to the marketplace.':section==='My Offers'?'Review offers submitted from this account.':'A clear timeline of your requests and offers.'}</p></div><button className="vy-dash-refresh" onClick={()=>db&&void load(db)} disabled={loading}><RefreshCw size={14} className={loading?'vy-spin':''}/> Refresh</button></div>
    {!userId?<div className="vy-dash-connect"><div className="vy-dash-connect-orb"><LockKeyhole size={24}/></div><div className="vy-dash-eyebrow">ACCOUNT ACCESS</div><h2>Connect to your workspace</h2><p>Your requests, offers and positions are tied to your verified Veylora account. Open the marketplace to connect and verify your Veylora Wallet, then return here.</p><a className="vy-dash-primary" href="/marketplace">Open marketplace <ArrowUpRight size={15}/></a><small>Guest visitors can explore sample markets, but account data is not shown without a session.</small></div>:<>
     <div className="vy-dash-welcome"><div><span>WELCOME BACK</span><h2>{displayName}</h2><p>{verified?'Your testnet wallet identity is verified for this session.':'Connect and verify your wallet in the marketplace to unlock supported account actions.'}</p></div><div className="vy-dash-welcome-mark"><img src="/veylora-mark.svg" alt=""/></div><div className="vy-dash-welcome-glow"/></div>
     {error&&<div className="vy-dash-error"><ShieldCheck size={16}/>{error}</div>}
     <div className="vy-dash-stats">
      <article><div className="vy-dash-stat-icon"><FileText size={17}/></div><span>YOUR REQUESTS</span><strong>{loading?'—':markets.length}</strong><small>{open.length} open and accepting offers</small></article>
      <article><div className="vy-dash-stat-icon"><ArrowUpRight size={17}/></div><span>YOUR OFFERS</span><strong>{loading?'—':bids.length}</strong><small>Submitted from this account</small></article>
      <article><div className="vy-dash-stat-icon"><BriefcaseBusiness size={17}/></div><span>AWARDED POSITIONS</span><strong>{loading?'—':awarded.length}</strong><small>Settlement tracked separately</small></article>
      <article><div className="vy-dash-stat-icon"><CircleDollarSign size={17}/></div><span>VERIFIED FUNDS</span><strong>—</strong><small>Balance source not yet connected</small></article>
     </div>
     <div className="vy-dash-section-head"><div><h2>{section==='Overview'?'Your latest activity':section==='My Requests'?'Requests you created':section==='My Offers'?'Offers you submitted':section==='Positions'?'Awarded positions':section==='Funds & Settlement'?'Funds & settlement':'Account activity'}</h2><p>{section==='Overview'?'Your own database records, not sample activity.':'Showing records available to this signed-in account.'}</p></div><div className="vy-dash-search"><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your records"/></div></div>
     {section==='Funds & Settlement'?<div className="vy-dash-funds"><div className="vy-dash-fund-card"><Wallet size={20}/><div><b>Wallet identity</b><p>{verified?'Verified testnet identity':'Not verified'}</p><small>{verified?identity:'Connect and verify in Explore Markets.'}</small></div><span className={verified?'good':''}>{verified?'VERIFIED':'ACTION NEEDED'}</span></div><div className="vy-dash-fund-card"><ShieldCheck size={20}/><div><b>Settlement evidence</b><p>Tracked per awarded request</p><small>Only supported transparent Zcash testnet outputs can currently be verified.</small></div><span>TESTNET</span></div><div className="vy-dash-fund-note"><LockKeyhole size={16}/><p><b>No invented balance.</b> A verified wallet identity does not prove a spendable balance or funds committed to a deal. A reliable balance source must be configured before we can show a number here.</p></div></div>
     :section==='My Offers'?<Records empty="No offers found for this account yet." loading={loading} rows={filteredBids.map(b=>({id:b.id,title:markets.find(m=>m.id===b.market_id)?.title||'Request',meta:'Submitted '+dateLabel(b.created_at),status:'Offer submitted',amount:Number(b.amount).toLocaleString(undefined,{maximumFractionDigits:8})+' TAZ'}))}/>
     :section==='Positions'?<Records empty="No awarded positions are linked to your requests yet." loading={loading} rows={awarded.filter(m=>(m.title+' '+m.status).toLowerCase().includes(query.toLowerCase())).map(m=>({id:m.id,title:m.title,meta:'Updated from request record · '+dateLabel(m.created_at),status:m.status.replaceAll('_',' '),amount:m.quantity}))}/>
     :section==='My Requests'?<Records empty="You have not published any requests yet." loading={loading} rows={filteredMarkets.map(m=>({id:m.id,title:m.title,meta:m.category+' · closes '+dateLabel(m.closes_at),status:m.status,amount:m.quantity}))}/>
     :<Records empty={section==='Activity'?'No account activity is available yet.':'Your requests and offers will appear here as you use Veylora.'} loading={loading} rows={[...filteredMarkets.map(m=>({id:'m-'+m.id,title:m.title,meta:'Request · '+dateLabel(m.created_at),status:m.status,amount:m.quantity})),...filteredBids.map(b=>({id:'b-'+b.id,title:markets.find(m=>m.id===b.market_id)?.title||'Offer submitted',meta:'Offer · '+dateLabel(b.created_at),status:'Submitted',amount:Number(b.amount).toLocaleString(undefined,{maximumFractionDigits:8})+' TAZ'}))].sort((a,b)=>b.meta.localeCompare(a.meta)).slice(0,8)}/>}
     <div className="vy-dash-footer-note"><Zap size={14}/><span>Veylora keeps market outcomes, submitted payments, network confirmation and trade completion as separate states.</span><a href="/how-it-works">How it works <ArrowUpRight size={12}/></a></div>
    </>}
   </section>
  </main>
 </div>
}
function Records({rows,loading,empty}:{rows:{id:string;title:string;meta:string;status:string;amount:string}[];loading:boolean;empty:string}){
 if(loading)return <div className="vy-dash-records"><div className="vy-dash-skeleton"/><div className="vy-dash-skeleton"/><div className="vy-dash-skeleton"/></div>
 if(!rows.length)return <div className="vy-dash-empty"><div><FileText size={20}/></div><b>{empty}</b><p>When you take an action in the marketplace, your account records will appear here.</p><a href="/marketplace">Explore markets <ArrowUpRight size={13}/></a></div>
 return <div className="vy-dash-records">{rows.map(r=><article key={r.id}><div className="vy-dash-record-icon"><FileText size={16}/></div><div className="vy-dash-record-main"><b>{r.title}</b><small>{r.meta}</small></div><span className="vy-dash-record-status">{r.status}</span><strong>{r.amount}</strong><a href="/marketplace" aria-label={'Open marketplace for '+r.title}><ArrowUpRight size={15}/></a></article>)}</div>
}
