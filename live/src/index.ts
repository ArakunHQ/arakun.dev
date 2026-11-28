// The live poll behind arakun.dev/vote: one Durable Object holds the poll, every open
// page keeps a WebSocket to it, and every change goes out to all of them.
//
// Paths work with or without the /live prefix, so the same Worker serves the
// production route (arakun.dev/live/*) and its workers.dev preview.
//
//   GET  /ws?voter=<id>    WebSocket; the server sends the state on connect and on change
//   GET  /state?voter=<id> the same state as JSON, for pages whose socket fails
//   POST /vote             {option, voter}, for pages whose socket fails
//   POST /admin/open       Authorization: Bearer <ADMIN_TOKEN>
//   POST /admin/close
//   POST /admin/reset

import { DurableObject } from 'cloudflare:workers'
import type { Option, PollState, Status } from './protocol.ts'
import { isOption, isVoter, OPTIONS, winnerOf } from './protocol.ts'

interface LiveEnv {
  /** A Wrangler secret. Unset turns the admin endpoints off. */
  ADMIN_TOKEN?: string
  POLL: DurableObjectNamespace<Poll>
}

/** The one poll every page talks to. */
const POLL_NAME = 'demo-day'

/** Larger messages are not votes; the socket is closed. */
const MAX_MESSAGE_BYTES = 512
/**
 * A venue's Wi-Fi puts a whole room behind one address, so the limit per address is
 * loose. It stops a script, not a crowd.
 */
const IP_WINDOW_MS = 10_000
const IP_MAX_MESSAGES = 120
/** One page sends a vote per tap; more than this is not a person tapping. */
const SOCKET_WINDOW_MS = 10_000
const SOCKET_MAX_MESSAGES = 20
/** New voter ids one address may add. Changing a vote doesn't count. */
const IP_MAX_VOTERS = 400
/** The poll stops taking new voters here, so storage stays small. */
const MAX_VOTERS = 5000

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { ...CORS, 'Cache-Control': 'no-store' },
  })
}

const LIVE_PREFIX = /^\/live(?=\/|$)/u
const ADMIN_PATH = /^\/admin\/(?<action>open|close|reset)$/u
const BEARER = /^Bearer\s+/iu

type AdminAction = 'open' | 'close' | 'reset'

/**
 * Compares the SHA-256 of both sides, not the tokens. How long a wrong guess takes
 * then depends on the hashes, which tells nothing about the token or its length.
 */
async function sameToken(given: string, expected: string) {
  const encoder = new TextEncoder()
  const [a, b] = await Promise.all(
    [given, expected].map(async (text) =>
      new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text))).toString()
    )
  )
  return a === b
}

type PollStub = DurableObjectStub<Poll>

async function handleVote(request: Request, poll: PollStub) {
  const body = await readSmallJson(request)
  if (!(body && isOption(body.option) && isVoter(body.voter))) {
    return json({ error: 'bad vote' }, 400)
  }
  const result = await poll.vote(body.option, body.voter, clientIp(request))
  return result.ok ? json(result.state) : json({ error: result.error }, result.status)
}

async function handleAdmin(request: Request, env: LiveEnv, poll: PollStub, action: AdminAction) {
  if (!env.ADMIN_TOKEN) {
    return json({ error: 'ADMIN_TOKEN is not set' }, 503)
  }
  const given = request.headers.get('Authorization')?.replace(BEARER, '') ?? ''
  if (!(await sameToken(given, env.ADMIN_TOKEN))) {
    return json({ error: 'wrong token' }, 401)
  }
  return json(await poll.admin(action))
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(LIVE_PREFIX, '') || '/'
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }
    const poll = env.POLL.get(env.POLL.idFromName(POLL_NAME))
    const admin = path.match(ADMIN_PATH)?.groups?.action as AdminAction | undefined

    if (path === '/ws') {
      return request.headers.get('Upgrade') === 'websocket'
        ? poll.fetch(request)
        : json({ error: 'expected a WebSocket' }, 426)
    }
    if (path === '/state' && request.method === 'GET') {
      const voter = url.searchParams.get('voter')
      return json(await poll.state(isVoter(voter) ? voter : null))
    }
    if (path === '/vote' && request.method === 'POST') {
      return handleVote(request, poll)
    }
    if (admin && request.method === 'POST') {
      return handleAdmin(request, env, poll, admin)
    }
    if (path === '/') {
      return json({ ok: true, endpoints: ['/ws', '/state', '/vote', '/admin/open|close|reset'] })
    }
    return json({ error: 'not found' }, 404)
  },
} satisfies ExportedHandler<LiveEnv>

