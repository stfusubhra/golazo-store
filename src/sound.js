// ---------------------------------------------------------------------------
// Tiny WebAudio synth for UI feedback — no assets required.
// ---------------------------------------------------------------------------

let ctx = null
let noiseBuf = null

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// shared white-noise buffer (one allocation, reused by every noise-based sound)
function getNoise(c) {
  if (!noiseBuf) {
    const len = Math.floor(c.sampleRate * 0.6)
    noiseBuf = c.createBuffer(1, len, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

function blip({ freq = 520, type = 'square', dur = 0.09, gain = 0.045, delay = 0 }) {
  const c = ensure()
  if (!c) return
  const t = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export function playHover() {
  blip({ freq: 340, type: 'sine', dur: 0.05, gain: 0.02 })
}

export function playClick() {
  blip({ freq: 520, type: 'square', dur: 0.08, gain: 0.04 })
}

export function playSuccess() {
  blip({ freq: 520, type: 'square', dur: 0.08, gain: 0.045 })
  blip({ freq: 780, type: 'square', dur: 0.1, gain: 0.045, delay: 0.09 })
}

// Air whoosh — a ball cutting through the air as it launches toward the cart.
// Kept soft and neutral (whooshes aren't sport-specific).
export function playSwoosh() {
  const c = ensure()
  if (!c) return
  const t = c.currentTime
  const src = c.createBufferSource()
  src.buffer = getNoise(c)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.1
  bp.frequency.setValueAtTime(450, t)
  bp.frequency.exponentialRampToValueAtTime(1500, t + 0.14)
  bp.frequency.exponentialRampToValueAtTime(280, t + 0.45)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.11, t + 0.12)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
  src.connect(bp)
  bp.connect(g)
  g.connect(c.destination)
  src.start(t)
  src.stop(t + 0.55)
}

// Soccer-ball landing: a deep, dead "thump" — low-pitched, fast-decaying, with
// a leather "thock" attack and ONE damped follow-up bounce. Deliberately NOT a
// basketball "boing" (which would be higher, springier and longer-ringing).
export function playAddToCart() {
  const c = ensure()
  if (!c) return
  const t = c.currentTime

  // leather contact attack — a 50ms burst of high-passed noise
  const hit = c.createBufferSource()
  hit.buffer = getNoise(c)
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 900
  const g1 = c.createGain()
  g1.gain.setValueAtTime(0.22, t)
  g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  hit.connect(hp)
  hp.connect(g1)
  g1.connect(c.destination)
  hit.start(t)
  hit.stop(t + 0.06)

  // the thump itself — sine slamming 120Hz down to 45Hz
  const thump = c.createOscillator()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(120, t)
  thump.frequency.exponentialRampToValueAtTime(45, t + 0.16)
  const g2 = c.createGain()
  g2.gain.setValueAtTime(0.55, t)
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
  thump.connect(g2)
  g2.connect(c.destination)
  thump.start(t)
  thump.stop(t + 0.3)

  // damped follow-up bounce (soccer balls settle fast — no springy reboing)
  const t2 = t + 0.17
  const rebound = c.createOscillator()
  rebound.type = 'sine'
  rebound.frequency.setValueAtTime(85, t2)
  rebound.frequency.exponentialRampToValueAtTime(38, t2 + 0.12)
  const g3 = c.createGain()
  g3.gain.setValueAtTime(0.0001, t2)
  g3.gain.exponentialRampToValueAtTime(0.2, t2 + 0.01)
  g3.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.2)
  rebound.connect(g3)
  g3.connect(c.destination)
  rebound.start(t2)
  rebound.stop(t2 + 0.22)
}
