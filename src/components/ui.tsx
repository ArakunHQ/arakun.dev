import { getRouteApi, Link } from '@tanstack/react-router'
import type { ComponentProps, CSSProperties, PointerEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Platform } from '#/site'
import { installCommands, site } from '#/site'
import { useCelebrate } from './celebrate-context'

export type Tone = 'success' | 'error' | 'attention' | 'draft' | 'accent'

/** A headline whose words rise into place one after another on entrance. */
export function Words({ text }: { text: string }) {
  return (
    <span className="words">
      {text.split(' ').map((word, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the words never move, and the same word can appear twice.
        <span key={i}>
          <span className="w">
            <span style={{ '--i': i } as CSSProperties}>{word}</span>
          </span>{' '}
        </span>
      ))}
    </span>
  )
}

/** Sets an element's place in the entrance stagger: `<p className="rise" style={step(2)}>`. */
export const step = (i: number, at = 0) => ({ '--i': i, '--at': `${at}ms` }) as CSSProperties

export function Eyebrow({ num, label }: { num: string; label: string }) {
  return (
    <div className="eb mono-label">
      <span className="n">{num}</span>
      <span>{label}</span>
    </div>
  )
}

type ButtonTone = 'primary' | 'secondary' | 'ghost'

/** A button that goes to another page of the site. */
export function ButtonLink({
  tone = 'primary',
  ...props
}: ComponentProps<typeof Link> & { tone?: ButtonTone }) {
  return <Link className="btn" data-tone={tone} {...props} />
}

const MAC = /Macintosh/u

const root = getRouteApi('__root__')

/**
 * The release the site offers: the newest on GitHub, or the one in `site.ts` if GitHub
 * cannot be reached. Use this, not `site.version`, for anything the visitor downloads.
 */
export const useLatest = () => root.useLoaderData()

/**
 * The download that suits the visitor: macOS on a Mac, Linux everywhere else.
 * The server can't see the visitor's OS, so the page renders Linux first and
 * switches after hydration, which also keeps the server and client markup equal.
 */
export function useVisitorPlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('Linux')
  useEffect(() => {
    // iPads also say "Macintosh"; touch support tells them apart.
    if (MAC.test(navigator.userAgent) && navigator.maxTouchPoints < 2) {
      setPlatform('macOS')
    }
  }, [])
  return platform
}

/** Downloads the release archive for a platform and celebrates the click. */
export function DownloadButton({
  platform,
  tone = 'primary',
}: {
  platform: Platform
  tone?: ButtonTone
}) {
  const celebrate = useCelebrate()
  const latest = useLatest()
  return (
    <a
      className="btn"
      data-tone={tone}
      href={latest.downloads[platform]}
      onClick={(e) =>
        celebrate(
          e.currentTarget,
          {
            text: `Arakun ${latest.version} for ${platform} is downloading.`,
            label: 'Downloading',
            tone: 'attention',
          },
          48
        )
      }
    >
      Download for {platform}
    </a>
  )
}

export function StatusPill({ tone = 'success', label }: { tone?: Tone; label: string }) {
  return (
    <span className="pill" data-tone={tone}>
      {label}
    </span>
  )
}

/** The install command for a shell. The whole line copies it. */
export function InstallLine({ shell = 'sh' }: { shell?: keyof typeof installCommands }) {
  const celebrate = useCelebrate()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  return (
    <button
      aria-label={copied ? 'Install command copied' : 'Copy the install command'}
      className="il"
      data-state={copied ? 'copied' : 'idle'}
      onClick={(e) => {
        navigator.clipboard?.writeText(installCommands[shell]).catch(() => {
          // The browser can refuse the clipboard. The command is still on screen to copy.
        })
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 2600)
        celebrate(
          e.currentTarget,
          {
            text: 'Install command copied. Paste it in a terminal.',
            label: 'Copied',
            tone: 'success',
          },
          24
        )
      }}
      type="button"
    >
      {shell === 'sh' ? (
        <code>
          <span className="p">$ </span>curl -fsSL <span className="u">{site.installUrl}</span> | sh
        </code>
      ) : (
        <code>
          <span className="p">&gt; </span>irm <span className="u">{site.installUrl}.ps1</span> | iex
        </code>
      )}
      <svg aria-hidden="true" className="c" fill="none" height="16" viewBox="0 0 24 24" width="16">
        <rect
          height="12"
          rx="3"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.75"
          width="12"
          x="9"
          y="9"
        />
        <path
          d="M15 9V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
      <svg aria-hidden="true" className="ok" fill="none" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
    </button>
  )
}

