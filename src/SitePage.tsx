import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleHelp, FileText, LockKeyhole, Sparkles } from 'lucide-react'
import ThemeControl from './ThemeControl'

type Section = { heading: string; paragraphs?: string[]; bullets?: string[] }
type Page = { eyebrow: string; title: string; lead: string; sections: Section[] }
const pages: Record<string, Page> = {
  '/how-it-works': {
    eyebrow: 'THE VEYLORA METHOD',
    title: 'Clear terms.\nPrivate offers.\nA verifiable outcome.',
    lead: 'Veylora is an early-stage marketplace for requests for quotation (RFQs), sealed offers and explicit settlement status. Here is how the intended workflow works in the current beta.',
    sections: [
      { heading: '01 / Publish a request', paragraphs: ['A buyer describes what they need, the quantity, the relevant requirements and a closing time. Clear specifications make offers easier to compare.'] },
      { heading: '02 / Commit an offer', paragraphs: ['A supplier enters an offer amount and any relevant terms before the request closes. Current access rules restrict other bidders from reading offers, but the platform operator may still be able to access stored records. Demo offers remain in the browser and are not durable.'] },
      { heading: '03 / Close and award', paragraphs: ['For supported live RFQs, the owner can request a server-side close and award after the deadline. The current beta uses the lowest eligible offer, with the earliest committed offer as the tie-breaker. An award is a market decision, not proof that payment happened.'] },
      { heading: '04 / Verify settlement', paragraphs: ['The current integration is limited to transparent Zcash testnet outputs when a restricted testnet node is configured. The verifier checks the expected recipient, amount and confirmation threshold. It does not broadcast funds or verify shielded payment details. Testnet TAZ has no mainnet value.'] },
      { heading: '05 / Record completion', paragraphs: ['Completion is a separate status that follows a confirmed testnet payment check. Until the backend, access controls, concurrency protections and operational review are complete, do not use the beta for valuable trades.'] },
    ],
  },
  '/about': {
    eyebrow: 'WHY VEYLORA EXISTS',
    title: 'A more deliberate\nway to trade.',
    lead: 'Veylora Market is an early-stage product exploring how private offers and clearer settlement records can make business-to-business requests for quotation easier to understand.',
    sections: [
      { heading: 'Our point of view', paragraphs: ['Commercial decisions can involve sensitive pricing, supplier relationships and delivery details. A useful marketplace should make the rules legible without pretending that privacy or payment verification is absolute.'] },
      { heading: 'What we are building', bullets: ['Structured requests with clear quantities and deadlines.', 'Offer access rules that limit visibility between bidders.', 'Separate states for award, payment submission, network confirmation and completion.', 'A Network Lab for checking configured Zcash testnet infrastructure.'] },
      { heading: 'What we are not claiming', paragraphs: ['Veylora is not currently an operator-blind auction, a zero-knowledge bidding system, a payment processor or a production-ready settlement network. Shielded cryptocurrency does not automatically hide application records or metadata. Some market examples are simulated.'] },
      { heading: 'Built in the open', paragraphs: ['The project is in beta and evolves through implementation, testing and feedback. You can inspect the code or report a problem through the public repository.'], bullets: ['Source code and project notes are available on GitHub.', 'Please do not submit seed phrases, private keys or sensitive payment credentials in feedback.'] },
    ],
  },
  '/privacy': {
    eyebrow: 'LEGAL / DATA & PRIVACY',
    title: 'Privacy notice.',
    lead: 'This preliminary notice explains the categories of information the Veylora Market beta may process and the limits of its privacy model. It should be reviewed against the final deployment, provider settings and applicable law before a public commercial launch.',
    sections: [
      { heading: 'Information you provide', paragraphs: ['Depending on how you use the beta, this may include your account email, authentication-related records, RFQ titles and descriptions, quantities, deadlines, offer amounts, notes, settlement recipient addresses, transaction identifiers and feedback you submit. Do not enter information you are not comfortable storing in a beta service.'] },
      { heading: 'Information handled by providers', paragraphs: ['The service uses Supabase for authentication and database functions and Vercel for hosting and server functions. These providers may process technical information such as request metadata and security logs as part of operating their services. The exact retention and processing terms depend on the configuration and the providers’ current policies.'] },
      { heading: 'How information is used', bullets: ['To create accounts and authenticate users.', 'To display and operate requests, offers and status records.', 'To check submitted testnet settlement evidence when the verifier is configured.', 'To respond to feedback, diagnose faults and protect the service.'] },
      { heading: 'Who may access records', paragraphs: ['Application policies are intended to restrict offer visibility between bidders, but the platform operator may be able to access stored records. Do not treat a hidden offer in the interface as cryptographic confidentiality or operator-blind storage. Public blockchain transactions can also expose information depending on the transaction type and data shared.'] },
      { heading: 'Retention and security', paragraphs: ['Records may remain in the database and provider logs for as long as needed to operate, troubleshoot or secure the beta, subject to the configured retention controls. No online system can promise absolute security. The project still requires production-grade security review and documented retention/deletion procedures.'] },
      { heading: 'Your choices and contact', paragraphs: ['Do not submit unnecessary personal or confidential information. For a data-related request or privacy concern, contact the project through GitHub Issues without including secrets or sensitive records. The current beta does not provide a verified legal entity or dedicated privacy contact, so those details must be established before commercial launch.'] },
      { heading: 'Changes to this notice', paragraphs: ['This notice may change as the product and infrastructure evolve. A future production version should display the effective date, responsible legal entity, jurisdiction-specific rights and a direct privacy contact.'] },
    ],
  },
  '/terms': {
    eyebrow: 'LEGAL / SERVICE TERMS',
    title: 'Terms of use.',
    lead: 'These draft terms describe the limited early-access beta. They are a product notice, not a substitute for jurisdiction-specific legal review. By using the beta, you should understand and accept the limitations below.',
    sections: [
      { heading: '1. Beta service', paragraphs: ['Veylora Market is provided for evaluation and testing. Features may change, be unavailable or contain errors. The service is not represented as production-ready for valuable commercial transactions.'] },
      { heading: '2. Eligibility and account security', paragraphs: ['You are responsible for the accuracy of information you submit, protecting your account credentials and activity performed through your account. Do not share passwords, private keys or wallet seed phrases. The project may restrict access to protect the service.'] },
      { heading: '3. Requests and offers', paragraphs: ['You are responsible for the legality and accuracy of your requests, offer terms, delivery arrangements and business decisions. The current beta does not guarantee supplier performance, authenticity, product quality, delivery, dispute resolution or successful settlement. Demo activity is illustrative only.'] },
      { heading: '4. Awards and payments', paragraphs: ['A market award does not mean payment has been made. Settlement checks are currently limited to transparent Zcash testnet evidence when the required node is configured. Testnet TAZ is for testing only. The beta does not broadcast transactions, custody funds or verify shielded payment details. Never send mainnet funds in reliance on this interface.'] },
      { heading: '5. Acceptable use', bullets: ['Do not attempt to access another user’s account or restricted records.', 'Do not interfere with the service, probe systems without permission or submit malicious content.', 'Do not use the beta for unlawful activity, fraud or transactions that require guarantees the service does not provide.', 'Do not submit secrets, seed phrases, private keys or unnecessary personal data.'] },
      { heading: '6. Availability and liability', paragraphs: ['To the extent permitted by applicable law, the beta is provided “as is” and “as available”, without guarantees of uninterrupted operation, fitness for a particular purpose or error-free results. Nothing in these draft terms excludes liability that cannot lawfully be excluded. A final liability framework, governing law and dispute process must be established with legal counsel before production launch.'] },
      { heading: '7. Changes and contact', paragraphs: ['These draft terms may be updated as the product evolves. Continued use after a posted update may indicate acceptance where permitted by law. For questions, use the project’s GitHub Issues page; do not include credentials or confidential transaction data.'] },
    ],
  },
  '/risk-disclosures': {
    eyebrow: 'READ BEFORE PARTICIPATING',
    title: 'Risk disclosures.',
    lead: 'Veylora Market is experimental software. Understand these limitations before creating requests or submitting offers.',
    sections: [
      { heading: 'Beta and operational risk', paragraphs: ['The interface, APIs, database policies and network integrations may contain bugs or outages. Server-side controls, audit trails, rate limiting, atomic award operations and security review remain important release gates. Do not rely on this beta for valuable trades.'] },
      { heading: 'Privacy and confidentiality', paragraphs: ['Offer visibility rules are application-level controls, not proof of cryptographic secrecy. The operator may be able to access stored bid records, RFQ details and metadata. Avoid sharing commercially sensitive details unless you accept this risk.'] },
      { heading: 'Blockchain and testnet risk', paragraphs: ['Network state and transaction details can be misread or unavailable if the configured node is unhealthy or misconfigured. The verifier supports transparent testnet output checks only. It does not send transactions or verify shielded payment details. TAZ is testnet currency, not ZEC mainnet funds.'] },
      { heading: 'Commercial and counterparty risk', paragraphs: ['Veylora does not independently guarantee identities, counterparties, goods, delivery, quality, legal compliance or performance. Buyers and suppliers remain responsible for their due diligence and agreements.'] },
      { heading: 'No financial, legal or tax advice', paragraphs: ['Content on the site is informational and technical in nature. It is not financial, investment, legal, tax or procurement advice. Obtain independent professional advice where appropriate.'] },
    ],
  },
  '/faq': {
    eyebrow: 'HELP CENTRE',
    title: 'Frequently asked\nquestions.',
    lead: 'Straight answers about what the Veylora beta does today, and what it does not claim to do.',
    sections: [
      { heading: 'Are offers fully private?', paragraphs: ['Offers are restricted from other bidders under the current application access rules. The operator may still access stored records, so this is not operator-blind or cryptographic bid confidentiality.'] },
      { heading: 'Can I use real Zcash?', paragraphs: ['No. The current verifier is for transparent Zcash testnet transactions only, and only when the testnet node is correctly configured. TAZ is testnet currency. Do not send mainnet funds.'] },
      { heading: 'Does submitting a transaction ID send payment?', paragraphs: ['No. It only submits evidence for a check against the configured testnet node. The page does not broadcast transactions or control a wallet.'] },
      { heading: 'Are all market entries live?', paragraphs: ['No. Sample requests and transfer previews are labelled as demo or simulated. Database RFQs are shown when the configured database returns them. The transfer preview does not monitor a live chain.'] },
      { heading: 'Can I use Veylora for a valuable trade?', paragraphs: ['Not at this stage. The product is a beta and still needs security review, stronger operational controls, comprehensive testing and legal preparation before valuable commercial use.'] },
      { heading: 'How do I report a problem?', paragraphs: ['Use the Contact & Support page to open a GitHub issue or submit feedback from the main marketplace. Do not include passwords, seed phrases, private keys or confidential payment details.'] },
    ],
  },
  '/contact': {
    eyebrow: 'CONTACT & SUPPORT',
    title: 'Let’s make the beta better.',
    lead: 'For bug reports, product feedback and project questions, use the public project channels. Please keep credentials and sensitive business or payment information out of reports.',
    sections: [
      { heading: 'Report a bug', paragraphs: ['Include the page you were on, what you expected, what happened instead, and the approximate time. Remove personal details and secrets from screenshots or logs.'] },
      { heading: 'Product feedback', paragraphs: ['Tell us what you were trying to accomplish and what would make the workflow clearer. Feedback can also be sent from the marketplace interface.'] },
      { heading: 'Security concerns', paragraphs: ['Please do not publish exploitable details or secrets in a public issue. The project has not yet established a dedicated private security reporting address; avoid sharing sensitive data until an appropriate channel is available.'] },
    ],
  },
}
const nav = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/risk-disclosures', label: 'Risk' },
  { href: '/contact', label: 'Contact' },
]
export default function SitePage() {
  const path = window.location.pathname.replace(/\/$/, '') || '/how-it-works'
  const page = pages[path] ?? pages['/how-it-works']
  const legal = ['/privacy', '/terms', '/risk-disclosures'].includes(path)
  const titleLines = page.title.split('\n')
  return <div className="info-shell">
    <header className="info-header">
      <a className="brand" href="/"><span className="mark"><img src="/veylora-mark.svg" alt="Veylora Market logo" /></span><span><b>VEYLORA</b><small>PRIVATE MARKET</small></span></a>
      <a className="info-back" href="/"><ArrowLeft size={14}/> Back to market</a>
    </header>
    <main className="info-main">
      <div className="info-hero">
        <div className="eyebrow"><i/> {page.eyebrow}</div>
        <h1>{titleLines.map((line, i) => <span key={line}>{line}{i < titleLines.length - 1 && <br/>}</span>)}</h1>
        <p>{page.lead}</p>
        {legal && <div className="info-draft"><FileText size={15}/> Draft beta notice · Last reviewed 15 October 2026 · Obtain legal review before commercial launch.</div>}
      </div>
      <div className="info-layout">
        <aside className="info-sidebar"><span>ON THIS SITE</span>{nav.map(item => <a key={item.href} className={item.href === path ? 'current' : ''} href={item.href}>{item.label}<ArrowUpRight size={12}/></a>)}<a className="info-support" href="https://github.com/Lordprolific/veylora-market/issues" target="_blank" rel="noreferrer"><CircleHelp size={15}/> Open support issue</a></aside>
        <div className="info-content">{page.sections.map((section, i) => <section className="info-section" key={section.heading}><div className="info-section-index">{String(i + 1).padStart(2, '0')}</div><div><h2>{section.heading}</h2>{section.paragraphs?.map((paragraph, j) => <p key={j}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map(bullet => <li key={bullet}><CheckCircle2 size={14}/><span>{bullet}</span></li>)}</ul>}</div></section>)}
          <div className="info-endnote"><LockKeyhole size={17}/><p>Veylora aims to make the status of a transaction clear without overstating what has been verified. This beta is not for valuable trades.</p></div>
        </div>
      </div>
      <section className="info-cta"><div><span className="eyebrow muted"><Sparkles size={12}/> CONTINUE EXPLORING</span><h2>Know what the system<br/>can actually prove.</h2><p>Review the settlement model or return to the market.</p></div><div className="info-cta-actions"><a className="primary" href="/testnet.html">Open Network Lab <ArrowUpRight size={14}/></a><a className="quiet" href="/">Return to market</a></div></section>
    </main>
    <footer className="info-footer"><ThemeControl /><a className="brand" href="/"><span className="mark"><img src="/veylora-mark.svg" alt="Veylora Market logo" /></span><span><b>VEYLORA</b><small>PRIVATE MARKET</small></span></a><span>PRIVATE MARKET INFRASTRUCTURE · BETA</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></div></footer>
  </div>
}
