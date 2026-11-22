import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import type { Entry } from '#/release-entry'
import { entryFrom } from '#/release-entry'
import { notes } from '#/release-notes'
import type { Platform } from '#/site'
import { site } from '#/site'

/**
 * The changelog's data: the app's releases, read from GitHub.
 *
 * Publishing a release on GitHub is all it takes. The site asks GitHub at most
 * once every ten minutes and remembers the answer, so a new release shows up
 * within ten minutes and no deploy is needed.
 *
 * If GitHub cannot be reached, the last answer is served for as long as it is
 * known, and after that the releases listed in `release-notes.ts`.
 *
 * The changelog entry, written for people who use the app, comes from the top of
 * the release's notes (see `release-entry.ts`). It is written in the version bump
 * pull request of the app. A release without one shows its GitHub notes. An entry
 * in `release-notes.ts` always wins.
 */
export interface Release {
  /** The files attached to the release on GitHub. Empty for a release only known from `release-notes.ts`. */
  assets: { name: string; url: string }[]
  /**
   * The release notes written on GitHub, as markdown. Empty when there are none worth
   * showing, or when the release has a `note`.
   */
  body: string
  name: string
  /** The changelog entry: from `release-notes.ts`, or from the top of the GitHub notes. */
  note: Entry | null
  prerelease: boolean
  /** ISO date GitHub published it, or null for a release only known from `release-notes.ts`. */
  publishedAt: string | null
  source: 'github' | 'fallback'
  tag: string
  url: string
}

const FRESH_FOR = 10 * 60 * 1000
const STALE_FOR = 7 * 24 * 60 * 60

const api =
  site.githubUrl.replace('https://github.com/', 'https://api.github.com/repos/') +
  '/releases?per_page=100'

// One copy per running Worker instance. Enough on its own to keep the site far
// below GitHub's limit of 60 anonymous requests an hour for most traffic.
let remembered: { at: number; releases: Release[] } | undefined

/** GitHub writes this line by itself when a release has no notes. It says nothing a reader needs. */
const onlyCompareLink = /^\s*\*\*Full Changelog\*\*:\s*\S+\s*$/iu

interface GitHubRelease {
  assets?: { browser_download_url: string; name: string }[]
  body: string | null
  draft: boolean
  html_url: string
  name: string | null
  prerelease: boolean
  published_at: string | null
  tag_name: string
}

function fromGitHub(list: GitHubRelease[]): Release[] {
  return list
    .filter((release) => !release.draft)
    .map((release) => ({
      tag: release.tag_name,
      name: release.name?.trim() || release.tag_name,
      assets: (release.assets ?? []).map((asset) => ({
        name: asset.name,
        url: asset.browser_download_url,
      })),
      publishedAt: release.published_at,
      url: release.html_url,
      prerelease: release.prerelease,
      note: entryFrom(release.body ?? ''),
      body: onlyCompareLink.test(release.body ?? '') ? '' : (release.body ?? '').trim(),
      source: 'github' as const,
    }))
}

/** What the page shows when GitHub has never answered: the releases we wrote notes for. */
function fallback(): Release[] {
  return Object.entries(notes).map(([tag, note]) => ({
    tag,
    name: note.title,
    assets: [],
    publishedAt: note.publishedAt ?? null,
    url: `${site.githubUrl}/releases/tag/${tag}`,
    prerelease: false,
    note,
    body: '',
    source: 'fallback' as const,
  }))
}

/**
 * Cloudflare's cache, shared by every instance in a data center. It only
 * stores anything on a custom domain; on workers.dev and in local runs it
 * quietly does nothing, and `remembered` carries the load.
 */
// The page's DOM types do not know Workers' `caches.default`.
const edgeCache = () => (caches as unknown as { default: Cache }).default

const shared = {
  // v5: the changelog entry is read from the GitHub notes. A new key, so an older
  // cached answer without it is never read.
  key: new Request('https://releases.arakun.internal/v5'),
  async read(): Promise<{ at: number; releases: Release[] } | undefined> {
    try {
      const hit = await edgeCache().match(this.key)
      return hit ? await hit.json() : undefined
    } catch {
      return undefined
    }
  },
  async write(value: { at: number; releases: Release[] }) {
    try {
      await edgeCache().put(
        this.key,
        new Response(JSON.stringify(value), {
          headers: {
            'content-type': 'application/json',
            'cache-control': `public, max-age=${STALE_FOR}`,
          },
        })
      )
    } catch {
      // No cache here. The in-memory copy still works.
    }
  },
}

