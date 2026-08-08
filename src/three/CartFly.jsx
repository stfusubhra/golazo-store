// ---------------------------------------------------------------------------
// Add-to-cart flight: every "Add to cart" click spawns a ghost classic ball
// that launches from the hero toward the cart icon (top-right), spinning hard
// with afterimage trails, then vanishes as a ring flash pops at the cart.
// Modeled on the slamdunk store inspiration, re-skinned with our real 32-panel
// geometry and soccer-ball audio (soft swoosh + deep landing thump).
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { buildClassicBallGeometry, paintBall, getLeatherTextures } from './classicBall'
import { playSwoosh, playAddToCart } from '../sound'

const TRAIL_COUNT = 8

function GhostBall({ id, product, onComplete }) {
  const { viewport, gl, size } = useThree()
  const flightRef = useRef(null) // position carrier (launch path)
  const ballRef = useRef(null) // the spinning/shrinking 32-panel ball
  const ringRef = useRef(null) // white flash that pops at the cart
  const trailRefs = useRef([])

  const geometry = useMemo(() => buildClassicBallGeometry({ subdiv: 2, seamDepth: 0.012, fillet: 0.3 }), [])
  const { normalMap, roughnessMap } = useMemo(() => getLeatherTextures(1024), [])
  useEffect(() => {
    paintBall(geometry, product.primaryColor, product.lineColor)
  }, [geometry, product.primaryColor, product.lineColor])

  useEffect(() => {
    const g = flightRef.current
    const m = ballRef.current
    const ring = ringRef.current
    if (!g || !m || !ring) return

    const vw = viewport.width
    const vh = viewport.height
    const portrait = vh > vw
    const narrow = !portrait && vw < 6

    // spawn from the hero ball's rest pose (mirrors Ball.jsx)
    const start = new THREE.Vector3(0, portrait ? 1.2 : narrow ? -0.3 : 0, 0)
    // the cart icon sits at the top-right of the frame — aim at its ACTUAL
    // DOM position (projected into world units) so the ball always lands on
    // the icon no matter the layout, instead of a blind corner offset.
    const dom = gl.domElement
    const r = dom.getBoundingClientRect()
    const btn = document.querySelector('button[aria-label="Open cart"]')
    let cart
    if (btn && size.width > 0 && size.height > 0) {
      const br = btn.getBoundingClientRect()
      const cx = br.left + br.width / 2 - r.left
      const cy = br.top + br.height / 2 - r.top
      cart = new THREE.Vector3(
        (cx / size.width) * vw - vw / 2,
        vh / 2 - (cy / size.height) * vh,
        0,
      )
    } else {
      // fallback: top-right corner of the frame
      const E = narrow ? 0.8 : 1.5
      const C = narrow ? 0.8 : 1.2
      cart = new THREE.Vector3(vw / 2 - E, vh / 2 - C, 0)
    }
    cart.x += (Math.random() - 0.5) * 0.2
    cart.y += (Math.random() - 0.5) * 0.2
    const startScale = portrait ? 0.9 : 1.0
    // direction the ball is yanked back before launch (away from the cart)
    const pull = new THREE.Vector3().subVectors(cart, start).normalize().negate().multiplyScalar(3.5)

    m.position.copy(start)
    m.scale.setScalar(startScale)
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)

    ring.position.set(cart.x, cart.y, 0.1)
    ring.scale.setScalar(0.01)
    ring.visible = false
    ring.material.opacity = 1

    trailRefs.current.forEach((t) => {
      if (!t) return
      t.position.copy(start)
      t.scale.setScalar(startScale)
      t.visible = false
      t.material.opacity = 0
    })

    playSwoosh()

    const tl = gsap.timeline({ onComplete })

    // 1) yank the ball back toward the camera while it starts glowing
    tl.to(g.position, { x: pull.x, y: pull.y, z: -5, duration: 0.4, ease: 'back.out(1.5)' }, 0)
    tl.to(m.material, { emissiveIntensity: 3, duration: 0.4, ease: 'power2.in' }, 0)

    const F = 0.55 // flight time of the launch
    // 2) launch to the cart — accelerating (power4.in) like a struck ball
    tl.to(g.position, { x: cart.x - start.x, y: cart.y - start.y, z: 0, duration: F, ease: 'power4.in' }, 0.4)
    //    and spin three full turns on two axes the whole way
    tl.to(m.rotation, { x: `+=${Math.PI * 6}`, y: `+=${Math.PI * 6}`, duration: F + 0.4, ease: 'power1.inOut' }, 0)
    // 3) afterimage trails chase the ball into the cart
    trailRefs.current.forEach((t, i) => {
      if (!t) return
      t.visible = true
      const U = 0.4 + i * 0.015
      tl.to(t.position, { x: cart.x, y: cart.y, z: 0, duration: F, ease: 'power4.in' }, U)
      tl.to(t.scale, { x: 0, y: 0, z: 0, duration: 0.2, ease: 'power1.in' }, U + F - 0.2)
      tl.fromTo(t.material, { opacity: 0.35 }, { opacity: 0, duration: 0.3 }, U + F - 0.3)
    })

    const O = 0.4 + F // 0.95 — the moment of impact
    // 4) the ball shrinks to nothing exactly at the cart…
    tl.to(m.scale, { x: 0, y: 0, z: 0, duration: 0.1, ease: 'power1.out' }, O - 0.05)
    //    …the ring flashes and the soccer ball lands (thump)
    tl.call(() => {
      ring.visible = true
      playAddToCart()
    }, [], O - 0.05)
    tl.to(ring.scale, { x: 2.5, y: 2.5, z: 1, duration: 0.3, ease: 'power2.out' }, O - 0.05)
    tl.to(ring.material, { opacity: 0, duration: 0.3, ease: 'power1.in' }, O - 0.05)

    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <group>
      {/* flight carrier — only the ball rides on it; trails + ring use world space */}
      <group ref={flightRef}>
        <mesh ref={ballRef} geometry={geometry} castShadow>
          <meshStandardMaterial
            vertexColors
            normalMap={normalMap}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            roughnessMap={roughnessMap}
            roughness={0.65}
            metalness={0.02}
            envMapIntensity={0.9}
            side={THREE.DoubleSide}
            emissive={product.accentColor}
            emissiveIntensity={0}
          />
        </mesh>
      </group>
      {/* afterimage trail ghosts */}
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <mesh key={i} ref={(el) => (trailRefs.current[i] = el)} visible={false}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color={product.primaryColor} transparent opacity={0} roughness={0.4} />
        </mesh>
      ))}
      {/* ring flash at the cart */}
      <mesh ref={ringRef} visible={false}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Collects one ghost per trigger; each removes itself when its flight ends.
// The product is snapshotted per ghost so switching products mid-flight
// can't repaint a ball that's already airborne.
export default function CartFly({ product, triggerTime }) {
  const [ghosts, setGhosts] = useState([])
  useEffect(() => {
    if (triggerTime > 0) setGhosts((l) => [...l, { id: triggerTime, product }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerTime])
  const remove = (id) => setGhosts((l) => l.filter((g) => g.id !== id))
  return (
    <>
      {ghosts.map((g) => (
        <GhostBall key={g.id} id={g.id} product={g.product} onComplete={() => remove(g.id)} />
      ))}
    </>
  )
}