export function Principle({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <article className="pr">
      <span className="n">{num}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}

export function SessionRow({
  text,
  time,
  tone,
  label,
}: {
  text: string
  time: string
  tone: Tone
  label: string
}) {
  return (
    <div className="sr">
      <div className="t">
        <span className="m">{text}</span>
        <span className="w">{time}</span>
      </div>
      <StatusPill label={label} tone={tone} />
    </div>
  )
}

const shots = {
  dark: {
    src: '/img/app-dark.webp',
    alt: 'Arakun on its start screen in the Arakun Black palette: the sidebar, an ASCII raccoon above the composer and a terminal.',
  },
  light: {
    src: '/img/app-light.webp',
    alt: 'Arakun on its start screen in light mode: the sidebar, an ASCII raccoon above the composer and a terminal.',
  },
}

/**
 * A real capture of the app that tilts toward the pointer.
 * `theme="match"` follows the page theme; `"opposite"` shows the other one.
 */
export function AppShot({
  theme = 'match',
  eager = false,
}: {
  theme?: 'match' | 'opposite'
  eager?: boolean
}) {
  const tilt = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const box = el.getBoundingClientRect()
    el.style.setProperty('--ry', `${((e.clientX - box.left) / box.width - 0.5) * 5}deg`)
    el.style.setProperty('--rx', `${(0.5 - (e.clientY - box.top) / box.height) * 4}deg`)
  }
  const rest = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--rx', '0deg')
    e.currentTarget.style.setProperty('--ry', '0deg')
  }
  const onDark = theme === 'match' ? shots.dark : shots.light
  const onLight = theme === 'match' ? shots.light : shots.dark
  const loading = eager ? 'eager' : 'lazy'
  return (
    <div className="shot" onPointerLeave={rest} onPointerMove={tilt}>
      <img
        alt={onDark.alt}
        className="only-dark"
        height={1800}
        loading={loading}
        src={onDark.src}
        width={2880}
      />
      <img
        alt={onLight.alt}
        className="only-light"
        height={1800}
        loading={loading}
        src={onLight.src}
        width={2880}
      />
    </div>
  )
}

export function FeatureCard({
  label,
  title,
  body,
  children,
}: {
  label: string
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <article className="fc">
      <div className="v">{children}</div>
      <div className="b">
        <span className="l">{label}</span>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </article>
  )
}

export function PageHeader({
  num,
  label,
  title,
  lead,
}: {
  num: string
  label: string
  title: string
  lead: string
}) {
  return (
    <header className="ph wrap">
      <div className="rise">
        <Eyebrow label={label} num={num} />
      </div>
      <h1>
        <Words text={title} />
      </h1>
      <p className="rise" style={step(0, 380)}>
        {lead}
      </p>
    </header>
  )
}

/** The closing call to install, above the footer on inner pages. */
export function InstallBand({ note }: { note?: string }) {
  const platform = useVisitorPlatform()
  return (
    <div className="wrap section" data-reveal="">
      <section className="ib">
        <div className="t">
          <h2 className="h2">Install Arakun</h2>
          <p className="lead">One line in a terminal. Free and open source under {site.license}.</p>
          {note ? <span className="note">{note}</span> : null}
        </div>
        <div className="a">
          <InstallLine />
          <div className="b">
            <ButtonLink to="/docs" tone="ghost">
              Read the docs
            </ButtonLink>
            <DownloadButton platform={platform} />
          </div>
        </div>
      </section>
    </div>
  )
}
