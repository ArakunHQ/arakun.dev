import { createServerFn } from '@tanstack/react-start'

/**
 * What Arakun Pro adds, from the paid parts of the app's cloud/ Worker. A visitor can
 * tick the ones they want, so we know what to build first. Prices are not decided, so
 * no page names one.
 */
export const proFeatures = [
  {
    id: 'cloud',
    name: 'Cloud machines',
    title: 'Agents that work while your laptop sleeps',
    body: 'Start a task on a cloud machine and close the lid. It wakes when you send a prompt from your phone, and sleeps again when the agent is done.',
  },
  {
    id: 'teams',
    name: 'Teams',
    title: 'Work next to your team',
    body: 'Shared channels for people and their agents, end to end encrypted. Our server stores and forwards messages; it never holds a key that opens them.',
  },
  {
    id: 'linear',
    name: 'Linear delegation',
    title: 'Assign the issue to Arakun',
    body: 'Hand a Linear issue to Arakun. An agent picks it up on your computer and posts its plan and progress back on the issue.',
  },
  {
    id: 'limits',
    name: 'Higher limits',
    title: 'More computers, more phones',
    body: 'Room on the relay for people who run Arakun on many machines, and more cloud hours each month.',
  },
] as const

export type ProFeatureId = (typeof proFeatures)[number]['id']

const FEATURE_IDS = new Set<string>(proFeatures.map((feature) => feature.id))
// Loose on purpose: it only catches typos. Nobody gets mail until we write to them.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u
const MAX_EMAIL = 254

export interface WaitlistInput {
  email: string
  interests: ProFeatureId[]
  /** A field people never see. Bots fill it in. */
  website: string
}

function parseInput(data: unknown): WaitlistInput {
  const input = (data ?? {}) as Record<string, unknown>
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  if (email.length > MAX_EMAIL || !EMAIL.test(email)) {
    throw new Error('Enter a valid email address.')
  }
  const interests = Array.isArray(input.interests)
    ? input.interests.filter((id): id is ProFeatureId => FEATURE_IDS.has(id as string))
    : []
  const website = typeof input.website === 'string' ? input.website : ''
  return { email, interests: [...new Set(interests)], website }
}

/**
 * Puts the address on the Arakun Pro waitlist as a PostHog person, keyed by the address,
 * so signing up twice updates the same person. It runs because the visitor asked, not on
 * the cookie banner: the form says what we do with the address.
 */
export const joinWaitlist = createServerFn({ method: 'POST' })
  .validator(parseInput)
  .handler(async ({ data }) => {
    // A bot gets the same answer as a person, so it learns nothing.
    if (data.website) {
      return { ok: true }
    }
    const { captureServerEvent } = await import('@rivi-software/posthog-tanstack-start/server')
    captureServerEvent('pro waitlist joined', data.email, {
      interests: data.interests,
      $set: { email: data.email, pro_waitlist: true, pro_interests: data.interests },
      $set_once: { pro_waitlist_joined_at: new Date().toISOString() },
    })
    return { ok: true }
  })
