// ---------------------------------------------------------------------------
// The classic football: real 32-panel geometry with V-groove seams and a
// hi-res procedural leather material. Draggable to spin, animated through
// the scene as the user scrolls (same choreography as the inspiration site).
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { buildClassicBallGeometry, paintBall, getLeatherTextures } from './classicBall'

const ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2
const clamp01 = (t) => Math.min(Math.max(t, 0), 1)
const lerp = THREE.MathUtils.lerp

export default function Ball({ product, scrollRef, configurator = false, shadowRef }) {
  const mesh = useRef(null)
  const spin = useRef({ x: 0, y: 0, z: 0 })
  const drag = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  // cache the scroll fraction of each [data-stage] section (hero / elite / true / third / outro)
  const stagesRef = useRef(null)
  const getStages = (el) => {
    if (!el) return null
    const max = el.scrollHeight - el.clientHeight
    if (max <= 0) return null
    if (stagesRef.current && stagesRef.current.max === max) return stagesRef.current
    const map = {}
    el.querySelectorAll('[data-stage]').forEach((s) => {
      map[s.dataset.stage] = {
        start: s.offsetTop / max,
        end: (s.offsetTop + s.offsetHeight) / max,
      }
    })
    if (!map.hero || !map.elite || !map.true || !map.third || !map.outro) return null
    stagesRef.current = { max, map }
    return stagesRef.current
  }

  const geometry = useMemo(() => buildClassicBallGeometry({ subdiv: 2, seamDepth: 0.012, fillet: 0.3 }), [])
  const { normalMap, roughnessMap } = useMemo(() => getLeatherTextures(), [])

  // repaint the two panel colors whenever the product changes
  useEffect(() => {
    paintBall(geometry, product.primaryColor, product.lineColor)
  }, [geometry, product.primaryColor, product.lineColor])

  // entrance spin + elastic pop when the product changes
  useEffect(() => {
    if (!mesh.current) return
    gsap.to(spin.current, {
      y: spin.current.y + Math.PI * 3,
      x: spin.current.x + Math.PI * 0.75,
      duration: 1.4,
      ease: 'power4.inOut',
    })
    gsap
      .timeline()
      .to(mesh.current.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 0.2, ease: 'power2.in' })
      .to(mesh.current.scale, { x: 0.95, y: 0.95, z: 0.95, duration: 1.2, ease: 'elastic.out(1, 0.4)' })
  }, [product])

  useFrame((state) => {
    const m = mesh.current
    if (!m) return

    if (configurator) {
      m.rotation.x = drag.current.x
      m.rotation.y = drag.current.y + state.clock.elapsedTime * 0.1
      m.rotation.z = 0
      m.position.set(0, 0, 0)
      m.scale.setScalar(1)
      return
    }

    // scroll progress through the whole page
    const el = scrollRef && scrollRef.current
    let w = 0
    if (el) {
      const { scrollTop, scrollHeight, clientHeight } = el
      const max = scrollHeight - clientHeight
      w = max > 0 ? scrollTop / max : 0
    }
    w = clamp01(w)
    const stages = getStages(el)

    const b = state.viewport.width
    const I = state.viewport.height
    const portrait = b < I
    const narrow = !portrait && b < 6.5
    let yOff = 0
    if (portrait) yOff = 1.2
    else if (narrow) yOff = -0.3

    const v = new THREE.Vector3()
    let scale = 1
    let tumble = 0
    let heroP = 0
    // true once the ball has started its exit run (enables a snappier chase)
    let exiting = false

    if (!stages) {
      // fallback: gentle idle at center
      v.set(0, yOff, 0)
      scale = portrait ? 0.9 : 1
    } else {
      const H = stages.map.hero
      const E = stages.map.elite
      const T = stages.map.true
      const C = stages.map.third
      const O = stages.map.outro
      // the ball lives on the OPPOSITE side of the text at each snap/rest point.
      // On the two metric pages it is BIG and half-clipped at the side edge
      // (like the inspiration site): the center sits just past the viewport edge.
      const sideScale = portrait ? 1.05 : narrow ? 1.2 : 2.0
      const sideX = b / 2 + sideScale * 0.3
      // the third page is a centered "stadium night" shot — ball holds the stage
      const centerScale = portrait ? 0.8 : 1.25
      const centerY = -0.15
      // Portrait keeps the two metric pages clear of the edge sliver: instead of
      // sitting half-off the side (where it would sit UNDER the full-width text)
      // the ball floats CENTERED in the open space above the bottom-pinned text.
      // ELITE and TRUE FLIGHT share the exact same pose, keeping them symmetric.
      const topScale = 0.6
      const topPose = 1.5
      // THE LEGEND page keeps the ball CENTERED too, sitting just above the
      // heading — low enough to clear the sticky header, high enough to stay
      // in the open space so it never covers the text or the cards.
      const legendScale = portrait ? 0.9 : 1.1
      const legendY = portrait ? 0.34 : 0.28
      // the ball vacates for the very last page (footer) at the end of THE
      // LEGEND scroll, so the closing page stays clean.
      const footerExit = O.end - 0.03

      // the ball leaves the stadium center during the LAST part of the third
      // page, rising to its THE LEGEND pose — still centered, in the open space
      // above the heading — so it is already in place when the outro snaps in.
      const exitStart = O.start - 0.4 * (O.start - C.start)
      exiting = w >= exitStart

      if (w < E.start) {
        // ---- HERO: drift right → sweep left → hop center → greet ELITE side-by-side
        const p = clamp01((w - H.start) / (E.start - H.start))
        heroP = p
        const half = b / 2
        if (p < 0.3) {
          const t = ease(p / 0.3)
          v.set(lerp(0, half, t), yOff, 0)
          scale = lerp(portrait ? 0.9 : 1.0, portrait ? 1.3 : 2.5, t)
        } else if (p < 0.55) {
          const t = ease((p - 0.3) / 0.25)
          v.set(lerp(half, -half, t), yOff, 0)
          scale = portrait ? 1.3 : 2.5
          tumble = t * Math.PI * 3
        } else if (p < 0.75) {
          const t = ease((p - 0.55) / 0.2)
          v.set(lerp(-half, 0, t), yOff + Math.sin(t * Math.PI) * 3, 0)
          scale = lerp(portrait ? 1.3 : 2.5, portrait ? 1.1 : 1.5, t)
        } else {
          // slide to the right edge so the ball sits beside the ELITE text
          const t = ease((p - 0.75) / 0.25)
          v.set(lerp(0, sideX, t), lerp(yOff, 0, t), 0)
          scale = lerp(portrait ? 1.1 : 1.5, sideScale, t)
        }
      } else if (w < T.start) {
        // ---- ELITE TOUCH. Desktop: text on the LEFT, the BIG ball SPINS half-off
        // the RIGHT edge, then sweeps across to the LEFT edge, arriving posed for
        // TRUE FLIGHT. Portrait: the edge sliver would sit under the full-width
        // text, so the ball floats centered in the open space above the text.
        if (portrait) {
          v.set(0, topPose, 0)
          scale = topScale
          tumble = Math.sin(state.clock.elapsedTime * 1.6) * 0.12
        } else {
          const p = clamp01((w - E.start) / (T.start - E.start))
          if (p < 0.8) {
            v.set(sideX, 0, 0)
            scale = sideScale
            tumble = Math.sin(state.clock.elapsedTime * 1.6) * 0.12
          } else {
            const t = ease((p - 0.8) / 0.2)
            v.set(lerp(sideX, -sideX, t), 0, 0)
            scale = sideScale
          }
        }
      } else if (w < C.start) {
        // ---- TRUE FLIGHT. Desktop: text on the RIGHT, the BIG ball SPINS half-off
        // the LEFT edge, then glides to center, shrinking to the stadium shot.
        // Portrait: same centered-top pose as ELITE TOUCH — symmetric pair.
        if (portrait) {
          v.set(0, topPose, 0)
          scale = topScale
          tumble = Math.sin(state.clock.elapsedTime * 1.6) * 0.12
        } else {
          const p = clamp01((w - T.start) / (C.start - T.start))
          if (p < 0.8) {
            v.set(-sideX, 0, 0)
            scale = sideScale
            tumble = Math.sin(state.clock.elapsedTime * 1.6) * 0.12
          } else {
            const t = ease((p - 0.8) / 0.2)
            v.set(lerp(-sideX, 0, t), lerp(0, centerY, t), 0)
            scale = lerp(sideScale, centerScale, t)
          }
        }
      } else if (w < exitStart) {
        // ---- THIRD PAGE (stadium night): the ball holds center stage. The
        // TRUE→THIRD glide already landed it here, so no entrance.
        v.set(0, centerY + Math.sin(state.clock.elapsedTime * 0.6) * 0.05, 0)
        scale = centerScale
        tumble = Math.sin(state.clock.elapsedTime * 0.35) * 0.22
      } else if (w < O.start) {
        // ---- TRANSITION: the ball rises from the stadium center to its THE
        // LEGEND pose (still centered, up in the open space above the heading),
        // arriving exactly as the outro snaps into view.
        const p = clamp01((w - exitStart) / (O.start - exitStart))
        const t = ease(p)
        v.set(0, lerp(centerY, legendY, t), 0)
        scale = lerp(centerScale, legendScale, t)
        tumble = Math.sin(t * Math.PI) * 0.4
      } else if (w < footerExit) {
        // ---- THE LEGEND page: the ball holds CENTER stage up in the open
        // space above the heading, floating with a slow spin.
        v.set(0, legendY + Math.sin(state.clock.elapsedTime * 0.6) * 0.03, 0)
        scale = legendScale
        tumble = Math.sin(state.clock.elapsedTime * 0.4) * 0.25
      } else {
        // ---- FOOTER (last page): lift off fast so the closing page is clean.
        const p = clamp01((w - footerExit) / (1 - footerExit))
        const t = clamp01(p * 1.6)
        v.set(0, lerp(legendY, 14, t), 0)
        scale = lerp(legendScale, 1, t)
      }
    }

    m.position.lerp(v, exiting ? 0.16 : 0.08)
    spin.current.z = lerp(spin.current.z, 0, 0.1)
    // continuous rotation that speeds up as you scroll ("two scrolls" of spin)
    spin.current.y += 0.02 + w * 0.06
    spin.current.x = lerp(spin.current.x, tumble, 0.08)

    if (w > 0.05 && !dragging.current) {
      drag.current.x = lerp(drag.current.x, 0, 0.1)
      drag.current.y = lerp(drag.current.y, 0, 0.1)
    }

    m.rotation.x = spin.current.x + drag.current.x
    m.rotation.y = spin.current.y + drag.current.y
    m.rotation.z = spin.current.z

    // gentle idle float on the hero
    if (heroP < 0.05) m.position.y += Math.sin(state.clock.elapsedTime) * 0.0025

    m.scale.setScalar(lerp(m.scale.x, scale, 0.1))

    // keep the contact-shadow plane just under the ball (it grows a lot now).
    if (shadowRef && shadowRef.current) {
      const gy = v.y - scale - 0.25
      shadowRef.current.position.y = lerp(shadowRef.current.position.y, gy, 0.15)
      shadowRef.current.visible = gy > -2.7
    }
  })

  const onPointerDown = (e) => {
    e.stopPropagation()
    if (e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
    }
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerUp = () => {
    dragging.current = false
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    e.stopPropagation()
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    drag.current.y += dx * 0.005
    drag.current.x += dy * 0.005
    last.current = { x: e.clientX, y: e.clientY }
  }

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      castShadow
      receiveShadow
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerMove={onPointerMove}
      onPointerOver={() => {
        if (!dragging.current) document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!dragging.current) document.body.style.cursor = 'auto'
      }}
    >
      <meshStandardMaterial
        vertexColors
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.85, 0.85)}
        roughnessMap={roughnessMap}
        roughness={0.65}
        metalness={0.02}
        envMapIntensity={0.9}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
