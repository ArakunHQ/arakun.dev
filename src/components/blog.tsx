import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Author, Category, PostMeta, TocEntry } from '#/blog'
import {
  activeCategories,
  formatDay,
  postAuthors,
  postCategories,
  posts,
  postsInCategory,
} from '#/blog'
import { ogImagePath } from '#/seo'

const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export function Avatar({ author, size = 'md' }: { author: Author; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span aria-hidden="true" className="avatar" data-size={size}>
      {author.avatar ? (
        <img alt="" height={96} src={author.avatar} width={96} />
      ) : (
        initials(author.name)
      )}
    </span>
  )
}

/** "A", "A and B", "A, B and C". */
function separator(i: number, count: number) {
  if (i === 0) {
    return null
  }
  return i === count - 1 ? ' and ' : ', '
}

function AuthorNames({ authors }: { authors: Author[] }) {
  return (
    <span className="byline-names">
      {authors.map((author, i) => (
        <span key={author.id}>
          {separator(i, authors.length)}
          <Link params={{ author: author.id }} to="/blog/author/$author">
            {author.name}
          </Link>
        </span>
      ))}
    </span>
  )
}

/** Who wrote a post, and when: avatars, names, date and reading time. */
export function Byline({ post, showUpdated }: { post: PostMeta; showUpdated?: boolean }) {
  const authors = postAuthors(post)
  return (
    <div className="byline">
      <span className="avatar-stack">
        {authors.map((author) => (
          <Avatar author={author} key={author.id} />
        ))}
      </span>
      <div className="byline-text">
        <AuthorNames authors={authors} />
        <span className="byline-meta mono-label">
          <time dateTime={post.published}>{formatDay(post.published)}</time>
          <span>{post.readingMinutes} min read</span>
          {showUpdated && post.updated !== post.published ? (
            <span>
              Updated <time dateTime={post.updated}>{formatDay(post.updated)}</time>
            </span>
          ) : null}
        </span>
      </div>
    </div>
  )
}

export function CategoryChips({ categories }: { categories: Category[] }) {
  return (
    <ul className="chips">
      {categories.map((category) => (
        <li key={category.id}>
          <Link className="chip" params={{ category: category.id }} to="/blog/category/$category">
            {category.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** All posts, then one link per category that has posts, with how many. */
export function CategoryNav({ current }: { current?: string }) {
  return (
    <nav aria-label="Blog categories" className="blog-filter wrap">
      <ul className="chips">
        <li>
          <Link className="chip" data-active={current ? undefined : 'true'} to="/blog">
            All <span className="chip-count">{posts.length}</span>
          </Link>
        </li>
        {activeCategories.map((category) => (
          <li key={category.id}>
            <Link
              className="chip"
              data-active={current === category.id ? 'true' : undefined}
              params={{ category: category.id }}
              to="/blog/category/$category"
            >
              {category.label}{' '}
              <span className="chip-count">{postsInCategory(category.id).length}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Cover({ post }: { post: PostMeta }) {
  return (
    <Link
      aria-label={post.title}
      className="post-cover"
      params={{ slug: post.slug }}
      tabIndex={-1}
      to="/blog/$slug"
    >
      <img
        alt=""
        decoding="async"
        height={630}
        loading="lazy"
        src={ogImagePath(`/blog/${post.slug}`)}
        width={1200}
      />
    </Link>
  )
}

/** A post in a list: cover, categories, title, description and byline. */
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="post-card">
      <Cover post={post} />
      <div className="post-card-body">
        <CategoryChips categories={postCategories(post)} />
        <h3>
          <Link params={{ slug: post.slug }} to="/blog/$slug">
            {post.title}
          </Link>
        </h3>
        <p>{post.description}</p>
        <Byline post={post} />
      </div>
    </article>
  )
}

/** The post the overview leads with, cover beside the text on wide screens. */
export function FeaturedPost({ post }: { post: PostMeta }) {
  return (
    <article className="post-featured wrap">
      <Cover post={post} />
      <div className="post-featured-body">
        <span className="mono-label post-featured-label">Latest</span>
        <CategoryChips categories={postCategories(post)} />
        <h2>
          <Link params={{ slug: post.slug }} to="/blog/$slug">
            {post.title}
          </Link>
        </h2>
        <p className="lead">{post.description}</p>
        <Byline post={post} />
        <Link className="more mono-label" params={{ slug: post.slug }} to="/blog/$slug">
          Read article →
        </Link>
      </div>
    </article>
  )
}

export function PostGrid({ posts: list }: { posts: PostMeta[] }) {
  return (
    <div className="post-grid">
      {list.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  )
}

/** The author's photo, name, role, bio and links: under each post and on their page. */
export function AuthorCard({ author, heading = 'h3' }: { author: Author; heading?: 'h1' | 'h3' }) {
  const Name = heading
  return (
    <section className="author-card" data-page={heading === 'h1' ? 'true' : undefined}>
      <Avatar author={author} size="lg" />
      <div className="author-card-text">
        <Name>
          {heading === 'h1' ? (
            author.name
          ) : (
            <Link params={{ author: author.id }} to="/blog/author/$author">
              {author.name}
            </Link>
          )}
        </Name>
        <span className="mono-label author-role">{author.role}</span>
        <p>{author.bio}</p>
        {author.links.length ? (
          <ul className="author-links">
            {author.links.map((link) => (
              <li key={link.url}>
                <a href={link.url} rel="noopener me" target="_blank">
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

/**
 * "On this page": the post's sections, with the one being read marked. It reads
 * the headings the build gave ids to, so it lists exactly what the article shows.
 */
export function Toc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState(entries[0]?.id)
  useEffect(() => {
    const headings = entries
      .map((entry) => document.querySelector<HTMLElement>(`#${CSS.escape(entry.id)}`))
      .filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver(
      (seen) => {
        const visible = seen.filter((entry) => entry.isIntersecting)
        if (visible[0]) {
          setActive(visible[0].target.id)
        }
      },
      // A heading counts as current once it reaches the top fifth of the screen.
      { rootMargin: '0px 0px -80% 0px' }
    )
    for (const heading of headings) {
      observer.observe(heading)
    }
    return () => observer.disconnect()
  }, [entries])

  if (entries.length < 2) {
    return null
  }
  return (
    <nav aria-label="On this page" className="toc">
      <p className="mono-label toc-title">On this page</p>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a aria-current={active === entry.id ? 'location' : undefined} href={`#${entry.id}`}>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
