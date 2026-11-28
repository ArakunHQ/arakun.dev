import { useEffect, useRef, useState } from 'react'
import { captureEvent } from '#/analytics'
import type { ClientMessage, Option, PollState, ServerMessage } from '../live/src/protocol.ts'
import { OPTIONS } from '../live/src/protocol.ts'

/**
 * The page side of the live poll (live/README.md). The page keeps a WebSocket to the
 * arakun-live Worker; while the socket is down it asks GET /state every 2 seconds and
 * votes with POST /vote, so a phone on bad Wi-Fi still sees the result.
 */

export type { Option, PollState } from '../live/src/protocol.ts'
export { OPTIONS } from '../live/src/protocol.ts'

/**
 * Where the arakun-live Worker answers. On arakun.dev it is the /live/* route; set
 * VITE_LIVE_URL to its workers.dev address to try a preview.
 */
export const LIVE_URL: string = (import.meta.env.VITE_LIVE_URL as string | undefined) ?? '/live'

const VOTER_KEY = 'live-voter'
const POLL_MS = 2000
const PING_MS = 30_000
const TRAILING_SLASH = /\/$/u

function socketUrl(voter: string) {
  const base = new URL(LIVE_URL, location.href)
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  base.pathname = `${base.pathname.replace(TRAILING_SLASH, '')}/ws`
  base.searchParams.set('voter', voter)
  return base.toString()
}

export const liveEndpoint = (path: string) => `${LIVE_URL.replace(TRAILING_SLASH, '')}${path}`

/** A random id per browser: one vote each, and the vote can change while the poll is open. */
function voterId() {
  try {
    const saved = localStorage.getItem(VOTER_KEY)
    if (saved) {
      return saved
    }
    const id = crypto.randomUUID().replaceAll('-', '')
    localStorage.setItem(VOTER_KEY, id)
    return id
  } catch {
    // Storage blocked: one id for this page only.
    return crypto.randomUUID().replaceAll('-', '')
  }
}

export type Connection = 'connecting' | 'live' | 'polling'

export function useLivePoll() {
  const [state, setState] = useState<PollState | null>(null)
  const [connection, setConnection] = useState<Connection>('connecting')
  const [error, setError] = useState<string | null>(null)
  const socket = useRef<WebSocket | null>(null)
  const voter = useRef('')

  useEffect(() => {
    voter.current = voterId()
    let closed = false
    let retry = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let pollTimer: ReturnType<typeof setInterval> | undefined
    let pingTimer: ReturnType<typeof setInterval> | undefined

    const apply = (message: ServerMessage) => {
      if (message.type === 'state') {
        setState(message)
        setError(null)
      } else if (message.type === 'error') {
        setError(message.error)
      }
    }

    const poll = async () => {
      try {
        const response = await fetch(liveEndpoint(`/state?voter=${voter.current}`), {
          cache: 'no-store',
        })
        if (response.ok) {
          apply((await response.json()) as PollState)
        }
      } catch {
        // Offline for now; the next tick tries again.
      }
    }

    const startPolling = () => {
      if (pollTimer === undefined) {
        setConnection('polling')
        poll()
        pollTimer = setInterval(poll, POLL_MS)
      }
    }

    const stopPolling = () => {
      clearInterval(pollTimer)
      pollTimer = undefined
    }

    const connect = () => {
      if (closed) {
        return
      }
      clearTimeout(retryTimer)
      let ws: WebSocket
      try {
        ws = new WebSocket(socketUrl(voter.current))
      } catch {
        startPolling()
        return
      }
      socket.current = ws
      ws.onopen = () => {
        retry = 0
        stopPolling()
        setConnection('live')
        clearInterval(pingTimer)
        pingTimer = setInterval(() => send(ws, { type: 'ping' }), PING_MS)
      }
      ws.onmessage = (event) => {
        try {
          apply(JSON.parse(String(event.data)) as ServerMessage)
        } catch {
          // Not ours; ignore it.
        }
      }
      ws.onclose = () => {
        clearInterval(pingTimer)
        if (socket.current === ws) {
          socket.current = null
        }
        if (closed) {
          return
        }
        startPolling()
        // 1 s, 2 s, 4 s, then every 10 s.
        retry += 1
        retryTimer = setTimeout(connect, Math.min(10_000, 500 * 2 ** retry))
      }
    }

    // A phone that slept has a dead socket; try again as soon as the page is back.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && socket.current === null) {
        retry = 0
        connect()
      }
    }

    connect()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      closed = true
      clearTimeout(retryTimer)
      clearInterval(pingTimer)
      stopPolling()
      document.removeEventListener('visibilitychange', onVisible)
      socket.current?.close()
    }
  }, [])

  const vote = async (option: Option) => {
    if (state?.status !== 'open' || state.mine === option) {
      return
    }
    // Show the choice right away; the server's next state confirms it.
    setState({ ...state, mine: option })
    captureEvent('demo_vote', { pain: option, pain_label: OPTIONS[option - 1] })
    const ws = socket.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      send(ws, { type: 'vote', option, voter: voter.current })
      return
    }
    try {
      const response = await fetch(liveEndpoint('/vote'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option, voter: voter.current }),
      })
      const body = (await response.json()) as PollState | { error: string }
      if ('error' in body) {
        setError(body.error)
      } else {
        setState(body)
      }
    } catch {
      setError('Could not reach the poll. Try again.')
    }
  }

  return { state, connection, error, vote }
}

function send(ws: WebSocket, message: ClientMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}
