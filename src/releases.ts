import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { notes } from '#/release-notes'
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
 */
export interface Release {
  /**
   * The release notes written on GitHub, as markdown. Empty when there are none worth
   * showing, or when `release-notes.ts` has notes of its own for this tag.
   */
  body: string
  name: string
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
  '/releases?per_page=30'

// One copy per running Worker instance. Enough on its own to keep the site far
// below GitHub's limit of 60 anonymous requests an hour for most traffic.
let remembered: { at: number; releases: Release[] } | undefined

/** GitHub writes this line by itself when a release has no notes. It says nothing a reader needs. */
const onlyCompareLink = /^\s*\*\*Full Changelog\*\*:\s*\S+\s*$/iu

interface GitHubRelease {
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
      publishedAt: release.published_at,
      url: release.html_url,
      prerelease: release.prerelease,
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
    publishedAt: note.publishedAt ?? null,
    url: `${site.githubUrl}/releases/tag/${tag}`,
    prerelease: false,
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
  key: new Request('https://releases.arakun.internal/v2'),
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

export const getReleases = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Release[]> => {
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
      console.warn('Changelog: could not read releases from GitHub.', error)
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
)
