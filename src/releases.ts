import { env, waitUntil } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { notes } from '#/release-notes'
import type { Entry } from '#/release-rewrite'
import { changesFrom, entryFrom, MODEL, prompt, REWRITE_VERSION } from '#/release-rewrite'
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
 * GitHub's notes are written for developers. Workers AI rewrites them into a
 * changelog entry for people who use the app (see `release-rewrite.ts`), once
 * per release, and KV keeps the result. Until it is ready, which takes seconds,
 * the page shows the GitHub notes. A hand-written entry in `release-notes.ts`
 * always wins.
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
  /** The changelog entry: written by hand in `release-notes.ts`, or by Workers AI. */
  note: Entry | null
  prerelease: boolean
  /** ISO date GitHub published it, or null for a release only known from `release-notes.ts`. */
  publishedAt: string | null
  /** True when Workers AI wrote `note`, so the page can say so. */
  rewritten: boolean
  source: 'github' | 'fallback'
  tag: string
  url: string
}

const FRESH_FOR = 10 * 60 * 1000
const STALE_FOR = 7 * 24 * 60 * 60

const api =
  site.githubUrl.replace('https://github.com/', 'https://api.github.com/repos/') +
  '/releases?per_page=30'

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
      note: notes[release.tag_name] ?? null,
      rewritten: false,
      body:
        notes[release.tag_name] || onlyCompareLink.test(release.body ?? '')
          ? ''
          : (release.body ?? '').trim(),
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
    rewritten: false,
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
  // v4: releases carry their assets and their changelog entry. A new key, so an
  // older cached answer without them is never read.
  key: new Request('https://releases.arakun.internal/v4'),
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

// An entry never changes for its key, so once read it can stay in memory.
const entries = new Map<string, Entry>()
// Rewrites this instance has started, so a busy page starts each one once.
const started = new Set<string>()

/** Where an entry is kept. A new version or new GitHub notes give a new key. */
async function entryKey(release: Release): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(release.body))
  const hash = [...new Uint8Array(digest).slice(0, 8)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `entry:v${REWRITE_VERSION}:${release.tag}:${hash}`
}

/** Asks Workers AI for an entry and keeps it. Runs after the page has been sent. */
async function rewrite(release: Release, key: string, kv: KVNamespace, ai: Ai) {
  const changes = changesFrom(release.body)
  // Only dependency bumps and CI changes: there is nothing to tell a user.
  if (!changes) {
    return
  }
  // Other instances may see the same release at the same moment. KV is not a
  // lock, but this keeps it to a few rewrites at most, and the last one wins.
  const lock = `lock:${key}`
  if (await kv.get(lock)) {
    return
  }
  await kv.put(lock, '1', { expirationTtl: 300 })
  const result = await ai.run(MODEL, prompt(release.tag, changes))
  const entry = entryFrom(result)
  if (!entry) {
    throw new Error(`Workers AI gave no usable entry for ${release.tag}`)
  }
  await kv.put(key, JSON.stringify(entry))
  entries.set(key, entry)
}

/** Puts the Workers AI entries on the releases that have no hand-written one. */
function withEntries(releases: Release[]): Promise<Release[]> {
  const { AI: ai, CHANGELOG: kv } = env
  return Promise.all(
    releases.map(async (release) => {
      // The edge cache may hold releases from before a deploy that added or changed
      // a hand-written entry, so look it up again here.
      const hand = notes[release.tag]
      if (hand) {
        return { ...release, note: hand, rewritten: false, body: '' }
      }
      if (release.note || !release.body) {
        return release
      }
      try {
        const key = await entryKey(release)
        // A short cacheTtl: a missing entry shows up within a minute of being written.
        const entry = entries.get(key) ?? (await kv.get<Entry>(key, { type: 'json', cacheTtl: 60 }))
        if (entry) {
          entries.set(key, entry)
          return { ...release, note: entry, rewritten: true, body: '' }
        }
        if (!started.has(key)) {
          started.add(key)
          waitUntil(
            rewrite(release, key, kv, ai)
              .catch((error) =>
                console.warn('Changelog: could not rewrite the notes of', release.tag, error)
              )
              // Done, failed, or left to another instance: a later visit checks again.
              // A finished entry is in memory or KV by then, so it is not written twice.
              .finally(() => started.delete(key))
          )
        }
      } catch (error) {
        console.warn('Changelog: could not read the entry for', release.tag, error)
      }
      return release
    })
  )
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

export const getReleases = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Release[]> => withEntries(await readReleases())
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
