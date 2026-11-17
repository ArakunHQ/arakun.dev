# Instructions for coding agents

These rules come from [CONTRIBUTING.md](CONTRIBUTING.md). If the two disagree,
CONTRIBUTING.md is right; update this file to match.

This repository is the website at arakun.dev: TanStack Start on Cloudflare Workers,
managed with pnpm. The app is a separate repository, ArakunHQ/arakun. The README says
where each part of the site lives.

## Setting up

Node 24.15 or newer (Ultracite needs it) and pnpm (the version in `packageManager` in
`package.json`):

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

## Commits and pull requests

Every commit message and pull request title follows
[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <what the commit does>

<why, if it is not obvious>
```

- **type:** `feat`, `fix`, `docs`, `refactor` (no change in behavior), `perf`, `test`,
  `build` (dependencies, Vite, Wrangler), `ci`, `chore` or `revert`
  (`revert: <the title of the change you undo>`). Pick the one that matches the
  effect for the visitor: a bug fix that needs a refactor is still `fix`.
- **scope** (optional): the page or folder it touches, such as `home`, `features`,
  `download`, `changelog`, `docs`, `ui` or `theme`. Leave it out if the change spans
  many parts.
- **description:** imperative, lower case, no period at the end, under about 70
  characters. `fix(changelog): show pre-releases after stable ones`, not
  `Fixed changelog bug.`
- **Breaking changes** (a URL that no longer works): `!` after the type or scope, and a
  `BREAKING CHANGE:` line in the body that says what replaces it.
- Pull requests are squashed, so the title becomes the commit on `main`. CI fails the
  pull request if the title breaks these rules; check one with
  `tools/conventional-commits.sh title "<title>"`.
- One logical change per commit, and one fix or feature per pull request. Put unrelated
  cleanups in their own commit or pull request.
- Fill in `.github/pull_request_template.md`. Under "How did you test this?", list the
  commands you actually ran. Leave a checklist item unchecked if you did not run it.
- A visible change needs before and after screenshots in both themes. GitHub has no API
  to attach an image, so upload them with `tools/pr-assets.sh <file>...` and paste the
  Markdown it prints. Name each file; don't use a glob. The images are public: no real
  accounts, tokens, email addresses or home-directory paths in them.
- Always open a pull request as a draft: `gh pr create --draft --body-file -`. Run the
  checks below, wait for CI to pass, then mark it ready with `gh pr ready`. Marking it
  ready starts CodeRabbit's review; a workflow then asks a maintainer to review unless
  CodeRabbit approved. Merging is a person's job, not yours.
- Answer every CodeRabbit comment: fix it and push, or reply with the reason. Never
  resolve its threads yourself; that dismisses its approval.

## Before you commit

Run what CI runs, and fix every error:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm check       # lint and format; `pnpm fix` fixes most findings
pnpm build
pnpm exec wrangler deploy --dry-run
# wrangler.jsonc changed: regenerate the Worker types and commit them
pnpm cf-typegen
# .github/ changed: pin actions by SHA, see "Checks" in CONTRIBUTING.md
zizmor .github
```

If you add or update a dependency, commit `pnpm-lock.yaml` too. Keep dependencies few;
they must run on Cloudflare Workers, and GPL, LGPL and AGPL packages can't be used.
`lefthook install` runs the typecheck, the lint and the commit message check as Git
hooks.

## Code

- The version, release date, license and every download and GitHub link come from
  `src/site.ts`. Never write a version or a URL into a page.
- Styles use the CSS variables in `src/styles.css` (colors, fonts, text sizes, radii),
  never hand-written values. Check both themes: dark is the default, light is
  `data-theme="light"` on `<html>`.
- Docs pages are MDX in `content/docs/` and follow the README of ArakunHQ/arakun. Keep
  them in step when the app changes. Write `{site.version}` and the like for facts from
  `src/site.ts`; "Writing docs" in the README lists the components.
- Comments say why, not what. Comments and text on the site use plain, short sentences.
- Never commit a token. `GITHUB_TOKEN` is a Wrangler secret (`wrangler secret put`),
  and `.dev.vars` is ignored by git.
