import { useRef, useCallback } from 'react'

export function useSeekDrag(seek: (ratio: number) => void) {
  const dragging = useRef(false)

  const getRatio = (clientX: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  }

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragging.current = true
    seek(getRatio(e.clientX, e.currentTarget))

    const el = e.currentTarget
    const onMove = (ev: MouseEvent) => { if (dragging.current) seek(getRatio(ev.clientX, el)) }
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [seek])

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    dragging.current = true
    seek(getRatio(e.touches[0].clientX, e.currentTarget))

    const el = e.currentTarget
    const onMove = (ev: TouchEvent) => { if (dragging.current) seek(getRatio(ev.touches[0].clientX, el)) }
    const onEnd = () => { dragging.current = false; window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
  }, [seek])

  return { onMouseDown, onTouchStart }
}
