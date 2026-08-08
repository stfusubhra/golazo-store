// ---------------------------------------------------------------------------
// Classic 32-panel football — real geometry + realistic PBR maps.
//
// The ball is a truncated icosahedron (12 pentagons + 20 hexagons). Each
// panel is tessellated onto the sphere and the seam lines are pushed inward
// to form authentic V-grooves, so we get a genuine "classic football"
// silhouette instead of a texture slapped on a sphere. A hi-res procedural
// leather normal + roughness map finishes the realistic feel.
// ---------------------------------------------------------------------------
import * as THREE from 'three'

const PHI = (1 + Math.sqrt(5)) / 2
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// ------------------------------------------------------------------ icosahedron

function icosahedron() {
  const verts = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
  ].map((p) => new THREE.Vector3(...p).normalize())
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ]
  const seen = new Set()
  const edges = []
  for (const tri of faces) {
    for (let i = 0; i < 3; i++) {
      const a = tri[i]
      const b = tri[(i + 1) % 3]
      const k = a < b ? `${a}-${b}` : `${b}-${a}`
      if (!seen.has(k)) {
        seen.add(k)
        edges.push([a, b])
      }
    }
  }
  return { verts, faces, edges }
}

// ------------------------------------------------- truncated icosahedron panels
// Returns the 32 panel loops (20 hexagons + 12 pentagons) as spherical vertex
// loops with a per-panel kind (0 = hexagon, 1 = pentagon).

function panelLoops() {
  const { verts, faces, edges } = icosahedron()
  const cut = new Map()
  // Point on edge (a,b) at 1/3 from a. Cached by canonical key.
  const near = (a, b) => {
    const lo = a < b ? a : b
    const hi = a < b ? b : a
    const t = a < b ? 1 : 2
    const key = `${lo}|${hi}|${t}`
    let p = cut.get(key)
    if (!p) {
      p = new THREE.Vector3().lerpVectors(verts[a], verts[b], 1 / 3).normalize()
      cut.set(key, p)
    }
    return p
  }

  const loops = []
  for (const [a, b, c] of faces) {
    loops.push({
      kind: 0,
      verts: [near(a, b), near(b, a), near(b, c), near(c, b), near(c, a), near(a, c)],
    })
  }
  const adj = new Map()
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, [])
    if (!adj.has(b)) adj.set(b, [])
    adj.get(a).push(b)
    adj.get(b).push(a)
  }
  for (const [a, ns] of adj) {
    const dir = verts[a]
    const ref = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const u = new THREE.Vector3().crossVectors(dir, ref).normalize()
    const w = new THREE.Vector3().crossVectors(dir, u)
    const pts = ns.map((n) => {
      const p = near(a, n)
      const rel = p.clone().addScaledVector(dir, -p.dot(dir))
      return { p, ang: Math.atan2(rel.dot(w), rel.dot(u)) }
    })
    pts.sort((x, y) => x.ang - y.ang)
    loops.push({ kind: 1, verts: pts.map((x) => x.p) })
  }
  return loops
}

// ------------------------------------------------------------------ geometry

// Builds a non-indexed classic ball. Each panel is a fan triangulated from its
// center, midpoint-subdivided `subdiv` times, projected onto the sphere, then
// the seam band is depressed by `seamDepth` (quadratic falloff over `fillet`)
// to carve real grooves. A `kind` attribute marks hexagons (0) / pentagons (1)
// so the two panel colors can be painted later per product.

export function buildClassicBallGeometry({ radius = 1, subdiv = 2, seamDepth = 0.012, fillet = 0.3 } = {}) {
  const loops = panelLoops()
  const positions = []
  const normals = []
  const uvs = []
  const kinds = []

  const up = new THREE.Vector3(0, 1, 0)
  for (const loop of loops) {
    const n = loop.verts.length
    const center = new THREE.Vector3()
    for (const p of loop.verts) center.add(p)
    center.normalize()

    // per-panel UV basis (good enough for isotropic noise textures)
    const t1 = new THREE.Vector3().crossVectors(center, up)
    if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0)
    t1.normalize()
    const t2 = new THREE.Vector3().crossVectors(center, t1).normalize()
    const proj = (p) => [p.dot(t1), p.dot(t2)]

    // fan triangulation, tracking the distance to the seam line
    let tris = []
    for (let i = 0; i < n; i++) {
      tris.push([
        { p: center, d: subdiv + 3 },
        { p: loop.verts[i], d: 0 },
        { p: loop.verts[(i + 1) % n], d: 0 },
      ])
    }
    for (let s = 0; s < subdiv; s++) {
      const next = []
      for (const [a, b, c] of tris) {
        const mid = (x, y) => ({ p: x.p.clone().add(y.p).normalize(), d: Math.min(x.d, y.d) + 1 })
        const ab = mid(a, b)
        const bc = mid(b, c)
        const ca = mid(c, a)
        next.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca])
      }
      tris = next
    }

    // UV bounds of the panel
    let minU = Infinity
    let maxU = -Infinity
    let minV = Infinity
    let maxV = -Infinity
    for (const tri of tris) {
      for (const x of tri) {
        const [pu, pv] = proj(x.p)
        if (pu < minU) minU = pu
        if (pu > maxU) maxU = pu
        if (pv < minV) minV = pv
        if (pv > maxV) maxV = pv
      }
    }
    const rngU = maxU - minU || 1
    const rngV = maxV - minV || 1

    const maxD = subdiv + 3
    for (const tri of tris) {
      for (const x of tri) {
        const t = x.d / maxD
        const w = clamp01(t / fillet)
        const dip = (1 - w) * (1 - w)
        const r = radius * (1 - seamDepth * dip)
        positions.push(x.p.x * r, x.p.y * r, x.p.z * r)
        normals.push(x.p.x, x.p.y, x.p.z)
        const [pu, pv] = proj(x.p)
        uvs.push((pu - minU) / rngU, (pv - minV) / rngV)
        kinds.push(loop.kind)
      }
    }
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setAttribute('kind', new THREE.Float32BufferAttribute(kinds, 1))
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(positions.length), 3))
  return g
}

