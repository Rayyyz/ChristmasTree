import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Scene/Experience'
import { HandTracker } from './components/UI/HandTracker'
import { Overlay } from './components/UI/Overlay'
import { Suspense } from 'react'

function Loader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" wireframe />
    </mesh>
  )
}

function App() {
  return (
    <div className="h-screen w-full bg-gray-950 relative overflow-hidden">
      <HandTracker />
      <Overlay />
      <Canvas
        camera={{
          position: [0, 4, 20],
          fov: 45,
        }}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={<Loader />}>
          <Experience />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-4 text-white/50 text-sm pointer-events-none">
        Debug: R3F Canvas Loaded. If black screen, check console.
      </div>
    </div>
  )
}

export default App
