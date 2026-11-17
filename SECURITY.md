# Security policy

This repository is the website at arakun.dev, a Cloudflare Worker. It serves the
download links and install commands for the Arakun app, and shows release notes it
reads from GitHub. We take reports about any of these seriously.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report it privately through GitHub Security Advisories:
<https://github.com/arakunhq/arakun/security/advisories/new>
(the app repository's **Security** tab, then **Report a vulnerability**). The same
maintainers look after the site, so use that form for the site too, and say that the
report is about arakun.dev.

Include what you can of:

- the affected page or commit;
- what an attacker can do, and what they need first (a crafted link, a GitHub release
  they can edit, a position on the network...);
- steps or a proof of concept to reproduce it.

We will acknowledge the report, keep you updated while we work on a fix, and credit you in
the advisory unless you prefer otherwise. Please give us a reasonable time to release a
fix before disclosing details publicly.

## Supported versions

Only the site that is live at arakun.dev, built from `main`, is supported.

## Scope

Of particular interest:

- **Downloads and install commands.** A way to make the site point a visitor at a file,
  a script or an install command that does not come from ArakunHQ/arakun.
- **Release notes.** The Changelog renders Markdown from GitHub releases
  (`src/components/Markdown.tsx`). Script injection, unsafe links, or a way to make the
  page show content that is not on the release.
- **The Worker.** Cache poisoning of the shared release cache, responses one visitor can
  change for another, or leaking the `GITHUB_TOKEN` secret.

Out of scope: vulnerabilities in the Arakun app itself (report those with the same form,
as an app issue), in Cloudflare or GitHub, and findings that need a compromised browser
or machine. Missing headers or a scanner's output with no way to use it are not
vulnerabilities on their own, although we welcome the report.
