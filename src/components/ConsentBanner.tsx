import { Link } from '@tanstack/react-router'
import { acceptAnalytics, declineAnalytics, useAnalytics } from '#/analytics'

export function ConsentBanner() {
  const { showBanner } = useAnalytics()
  if (!showBanner) {
    return null
  }
  return (
    <aside aria-label="Cookies" className="consent">
      <p>
        Can we use cookies to see how people use this site? We use PostHog for this. Nothing loads
        until you say yes. <Link to="/privacy">Privacy</Link>
      </p>
      {/* Both answers look the same, so saying no is as easy as saying yes. */}
      <div className="actions">
        <button className="btn" data-tone="secondary" onClick={declineAnalytics} type="button">
          No thanks
        </button>
        <button className="btn" data-tone="secondary" onClick={acceptAnalytics} type="button">
          Accept
        </button>
      </div>
    </aside>
  )
}
