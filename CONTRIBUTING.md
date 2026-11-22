# Contributing to the Arakun website

Thanks for helping out. Issues, ideas and pull requests are all welcome.

This repository is the website at [arakun.dev](https://arakun.dev). The app itself
lives in [ArakunHQ/arakun](https://github.com/ArakunHQ/arakun), and has its own
[contributing guide](https://github.com/ArakunHQ/arakun/blob/main/CONTRIBUTING.md).

## Ways to help

- **Report a problem with the site** with the
  [bug report form](https://github.com/ArakunHQ/arakun.dev/issues/new/choose): a broken
  link, a page that looks wrong, text that is out of date. The page's address, your
  browser and a screenshot help most.
- **Suggest a change** with the feature request form. Say what a visitor can't find or
  do today, not only the fix you have in mind.
- **Fix the docs.** The docs pages come from the app's README. If a page says something
  the app no longer does, fix it here, or in the app's README if that is wrong too.
- **Send a pull request.** For anything bigger than a small fix, open an issue first so
  we can agree on the approach before you spend time on it.

**A bug in the app**, not the site? Report it in
[ArakunHQ/arakun](https://github.com/ArakunHQ/arakun/issues/new/choose).

**Security problems:** do not open a public issue. Follow [SECURITY.md](SECURITY.md).

## Contributor License Agreement

First-time contributors are asked to sign our [CLA](CLA.md). That includes anyone
named in a `Co-authored-by` line, except coding agents such as Claude Code. A bot
comments on your first pull request, and signing is a reply with only this
sentence:

```
I have read the CLA Document and I hereby sign the CLA
```

In short: **you keep the copyright to your work** and grant the maintainer the
right to distribute it under other terms too. The site's code stays AGPL-3.0, as
the app's does. Unsigned pull requests can't be merged.

## Setting up

You need [Node](https://nodejs.org/) 24.15 or newer and [pnpm](https://pnpm.io/). The
pnpm version is pinned in `packageManager` in `package.json`; `corepack enable` picks
it up. Node 25 and newer no longer include Corepack, so install it first with
`npm install -g corepack`.

```sh
pnpm install
pnpm dev          # http://localhost:3000, in the Workers runtime
```

The [README](README.md) says where each part of the site lives.

## Checks

CI runs these on every pull request. Run them before you push:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm check       # lint and format; `pnpm fix` fixes most findings
pnpm build
pnpm exec wrangler deploy --dry-run   # checks the Worker bundles; uploads nothing

# .github/ changed (brew install zizmor, or pipx install zizmor)
zizmor .github
```

CI also fails when `worker-configuration.d.ts` is out of date. After you change
`wrangler.jsonc`, run `pnpm cf-typegen` and commit the result.

Some notes:

- `--frozen-lockfile` fails if `pnpm-lock.yaml` would change. If you add or update a
  dependency, commit the new lockfile in the same pull request.
- `zizmor .github` checks the workflows for security problems. Pin every action to a
  full commit SHA with its version as a comment (`uses: owner/action@<sha> # v1.2.3`);
  Dependabot updates both. Give `actions/checkout` `persist-credentials: false` unless
  the job pushes, and a job only the `permissions:` it uses. If a finding is safe
  where it is, add `# zizmor: ignore[<rule>]` to the line it points at and say why.

### Git hooks

[`lefthook.yml`](lefthook.yml) runs the typecheck and the lint on commit, and checks
the commit message. Install [lefthook](https://lefthook.dev/installation/) (for example
`brew install lefthook` or `npm install -g lefthook`), then turn the hooks on in your
checkout:

```sh
lefthook install
```

Skip the hooks for one command with `LEFTHOOK=0 git commit ...`. Put your own changes
in `lefthook-local.yml`, which git ignores. Turn the hooks off with `lefthook uninstall`.

## Writing code

- **Facts in one place.** The version, release date, license and every download and
  GitHub link are in `src/site.ts`. Use them from there; don't write a version or a URL
  into a page.
- **Use the design tokens.** Colors, fonts, sizes and radii are CSS variables in
  `src/styles.css`, from the Brandbook. Use the variable, not a hand-written value.
  Check every change in both themes: dark is the default, and light is
  `data-theme="light"` on `<html>`.
- **Comments** say why, not what. Write plain, short sentences, as in the existing code
  and docs. The same goes for text on the site.
- **New dependencies:** keep them few. The site runs on Cloudflare Workers, so a package
  must work there, and everything it ships adds to the bundle. Say in the pull request
  why it is needed. Its license must allow use in AGPL-3.0 code that is also offered
  under other terms: no GPL, LGPL or AGPL packages.
- **Docs pages.** If the app's behavior changed, check the README of
  [ArakunHQ/arakun](https://github.com/ArakunHQ/arakun) and keep the pages in
  `content/docs/` in step with it. The README says how to write one.
- **Add a screenshot** to the pull request for any visible change, before and after,
  in both themes. Drag it into the description. With write access to
  [ArakunHQ/pr-assets](https://github.com/ArakunHQ/pr-assets), `tools/pr-assets.sh
  <file>...` uploads it there instead and prints the Markdown to paste; agents do
  this, since GitHub has no API to upload images. That repository is public: no
  real accounts, tokens, email addresses or home-directory paths in the picture.

## Pull requests

- **One fix or feature per pull request.** Split unrelated cleanups into their own.
- **Fill in the template:** what changed and why, the issue it fixes, and how you
  checked it (the commands you ran and what you tried by hand).
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/):

  ```
  <type>(<scope>): <what the commit does>

  <why, if it is not obvious>
  ```

  - **type:** `feat` (a new page or feature), `fix` (a bug fix), `docs`, `refactor`
    (no change in behavior), `perf`, `test`, `build` (dependencies, Vite, Wrangler),
    `ci`, `chore` or `revert` (`revert: <the title of the change you undo>`).
  - **scope** (optional): the part of the site it touches, usually a page or folder:
    `home`, `features`, `download`, `changelog`, `docs`, `ui`, `theme`...
  - **description:** imperative and lower case, with no period at the end, for example
    `fix(changelog): show pre-releases after stable ones` or
    `feat(download): add the macOS archive`.
  - **Breaking changes** (a URL that no longer works): add `!` after the type or scope,
    and a `BREAKING CHANGE:` line in the body that says what replaces it.

  Give the pull request title the same format. Pull requests are squashed, so the title
  becomes the commit message on `main`. The **Pull request title** check fails on a title
  that does not follow it; edit the title and the check runs again by itself. Check one
  with `tools/conventional-commits.sh title "<title>"`.

  Commits inside the pull request are not checked, because they do not reach `main`. To
  check them as you write them, turn on the [Git hooks](#git-hooks).
- **Open it as a draft** (`gh pr create --draft`) while CI runs, and mark it ready with
  `gh pr ready` once the checks pass. Nobody is asked to review a draft, and CodeRabbit
  skips it. Marking it ready starts CodeRabbit's review. When it finishes, a maintainer
  is asked to review unless CodeRabbit approved and every review thread is resolved. A
  pull request from outside the team always needs a maintainer's approval: a workflow
  dismisses CodeRabbit's, and the **Human approval** status waits for a person.
- **Answer every CodeRabbit comment.** Fix it and push, or reply with the reason you
  won't. Don't resolve its comments yourself: if you do, a workflow dismisses its
  approval and asks a person. `@coderabbitai resolve` and `@coderabbitai approve` don't
  work on your own pull request.
- **Keep the branch up to date** with `main`, and make sure CI passes before you ask for
  a review. If a check fails and you think it is not your change, say so in the pull
  request.
- **Coding agents are welcome.** You are still responsible for the change: read the
  diff, run the checks, and make sure you can explain it. [AGENTS.md](AGENTS.md) gives
  agents the rules from this guide (`CLAUDE.md` loads it for Claude Code). If you change
  a rule here, change it there too.

## License

By contributing you agree that your contribution is released under the
[GNU Affero General Public License v3.0](LICENSE), in addition to the grants in
the [CLA](CLA.md).
