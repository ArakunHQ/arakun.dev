import type { ComponentType } from 'react'
import { useState } from 'react'
import type { Option } from '#/live'
import { site } from '#/site'
import { IslandDemo } from './IslandDemo'
import { PhoneDemo } from './PhoneDemo'
import { SecretDemo } from './SecretDemo'
import { WorktreesDemo } from './WorktreesDemo'

interface Demo {
  Component: ComponentType
  caption: string
  name: string
}

/** One demo per answer, in the poll's order. */
export const demos: Record<Option, Demo> = {
  1: {
    name: 'Dynamic Island',
    caption: 'Every session is a dot in the island, and the one that needs you comes to you.',
    Component: IslandDemo,
  },
  2: {
    name: 'Worktrees',
    caption: 'Each session works in its own git worktree, so agents never edit the same copy.',
    Component: WorktreesDemo,
  },
  3: {
    name: 'Phone remote',
    caption: 'Answer from your phone. Allow is a hold, so a tap in your pocket runs nothing.',
    Component: PhoneDemo,
  },
  4: {
    name: 'Secrets on a card',
    caption: 'The agent asks on a card and gets a one-time handle, never the secret itself.',
    Component: SecretDemo,
  },
}

const ORDER: Option[] = [1, 2, 3, 4]

/** The winner's demo first; the chips switch to the others. */
export function Demos({ winner }: { winner: Option }) {
  const [picked, setPicked] = useState<{ winner: Option; shown: Option }>({
    winner,
    shown: winner,
  })
  // A new winner (the poll closed again) shows its own demo.
  const shown = picked.winner === winner ? picked.shown : winner
  const demo = demos[shown]
  const { Component } = demo

  return (
    <div className="demos">
      <div aria-label="Demos" className="demo-chips" role="tablist">
        {ORDER.map((option) => (
          <button
            aria-selected={option === shown}
            className="demo-chip"
            data-winner={option === winner ? '' : undefined}
            key={option}
            onClick={() => setPicked({ winner, shown: option })}
            role="tab"
            type="button"
          >
            <span className="num">{option}</span>
            {demos[option].name}
          </button>
        ))}
      </div>
      <figure className="demo" role="tabpanel">
        <figcaption>{demo.caption}</figcaption>
        <Component key={shown} />
      </figure>
      <a className="get-arakun" href={site.url}>
        Get Arakun <span aria-hidden="true">→</span> arakun.dev
      </a>
    </div>
  )
}