async function askGitHub(): Promise<Release[]> {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'arakun-website',
    'x-github-api-version': '2022-11-28',
  }
  // Optional. Without a token GitHub allows 60 requests an hour per address; with one, 5000.
  const token = (env as { GITHUB_TOKEN?: string }).GITHUB_TOKEN
  if (token) {
    headers.authorization = `Bearer ${token}`
  }
  const url = (env as { GITHUB_RELEASES_URL?: string }).GITHUB_RELEASES_URL || api
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) })
  if (!response.ok) {
    throw new Error(`GitHub answered ${response.status}`)
  }
  return fromGitHub(await response.json())
}

async function readReleases(): Promise<Release[]> {
  const now = Date.now()
  if (remembered && now - remembered.at < FRESH_FOR) {
    return remembered.releases
  }

  const cached = await shared.read()
  if (cached && now - cached.at < FRESH_FOR) {
    remembered = cached
    return cached.releases
  }

  try {
    const releases = await askGitHub()
    remembered = { at: now, releases }
    await shared.write(remembered)
    return releases
  } catch (error) {
    console.warn('Could not read the releases from GitHub.', error)
    // Old news beats no news: the last good answer, then the built-in list.
    const last = remembered ?? cached
    if (last) {
      // Wait a minute before asking again, so an outage does not mean a GitHub call per visitor.
      remembered = { at: now - FRESH_FOR + 60_000, releases: last.releases }
      return last.releases
    }
    return fallback()
  }
}

/** Nightly builds are tagged like `0.7.1-nightly.202611200109`. */
const NIGHTLY = /-nightly\./u

/**
 * A hand-written entry wins. It is applied here, not when GitHub answers, because the
 * edge cache may hold releases from before a deploy that added or changed one.
 */
function withHandNotes(release: Release): Release {
  const hand = notes[release.tag]
  return hand ? { ...release, note: hand } : release
}

// Nightlies come out every day and say nothing a reader of the changelog needs.
export const getReleases = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Release[]> =>
    (await readReleases()).filter((release) => !NIGHTLY.test(release.tag)).map(withHandNotes)
)

/** The release the site offers for download: its version and a file per platform. */
export interface Latest {
  downloads: Record<Platform, string>
  /**
   * arakun-server for Linux, per architecture, when the release has it.
   * Releases up to v0.4.0 have none, and up to v0.4.1 no arm64 one.
   */
  server: Partial<Record<ServerArch, string>>
  version: string
}

export type ServerArch = 'x86_64' | 'arm64'

const LEADING_V = /^v/iu

/**
 * Which file of a release each platform downloads. The first pattern that matches wins.
 * Each starts at `arakun-v`, so `arakun-server-v…-linux-x86_64.tar.gz` is never the app.
 */
const ARCHIVES: Record<Platform, RegExp[]> = {
  Linux: [/^arakun-v.*-linux-x86_64\.tar\.gz$/u],
  'Linux arm64': [/^arakun-v.*-linux-arm64\.tar\.gz$/u],
  Windows: [/^arakun-v.*-windows-x86_64\.zip$/u],
  macOS: [/^arakun-v.*-macos-arm64\.dmg$/u, /^arakun-v.*-macos-arm64\.tar\.gz$/u],
}

const SERVER_ARCHIVES: Record<ServerArch, RegExp> = {
  x86_64: /^arakun-server-v.*-linux-x86_64\.tar\.gz$/u,
  arm64: /^arakun-server-v.*-linux-arm64\.tar\.gz$/u,
}

function serversOf(release: Release): Partial<Record<ServerArch, string>> {
  const servers: Partial<Record<ServerArch, string>> = {}
  for (const [arch, pattern] of Object.entries(SERVER_ARCHIVES) as [ServerArch, RegExp][]) {
    const url = release.assets.find((asset) => pattern.test(asset.name))?.url
    if (url) {
      servers[arch] = url
    }
  }
  return servers
}

function downloadsOf(release: Release): Record<Platform, string> | undefined {
  const downloads: Partial<Record<Platform, string>> = {}
  for (const [platform, patterns] of Object.entries(ARCHIVES) as [Platform, RegExp[]][]) {
    const url = patterns
      .map((pattern) => release.assets.find((asset) => pattern.test(asset.name))?.url)
      .find(Boolean)
    if (!url) {
      return undefined
    }
    downloads[platform] = url
  }
  return downloads as Record<Platform, string>
}

/**
 * The newest stable release that has a file for every platform. A release whose files
 * are still uploading is skipped until they are all there, so a button never points
 * at a file that does not exist yet. Without GitHub, the version in `site.ts`.
 */
function latestOf(list: Release[]): Latest {
  for (const release of list) {
    if (release.prerelease) {
      continue
    }
    const downloads = downloadsOf(release)
    if (downloads) {
      return {
        version: release.tag.replace(LEADING_V, ''),
        downloads,
        server: serversOf(release),
      }
    }
  }
  return { version: site.version, downloads: site.downloads, server: {} }
}

export const getLatest = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Latest> => latestOf(await readReleases())
)
