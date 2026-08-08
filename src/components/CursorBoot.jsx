// ---------------------------------------------------------------------------
// GOLAZO custom cursor — an exact replica of the slamdunk cursor
// (https://slamdunk-five.vercel.app/), with one GOLAZO twist: the hover
// feedback takes the ACTIVE BALL's accent shade instead of a fixed orange.
//   - dot (8×8 white circle) tracks the pointer instantly  (quickTo 0.001)
//   - ring (32×32, 1px white border) trails behind         (quickTo 0.2 power3)
//   - both are fixed, pointer-events:none, mix-blend-difference and centered
//     on the pointer via -translate-x-1/2 -translate-y-1/2 (Tailwind v4 uses
//     the CSS "translate" property, which composes with GSAP's transform)
//   - hovering a BUTTON / A / .interactive element: the ring expands to 3× and
//     tints to the ball's accent at 0.15 opacity; the dot shrinks to 0.5× and
//     turns transparent
//   - idle: ring scale 1 / opacity .5 / white, dot scale 1 / white
//   - native cursor hidden globally via index.css on fine-pointer devices;
//     both elements carry `.cursor-slam` and are hidden on coarse pointers
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function CursorBoot({ accent = '#FFC300' }) {
  const dotRef = useRef(null) // instant element  (8×8)
  const ringRef = useRef(null) // trailing element (32×32)
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(false)

  // mousemove / mouseover wiring — identical mechanics to slamdunk
  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // slamdunk timings: the dot snaps, the ring trails
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.001 })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.001 })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.2, ease: 'power3' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.2, ease: 'power3' })

    let seen = false
    const move = (m) => {
      if (!seen) {
        // first move: snap both onto the pointer so there's no streak from (0,0)
        gsap.set(dot, { x: m.clientX, y: m.clientY })
        gsap.set(ring, { x: m.clientX, y: m.clientY })
        seen = true
        setVisible(true)
        return
      }
      dotX(m.clientX)
      dotY(m.clientY)
      ringX(m.clientX)
      ringY(m.clientY)
    }

    // slamdunk hover rule: a BUTTON / A / .interactive on the target or any
    // ancestor flips the cursor into its hover state
    const over = (m) => {
      const g = m.target
      const interactive =
        g.tagName === 'BUTTON' ||
        g.tagName === 'A' ||
        g.closest('button') ||
        g.closest('a') ||
        (g.classList && g.classList.contains('interactive'))
      setHovered(!!interactive)
    }

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [])

  // hover feedback — slamdunk's states, but the ring tint follows the ball's
  // accent shade. scale + color go through GSAP (they compose with quickTo's
  // x/y in the same transform); opacity is a CSS transition keyed off state.
  useEffect(() => {
    if (hovered) {
      gsap.to(ringRef.current, { scale: 3, backgroundColor: accent, duration: 0.3, overwrite: 'auto' })
      gsap.to(dotRef.current, { scale: 0.5, backgroundColor: 'transparent', duration: 0.3, overwrite: 'auto' })
    } else {
      gsap.to(ringRef.current, { scale: 1, backgroundColor: 'white', duration: 0.3, overwrite: 'auto' })
      gsap.to(dotRef.current, { scale: 1, backgroundColor: 'white', duration: 0.3, overwrite: 'auto' })
    }
  }, [hovered, accent])

  return (
    <>
      {/* dot — tracks the pointer instantly */}
      <div
        ref={dotRef}
        className="cursor-slam fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s' }}
      />
      {/* ring — trails behind; idle 50%, hover 15% + ball accent tint */}
      <div
        ref={ringRef}
        className="cursor-slam fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[9998] mix-blend-difference -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{
          opacity: visible ? (hovered ? 0.15 : 0.5) : 0,
          transition: 'opacity 0.3s',
        }}
      />
    </>
  )
}
