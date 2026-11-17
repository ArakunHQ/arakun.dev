import { createContext, useContext } from 'react'
import type { Tone } from './ui'

/**
 * Shows a toast under a control and throws a burst of characters from it.
 * Its own module, so the buttons in ui.tsx can use it while Celebrate.tsx
 * renders the toast with ui.tsx's SessionRow, without an import cycle.
 */
export type Celebrate = (
  anchor: HTMLElement,
  toast: { text: string; label: string; tone: Tone },
  bits: number
) => void

// Outside a CelebrateProvider, a celebration does nothing.
const ignore: Celebrate = () => undefined

export const CelebrateContext = createContext<Celebrate>(ignore)

export const useCelebrate = () => useContext(CelebrateContext)
