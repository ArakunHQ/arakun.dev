// CLA check (.github/workflows/cla.yml).
//
// Everyone who wrote a commit in a pull request, co-authors included, and the
// person who opened it, must have signed CLA.md. Coding agents named as
// co-authors are left out. The signatures are a JSON file on the cla-signatures
// branch, in the format the contributor-assistant action used before, so the
// old signatures still count. People are matched by their
// GitHub user id, which stays the same when they rename their account.
//
// The result is a commit status on the head commit, not the job's own check,
// because a run from a comment can't put a check on the pull request. A status
// belongs to the commit, so it covers every open pull request with that head.
// A comment on each pull request says who still has to sign and how.
//
// This runs with a write token on pull requests from forks. It reads the pull
// request only through the API and never runs its code. Keep it that way.
//
// Env: GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_EVENT_NAME, GITHUB_EVENT_PATH,
// optional GITHUB_API_URL, GITHUB_SERVER_URL, RUN_URL and PR (a pull request
// number for workflow_dispatch; empty checks every open pull request).

import { readFileSync } from "node:fs";

export const SENTENCE = "I have read the CLA Document and I hereby sign the CLA";
// The main ruleset requires a status with this name. It is the same name as in
// ArakunHQ/arakun, whose copy of this script this is.
const CONTEXT = "cla-assistant";
const BRANCH = "cla-signatures";
const FILE = "signatures/cla.json";
// Finds our own comment again, so a pull request gets one, kept up to date.
const MARKER = "<!-- arakun-cla -->";
// The copyright holder doesn't need a license from themselves.
// By user id (KarloAldrete), which survives a rename.
const ALLOWED = new Set([66887635]);
// Coding agents that commits name as a co-author. They are tools, not people,
// and can't sign; the person who ran them signs for the commit. By user id:
// claude (Claude Code), codex (Codex), cursoragent (Cursor), Copilot.
const AGENTS = new Set([81847, 267193182, 199161495, 198982749]);

const normalize = (text) => text.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * A comment signs if, outside quotes, it is the sentence and nothing else, in
 * any case and spacing. A comment that only mentions the sentence, such as a
 * question about it, has not agreed.
 */
export function signs(body) {
  // A quote runs on over lines without ">" until a blank line, as in GitHub's
  // markdown. Dropping too much only means signing again.
  let quoted = false;
  const own = (body ?? "")
    .split("\n")
    .filter((line) => {
      if (/^\s*>/.test(line)) quoted = true;
      else if (line.trim() === "") quoted = false;
      return !quoted;
    })
    // The bot shows the sentence in a code block, so a copy may bring the
    // fences or backticks along.
    .filter((line) => !/^\s*(```|~~~)\w*\s*$/.test(line))
    .join("\n");
  const text = normalize(own).replace(/^`+|`+$/g, "").replace(/[.!\s]+$/, "").trim();
  return text === normalize(SENTENCE);
}

/** A comment asks for a new check if it has the word "recheck". */
export function rechecks(body) {
  return /\brecheck\b/i.test(body ?? "");
}

export function exempt(user) {
  return user.type === "Bot" || user.login.endsWith("[bot]") || ALLOWED.has(user.id) || AGENTS.has(user.id);
}

/**
 * Who has to sign for a pull request: its author and every author and
 * co-author (Co-authored-by) of its commits, leaving out bots, coding agents
 * and the allow-list. `unknown` holds the commits with an author or co-author
 * whose email is not linked to a GitHub account, so no one can sign for them.
 * A commit's `coAuthors` are users, or null for one that isn't linked.
 */
export function signers(pr, commits) {
  const users = new Map();
  const unknown = [];
  const add = (user) => {
    if (user && !exempt(user)) users.set(user.id, user.login);
  };
  add(pr.user);
  for (const c of commits) {
    const people = [c.author?.id ? c.author : null, ...(c.coAuthors ?? [])];
    for (const user of people) add(user);
    if (people.includes(null)) unknown.push({ sha: c.sha });
  }
  return { users, unknown };
}

/** The users in `users` (id -> login) who have no signature yet. */
export function unsigned(users, signatures) {
  const signed = new Set(signatures.signedContributors.map((s) => s.id));
  return [...users].filter(([id]) => !signed.has(id)).map(([id, login]) => ({ id, login }));
}

export function commentBody({ missing, unknown, truncated = false, claUrl }) {
  if (missing.length === 0 && unknown.length === 0 && !truncated) {
    return `${MARKER}\nEveryone in this pull request has signed the [CLA](${claUrl}). Thank you!\n`;
  }
  const lines = [
    MARKER,
    `Thank you for your pull request. Before it can be merged, everyone who wrote a commit in it must sign our [Contributor License Agreement](${claUrl}). You keep the copyright to your work.`,
    "",
  ];
  if (missing.length > 0) {
    lines.push(
      "To sign, read the CLA, then post this comment, and nothing else, on this pull request:",
      "",
      "```",
      SENTENCE,
      "```",
      "",
      // Code spans, not @mentions: a fork can write commits under anyone's
      // email, and the bot must not ping them for it.
      `Still to sign: ${missing.map((m) => `\`${m.login}\``).join(", ")}`,
      "",
    );
  }
  if (unknown.length > 0) {
    lines.push(
      "These commits have an author or co-author email that is not linked to a GitHub account, so no one can sign for them:",
      "",
      // Only the hash: the author name is whatever the commit says, and the
      // bot must not repeat it.
      ...unknown.map((u) => `- ${u.sha}`),
      "",
      "Add the email to the GitHub account it belongs to, or rewrite the commits with an email that is on one.",
      "",
    );
  }
  if (truncated) {
    lines.push(
      "GitHub didn't list every commit in this pull request, or every author of one, so the rest can't be checked. Squash it into fewer commits, or ask a maintainer to check them by hand.",
      "",
    );
  }
  lines.push("Post `recheck` to check again.");
  return `${lines.join("\n")}\n`;
}

// --- GitHub API -------------------------------------------------------------

const API = process.env.GITHUB_API_URL || "https://api.github.com";
const REPO = process.env.GITHUB_REPOSITORY;
const TOKEN = process.env.GITHUB_TOKEN;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function gh(method, path, body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(path.startsWith("https://") ? path : `${API}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${TOKEN}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // The signature file is read again to spot changes; never from a cache.
      cache: "no-store",
    });
    if (res.ok) return res.status === 204 ? null : res.json();
    if (attempt < 3 && (res.status >= 500 || res.status === 429)) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
      continue;
    }
    throw new HttpError(res.status, `${method} ${path}: ${res.status} ${await res.text()}`);
  }
}