// Paint the two panel colors (hexagon / pentagon) onto a classic geometry.
export function paintBall(g, hexColor, pentColor) {
  const kind = g.getAttribute('kind')
  const color = g.getAttribute('color')
  const c1 = new THREE.Color(hexColor)
  const c2 = new THREE.Color(pentColor)
  for (let i = 0; i < kind.count; i++) {
    const c = kind.getX(i) > 0.5 ? c2 : c1
    color.setXYZ(i, c.r, c.g, c.b)
  }
  color.needsUpdate = true
}

// ----------------------------------------------------------- leather textures

function hash2(ix, iy, seed) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

function smooth(t) {
  return t * t * (3 - 2 * t)
}

function valueNoise(x, y, seed) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const a = hash2(ix, iy, seed)
  const b = hash2(ix + 1, iy, seed)
  const c = hash2(ix, iy + 1, seed)
  const d = hash2(ix + 1, iy + 1, seed)
  const u = smooth(fx)
  const v = smooth(fy)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x, y, seed, octaves = 5) {
  let sum = 0
  let amp = 0.5
  let f = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * f, y * f, seed + i * 101) * amp
    norm += amp
    amp *= 0.5
    f *= 2
  }
  return sum / norm
}

// Hi-res (default 2048x2048) procedural leather: tangent-space normal map from
// an fbm height field plus a matching roughness map. Generated once and cached.
export function createLeatherTextures(size = 2048) {
  const inner = Math.max(256, size >> 1)

  // height field at half resolution (fast to fill, bilinearly upsampled)
  const field = new Float32Array(inner * inner)
  const freq = 9
  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      field[y * inner + x] = fbm((x / inner) * freq, (y / inner) * freq, 7)
    }
  }
  const sample = (x, y) => {
    const fx = clamp01(x / size) * (inner - 1)
    const fy = clamp01(y / size) * (inner - 1)
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = fx - x0
    const ty = fy - y0
    const x1 = Math.min(x0 + 1, inner - 1)
    const y1 = Math.min(y0 + 1, inner - 1)
    const a = field[y0 * inner + x0]
    const b = field[y0 * inner + x1]
    const c = field[y1 * inner + x0]
    const d = field[y1 * inner + x1]
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty
  }

  // tangent-space normal map (leather grain)
  const nCanvas = document.createElement('canvas')
  nCanvas.width = size
  nCanvas.height = size
  const nctx = nCanvas.getContext('2d')
  const nImg = nctx.createImageData(size, size)
  const strength = 4
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hL = sample(x - 1, y)
      const hR = sample(x + 1, y)
      const hD = sample(x, y - 1)
      const hU = sample(x, y + 1)
      let nx = -(hR - hL) * strength
      let ny = -(hU - hD) * strength
      let nz = 1
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz)
      nx *= inv
      ny *= inv
      nz *= inv
      const i = (y * size + x) * 4
      nImg.data[i] = (nx * 0.5 + 0.5) * 255
      nImg.data[i + 1] = (ny * 0.5 + 0.5) * 255
      nImg.data[i + 2] = (nz * 0.5 + 0.5) * 255
      nImg.data[i + 3] = 255
    }
  }
  nctx.putImageData(nImg, 0, 0)
  const normalMap = new THREE.CanvasTexture(nCanvas)
  normalMap.wrapS = THREE.RepeatWrapping
  normalMap.wrapT = THREE.RepeatWrapping

  // roughness map (leather wear variation)
  const rCanvas = document.createElement('canvas')
  rCanvas.width = size
  rCanvas.height = size
  const rctx = rCanvas.getContext('2d')
  const rImg = rctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = sample(x, y)
      const rough = clamp01(0.52 + (h - 0.5) * 0.55)
      const i = (y * size + x) * 4
      const v = rough * 255
      rImg.data[i] = v
      rImg.data[i + 1] = v
      rImg.data[i + 2] = v
      rImg.data[i + 3] = 255
    }
  }
  rctx.putImageData(rImg, 0, 0)
  const roughnessMap = new THREE.CanvasTexture(rCanvas)
  roughnessMap.wrapS = THREE.RepeatWrapping
  roughnessMap.wrapT = THREE.RepeatWrapping

  return { normalMap, roughnessMap }
}

let leatherCache = null
export function getLeatherTextures(size = 2048) {
  if (!leatherCache) leatherCache = createLeatherTextures(size)
  return leatherCache
}
