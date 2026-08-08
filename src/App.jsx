// ---------------------------------------------------------------------------
// GOLAZO STORE — main experience
// A single-screen, snap-scrolling storefront with a scroll-driven 3D ball.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Scene from './three/Scene'
import { PRODUCTS } from './products'
import { darken } from './textures'
import { playClick, playHover, playSuccess } from './sound'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import Customize from './components/Customize'
import CursorBoot from './components/CursorBoot'

// Darkened rgba string of a hex — mirrors `darken()` (channel × f) but keeps
// an alpha channel, used for ball-tinted glows that stay night-dark.
const darkRgba = (hex = '', f = 1, a = 1) => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return `rgba(30, 76, 41, ${a})`
  return `rgba(${(((n >> 16) & 255) * f) | 0}, ${(((n >> 8) & 255) * f) | 0}, ${((n & 255) * f) | 0}, ${a})`
}

// ---------------------------------------------------------------- primitives

function AnimatedText({ text, delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const chars = ref.current.querySelectorAll('.char')
    gsap.fromTo(
      chars,
      { y: 120, opacity: 0, scale: 0.8, filter: 'blur(15px)', rotateX: -45 },
      {
        y: 0,
        opacity: 0.4,
        scale: 1,
        filter: 'blur(0px)',
        rotateX: 0,
        duration: 1.4,
        stagger: 0.06,
        ease: 'power4.out',
        delay,
      },
    )
  }, [text, delay])
  return (
    <span ref={ref} className="inline-flex relative" style={{ perspective: '1000px' }}>
      {text.split('').map((c, i) => (
        <span key={`${text}-${i}`} className="char inline-block will-change-transform origin-bottom" style={{ transformStyle: 'preserve-3d' }}>
          {c}
        </span>
      ))}
    </span>
  )
}

// Giant background product name (homepage only) + "GOLAZO" watermark near the footer.
function BackgroundTitle({ product, scrollRef }) {
  const watermarkRef = useRef(null)
  const nameRef = useRef(null)
  useEffect(() => {
    const el = scrollRef && scrollRef.current
    if (!el || !watermarkRef.current || !nameRef.current) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const max = scrollHeight - clientHeight
      const d = max > 0 ? scrollTop / max : 0
      // GOLAZO watermark only on the very last page (footer) — NOT on
      // THE LEGEND page (fades in during the final 5% of scroll).
      if (d > 0.95) {
        watermarkRef.current.style.opacity = '0.1'
        watermarkRef.current.style.transform = `translateY(${(d - 0.95) * -50}px)`
      } else {
        watermarkRef.current.style.opacity = '0'
        watermarkRef.current.style.transform = ''
      }
      // ball name only on the homepage: fade out over the second half of the first viewport
      const fadeStart = clientHeight * 0.5
      const fadeEnd = clientHeight
      const nameOpacity = scrollTop <= fadeStart ? 1 : Math.max(0, 1 - (scrollTop - fadeStart) / (fadeEnd - fadeStart))
      nameRef.current.style.opacity = String(nameOpacity)
    }
    el.addEventListener('scroll', onScroll)
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef])

  return (
    <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none select-none">
      <div
        ref={nameRef}
        className="flex absolute inset-0 flex-row items-start justify-center pt-[46vh] md:items-center md:pt-0 transition-opacity duration-500"
      >
        <h1 className="font-display font-bold text-[16vw] md:text-[18vw] leading-none text-white tracking-widest mix-blend-overlay flex flex-row items-center gap-3 md:gap-[10vw]">
          <AnimatedText text={product.namePart1} delay={0} />
          <AnimatedText text={product.namePart2} delay={0.2} />
        </h1>
      </div>
      <div ref={watermarkRef} className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-1000">
        <h1 className="font-display text-[25vw] text-white tracking-widest translate-y-[-10vh]">GOLAZO</h1>
      </div>
    </div>
  )
}