const GRAPHQL = process.env.GITHUB_GRAPHQL_URL || `${API}/graphql`;

async function graphql(query, variables) {
  const res = await gh("POST", GRAPHQL, { query, variables });
  if (res.errors?.length) throw new Error(`GraphQL: ${res.errors.map((e) => e.message).join("; ")}`);
  return res.data;
}

// More co-authors than this on one commit counts as not every author listed.
const MAX_AUTHORS = 50;

/**
 * Adds `coAuthors` to each commit: everyone GitHub lists as its author,
 * including Co-authored-by trailers, which only GraphQL resolves to users.
 * Returns false if some commit had more authors than could be listed.
 */
async function addCoAuthors(commits) {
  const [owner, name] = REPO.split("/");
  let complete = true;
  for (let i = 0; i < commits.length; i += 50) {
    const batch = commits.slice(i, i + 50);
    // The shas come from GitHub's compare and are checked, so they are safe
    // to put in the query.
    const fields = batch
      .map((c, j) => {
        if (!/^[0-9a-f]{40}$/.test(c.sha)) throw new Error(`Not a commit sha: ${c.sha}`);
        return `c${j}: object(oid: "${c.sha}") { ... on Commit { authors(first: ${MAX_AUTHORS}) { totalCount nodes { user { databaseId login } } } } }`;
      })
      .join("\n");
    const data = await graphql(
      `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { ${fields} } }`,
      { owner, name },
    );
    batch.forEach((c, j) => {
      const authors = data.repository[`c${j}`]?.authors;
      if (!authors || authors.totalCount > authors.nodes.length) complete = false;
      c.coAuthors = (authors?.nodes ?? []).map((a) => (a.user ? { id: a.user.databaseId, login: a.user.login } : null));
    });
  }
  return complete;
}

async function paged(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const items = await gh("GET", `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    out.push(...items);
    if (items.length < 100) return out;
  }
}

async function readSignatures() {
  try {
    const file = await gh("GET", `/repos/${REPO}/contents/${FILE}?ref=${BRANCH}`);
    return { data: JSON.parse(Buffer.from(file.content, "base64").toString("utf8")), sha: file.sha };
  } catch (e) {
    if (e.status === 404) return { data: { signedContributors: [] }, sha: undefined };
    throw e;
  }
}

/** Adds a signature. Returns false if the user had signed already. */
async function addSignature(user, comment, prNumber, repoId) {
  // The update names the file version it read, so two runs signing at once
  // can't overwrite each other: the second fails and reads again.
  for (let attempt = 1; ; attempt++) {
    const { data, sha } = await readSignatures();
    if (data.signedContributors.some((s) => s.id === user.id)) return false;
    data.signedContributors.push({
      name: user.login,
      id: user.id,
      comment_id: comment.id,
      created_at: comment.created_at,
      repoId,
      pullRequestNo: prNumber,
    });
    const content = Buffer.from(`${JSON.stringify(data, null, 2)}\n`).toString("base64");
    try {
      await gh("PUT", `/repos/${REPO}/contents/${FILE}`, {
        message: `@${user.login} has signed the CLA in ${REPO}#${prNumber}`,
        content,
        sha,
        branch: BRANCH,
      });
      return true;
    } catch (e) {
      if (attempt < 5 && (e.status === 409 || e.status === 422)) continue;
      throw e;
    }
  }
}

