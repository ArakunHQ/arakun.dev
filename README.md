<img src="public/brand/app-icon.svg" width="64" height="64" alt="">

# arakun-website

The website for Arakun: one native window for your coding agents.

Built with [TanStack Start](https://tanstack.com/start) and deployed to
[Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/).
The design comes from the Doop canvases "Website Design" and "Brandbook".

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs the site at http://localhost:3000 in the Workers runtime. |
| `pnpm build` | Builds the Worker and its static assets into `dist/`, then checks the build: no source map the site would serve, no value shaped like a secret (`workers-bundle-check.config.ts`). |
| `pnpm preview` | Builds, then serves the production build locally. |
| `pnpm typecheck` | Runs TypeScript without emitting. |
| `pnpm run deploy` | Builds and deploys with Wrangler, by hand. Needs `wrangler login` first. Not `pnpm deploy`, which is a pnpm command of its own. |

## Where things are

- `src/site.ts`: the facts and links every page shares (version, release date, license, install URL, GitHub and download URLs).
- `src/docs.tsx`: every docs page, written from the app's README at github.com/ArakunHQ/arakun. Add an entry to add a page.
- `src/styles.css`: the Brandbook tokens and every component's styles. Dark is the default; light is `data-theme="light"` on `<html>`.
- `src/routes/`: one file per page (`index`, `features`, `download`, `changelog`, `docs.index`, `docs.$slug`).
- `src/releases.ts`, `src/release-rewrite.ts`, `src/release-notes.ts`, `src/components/Markdown.tsx`: the changelog's GitHub sync and its Workers AI rewrite (see below).
- `src/components/ui.tsx`: buttons, the install line, cards and other shared pieces.
- `src/components/chrome.tsx`: the sticky header, the theme switch and the footer.
- `src/router.tsx`, `vite.config.ts`: [deploy-watch](https://github.com/rivi-software/tools/tree/main/packages/deploy-watch#readme) moves a tab left open across a deploy onto the new build at its next page change. A build in CI is named after its commit; `pnpm run deploy` by hand names it after `HEAD`.
- `src/components/HeroRaccoon.tsx`: the animated mascot in the home hero.
- `src/components/Celebrate.tsx`: the toast and ASCII burst after a download or copy.
- `public/img/`: real captures of the app, one per theme.

## The changelog syncs from GitHub

The Changelog page reads the releases of github.com/ArakunHQ/arakun. Publish a
release there and it shows on the site within ten minutes. No deploy is needed.

- `src/releases.ts` asks GitHub, at most once every ten minutes, and remembers
  the answer. If GitHub cannot be reached it serves the last answer it has, and
  after that the releases in `src/release-notes.ts`.
- GitHub's notes are a list of pull requests, written for developers. Workers AI
  rewrites them into a short entry per area for people who use the app
  (`src/release-rewrite.ts`). It drops what users would not notice, such as CI,
  tests and dependency bumps. Each release is rewritten once and kept in the
  `CHANGELOG` KV namespace; new notes on GitHub are rewritten again. Until the
  entry is ready, a few seconds after the first visit, the page shows the GitHub notes.
- `src/release-notes.ts` holds hand-written entries per tag. They win over both:
  write one when the rewrite gets something wrong. v0.1.0 and v0.2.1 have one.
- To change the prompt or the model, bump `REWRITE_VERSION` in
  `src/release-rewrite.ts`, so every release is rewritten the new way.
- Drafts are never shown; pre-releases get a "Pre-release" label.
- `pnpm dev` leaves Workers AI off, since it needs a Cloudflare login, and shows
  the GitHub notes. `CHANGELOG_AI=1 pnpm dev` turns it on; the model runs on
  Cloudflare and is billed to your account.
- Optional: `wrangler secret put GITHUB_TOKEN` raises GitHub's limit from 60 to
  5000 requests an hour. A token with no scopes is enough for a public repository.
- The shared cache only works on a custom domain. On a `workers.dev` address each
  Worker instance remembers the answer by itself, which still keeps requests low.

## Analytics

PostHog counts visits and reports errors, through
[posthog-tanstack-start](https://github.com/rivi-software/tools/tree/main/packages/posthog-tanstack-start#readme).

- The browser loads PostHog only after a visitor accepts the cookie banner
  (`src/analytics.ts`, `src/components/ConsentBanner.tsx`). "Cookies" in the
  footer changes the answer. Without consent nothing is stored or sent.
- The Worker reports what server functions throw (`src/start.ts`). It sets no cookie.
- `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` in `wrangler.jsonc` configure both
  sides. The token is public, since browsers send it. Empty turns PostHog off and
  hides the banner. To try it locally, put a token in `.dev.vars`.
- The project is on PostHog's US Cloud. The comment in `wrangler.jsonc` says why,
  and how the DPA with PostHog covers EU visitors.

## On a new release

The changelog needs nothing. The version and the download links do: change
`version` and `released` in `src/site.ts`, and check that the archive names in
`site.downloads` still match the files on the GitHub release.

## Deploys

Every push to `main` deploys to https://arakun.dev, once CI's checks pass (the
"Deploy to arakun.dev" job in `.github/workflows/ci.yml`). Pull requests never deploy.

- `wrangler.jsonc` attaches arakun.dev and www.arakun.dev to the Worker as custom
  domains. A deploy without one of them detaches it, so keep both. The `workers.dev`
  address is off.
- Deploys queue and run one at a time. When a deploy's turn comes and `main` has
  moved on, it skips, and the newer commit's run deploys.
- The job runs in the `production` environment of the GitHub repository. It needs:
  - `CLOUDFLARE_API_TOKEN`, an environment secret: a Cloudflare API token with
    "Edit Cloudflare Workers" on the account and zone that hold arakun.dev. That
    template includes Workers KV Storage, which the first deploy needs to create the
    changelog's `CHANGELOG` namespace.
  - `CLOUDFLARE_ACCOUNT_ID`, an environment variable: the ID of that account.
- Limit the environment to `main` (Settings > Environments > production >
  Deployment branches), so no other branch can read the token.
- To roll back, first cancel any "Deploy to arakun.dev" job that is queued or running
  in the Actions tab, or it deploys `main` again after you. Then run
  `pnpm exec wrangler rollback`, or pick an older version under Workers >
  arakun-website > Deployments in the Cloudflare dashboard. Then revert the commit on
  `main`, or the next push deploys it again.

## Contributing

Issues and pull requests are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) says how to
set up, which checks CI runs and how to write a pull request title. Coding agents
follow [AGENTS.md](AGENTS.md). Report security problems privately, as
[SECURITY.md](SECURITY.md) says. Everyone here follows the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

The website is licensed under the [GNU Affero General Public License v3.0](LICENSE),
like the app. Commercial licenses are available from the copyright holder; see
[NOTICE](NOTICE). Contributors sign the [CLA](CLA.md).
