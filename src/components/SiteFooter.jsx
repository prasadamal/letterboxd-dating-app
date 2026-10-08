import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link to="/cities">Cities</Link>
      <Link to="/privacy">Privacy</Link>
      <Link to="/terms">Terms</Link>
      <Link to="/support">Support</Link>
      <Link to="/delete-account">Delete account</Link>
    </footer>
  )
}