/**
 * Who has to sign for pull request `pr` at commit `sha`. The commits come from
 * comparing the base commit with `sha` itself, not from the pull request,
 * whose head may have moved since: a status on `sha` must judge `sha`. The
 * base is a commit, not the branch name, so every page compares the same two.
 */
async function review(pr, sha) {
  const commits = [];
  let total;
  for (let page = 1; ; page++) {
    const compare = await gh("GET", `/repos/${REPO}/compare/${pr.baseSha}...${sha}?per_page=100&page=${page}`);
    total = compare.total_commits;
    commits.push(...compare.commits);
    if (compare.commits.length < 100 || commits.length >= total) break;
  }
  const allAuthors = await addCoAuthors(commits);
  // If GitHub didn't return every commit (or no count), or every author of
  // one, the rest are unknown, so the check fails rather than pass on what it
  // saw.
  return { pr, ...signers(pr, commits), truncated: !(commits.length >= total) || !allAuthors };
}

/** `pr` with `baseSha`, the commit its base branch points at now. */
async function withBase(pr) {
  const ref = pr.base.ref.split("/").map(encodeURIComponent).join("/");
  const { object } = await gh("GET", `/repos/${REPO}/git/ref/heads/${ref}`);
  return { ...pr, baseSha: object.sha };
}

/**
 * The status for a commit that is the head of every pull request in `results`.
 * A status belongs to the commit, not the pull request, so it passes only if
 * it passes for each of them.
 */
export function verdict(results) {
  const missing = [...new Set(results.flatMap((r) => r.missing.map((m) => m.login)))];
  if (missing.length > 0) {
    const description = `Still to sign the CLA: ${missing.join(", ")}`;
    return { state: "failure", description: description.length > 140 ? `${description.slice(0, 137)}...` : description };
  }
  if (results.some((r) => r.unknown.length > 0)) {
    return { state: "failure", description: "Some commit authors have no GitHub account; see the comment." };
  }
  if (results.some((r) => r.truncated)) {
    return { state: "failure", description: "Not every commit or author could be listed; check them by hand." };
  }
  return { state: "success", description: "Everyone has signed the CLA." };
}

async function updateComment(result, claUrl) {
  const { number } = result.pr;
  // Only comment on a pull request that needs it, and once there is a comment,
  // keep it current, so it says "signed" after the last signature.
  const comments = await paged(`/repos/${REPO}/issues/${number}/comments`);
  const ours = comments.find((c) => c.user.login === "github-actions[bot]" && c.body.startsWith(MARKER));
  const body = commentBody({ ...result, claUrl });
  if (ours) {
    if (ours.body !== body) await gh("PATCH", `/repos/${REPO}/issues/comments/${ours.id}`, { body });
  } else if (verdict([result]).state !== "success") {
    await gh("POST", `/repos/${REPO}/issues/${number}/comments`, { body });
  }
}

const openPulls = () => paged(`/repos/${REPO}/pulls?state=open`);
// What a review depends on: the base can move or be rewritten under the same
// pull request, and that changes which commits it brings.
const key = (pr) => `${pr.number}:${pr.baseSha}`;

/** The open pull requests with `sha` as their head, with their base commits. */
async function headsOf(sha) {
  return Promise.all((await openPulls()).filter((p) => p.head.sha === sha).map(withBase));
}

/** Leaves `sha` blocked with a reason, when this run can't vouch for its result. */
async function giveUp(sha, description) {
  try {
    await gh("POST", `/repos/${REPO}/statuses/${sha}`, {
      state: "error",
      context: CONTEXT,
      description,
      target_url: process.env.RUN_URL || undefined,
    });
  } catch (e) {
    console.log(`::error::${sha}: couldn't set the error status: ${e.message}`);
  }
}

/**
 * Sets the status of `sha` from the open pull requests that have it as their
 * head. Fails closed: if anything goes wrong before the status is confirmed,
 * an earlier status, maybe a success, must not stand, so it becomes an error.
 */
async function check(sha, claUrl) {
  let errors;
  try {
    errors = await judge(sha, claUrl);
  } catch (e) {
    await giveUp(sha, e.giveUp ?? "Couldn't check this commit; post recheck on the pull request.");
    throw e;
  }
  // Only comments failed: the status itself is right, so it stays.
  if (errors.length > 0) throw errors[0];
}