// Reveal `.animate-item` children when they enter the viewport.
function useReveal(scrollRef) {
  useEffect(() => {
    const container = scrollRef && scrollRef.current
    if (!container) return
    const items = container.querySelectorAll('.animate-item')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('in-view')
          else e.target.classList.remove('in-view')
        })
      },
      { threshold: 0.3 },
    )
    items.forEach((i) => io.observe(i))
    return () => io.disconnect()
  }, [scrollRef])
}

// ---------------------------------------------------------------- section: hero

function HeroSection({ product, onPrev, onNext, onAddToCart, scrollRef }) {
  const priceRef = useRef(null)

  // price pops in whenever the product changes
  useEffect(() => {
    if (priceRef.current) {
      gsap.fromTo(
        priceRef.current,
        { y: 30, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out', delay: 0.4 },
      )
    }
  }, [product.id])

  const arrow = (dir, fn, label) => (
    <button onClick={fn} onMouseEnter={playHover} className="interactive nav-btn group" aria-label={label}>
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center text-white bg-black/20 backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:scale-110 group-active:scale-95">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'prev' ? 'M15.75 19.5L8.25 12l7.5-7.5' : 'M8.25 4.5l7.5 7.5-7.5 7.5'} />
        </svg>
      </div>
    </button>
  )

  return (
    <section data-stage="hero" className="relative w-full h-full min-h-full snap-start flex flex-col pointer-events-none overflow-hidden">
      {/* vertical product badge */}
      <div className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 h-40 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent">
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] tracking-widest font-mono" style={{ color: product.accentColor }}>
          {product.badge}
        </span>
      </div>

      {/* bottom row — price, CTA and arrows pinned to the bottom */}
      <div className="w-full px-6 md:px-16 pb-6 md:pb-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mt-auto pointer-events-none">
        {/* mobile spacer so the price sits below the ball */}
        <div className="md:hidden w-full h-[22vh] shrink-0" />

        <div className="flex flex-col gap-2 w-full md:w-auto text-center md:text-left pointer-events-auto items-center md:items-start">
          <div ref={priceRef} key={product.id} className="font-sans text-6xl md:text-5xl font-light tracking-wide drop-shadow-2xl" style={{ color: product.accentColor }}>
            ${product.price}
          </div>
          <div className="text-gray-400 text-xs tracking-wider uppercase font-medium flex items-center gap-2">
            Size: <span className="text-white">{product.size}</span>
            <span className="w-1 h-1 bg-white/50 rounded-full" />
            Classic Match
          </div>
        </div>

        <div className="w-full md:w-auto pointer-events-auto flex justify-center mt-4 md:mt-0">
          <button
            onClick={onAddToCart}
            onMouseEnter={playHover}
            className="interactive group relative w-full md:w-auto overflow-hidden rounded-sm px-14 py-5 transition-all duration-300 hover:-translate-y-1 border backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(0,0,0,0.35)',
              borderColor: `${product.accentColor}73`,
              boxShadow: `0 0 24px ${product.accentColor}2b, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}
          >
            <div className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
            <span className="relative z-10 text-white font-bold text-sm tracking-[0.2em] uppercase">Add to cart</span>
          </button>
        </div>

        <div className="flex items-center justify-center md:justify-end gap-4 pointer-events-auto">
          {arrow('prev', onPrev, 'Previous')}
          {arrow('next', onNext, 'Next')}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- section: metrics

function MetricStat({ value, unit, label, desc, delay }) {
  return (
    <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10 border-l border-white/20 pl-6" style={{ transitionDelay: `${delay}ms` }}>
      <div className="text-4xl font-bold text-white mb-1">
        {value}
        {unit && <span className="text-lg text-gray-500">{unit}</span>}
      </div>
      <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">{label}</div>
      <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">{desc}</p>
    </div>
  )
}

function MeterCard({ label, pct, status, delay }) {
  return (
    <div className="animate-item transition-all duration-1000 opacity-0 -translate-x-10 p-4 border border-white/10 bg-black/40 backdrop-blur-md rounded-lg max-w-[220px]" style={{ transitionDelay: `${delay}ms` }}>
      <div className="text-[10px] text-gray-400 font-mono mb-2">{label}</div>
      <div className="w-full h-1 bg-gray-700 rounded-full mb-2 overflow-hidden">
        <div className="h-full bg-white" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-white font-bold text-sm">
        <span>{pct}%</span>
        <span>{status}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- section: elite touch

function EliteTouchSection() {
  return (
    <section
      data-stage="elite"
      className="relative w-full h-full min-h-full flex items-center px-6 md:px-20 py-20 pointer-events-none snap-start overflow-hidden"
    >
      {/* text lives on the LEFT half — the ball spins on the right */}
      <div className="w-full md:w-1/2 relative z-10 pointer-events-auto">
        <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10" style={{ transitionDelay: '100ms' }}>
          <div className="text-xs font-mono text-brand-accent mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent" />
            PERFORMANCE METRICS
          </div>
          <h2 className="font-display text-5xl md:text-7xl text-white leading-[0.9] tracking-tight">
            ELITE
            <br />
            TOUCH
          </h2>
        </div>
        {/* the 32-panel text and the percentage bars sit SIDE BY SIDE */}
        <div className="mt-10 flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">
          <div className="space-y-8 flex-1 min-w-0">
            <MetricStat value="110" unit=" KM/H" label="Shot Speed" desc="Struck clean, the classic 32-panel tops a century of pace without deviating a centimetre." delay={200} />
            <MetricStat value="68.5" unit=" CM" label="Circumference" desc="Regulation size five — hand-checked to the same spec played on every elite pitch." delay={300} />
          </div>
          <div className="flex flex-col gap-5 flex-1 min-w-0 sm:max-w-[250px]">
            <MeterCard label="FIRST TOUCH" pct={96} status="LOCKED" delay={400} />
            <MeterCard label="PASS ACCURACY" pct={94} status="ON TARGET" delay={500} />
            <MeterCard label="CROSS COMPLETION" pct={91} status="DELIVERED" delay={600} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- section: true flight

function TrueFlightSection() {
  return (
    <section
      data-stage="true"
      className="relative w-full h-full min-h-full flex items-center justify-end px-6 md:px-20 py-20 pointer-events-none snap-start overflow-hidden"
    >
      {/* text lives on the RIGHT half — the ball spins on the left */}
      <div className="w-full md:w-1/2 relative z-10 pointer-events-auto">
        <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10" style={{ transitionDelay: '700ms' }}>
          <div className="text-xs font-mono text-brand-accent mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent" />
            IN THE AIR
          </div>
          <h2 className="font-display text-5xl md:text-7xl text-white leading-[0.9] tracking-tight">
            TRUE
            <br />
            FLIGHT
          </h2>
        </div>
        {/* metrics + spec chips side by side */}
        <div className="mt-10 flex flex-col sm:flex-row gap-8 sm:gap-12 items-start">
          <div className="space-y-8 flex-1 min-w-0">
            <MetricStat value="45" unit=" M" label="Flight Range" desc="A driven ball that carries the length of the box and lands where the plan said it would." delay={800} />
            <MetricStat value="480" unit=" RPM" label="Spin Rate" desc="Curve and dip built into the rotation — the ball bends late and drops over the wall." delay={900} />
          </div>
          <div className="animate-item transition-all duration-1000 opacity-0 translate-y-10 border border-white/10 bg-black/40 backdrop-blur-md rounded-lg p-4 flex-1 min-w-0 sm:max-w-[250px]" style={{ transitionDelay: '1000ms' }}>
            <div className="flex flex-col gap-y-2.5 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              <span>
                TAKEOFF SPEED <span className="text-white">104 KM/H</span>
              </span>
              <span>
                MAX HEIGHT <span className="text-white">8.5 M</span>
              </span>
              <span>
                HANG TIME <span className="text-white">2.4 S</span>
              </span>
              <span>
                RELEASE ANGLE <span className="text-white">31°</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- section: stadium night
// The third scroll page — a night-match showcase: a dim floodlit glow washing
// the top, a row of light towers with soft beams, and a deep-green turf glow
// rising from below (palette-independent so it reads as a night pitch on every
// ball), with the ball resting center stage and corner captions.

function StadiumSection({ product }) {
  const accent = product && product.accentColor
  return (
    <section
      data-stage="third"
      className="relative w-full h-full min-h-full flex items-center justify-center px-6 md:px-20 py-20 pointer-events-none snap-start overflow-hidden"
    >
      {/* floodlit stand glow across the top — dim + cool so it reads as ambient light, not a white sheet */}
      <div
        className="absolute -top-48 left-1/2 -translate-x-1/2 w-[150%] h-[75vh] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.045) 40%, transparent 72%)',
        }}
      />

      {/* floodlight towers — slim masts with lamp housings and soft blurred beams */}
      <div className="absolute top-[11vh] left-0 right-0 flex items-start justify-between px-[7vw] md:px-[11vw] pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="relative flex flex-col items-center">
            {/* mast rising off-frame */}
            <div className="w-[2px] h-9 bg-gradient-to-b from-transparent via-white/15 to-white/35" />
            {/* lamp housing — glow tinted to the ball */}
            <div
              className="relative h-[7px] w-[18px] rounded-[2px] bg-gradient-to-b from-white/90 to-white/40"
              style={{ boxShadow: `0 0 12px 3px ${darkRgba(accent, 0.8, 0.35)}` }}
            />
            {/* soft beam cone — blurred so it reads as light, tinted to the ball */}
            <div
              className="w-12 md:w-20 h-[26vh] md:h-[30vh]"
              style={{
                background: `linear-gradient(to bottom, ${darkRgba(accent, 0.85, 0.08)} 0%, ${darkRgba(accent, 0.85, 0.02)} 55%, transparent 85%)`,
                clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)',
                filter: 'blur(6px)',
              }}
            />
          </div>
        ))}
      </div>

      {/* turf glow rising from the bottom — the ball's accent, deeply darkened,
          so every product gets a rich night tint (TELSTAR amber, TANGO crimson,
          NOIR moonlight grey) instead of a generic green */}
      <div
        className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[170%] h-[70vh] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, ${darkRgba(accent, 0.34, 0.55)} 0%, ${darkRgba(accent, 0.34, 0.22)} 42%, transparent 66%)`,
        }}
      />

      {/* upper-left caption (below the sticky nav) */}
      <div className="absolute left-6 md:left-16 top-36 md:top-40 max-w-[230px] animate-item transition-all duration-1000 opacity-0 translate-y-10">
        <div className="text-xs font-mono text-brand-accent mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-accent" />
          MATCH NIGHT
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          The 32-panel classic under the lights it was built for. Ninety seams catch the floodlights.
        </p>
      </div>

      {/* lower-right caption */}
      <div className="absolute right-6 md:right-16 bottom-32 md:bottom-36 max-w-[230px] text-right animate-item transition-all duration-1000 opacity-0 translate-y-10">
        <div className="text-xs font-mono text-brand-accent mb-2 flex items-center gap-2 justify-end">
          GAME READY
          <span className="w-2 h-2 rounded-full bg-brand-accent" />
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Hand-stitched and balanced to fly true — from the first whistle to the final.
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- section: limited

