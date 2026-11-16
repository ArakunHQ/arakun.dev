import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import { SessionRow } from './ui'
import type { Tone } from './ui'

/** A mood the hero raccoon can be asked to show from anywhere on the page. */
export const MOOD_EVENT = 'arakun:mood'

type Toast = { text: string; label: string; tone: Tone; left: number; top: number; on: boolean }

type Celebrate = (anchor: HTMLElement, toast: { text: string; label: string; tone: Tone }, bits: number) => void

const CelebrateContext = createContext<Celebrate>(() => {})

export const useCelebrate = () => useContext(CelebrateContext)

const CHARS = '*#%+=:-'
const COLORS = ['--color-accent-ink', '--color-text', '--color-text-faint', '--color-text']

/** A burst of the characters the app draws its ASCII raccoon with. */
function burst(anchor: HTMLElement, count: number) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const box = anchor.getBoundingClientRect()
  const cx = box.left + scrollX + box.width / 2
  const cy = box.top + scrollY + box.height / 2
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('span')
    bit.className = 'bit'
    bit.textContent = CHARS[i % CHARS.length]
    bit.style.left = `${cx}px`
    bit.style.top = `${cy}px`
    bit.style.fontSize = `${12 + Math.random() * 12}px`
    bit.style.color = `var(${COLORS[i % COLORS.length]})`
    document.body.appendChild(bit)
    const angle = Math.random() * Math.PI * 2
    const speed = 90 + Math.random() * 200
    const x = Math.cos(angle) * speed
    const y = Math.sin(angle) * speed - 90
    const spin = (Math.random() - 0.5) * 540
    bit.animate(
      [
        { transform: 'translate(-50%, -50%)', opacity: 1 },
        { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${x * 1.25}px), calc(-50% + ${y + 150}px)) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.15,.7,.3,1)' },
    ).onfinish = () => bit.remove()
  }
}

export function CelebrateProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // The toast and the burst are placed at the clicked control's spot on the page.
  // That spot means nothing on the next page, so a route change clears them at once.
  const pathname = useLocation({ select: (l) => l.pathname })
  useEffect(() => {
    return () => {
      clearTimeout(timer.current)
      setToast(null)
      for (const bit of document.querySelectorAll('.bit')) bit.remove()
    }
  }, [pathname])

  const celebrate = useCallback<Celebrate>((anchor, message, bits) => {
    const box = anchor.getBoundingClientRect()
    const width = Math.min(400, innerWidth - 32)
    const left = Math.max(16, Math.min(innerWidth - width - 16, box.left + box.width / 2 - width / 2))
    setToast({ ...message, left: left + scrollX, top: box.bottom + scrollY + 12, on: true })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast((t) => (t ? { ...t, on: false } : t)), 2600)
    burst(anchor, bits)
    dispatchEvent(new CustomEvent(MOOD_EVENT, { detail: 'happy' }))
  }, [])

  return (
    <CelebrateContext.Provider value={celebrate}>
      {children}
      {toast && (
        <div className="toast" role="status" data-on={toast.on} style={{ left: toast.left, top: toast.top }}>
          <SessionRow text={toast.text} time="now" tone={toast.tone} label={toast.label} />
        </div>
      )}
    </CelebrateContext.Provider>
  )
}
