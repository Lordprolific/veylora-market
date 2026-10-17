import { useCallback, useRef, type PointerEvent } from 'react'
import { TransferIcon } from './TransferIcon'

const MAX_TILT = 9 // degrees

/**
 * Decorative 3D hero object. The rings and core are real 3D layers (CSS preserve-3d);
 * the pointer tilts the whole stage. Tilt is skipped on touch and reduced-motion devices.
 */
export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null)

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--tx', `${(-y * MAX_TILT).toFixed(2)}deg`)
    el.style.setProperty('--ty', `${(x * MAX_TILT).toFixed(2)}deg`)
  }, [])

  const onPointerLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--tx', '0deg')
    el.style.setProperty('--ty', '0deg')
  }, [])

  return (
    <div
      className="hero-art"
      aria-hidden="true"
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="hero-stage">
        <div className="hero-orbit orbit-one" />
        <div className="hero-orbit orbit-two" />
        <div className="hero-orbit orbit-three" />
        <div className="hero-core">
          <img src="/veylora-mark.svg" alt="" />
        </div>
        <div className="orbit-node node-one" />
        <div className="orbit-node node-two" />
        <div className="orbit-node node-three" />
        <div className="transfer-chip">
          <TransferIcon direction="swap" size={14} />
          <span>Private swap</span>
        </div>
      </div>
      <div className="art-caption">VEYLORA / PRIVATE EXCHANGE</div>
    </div>
  )
}