/** check() without the fallback. Returns the errors from updating comments. */
async function judge(sha, claUrl) {
  let prs = await headsOf(sha);
  if (prs.length === 0) {
    console.log(`${sha}: the head of no open pull request, skipped.`);
    return [];
  }
  // The commits between a base commit and `sha` don't change, so a review is
  // reused across tries.
  const reviews = new Map();
  // Runs don't wait for each other: another run may record a signature, or a
  // pull request with this head may open or change its base, while this one
  // checks. After posting, look at all of it again, and check again if
  // anything changed, so the last status posted for `sha` saw the newest.
  let before = await readSignatures();
  for (let attempt = 1; ; attempt++) {
    for (const pr of prs) if (!reviews.has(key(pr))) reviews.set(key(pr), await review(pr, sha));
    const results = prs.map((pr) => {
      const r = reviews.get(key(pr));
      return { ...r, missing: unsigned(r.users, before.data) };
    });
    const { state, description } = verdict(results);
    await gh("POST", `/repos/${REPO}/statuses/${sha}`, {
      state,
      context: CONTEXT,
      description,
      target_url: process.env.RUN_URL || undefined,
    });
    console.log(`${sha} (${prs.map((p) => `#${p.number}`).join(", ")}): ${state}, ${description}`);
    // A comment that fails to update must not skip the look below: the status
    // just posted may already be stale.
    const errors = [];
    for (const result of results) {
      try {
        await updateComment(result, claUrl);
      } catch (e) {
        errors.push(e);
      }
    }

    const [after, now] = await Promise.all([readSignatures(), headsOf(sha)]);
    const same = (a, b) => a.map(key).sort().join() === b.map(key).sort().join();
    // No open pull request has this head any more, so its status no longer matters.
    if (now.length === 0 || (after.sha === before.sha && same(now, prs))) return errors;
    if (attempt === 5) {
      throw Object.assign(new Error(`${sha}: the signatures or pull requests kept changing.`), {
        giveUp: "Signatures or pull requests kept changing; post recheck on the pull request.",
      });
    }
    before = after;
    prs = now;
  }
}

async function main() {
  if (!REPO || !TOKEN) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  const name = process.env.GITHUB_EVENT_NAME;
  const server = process.env.GITHUB_SERVER_URL || "https://github.com";
  const repo = event.repository ?? (await gh("GET", `/repos/${REPO}`));
  const claUrl = `${server}/${REPO}/blob/${repo.default_branch}/CLA.md`;
  const all = async () => (await openPulls()).map((p) => p.head.sha);

  // The commits whose status may change.
  let shas;
  if (name === "pull_request_target") {
    // After a push or a close, the old head may still be the head of another
    // open pull request, whose status no longer has to include this one.
    shas = [event.pull_request.head.sha, event.before];
  } else if (name === "issue_comment") {
    if (!event.issue.pull_request) return;
    const { comment } = event;
    const pr = await withBase(await gh("GET", `/repos/${REPO}/pulls/${event.issue.number}`));
    shas = [pr.head.sha];
    if (signs(comment.body)) {
      // Only someone this pull request needs can sign here, so a comment
      // can't sign for someone else.
      if ((await review(pr, pr.head.sha)).users.has(comment.user.id)) {
        if (await addSignature(comment.user, comment, pr.number, repo.id)) {
          console.log(`@${comment.user.login} signed the CLA.`);
        } else {
          console.log(`@${comment.user.login} had signed already.`);
        }
        // Their other open pull requests were waiting for this too. Also when
        // the signature was there already: a rerun of a run that saved it but
        // failed on some pull request must reach those again.
        shas = await all();
      } else {
        console.log(`@${comment.user.login} doesn't need to sign for #${pr.number}; ignored.`);
      }
    } else if (!rechecks(comment.body)) {
      return;
    }
  } else if (name === "push") {
    // This workflow or its script changed on the default branch: judge every
    // open pull request under the new rules, not the last run's.
    shas = await all();
  } else if (name === "workflow_dispatch") {
    const number = (process.env.PR ?? "").trim();
    if (number && !/^[0-9]+$/.test(number)) throw new Error(`Not a pull request number: ${number}`);
    shas = number ? [(await gh("GET", `/repos/${REPO}/pulls/${number}`)).head.sha] : await all();
  } else {
    throw new Error(`Unexpected event: ${name}`);
  }

  let failed = false;
  for (const sha of new Set(shas.filter((s) => /^[0-9a-f]{40}$/.test(s ?? "") && !/^0+$/.test(s)))) {
    try {
      await check(sha, claUrl);
    } catch (e) {
      // One broken pull request must not leave the others unchecked.
      console.log(`::error::${sha}: ${e.message}`);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
