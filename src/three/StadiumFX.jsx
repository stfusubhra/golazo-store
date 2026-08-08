// ---------------------------------------------------------------------------
// Stadium-night FX (third scroll page): a floodlit turf pool and soft light
// shafts rendered in 3D behind the DOM layer. Everything is tinted to the
// current ball's accent color and fades in/out with scroll so it only exists
// while the stadium page owns the stage.
// ---------------------------------------------------------------------------
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2
const clamp01 = (t) => Math.min(Math.max(t, 0), 1)

export default function StadiumFX({ product, scrollRef }) {
  const poolRef = useRef(null)
  const shaftRefs = useRef([])
  const stagesRef = useRef(null)

  // shared radial-gradient sprite (white; tinted per product via material.color)
  const sprite = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 126)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.38, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])

  // light shafts: apex at a high fixture (narrow, off the top of the frame),
  // base opening out as it reaches the ball's stadium spot (0, -0.15, 0)
  const shafts = useMemo(() => {
    const fixtures = [
      [-0.75, 1.15, -1.2],
      [-0.35, 1.3, -1.6],
      [0.35, 1.3, -1.6],
      [0.75, 1.15, -1.2],
    ]
    const up = new THREE.Vector3(0, 1, 0)
    const target = new THREE.Vector3(0, -0.15, 0)
    return fixtures.map(([x, y, z]) => {
      const from = new THREE.Vector3(x, y, z)
      // cone +Y (apex end) points from the ball back up to the fixture
      const dir = new THREE.Vector3().subVectors(from, target).normalize()
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir)
      return { from: [x, y, z], quat }
    })
  }, [])

  // fade in/out around the stadium stage, driven by the same scroll fractions
  // Ball.jsx uses (third page holds, then an exit run leads into THE LEGEND)
  useFrame(() => {
    const el = scrollRef && scrollRef.current
    const pool = poolRef.current
    if (!el || !pool) return
    const max = el.scrollHeight - el.clientHeight
    const w = max > 0 ? el.scrollTop / max : 0

    let stages = stagesRef.current
    if (!stages || stages.max !== max) {
      const map = {}
      el.querySelectorAll('[data-stage]').forEach((s) => {
        map[s.dataset.stage] = s.offsetTop / max
      })
      if (map.hero && map.elite && map.true && map.third && map.outro) {
        stages = { max, map }
        stagesRef.current = stages
      }
    }
    if (!stages) return

    const C = stages.map.third
    const O = stages.map.outro
    const exitStart = O - 0.4 * (O - C)
    // Lights rise during the approach so they're fully up the moment the
    // stadium page settles (at w === C.start), hold through the page, then
    // dim on the exit run into THE LEGEND.
    const fadeIn = 0.05
    let k = 0
    if (w < C - fadeIn) k = 0
    else if (w < C) k = ease((w - (C - fadeIn)) / fadeIn)
    else if (w < exitStart) k = 1
    else if (w < O) k = 1 - ease((w - exitStart) / (O - exitStart))
    k = clamp01(k)

    pool.material.opacity = 0.4 * k
    pool.scale.setScalar(0.5 + 1.2 * k)
    shaftRefs.current.forEach((sh) => {
      if (sh) sh.material.opacity = 0.05 * k
    })
  })

  return (
    <group>
      {/* floodlit turf pool under the ball (above the contact shadow, additive) */}
      <mesh ref={poolRef} position={[0, -1.55, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[5.5, 5.5]} />
        <meshBasicMaterial
          map={sprite}
          color={product.accentColor}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* soft light shafts from the stands */}
      {shafts.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => (shaftRefs.current[i] = el)}
          position={s.from}
          quaternion={s.quat}
          raycast={() => null}
        >
          <coneGeometry args={[0.45, 4, 16, 1, true]} />
          <meshBasicMaterial
            color={product.accentColor}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}
