import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { BuildMeta } from '@rivi-software/deploy-watch/react'
import { CelebrateProvider } from '#/components/Celebrate'
import { SiteFooter, SiteNav, useReveal } from '#/components/chrome'
import { pageMeta } from '#/seo'
import { site } from '#/site'
import appCss from '#/styles.css?url'

// Runs before first paint so the page never flashes the wrong theme.
// Dark is the default; a saved choice wins, then the system preference.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){}})()`

const description =
  'Arakun is a native app where Claude Code, Droid, OpenCode and Workers AI work side by side, each on its own git worktree.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: `${site.name} · ${site.line}` },
      { name: 'description', content: description },
      { property: 'og:site_name', content: site.name },
      { property: 'og:type', content: 'website' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      // The home card. Pages override these with their own (pageMeta); a page that doesn't keeps this one.
      ...pageMeta({ path: '/', title: site.name, description: site.line }),
      { name: 'theme-color', content: '#0b0b0b' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/brand/favicon.svg' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/brand/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
        <BuildMeta />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const pathname = useLocation({ select: (l) => l.pathname })
  useReveal(pathname)
  return (
    <CelebrateProvider>
      <SiteNav />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </CelebrateProvider>
  )
}

function NotFound() {
  return (
    <header className="ph wrap">
      <span className="mono-label">404</span>
      <h1>This page is not here.</h1>
      <p>The link is wrong or the page moved. The home page is a good place to start again.</p>
    </header>
  )
}
