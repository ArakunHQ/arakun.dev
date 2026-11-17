/**
 * `curl -fsSL https://arakun.dev/install | sh`, `curl -fsSL https://arakun.dev/install-server | sh`
 * and `irm https://arakun.dev/install.ps1 | iex`.
 * The scripts come from the app repository's main, so a fix there reaches the
 * one-line install without redeploying the site. Plain text, so a browser shows
 * the script for reading before anyone runs it.
 */

const RELEASES = 'https://github.com/arakunhq/arakun/releases'

/** The last line of tools/install-release.sh, which runs it. Its header asks to keep it as is. */
const RUN = /\nmain "\$@"\n?$/u

export const INSTALLERS = {
  sh: {
    file: 'tools/install-release.sh',
    fail: `echo "arakun: the installer is not published yet. See ${RELEASES}" >&2; exit 1\n`,
  },
  /**
   * The same script, run with `--server`: `curl | sh -s -- --server` is hard to remember.
   * A script whose last line has changed is not run with a guess: it fails instead.
   */
  server: {
    file: 'tools/install-release.sh',
    fail: `echo "arakun: the server installer is not published yet. See ${RELEASES}" >&2; exit 1\n`,
    edit: (script: string) =>
      RUN.test(script) ? script.replace(RUN, '\nmain --server "$@"\n') : undefined,
  },
  ps1: {
    file: 'tools/install-release.ps1',
    fail: `throw "arakun: the installer is not published yet. See ${RELEASES}"\n`,
  },
} as const

export interface Installer {
  /** Changes the script before it is served; undefined serves `fail`. */
  edit?: (script: string) => string | undefined
  fail: string
  file: string
}

export async function installer(spec: Installer, fetcher: typeof fetch = fetch): Promise<Response> {
  let body: string = spec.fail
  try {
    const res = await fetcher(
      `https://raw.githubusercontent.com/arakunhq/arakun/main/${spec.file}`,
      {
        cf: { cacheTtl: 300, cacheEverything: true },
      } as RequestInit
    )
    if (res.ok) {
      const script = await res.text()
      body = spec.edit ? (spec.edit(script) ?? spec.fail) : script
    }
  } catch {
    // Same as a failed fetch: a script that stops.
  }
  // A failed fetch must still be a script that stops, never an HTML page piped
  // into sh. It is a 200 because `curl -f` hides the body of an error, and then
  // the reader would see nothing at all.
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'x-content-type-options': 'nosniff',
    },
  })
}

/** HEAD: the GET's status and headers, without the script. */
export async function head(spec: Installer, fetcher: typeof fetch = fetch): Promise<Response> {
  const res = await installer(spec, fetcher)
  return new Response(null, { status: res.status, headers: res.headers })
}