function LimitedSection() {
  return (
    <section data-stage="outro" className="relative w-full h-full min-h-full flex items-center px-6 md:px-20 pt-32 md:pt-44 pb-16 md:pb-20 pointer-events-none snap-start overflow-hidden">
      <div className="w-full relative z-10 pointer-events-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs font-mono text-brand-accent mb-2">RANK 01</div>
            <h2 className="font-display text-6xl md:text-8xl text-white leading-[0.9] tracking-tight">
              THE
              <br />
              LEGEND
            </h2>
          </div>
          <div className="text-right hidden md:block pb-2">
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">Elite Tier</div>
            <p className="text-xs text-gray-500 max-w-[220px]">Built for the biggest stage on earth.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="animate-item border border-white/10 bg-black/40 backdrop-blur-md rounded-lg p-6">
            <div className="text-[10px] font-mono text-brand-accent uppercase tracking-widest mb-3">Certified</div>
            <h3 className="font-display text-2xl text-white mb-2">Gold Standard</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Regulation size and weight. Every ball hand-checked before it ships.</p>
          </div>
          <div className="animate-item border border-white/10 bg-black/40 backdrop-blur-md rounded-lg p-6" style={{ transitionDelay: '150ms' }}>
            <div className="text-[10px] font-mono text-brand-accent uppercase tracking-widest mb-3">Next Level Performance</div>
            <h3 className="font-display text-2xl text-white mb-2">Every Touch Counts</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Carved seams and pebbled leather keep the ball true in every climate.</p>
          </div>
          <div className="animate-item border border-white/10 bg-black/40 backdrop-blur-md rounded-lg p-6" style={{ transitionDelay: '300ms' }}>
            <div className="text-[10px] font-mono text-brand-accent uppercase tracking-widest mb-3">Heritage</div>
            <h3 className="font-display text-2xl text-white mb-2">The Same Ball</h3>
            <p className="text-xs text-gray-500 leading-relaxed">The same 32-panel silhouette that has defined world football for fifty years.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- section: footer

function FooterSection({ onShop }) {
  return (
    <section className="relative w-full h-full min-h-full snap-start flex flex-col items-center justify-center gap-10 pointer-events-none px-6">
      <div className="text-[10px] md:text-xs tracking-[0.3em] text-gray-500 font-mono flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span>OFFICIAL STORE</span>
        <span className="text-white/30">|</span>
        <span>GLOBAL SHIPPING</span>
        <span className="text-white/30">|</span>
        <span>SECURE CHECKOUT</span>
      </div>

      <button
        onClick={onShop}
        onMouseEnter={playHover}
        className="pointer-events-auto interactive group relative overflow-hidden rounded-sm px-16 py-6 transition-all duration-300 hover:brightness-110"
        style={{ backgroundColor: '#FFC300', boxShadow: '0 0 30px rgba(255, 195, 0, 0.35)' }}
      >
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
        <span className="relative z-10 text-black font-bold text-sm tracking-[0.25em] uppercase">Shop the drop</span>
      </button>

      <div className="flex items-center gap-6 text-gray-500">
        <a href="#" className="hover:text-white transition-colors interactive" aria-label="Instagram">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h8.25a2.25 2.25 0 002.25-2.25V8.25zm-2.25 0H18m-6 2.25a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </a>
        <a href="#" className="hover:text-white transition-colors interactive" aria-label="X">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l9.75 9m0-9l-9.75 9" />
          </svg>
        </a>
        <a href="#" className="hover:text-white transition-colors interactive" aria-label="YouTube">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
          </svg>
        </a>
      </div>

      <div className="text-[10px] text-gray-600 tracking-widest">© 2026 GOLAZO STORE. ENGINEERED FOR GREATNESS.</div>
    </section>
  )
}

// --------------------------------------------------------------------- app

export default function App() {
  const [products, setProducts] = useState(PRODUCTS)
  const [active, setActive] = useState(0)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  // bump to fire the add-to-cart ghost flight (CartFly listens for this)
  const [addToCartTrigger, setAddToCartTrigger] = useState(0)

  const scrollRef = useRef(null)
  const appRootRef = useRef(null)

  useReveal(scrollRef)

  const product = products[active] || PRODUCTS[0]

  const next = () => {
    setActive((p) => (p + 1) % products.length)
    playClick()
  }
  const prev = () => {
    setActive((p) => (p - 1 + products.length) % products.length)
    playClick()
  }

  // Launch the ghost-ball flight immediately; the cart itself updates ~950ms
  // later, landing exactly as the ball vanishes into the cart icon. The thump
  // at impact (playAddToCart) is the audible confirmation — no extra beep.
  const addToCart = () => {
    const p = product
    setAddToCartTrigger(Date.now())
    setTimeout(() => setCart((c) => [...c, p]), 950)
  }

  const removeItem = (idx) => setCart((c) => c.filter((_, i) => i !== idx))

  const addCustom = ({ base, line }) => {
    const custom = {
      id: Date.now(),
      namePart1: 'MY',
      namePart2: 'BALL',
      model: 'CUSTOM 32',
      category: 'YOUR DESIGN · ONE OF ONE',
      price: 99.99,
      size: '5',
      badge: 'MY/01',
      primaryColor: base,
      lineColor: line,
      accentColor: line,
      bgColor: darken(line, 0.42),
      specs: [
        ['CONSTRUCTION', '32-Panel Custom Build'],
        ['PANELS', '12 Pentagons · 20 Hexagons'],
        ['SIZE', '5'],
        ['STATUS', 'One of One'],
      ],
      story: 'Designed by you. A one-of-one classic 32-panel match ball built to match your game.',
    }
    setProducts((p) => [...p, custom])
    setActive(products.length) // index of the new product
    setCustomizeOpen(false)
    playSuccess()
  }

  const scrollToTop = () => scrollRef.current && scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
  const scrollToFooter = () =>
    scrollRef.current &&
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })

  return (
    <>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} items={cart} onRemove={removeItem} />
      {customizeOpen && <Customize onClose={() => setCustomizeOpen(false)} onSave={addCustom} initialProduct={product} />}
      {/* custom boot cursor (replaces the native pointer on desktop) */}
      <CursorBoot accent={product.accentColor} />

      <div
        ref={appRootRef}
        id="app-root"
        className="relative w-full h-screen flex items-center justify-center overflow-hidden p-0 md:p-8 select-none"
        style={{
          backgroundColor: product.bgColor,
          transition: 'background-color 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div className="relative w-full h-full md:max-w-[1600px] md:max-h-[900px] bg-brand-dark md:rounded-[2.5rem] shadow-2xl flex flex-col border-0 md:border border-white/5 overflow-hidden">
          {/* vignette + floor grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/30 via-black to-black opacity-80 pointer-events-none z-0" />
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20 pointer-events-none z-0"
            style={{
              background: 'repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.05) 50px)',
              transform: 'perspective(500px) rotateX(60deg) scale(2)',
              transformOrigin: 'bottom center',
              maskImage: 'linear-gradient(to top, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
            }}
          />

          <BackgroundTitle product={product} scrollRef={scrollRef} />
          <Scene product={product} scrollRef={scrollRef} appRootRef={appRootRef} addToCartTrigger={addToCartTrigger} />

          {/* scrollable content */}
          <div ref={scrollRef} className="absolute inset-0 z-30 w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar snap-y snap-mandatory">
            <Navbar
              cartCount={cart.length}
              onCustomize={() => {
                setCustomizeOpen(true)
                playClick()
              }}
              onOpenCart={() => {
                setCartOpen(true)
                playClick()
              }}
              onProducts={scrollToTop}
              onContacts={scrollToFooter}
            />

            <HeroSection
              product={product}
              onPrev={prev}
              onNext={next}
              onAddToCart={addToCart}
              scrollRef={scrollRef}
            />
            <EliteTouchSection />
            <TrueFlightSection />
            <StadiumSection product={product} />
            <LimitedSection />
            <FooterSection onShop={scrollToTop} />
          </div>

          {/* corner mark */}
          <div className="absolute bottom-6 left-8 text-white/30 text-xs font-bold z-50 pointer-events-none hidden md:block">GZ</div>
        </div>
      </div>
    </>
  )
}
