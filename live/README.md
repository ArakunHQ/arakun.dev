# arakun-live

The realtime poll behind [arakun.dev/vote](https://arakun.dev/vote), for live talks.
The audience votes on their phones and sees the bars move. When the speaker closes the
poll, every open page switches to the demo of the winning answer.

It is a Worker of its own, `arakun-live`, with one Durable Object (`Poll`, named
`demo-day`) that holds the poll. The site's Worker and its domains don't change for it.

## How it works

- Every page keeps a WebSocket to the Durable Object (the Hibernation API, so an idle
  room costs nothing). On every change the object sends the whole state to every page:
  `waiting`, `open` or `closed`, the votes per answer, the total and the winner.
- A page votes with `{"type":"vote","option":1-4,"voter":"<id>"}`. The voter id is
  random, made by the page and kept in localStorage, so it is one vote per browser.
  Voting again changes the vote while the poll is open.
- If the socket fails, the page asks `GET /state` every 2 seconds and votes with
  `POST /vote` until the socket is back.
- Closing picks the answer with the most votes; on a tie, the lowest number.
- Limits: messages over 512 bytes close the socket, bad answers are refused, each page
  may send 20 messages per 10 seconds and each address 120 (a venue puts the whole room
  behind one address), and an address may add 400 voters at most.

| Path | What it does |
| --- | --- |
| `GET /ws?voter=<id>` | The WebSocket. |
| `GET /state?voter=<id>` | The state as JSON. |
| `POST /vote` | `{"option": 2, "voter": "<id>"}` |
| `POST /admin/open` | Opens the poll. Needs `Authorization: Bearer <ADMIN_TOKEN>`. |
| `POST /admin/close` | Closes it and picks the winner. |
| `POST /admin/reset` | Clears the votes and goes back to `waiting`. |

Each path also works under `/live`, which is how arakun.dev reaches it.

## Run it locally

```sh
pnpm exec wrangler dev -c live/wrangler.jsonc --port 8788 --var ADMIN_TOKEN:local-only
VITE_LIVE_URL=http://localhost:8788 pnpm dev   # then open http://localhost:3000/vote
```

The admin page is http://localhost:3000/vote/admin; type `local-only` as the token.

## Deploy

The admin token is a Wrangler secret. Make a long random one and set it once per
Worker; nobody else needs it:

```sh
pnpm exec wrangler secret put ADMIN_TOKEN -c live/wrangler.jsonc
```

**Preview** on workers.dev, with no route on arakun.dev:

```sh
pnpm exec wrangler deploy -c live/wrangler.jsonc --env=""
```

Point a local or preview build of the site at it with
`VITE_LIVE_URL=https://arakun-live.<account>.workers.dev`.

**Production** adds the route `arakun.dev/live/*`, so the page on arakun.dev talks to
`/live/ws` and `/live/state` on its own origin:

```sh
pnpm exec wrangler deploy -c live/wrangler.jsonc --env production
```

A route runs in front of the site's custom domain, so only `/live/*` reaches this
Worker. Once the route is on, deploy with `--env production` only, so a preview deploy
never drops it. The site itself needs no deploy for the route, only for the `/vote`
pages.

## On the day

1. Open arakun.dev/vote/admin on your phone and type the token once.
2. **Reset** before the talk, then **Open** when you show the question.
3. **Close** when the bars settle. Every page shows the winner's demo.

Each vote also sends a `demo_vote` event to PostHog from the browser (`pain`: 1–4 and
`pain_label`), only for visitors who accepted the cookie banner.
