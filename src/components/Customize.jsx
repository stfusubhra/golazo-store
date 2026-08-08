import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { BASE_COLORS, LINE_COLORS } from '../products'
import { shade } from '../textures'
import { playClick, playHover } from '../sound'
import Ball from '../three/Ball'

export default function Customize({ onClose, onSave, initialProduct }) {
  const [base, setBase] = useState(initialProduct.primaryColor)
  const [line, setLine] = useState(initialProduct.lineColor)

  const accent = shade(line, 0.1)
  const previewProduct = useMemo(
    () => ({ id: 0, primaryColor: base, lineColor: line, accentColor: accent }),
    [base, line, accent],
  )

  const setField = (fn) => (v) => {
    fn(v)
    playClick()
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease]" onClick={onClose} />

      <div className="relative w-full max-w-md h-full bg-brand-dark border-l border-white/10 flex flex-col animate-[slideIn_0.4s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden">
        {/* header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex items-start justify-between">
          <div>
            <h2 className="text-white font-display text-3xl md:text-4xl mb-1 leading-none">
              DESIGN YOUR
              <br />
              GAME
            </h2>
            <p className="text-gray-400 text-sm mt-2">Create a classic 32-panel ball that matches your game.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors interactive" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {/* live 3D preview */}
          <div className="rounded-lg overflow-hidden border border-white/10 bg-gradient-to-b from-black/70 to-black/30">
            <div className="h-48">
              <Canvas camera={{ position: [0, 0, 3.1], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[3, 4, 5]} intensity={2.2} />
                <spotLight position={[-3, 2, 2]} angle={0.6} penumbra={1} intensity={4} color={accent} />
                <Suspense fallback={null}>
                  <Ball product={previewProduct} configurator />
                </Suspense>
              </Canvas>
            </div>
            <div className="px-3 py-2 bg-black/40 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              Live Preview · 32-Panel Classic · drag to spin
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-3 block">Panel Color</label>
            <div className="flex flex-wrap gap-3">
              {BASE_COLORS.map((b) => (
                <button
                  key={b}
                  onClick={() => setField(setBase)(b)}
                  className={`w-10 h-10 rounded-full border-2 transition-all interactive ${
                    base === b ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: b }}
                  aria-label={`Panel color ${b}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-3 block">Pentagon Color</label>
            <div className="flex flex-wrap gap-3">
              {LINE_COLORS.map((b) => (
                <button
                  key={b}
                  onClick={() => setField(setLine)(b)}
                  className={`w-8 h-8 rounded-full border-2 transition-all interactive ${
                    line === b ? 'border-white scale-110' : 'border-white/10 hover:scale-105'
                  }`}
                  style={{ backgroundColor: b }}
                  aria-label={`Pentagon color ${b}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="p-6 md:p-8 border-t border-white/10 bg-[#0a0a0a]">
          <button
            onClick={() => onSave({ base, line })}
            onMouseEnter={playHover}
            className="w-full py-4 font-bold uppercase tracking-widest text-white transition-all duration-300 border backdrop-blur-md hover:-translate-y-0.5 interactive"
            style={{
              backgroundColor: 'rgba(0,0,0,0.35)',
              borderColor: `${line}73`,
              boxShadow: `0 0 24px ${line}2b`,
            }}
          >
            Add to Collection
          </button>
        </div>
      </div>
    </div>
  )
}
