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
- `src/releases.ts`, `src/release-notes.ts`, `src/components/Markdown.tsx`: the changelog's GitHub sync (see below).
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
- The page shows the notes written on the GitHub release. Drafts are never shown;
  pre-releases get a "Pre-release" label.
- `src/release-notes.ts` holds hand-written notes per tag. They are shown for a
  release whose GitHub notes are empty, as v0.1.0's are.
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

- `wrangler.jsonc` attaches arakun.dev to the Worker as a custom domain. Cloudflare
  makes the DNS record and the certificate. The `workers.dev` address is off.
- Before the first deploy, free the name: delete the DNS record for `arakun.dev`, or
  detach the domain from the Pages project or Worker that serves it now. A custom
  domain can't replace an existing record. The `www` redirect can stay.
- Deploys queue and run one at a time. When a deploy's turn comes and `main` has
  moved on, it skips, and the newer commit's run deploys.
- The job runs in the `production` environment of the GitHub repository. It needs:
  - `CLOUDFLARE_API_TOKEN`, an environment secret: a Cloudflare API token with
    "Edit Cloudflare Workers" on the account and zone that hold arakun.dev.
  - `CLOUDFLARE_ACCOUNT_ID`, an environment variable: the ID of that account.
- Limit the environment to `main` (Settings > Environments > production >
  Deployment branches), so no other branch can read the token.
- To roll back, run `pnpm exec wrangler rollback`, or pick an older version under
  Workers > arakun-website > Deployments in the Cloudflare dashboard. Then revert the
  commit on `main`, or the next push deploys it again.

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
