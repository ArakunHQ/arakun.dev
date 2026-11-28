// What the live Worker and the /vote page say to each other. Both import this file.

/** The answers, in order. The number a visitor taps is the index plus one. */
export const OPTIONS = [
  "I can't tell which agent needs me.",
  'My agents step on each other.',
  'I have to sit and watch.',
  'I paste secrets into chat.',
] as const

export type Option = 1 | 2 | 3 | 4

/** waiting: not opened yet, or reset. open: taking votes. closed: the winner is out. */
export type Status = 'waiting' | 'open' | 'closed'

export interface PollState {
  /** Votes per option, in the order of OPTIONS. */
  counts: number[]
  /** This page's vote, when the server knows its voter id. */
  mine: Option | null
  /** Pages connected right now. */
  online: number
  round: number
  status: Status
  total: number
  type: 'state'
  /** Set when the poll closes. */
  winner: Option | null
}

export type ClientMessage = { type: 'vote'; option: Option; voter: string } | { type: 'ping' }

export type ServerMessage = PollState | { type: 'error'; error: string } | { type: 'pong' }

export const isOption = (value: unknown): value is Option =>
  value === 1 || value === 2 || value === 3 || value === 4

/** Ids the page makes itself: random, URL-safe, not too short or long. */
const VOTER = /^[A-Za-z0-9_-]{8,64}$/u

export const isVoter = (value: unknown): value is string =>
  typeof value === 'string' && VOTER.test(value)

/** The most votes wins; on a tie, the lowest number. */
export function winnerOf(counts: number[]): Option {
  let best = 0
  for (let i = 1; i < counts.length; i += 1) {
    if ((counts[i] ?? 0) > (counts[best] ?? 0)) {
      best = i
    }
  }
  return (best + 1) as Option
}
