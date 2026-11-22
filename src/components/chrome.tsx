import { Link, useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { reopenConsent, useAnalytics } from '#/analytics'
import { site } from '#/site'
import { ButtonLink, useLatest } from './ui'

/** The hero raccoon sends this with `true` while it is on screen, and `false` once it is not. */
export const HERO_EVENT = 'arakun:hero-in-view'

/**
 * Sticky top bar with the raccoon in the brand.
 *
 * One raccoon per composition: while the hero's raccoon is on screen the small
 * one in the bar steps out, and it comes back once the hero has scrolled away.
 * Pages without a hero always show it.
 */
export function SiteNav() {
  const pathname = useLocation({ select: (l) => l.pathname })
  // The home page loads with its hero in view, so start hidden there: no flash before hydration.
  const [heroInView, setHeroInView] = useState(pathname === '/')

  // The hero reports itself. After a client-side navigation the new page can render after
  // the URL changes, so a lookup on the URL change would miss it.
  useEffect(() => {
    const seen = (e: Event) => setHeroInView((e as CustomEvent<boolean>).detail)
    addEventListener(HERO_EVENT, seen)
    return () => removeEventListener(HERO_EVENT, seen)
  }, [])

  return (
    <header className="sn" data-hero={heroInView}>
      <div className="wrap">
        <Link className="brand" to="/">
          <span className="mark">
            <img alt="" height={28} src="/brand/app-icon.svg" width={28} />
          </span>
          <span>{site.name}</span>
        </Link>
        <nav aria-label="Main">
          <Link to="/features">Features</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/changelog">Changelog</Link>
          <a className="gh" href={site.githubUrl}>
            GitHub
          </a>
        </nav>
        <ThemeToggle />
        <span className="dl">
          <ButtonLink to="/download" tone="ghost">
            Download
          </ButtonLink>
        </span>
      </div>
    </header>
  )
}

/**
 * Switches between dark and light and remembers the choice.
 * The first paint is set by the inline script in the root route, and the icon
 * follows the theme through CSS, so the button is right before the app hydrates.
 */
function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement
    const next = root.dataset.theme === 'light' ? 'dark' : 'light'
    const apply = () => {
      root.dataset.theme = next
    }
    try {
      localStorage.setItem('theme', next)
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    // Cross-fade the whole page where the browser can; otherwise switch at once.
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(apply)
    } else {
      apply()
    }
  }
  return (
    <button
      aria-label="Switch between dark and light mode"
      className="tt"
      onClick={toggle}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="only-dark"
        fill="none"
        height="18"
        viewBox="0 0 24 24"
        width="18"
      >
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
        />
      </svg>
      <svg
        aria-hidden="true"
        className="only-light"
        fill="none"
        height="18"
        viewBox="0 0 24 24"
        width="18"
      >
        <path
          d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
    </button>
  )
}

export function SiteFooter() {
  const latest = useLatest()
  return (
    <footer className="sf">
      <div className="wrap">
        <div className="top">
          <div className="id">
            <span className="nm">{site.name}</span>
            <p>{site.line}</p>
          </div>
          <div className="col">
            <span>Product</span>
            <Link to="/features">Features</Link>
            <Link to="/download">Download</Link>
            <Link to="/changelog">Changelog</Link>
          </div>
          <div className="col">
            <span>Learn</span>
            <Link to="/docs">Docs</Link>
            <Link hash="the-arakun-command" to="/docs">
              The arakun command
            </Link>
            <Link params={{ slug: 'keyboard-shortcuts' }} to="/docs/$slug">
              Keyboard shortcuts
            </Link>
          </div>
          <div className="col">
            <span>Source</span>
            <a href={site.githubUrl}>GitHub</a>
            <a href={site.issuesUrl}>Issues</a>
            <a href={site.licenseUrl}>License</a>
          </div>
        </div>
        <div className="legal">
          <span>arakun.dev</span>
          <span className="end">
            <Link to="/privacy">Privacy</Link>
            <CookieSettings />
            <span>
              {site.license} · v{latest.version}
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}

/**
 * Sections fade up as they scroll into view. Only sections that start below
 * the fold are hidden, so nothing visible on load ever flashes.
 */
export function useReveal(key: string) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new key means a new page, whose sections need observing.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      return
    }
    const seen = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }
          entry.target.setAttribute('data-reveal', '')
          seen.unobserve(entry.target)
        }
      },
      { threshold: 0.12 }
    )
    for (const el of document.querySelectorAll('[data-reveal]')) {
      if (el.getBoundingClientRect().top > innerHeight) {
        el.setAttribute('data-reveal', 'pre')
        seen.observe(el)
      }
    }
    return () => seen.disconnect()
  }, [key])
}

// Shown once PostHog is configured, so a visitor can change their answer to the banner.
function CookieSettings() {
  const { available } = useAnalytics()
  if (!available) {
    return null
  }
  return (
    <button onClick={reopenConsent} type="button">
      Cookies
    </button>
  )
}
