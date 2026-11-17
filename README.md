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
| `pnpm build` | Builds the Worker and its static assets into `dist/`. |
| `pnpm preview` | Builds, then serves the production build locally. |
| `pnpm typecheck` | Runs TypeScript without emitting. |
| `pnpm deploy` | Builds and deploys with Wrangler. Needs `wrangler login` first. |

## Where things are

- `src/site.ts`: the facts and links every page shares (version, release date, license, install URL, GitHub and download URLs).
- `src/docs.tsx`: every docs page, written from the app's README at github.com/ArakunHQ/arakun. Add an entry to add a page.
- `src/styles.css`: the Brandbook tokens and every component's styles. Dark is the default; light is `data-theme="light"` on `<html>`.
- `src/routes/`: one file per page (`index`, `features`, `download`, `changelog`, `docs.index`, `docs.$slug`).
- `src/releases.ts`, `src/release-notes.ts`, `src/components/Markdown.tsx`: the changelog's GitHub sync (see below).
- `src/components/ui.tsx`: buttons, the install line, cards and other shared pieces.
- `src/components/chrome.tsx`: the sticky header, the theme switch and the footer.
- `src/router.tsx`, `vite.config.ts`: [deploy-watch](https://github.com/rivi-software/tools/tree/main/packages/deploy-watch#readme) moves a tab left open across a deploy onto the new build at its next page change. A build in CI is named after its commit; `pnpm deploy` by hand names it after `HEAD`.
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

## On a new release

The changelog needs nothing. The version and the download links do: change
`version` and `released` in `src/site.ts`, and check that the archive names in
`site.downloads` still match the files on the GitHub release.

## Before launch

The custom domain is not configured. Add a `routes` entry to `wrangler.jsonc`
(or attach the domain in the Cloudflare dashboard) to serve the site at arakun.dev.

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
