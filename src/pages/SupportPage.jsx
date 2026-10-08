import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark.jsx'
import { SiteFooter } from '../components/SiteFooter.jsx'
import { SUPPORT_EMAIL } from '../lib/site.js'

const FAQ = [
  ['How do the daily films work?', 'Everyone gets the same 10 films each day. Swipe right if you loved it, left if you didn’t, up if you haven’t seen it. Then see how everyone else voted.'],
  ['When does dating open in my city?', 'Dating is optional and opens city by city once enough women and men there switch it on. The Cities page shows how close each one is.'],
  ['How do I report or block someone?', 'On their dating card, or from the menu in your chat, choose Report or Block. We review reports within 24 hours.'],
  ['How do I delete my account?', 'In the app: You → Settings → Delete account. Or use the Delete account page on this website.'],
  ['How do I cancel Plus?', 'Plus is billed by Apple or Google. Cancel it in your App Store or Google Play subscriptions.']
]

export default function SupportPage() {
  useEffect(() => {
    document.title = 'Support · ReelMates'
  }, [])
  return (
    <div className="site-page">
      <main className="site-column">
        <Link to="/" className="site-home">
          <BrandMark />
        </Link>
        <section className="panel">
          <h1 className="panel-title">Support</h1>
          <p className="muted-text">
            Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We usually reply within two days. For anything about your
            account, write from the email you signed up with.
          </p>
        </section>
        {FAQ.map(([q, a]) => (
          <section key={q} className="panel faq">
            <h2>{q}</h2>
            <p className="muted-text">{a}</p>
          </section>
        ))}
        <SiteFooter />
      </main>
    </div>
  )
}
