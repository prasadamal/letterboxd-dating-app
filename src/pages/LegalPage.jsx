import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import privacy from '../../docs/legal/PRIVACY_POLICY.md?raw'
import terms from '../../docs/legal/TERMS_OF_SERVICE.md?raw'
import { BrandMark } from '../components/BrandMark.jsx'
import { Markdown } from '../components/Markdown.jsx'
import { SiteFooter } from '../components/SiteFooter.jsx'

const DOCS = {
  privacy: { title: 'Privacy Policy', source: privacy },
  terms: { title: 'Terms of Service', source: terms }
}

// /privacy and /terms, from docs/legal so the store links and the repo never disagree.
export default function LegalPage({ doc }) {
  const { title, source } = DOCS[doc]
  useEffect(() => {
    document.title = `${title} · ReelMates`
  }, [title])
  return (
    <div className="site-page">
      <main className="site-column">
        <Link to="/" className="site-home">
          <BrandMark />
        </Link>
        <article className="panel legal">
          <Markdown source={source} />
        </article>
        <SiteFooter />
      </main>
    </div>
  )
}
