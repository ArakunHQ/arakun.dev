import type { PostHogBrowserConfig } from '@rivi-software/posthog-tanstack-start/browser'
import { initPostHog, withPostHog } from '@rivi-software/posthog-tanstack-start/browser'
import { useSyncExternalStore } from 'react'

/**
 * PostHog runs only after the visitor accepts the cookie banner. Until then posthog-js
 * is not even loaded, so nothing is stored or sent from the browser. The choice itself
 * is kept in localStorage, like the theme.
 */

export type Consent = 'granted' | 'denied' | 'unset'

const KEY = 'analytics-consent'

interface State {
  /** PostHog's settings from the Worker; null until the router hydrates, or when PostHog is off. */
  config: PostHogBrowserConfig | null
  consent: Consent
  /** The banner was opened again from the footer. */
  reopened: boolean
}

let state: State = { config: null, consent: 'unset', reopened: false }
const listeners = new Set<() => void>()

function update(next: Partial<State>) {
  state = { ...state, ...next }
  for (const listener of listeners) {
    listener()
  }
}

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'granted' || value === 'denied' ? value : 'unset'
  } catch {
    return 'unset'
  }
}

function saveConsent(consent: Consent) {
  try {
    localStorage.setItem(KEY, consent)
  } catch {
    // Storage blocked: the choice holds for this page only.
  }
}

function start() {
  initPostHog(state.config, {
    // Opting out also deletes PostHog's cookie and storage, and keeps them off.
    opt_out_persistence_by_default: true,
    // The site never identifies visitors, so no person profiles.
    person_profiles: 'identified_only',
    // No session recording, whatever the project settings say. Autocapture stays on for
    // clicks; it never reads what is typed into a field.
    disable_session_recording: true,
    // POSTHOG_HOST is our proxy (wrangler.jsonc), so links into PostHog, such as the
    // toolbar's, need the app's own host.
    ui_host: 'https://us.posthog.com',
    // The site uses no feature flags, so it skips the request that fetches them.
    advanced_disable_flags: true,
    // Consent can be withdrawn in another tab while posthog-js is still loading here.
    // Every event checks the answer as it leaves, so none slips out in between.
    before_send: (event) => (state.consent === 'granted' ? event : null),
  })
  withPostHog((posthog) => {
    // Withdrawn while the SDK loaded: stop now, before the opt-in below can send anything.
    if (state.consent !== 'granted') {
      posthog.opt_out_capturing()
    }
    // A visitor who declined and then accepts on the same page: posthog-js remembers the opt-out.
    else if (posthog.has_opted_out_capturing()) {
      posthog.opt_in_capturing()
    }
  })
}

/** Called once in the browser, from the router's hydrate. */
export function setupAnalytics(config: PostHogBrowserConfig | null) {
  update({ config, consent: readConsent() })
  if (state.consent === 'granted') {
    start()
  }
  // A choice made in another tab of the site applies here too, so a "No thanks" there
  // stops PostHog in a tab that accepted earlier.
  addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) {
      return
    }
    const consent = readConsent()
    if (consent === state.consent) {
      return
    }
    update({ consent, reopened: false })
    if (consent === 'granted') {
      start()
    } else {
      stop()
    }
  })
}

// Only does something when PostHog runs in this tab: it stops and deletes its cookie and storage.
function stop() {
  withPostHog((posthog) => posthog.opt_out_capturing())
}

/** Sends an event only when the visitor said yes; otherwise nothing leaves the browser. */
export function captureEvent(name: string, properties: Record<string, unknown>) {
  if (state.consent !== 'granted') {
    return
  }
  withPostHog((posthog) => posthog.capture(name, properties))
}

export function acceptAnalytics() {
  saveConsent('granted')
  update({ consent: 'granted', reopened: false })
  start()
}

export function declineAnalytics() {
  saveConsent('denied')
  update({ consent: 'denied', reopened: false })
  stop()
}

export function reopenConsent() {
  update({ reopened: true })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const SERVER_STATE: State = { config: null, consent: 'unset', reopened: false }

export function useAnalytics() {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE
  )
  return {
    /** PostHog is configured, so there is something to consent to. */
    available: current.config !== null,
    consent: current.consent,
    showBanner: current.config !== null && (current.consent === 'unset' || current.reopened),
  }
}
