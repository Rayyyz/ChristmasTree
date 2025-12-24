import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Shape, ExtrudeGeometry, Mesh } from 'three'
import { useStore } from '../../store/useStore'
import { easing } from 'maath'

export const Star = () => {
  const meshRef = useRef<Mesh>(null)
  const { mode } = useStore()

  const geometry = useMemo(() => {
    const shape = new Shape()
    const outerRadius = 0.8
    const innerRadius = 0.35
    const points = 5

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius
      // Rotate starting angle to make it point up
      const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.closePath()

    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05
    }

    const geo = new ExtrudeGeometry(shape, extrudeSettings)
    geo.center()
    return geo
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Slow rotation
    meshRef.current.rotation.y += delta * 0.5
    
    // Floating effect
    meshRef.current.position.y = 7.2 + Math.sin(state.clock.elapsedTime) * 0.1

    // Scale animation based on mode (Hide in CHAOS mode?)
    // Or maybe just let it stay? Usually top star is part of the tree.
    // Let's hide it or float it away in Chaos mode.
    // For now, let's keep it simple: It stays at the center but maybe scales down in Chaos?
    
    const targetScale = mode === 'TREE' ? 1 : 0
    easing.damp3(meshRef.current.scale, [targetScale, targetScale, targetScale], 1.5, delta)
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 7.2, 0]}>
      <meshStandardMaterial
        color="#ffffff"
        emissive="#FFD700"
        emissiveIntensity={3.0}
        roughness={0.1}
        metalness={0.8}
        toneMapped={false}
      />
      {/* Add a point light to make it glow onto surroundings */}
      <pointLight color="#FFD700" intensity={3} distance={15} decay={2} />
    </mesh>
  )
}
