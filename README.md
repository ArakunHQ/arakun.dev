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
- `content/docs/`: every docs page as MDX, written from the app's README at github.com/ArakunHQ/arakun. See "Writing docs" below.
- `src/docs.ts`, `src/components/mdx.tsx`, `source.config.ts`: how the docs load, the components pages can use, and the MDX build.
- `src/styles.css`: the Brandbook tokens and every component's styles. Dark is the default; light is `data-theme="light"` on `<html>`.
- `src/routes/`: one file per page (`index`, `features`, `download`, `changelog`, `docs.index`, `docs.$slug`).
- `src/releases.ts`, `src/release-notes.ts`, `src/components/Markdown.tsx`: the changelog's GitHub sync (see below).
- `src/components/ui.tsx`: buttons, the install line, cards and other shared pieces.
- `src/components/chrome.tsx`: the sticky header, the theme switch and the footer.
- `src/router.tsx`, `vite.config.ts`: [deploy-watch](https://github.com/rivi-software/tools/tree/main/packages/deploy-watch#readme) moves a tab left open across a deploy onto the new build at its next page change. A build in CI is named after its commit; `pnpm run deploy` by hand names it after `HEAD`.
- `src/components/HeroRaccoon.tsx`: the animated mascot in the home hero.
- `src/components/Celebrate.tsx`: the toast and ASCII burst after a download or copy.
- `public/img/`: real captures of the app, one per theme.

## Writing docs

Each docs page is one MDX file in `content/docs/`: Markdown, plus a few components.
[Fumadocs MDX](https://fumadocs.dev/docs/mdx) compiles them when the site builds.

````mdx
---
title: Read a terminal
description: arakun run and arakun logs.
---

## Start a command and wait for it

```sh
arakun run --port 5173 npm run dev
```
````

- **Add a page:** add `content/docs/<slug>.mdx`, then put `<slug>` in
  `content/docs/meta.json`. Its place there sets the order, and the `---Group---` line
  above it sets its group. The build fails if a page is missing from `meta.json`. The
  page is served at `/docs/<slug>`.
- **title** and **description** are required. The description is the line under the
  title, in the docs index and on the link preview card.
- **Facts from `src/site.ts`:** write `{site.version}`, `{site.installUrl}`,
  `{site.privacyEmail}` and so on. They work in text, code, code blocks and links
  (`[mail](mailto:{site.privacyEmail})`). A name that doesn't exist fails the build.
- **Headings:** `##` and `###` make the "On this page" list and get a link to themselves.
- **Code blocks** are highlighted at build time and get a copy button.
  `title="hyprland.conf"` after the language adds a title. `tab="Windows"` on code blocks
  next to each other turns them into tabs. `// [!code highlight]` at the end of a line
  marks the line.
- **Components**, no import needed:

| Component | Use |
| --- | --- |
| `<Callout type="info\|tip\|warn\|error\|success" title="…">` | A note set apart from the text. `type` and `title` are optional. |
| `<Steps>` with a `<Step>` per step | Numbered steps. Put them under a `##` heading and start each step with a `###` heading. |
| `<Tabs items={['a', 'b']}>` with `<Tab value="a">` | Content that differs per platform or option. |
| `<Cards>` with `<Card title="…" href="/docs/…" description="…" />` | Links to other pages. |
| `<Accordions>` with `<Accordion title="…">` | Details a reader can open. |
| `<kbd>Ctrl+T</kbd>` | A key. |

Inside a component, leave a blank line after the opening tag and before the closing
one, so the Markdown in between is read as Markdown. `pnpm dev` reloads a page when its
file changes.

## The changelog syncs from GitHub

The Changelog page reads the releases of github.com/ArakunHQ/arakun. Publish a
release there and it shows on the site within ten minutes. No deploy is needed.

- `src/releases.ts` asks GitHub, at most once every ten minutes, and remembers
  the answer. If GitHub cannot be reached it serves the last answer it has, and
  after that the releases in `src/release-notes.ts`.
- The page shows the notes written on the GitHub release. Drafts are never shown;
  pre-releases get a "Pre-release" label.
- `src/release-notes.ts` holds hand-written notes per tag. They are shown in
  place of the GitHub notes: for v0.1.0, whose notes are empty, and for v0.2.1
  and v0.3.0, whose notes are GitHub's generated list of pull requests.
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
    "Edit Cloudflare Workers" on the account and zone that hold arakun.dev.
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
