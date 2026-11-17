import { useSyncExternalStore } from 'react'
import { initPostHog, withPostHog } from '@rivi-software/posthog-tanstack-start/browser'
import type { PostHogBrowserConfig } from '@rivi-software/posthog-tanstack-start/browser'

/**
 * PostHog runs only after the visitor accepts the cookie banner. Until then posthog-js
 * is not even loaded, so nothing is stored or sent from the browser. The choice itself
 * is kept in localStorage, like the theme.
 */

export type Consent = 'granted' | 'denied' | 'unset'

const KEY = 'analytics-consent'

type State = {
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
  for (const listener of listeners) listener()
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
  // Opting out also deletes PostHog's cookie and storage, and keeps them off.
  initPostHog(state.config, { opt_out_persistence_by_default: true })
  // A visitor who declined and then accepts on the same page: posthog-js remembers the opt-out.
  withPostHog((posthog) => {
    if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing()
  })
}

/** Called once in the browser, from the router's hydrate. */
export function setupAnalytics(config: PostHogBrowserConfig | null) {
  update({ config, consent: readConsent() })
  if (state.consent === 'granted') start()
  // A choice made in another tab of the site applies here too, so a "No thanks" there
  // stops PostHog in a tab that accepted earlier.
  addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) return
    const consent = readConsent()
    if (consent === state.consent) return
    update({ consent, reopened: false })
    if (consent === 'granted') start()
    else stop()
  })
}

// Only does something when PostHog runs in this tab: it stops and deletes its cookie and storage.
function stop() {
  withPostHog((posthog) => posthog.opt_out_capturing())
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
  const current = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE)
  return {
    /** PostHog is configured, so there is something to consent to. */
    available: current.config !== null,
    consent: current.consent,
    showBanner: current.config !== null && (current.consent === 'unset' || current.reopened),
  }
}
