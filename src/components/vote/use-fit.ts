import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * Scales a scene drawn at the app's own sizes down to the width it gets, so a phone
 * shows the same layout smaller instead of a squeezed one.
 */
export function useFit<T extends HTMLElement>(designWidth: number): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    const measure = () => setScale(Math.min(1, el.clientWidth / designWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [designWidth])
  return [ref, scale]
}
