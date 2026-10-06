import { posterBackground, posterTitleSize } from '../lib/posterArt.js'

// Typographic poster, like the app's: a genre gradient, the year up top and the title set big.
export function Poster({ film, width = 150 }) {
  const padding = width < 180 ? 12 : 18
  const titleSize = posterTitleSize(film.title, width, padding)
  return (
    <div className="poster" style={{ width, height: Math.round(width * 1.45), padding, background: posterBackground(film) }}>
      <span className="poster-year">{film.year || ''}</span>
      <span className="poster-watermark" aria-hidden="true" style={{ fontSize: Math.round(width * 0.42) }}>
        {String(film.year || '').slice(-2)}
      </span>
      <div className="poster-bottom">
        <strong className="poster-title" style={{ fontSize: titleSize }}>
          {film.title}
        </strong>
        {film.genres?.[0] && <span className="poster-meta">{film.genres[0]}</span>}
      </div>
    </div>
  )
}