function clientIp(request: Request) {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown'
}

async function readSmallJson(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text()
  if (text.length > MAX_MESSAGE_BYTES) {
    return null
  }
  try {
    const value: unknown = JSON.parse(text)
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Kept on each socket, so it survives the object hibernating. */
interface Attachment {
  ip: string
  voter: string | null
}

interface RateWindow {
  count: number
  start: number
}

type VoteResult = { ok: true; state: PollState } | { ok: false; status: number; error: string }

// The runtime answers a closing socket itself (web_socket_auto_reply_to_close, on by
// default since the 2026-04-07 compatibility date), so there is no webSocketClose.
export class Poll extends DurableObject<LiveEnv> {
  private status: Status = 'waiting'
  private winner: Option | null = null
  /** Goes up on every reset, so a page can forget a vote from before it. */
  private round = 0
  private readonly votes = new Map<string, Option>()
  private readonly votersByIp = new Map<string, number>()
  // Rate limits live in memory only. Waking from hibernation starts them over, which
  // is fine for a limit this loose.
  private readonly ipWindows = new Map<string, RateWindow>()
  private readonly socketWindows = new WeakMap<WebSocket, RateWindow>()

  constructor(ctx: DurableObjectState, env: LiveEnv) {
    super(ctx, env)
    // Pages ping to keep their socket alive. The runtime answers without waking the object.
    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}')
    )
    ctx.blockConcurrencyWhile(async () => {
      const meta = await ctx.storage.get<{ status: Status; winner: Option | null; round: number }>(
        'meta'
      )
      if (meta) {
        this.status = meta.status
        this.winner = meta.winner
        this.round = meta.round
      }
      const stored = await ctx.storage.list<Option>({ prefix: 'v:' })
      for (const [key, option] of stored) {
        this.votes.set(key.slice(2), option)
      }
    })
  }

  override fetch(request: Request): Response {
    const voter = new URL(request.url).searchParams.get('voter')
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket]
    this.ctx.acceptWebSocket(server)
    const attachment: Attachment = { voter: isVoter(voter) ? voter : null, ip: clientIp(request) }
    server.serializeAttachment(attachment)
    server.send(JSON.stringify(this.snapshot(attachment.voter)))
    return new Response(null, { status: 101, webSocket: client })
  }

  override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const size = typeof message === 'string' ? message.length : message.byteLength
    if (size > MAX_MESSAGE_BYTES) {
      ws.close(1009, 'message too large')
      return
    }
    const attachment = ws.deserializeAttachment() as Attachment
    if (!allow(this.socketWindowFor(ws), SOCKET_WINDOW_MS, SOCKET_MAX_MESSAGES)) {
      ws.send(JSON.stringify({ type: 'error', error: 'slow down' }))
      return
    }
    let data: { type?: unknown; option?: unknown; voter?: unknown }
    try {
      data = JSON.parse(typeof message === 'string' ? message : new TextDecoder().decode(message))
    } catch {
      ws.send(JSON.stringify({ type: 'error', error: 'bad message' }))
      return
    }
    if (data.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }))
      return
    }
    if (data.type !== 'vote' || !isOption(data.option) || !isVoter(data.voter)) {
      ws.send(JSON.stringify({ type: 'error', error: 'bad vote' }))
      return
    }
    if (attachment.voter !== data.voter) {
      attachment.voter = data.voter
      ws.serializeAttachment(attachment)
    }
    const result = await this.vote(data.option, data.voter, attachment.ip)
    if (!result.ok) {
      ws.send(JSON.stringify({ type: 'error', error: result.error }))
    }
  }

  state(voter: string | null): PollState {
    return this.snapshot(voter)
  }

  async vote(option: Option, voter: string, ip: string): Promise<VoteResult> {
    if (!allow(this.ipWindowFor(ip), IP_WINDOW_MS, IP_MAX_MESSAGES)) {
      return { ok: false, status: 429, error: 'slow down' }
    }
    if (this.status !== 'open') {
      return { ok: false, status: 409, error: 'the poll is not open' }
    }
    const previous = this.votes.get(voter)
    if (previous === option) {
      return { ok: true, state: this.snapshot(voter) }
    }
    if (previous === undefined) {
      const fromIp = this.votersByIp.get(ip) ?? 0
      if (this.votes.size >= MAX_VOTERS || fromIp >= IP_MAX_VOTERS) {
        return { ok: false, status: 429, error: 'too many voters' }
      }
      this.votersByIp.set(ip, fromIp + 1)
    }
    this.votes.set(voter, option)
    await this.ctx.storage.put(`v:${voter}`, option)
    this.broadcast()
    return { ok: true, state: this.snapshot(voter) }
  }

  async admin(action: AdminAction): Promise<PollState> {
    if (action === 'open') {
      this.status = 'open'
      this.winner = null
    } else if (action === 'close') {
      this.status = 'closed'
      this.winner = winnerOf(this.counts())
    } else {
      this.status = 'waiting'
      this.winner = null
      this.round += 1
      this.votes.clear()
      this.votersByIp.clear()
      await this.ctx.storage.delete([...(await this.ctx.storage.list({ prefix: 'v:' })).keys()])
    }
    await this.ctx.storage.put('meta', {
      status: this.status,
      winner: this.winner,
      round: this.round,
    })
    this.broadcast()
    return this.snapshot(null)
  }

  private counts() {
    const counts = OPTIONS.map(() => 0)
    for (const option of this.votes.values()) {
      counts[option - 1] += 1
    }
    return counts
  }

  private snapshot(voter: string | null): PollState {
    const counts = this.counts()
    return {
      type: 'state',
      status: this.status,
      counts,
      total: this.votes.size,
      winner: this.winner,
      round: this.round,
      online: this.ctx.getWebSockets().length,
      mine: voter ? (this.votes.get(voter) ?? null) : null,
    }
  }

  /** Every page gets the whole state, with its own vote in it. */
  private broadcast() {
    const shared = this.snapshot(null)
    for (const ws of this.ctx.getWebSockets()) {
      const { voter } = ws.deserializeAttachment() as Attachment
      const mine = voter ? (this.votes.get(voter) ?? null) : null
      try {
        ws.send(JSON.stringify({ ...shared, mine }))
      } catch {
        // The socket is closing; it drops out of getWebSockets() on its own.
      }
    }
  }

  private ipWindowFor(ip: string) {
    let bucket = this.ipWindows.get(ip)
    if (!bucket) {
      bucket = { start: Date.now(), count: 0 }
      this.ipWindows.set(ip, bucket)
    }
    return bucket
  }

  private socketWindowFor(ws: WebSocket) {
    let bucket = this.socketWindows.get(ws)
    if (!bucket) {
      bucket = { start: Date.now(), count: 0 }
      this.socketWindows.set(ws, bucket)
    }
    return bucket
  }
}

function allow(bucket: RateWindow, length: number, max: number) {
  const now = Date.now()
  if (now - bucket.start > length) {
    bucket.start = now
    bucket.count = 0
  }
  bucket.count += 1
  return bucket.count <= max
}
