// ---------------------------------------------------------------------------
// Full-screen R3F canvas. Lives BELOW the scroll container (z-10) so wheel
// events pass through; drag events bubble up to the app root (eventSource).
// ---------------------------------------------------------------------------
import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import Ball from './Ball'
import CartFly from './CartFly'
import StadiumFX from './StadiumFX'

export default function Scene({ product, scrollRef, appRootRef, addToCartTrigger }) {
  // the contact shadow plane follows the ball (Ball.jsx drives its height)
  const shadowRef = useRef(null)
  return (
    <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 8], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        eventSource={appRootRef}
        eventPrefix="client"
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Ball product={product} scrollRef={scrollRef} shadowRef={shadowRef} />
          <CartFly product={product} triggerTime={addToCartTrigger} />
          <StadiumFX product={product} scrollRef={scrollRef} />
          <ambientLight intensity={0.45} />
          <directionalLight
            position={[-5, 10, 5]}
            angle={0.3}
            penumbra={1}
            intensity={2.2}
            castShadow
            shadow-bias={-1e-4}
            color="#ffffff"
          />
          {/* soft rim to lift the leather off the background */}
          <directionalLight position={[6, 3, -6]} intensity={0.8} color={product.accentColor} />
          <spotLight
            position={[5, 0, -5]}
            angle={0.5}
            penumbra={1}
            intensity={5}
            color={product.accentColor}
          />
          <pointLight position={[-5, 0, 5]} intensity={0.8} color="#4a5568" />
          <group ref={shadowRef}>
            <ContactShadows
              opacity={0.55}
              scale={10}
              blur={2.5}
              far={4}
              resolution={512}
              color="#000000"
              position={[0, 0, 0]}
            />
          </group>
          {/* self-contained studio environment (no external HDR dependency) */}
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={2.4} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[9, 3.5, 1]} color="#ffffff" />
            <Lightformer intensity={1.5} position={[-6, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={[5, 4, 1]} color="#ffffff" />
            <Lightformer intensity={1} position={[6, 1, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 4, 1]} color={product.accentColor} />
            <Lightformer intensity={1.2} position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[9, 3, 1]} color="#e6e6e6" />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  )
}
