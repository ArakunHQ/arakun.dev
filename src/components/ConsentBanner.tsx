import { acceptAnalytics, declineAnalytics, useAnalytics } from '#/analytics'

export function ConsentBanner() {
  const { showBanner } = useAnalytics()
  if (!showBanner) return null
  return (
    <aside className="consent" aria-label="Cookies">
      <p>
        Can we use cookies to see how people use this site? We use PostHog for this. Nothing loads until you say yes.
      </p>
      <div className="actions">
        <button type="button" className="btn" data-tone="ghost" onClick={declineAnalytics}>
          No thanks
        </button>
        <button type="button" className="btn" data-tone="primary" onClick={acceptAnalytics}>
          Accept
        </button>
      </div>
    </aside>
  )
}
