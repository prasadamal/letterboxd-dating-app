export function BrandMark({ subtitle = 'movie dating' }) {
  return (
    <div className="brand-wrap">
      <div className="brand-mark">RM</div>
      <div>
        <p className="eyebrow">{subtitle}</p>
        <h1>ReelMates</h1>
      </div>
    </div>
  )
}
