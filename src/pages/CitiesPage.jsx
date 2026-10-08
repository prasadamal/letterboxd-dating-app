import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark.jsx'
import { SiteFooter } from '../components/SiteFooter.jsx'

// "Unlock your city": dating opens in a city once enough women and men there switch it on.
export default function CitiesPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Unlock dating in your city · ReelMates'
    fetch('/api/v1/platform/status')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Could not load cities'))))
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  const target = data?.cityTarget ?? 150
  return (
    <div className="site-page">
      <main className="site-column">
        <Link to="/" className="site-home">
          <BrandMark />
        </Link>
        <section className="cta-card">
          <h1 className="cities-title">Unlock dating in your city</h1>
          <p>
            ReelMates is a film app first. Dating is optional and opens in a city once {target} {target === 1 ? 'woman' : 'women'} and {target} {target === 1 ? 'man' : 'men'} there switch it on, so
            the first deck is full of people with your taste. Invite your film friends to get yours there sooner.
          </p>
          <Link className="dark-button" to="/">
            Join ReelMates
          </Link>
        </section>
        {error && <p className="error-text">{error}</p>}
        {data && (
          <section className="panel">
            <p className="panel-label">Closest to opening</p>
            {data.openEverywhere && <p className="muted-text">Dating is open everywhere right now.</p>}
            {data.cities?.length ? (
              <ul className="city-board">
                {data.cities.map((city) => (
                  <li key={`${city.name}|${city.country}`}>
                    <div className="city-line">
                      <strong>{city.name}</strong>
                      <span>{city.open ? 'Open' : `${city.progressPercent}%`}</span>
                    </div>
                    <div className="meter-track">
                      <span style={{ width: `${city.open ? 100 : city.progressPercent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-text">No city is on the board yet. Be the first in yours.</p>
            )}
          </section>
        )}
        <SiteFooter />
      </main>
    </div>
  )
}
