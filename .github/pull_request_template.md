<!-- Write this so a reader who opens no files still knows why the pull request is needed and what it does. Aim for 150 words or fewer; screenshots, code blocks and <details> blocks don't count. A section you have nothing for gets one bullet: "- None." -->

## Problem

<!-- First line: who is affected and what is wrong for them today. A fix says what breaks (and on which page or browser); a feature names what a visitor can't find or do; a chore says who is blocked. It should stay true under a different solution. The code path goes under Changes. -->

<!-- Fixes an issue? Uncomment the line below so merging closes it. Use "Refs #ISSUE_ID" instead when it only does part of the work. -->
<!-- Closes #ISSUE_ID -->

## Changes

<!-- For each change a visitor can notice, say what they will now see or do differently, not only the code that does it. Mark the rest as mechanical so a reviewer knows nothing visible hides in it. -->

<!-- Visible changes: add a before and after screenshot, in both the dark and the light theme. A short GIF or animated WebP can replace the after screenshot for an interaction one picture can't show. -->

<!-- Breaking change (a URL that no longer works): put `!` in the title, a `BREAKING CHANGE:` line in the commit message, and say here what replaces it. -->

## How did you test this?

<!-- Steps to reproduce and verify, and what you expected to see. Name the pages and browsers you checked by hand. -->
<!-- Don't repeat the commands ticked under Checks; link the CI run instead, and say what you did not check. Long output goes in a <details> block. -->
<!-- Agents: do NOT claim manual testing you haven't done. Say what you could not try, and list only the commands you actually ran. -->

**Checked in:** <!-- Browsers and screen sizes, e.g. "Firefox and Safari, desktop and a 390px phone". For CI-only changes: "GitHub Actions only". -->

## Checks

<!-- Tick only what you ran. Delete an item that does not apply to this diff, so an unticked box always means "not run". The commands are in CONTRIBUTING.md under "Checks". -->

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` and `pnpm exec wrangler deploy --dry-run` pass
- [ ] `wrangler.jsonc` changed: `pnpm cf-typegen` was run and `worker-configuration.d.ts` is committed
- [ ] Dependencies changed: `pnpm-lock.yaml` is committed, and the description says why each new package is needed
- [ ] `.github/` changed: `zizmor .github` passes
- [ ] Visible change: screenshots in both themes are under Changes, and it was checked on a narrow screen
- [ ] One fix or feature per pull request
- [ ] The title follows [Conventional Commits](https://github.com/ArakunHQ/arakun.dev/blob/main/CONTRIBUTING.md#pull-requests) (CI checks it; it becomes the commit message on `main`)
- [ ] I have signed the [CLA](https://github.com/ArakunHQ/arakun.dev/blob/main/CLA.md) (the bot asks on your first pull request; reply with the sentence it gives)

## Docs

<!-- Changed a docs page, the version, a download link or a command shown on the site? Check it against the app's README at github.com/ArakunHQ/arakun, and update README.md here if a command or file moved. Name what you updated, or write "- None." -->

## 🤖 Agent context

<!-- Fill this in if an agent wrote or co-wrote this pull request. Delete it for fully human-written ones. -->

<!-- Keep one: "Human-driven (agent-assisted)" when a person directed the work, or "Fully autonomous" when no one did. -->

**Autonomy:** Human-driven (agent-assisted) - or - Fully autonomous

<!-- The tool and exact model, e.g. "Arakun + Claude Code, Opus 5.5". List each model that wrote code. -->

**Agent:** tool, model

<!-- Every skill that ran (e.g. /simplify), or "None". -->

**Skills:** `/skill`

<details>
<summary>More context for AI agents</summary>

<!-- Agents: collapsed by default and not counted toward the 150 words.
     Rewrite it on every push to describe the pull request at that commit; replace stale bullets, never append a log.
     One line per bullet, under 25 words, 8 bullets at most. Delete a field you have nothing for.
     Paraphrase the user's intent, never paste prompts. Leave out tool output and anything private from the session (keys, tokens, paths under your home directory, other people's data). -->

- **Decisions:** one bullet per decision, and why it beat the obvious alternative
- **Follow-ups:** work left for a later pull request
- **Read closely:** files or lines that need a careful review

</details>

<!-- Rules for agents opening a pull request here:
- Title: Conventional Commits, <type>(<scope>): <description>, as AGENTS.md and CONTRIBUTING.md describe. Pull requests are squashed, so the title becomes the commit on main, and CI fails a title that breaks the rules. Check one with `tools/conventional-commits.sh title "<title>"`.
  ✅ fix(changelog): show pre-releases after stable ones
  ❌ Fixed some changelog bugs.
- Voice: the subject of each sentence is the change, not its author. No "I" in the body; authorship is stated once, under Agent context.
- Body: describe the rationale, not a replay of the session. Pass it straight to `gh pr create --body-file -` on stdin so markdown and newlines survive.
- Draft first: open with `--draft`, get the typecheck and build green locally and CI passing, then mark it ready with `gh pr ready`.
- Split instead of stuffing: if the diff holds separable steps, open them as separate pull requests.
- Never write an @mention you have not verified this session (`gh api user`, `gh pr view --json author,assignees`); never guess a handle from a display name.
- This repository is public (AGPL-3.0): no secrets, private logs or other people's data in code, commits or this description.
- Agent-written pull requests always need a human review; do not self-merge or approve.
-->
