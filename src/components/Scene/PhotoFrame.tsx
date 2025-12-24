import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Vector3, Color, DoubleSide, Group } from 'three'
import { easing } from 'maath'
import { useStore } from '../../store/useStore'

// Gold material shared props
const goldMaterial = {
  color: new Color('#FFD700'),
  metalness: 1,
  roughness: 0.15,
  envMapIntensity: 2,
}

interface PhotoFrameProps {
  url: string
  index: number
  total: number
  positionData: {
    tree: [number, number, number]
    chaos: [number, number, number]
  }
}

export const PhotoFrame = ({ url,  positionData }: PhotoFrameProps) => {
  const groupRef = useRef<Group>(null)
  const texture = useTexture(url)
  const { mode } = useStore()
  
  // Random offset for floating effect
  const randomOffset = useMemo(() => Math.random() * 100, [])
  
  useFrame((state, delta) => {
    if (!groupRef.current) return

    const targetMix = mode === 'CHAOS' ? 1 : 0
    
    // We use a local mix value stored in userData to keep state per object without heavy React renders
    // Initialize if undefined
    if (groupRef.current.userData.mix === undefined) groupRef.current.userData.mix = targetMix === 1 ? 0 : 1

    // Smoothly interpolate mix
    easing.damp(groupRef.current.userData, 'mix', targetMix, 1.5, delta)
    const mix = groupRef.current.userData.mix

    // Interpolate position
    const x = positionData.tree[0] * (1 - mix) + positionData.chaos[0] * mix
    const y = positionData.tree[1] * (1 - mix) + positionData.chaos[1] * mix
    const z = positionData.tree[2] * (1 - mix) + positionData.chaos[2] * mix

    groupRef.current.position.set(x, y, z)

    // Orientation
    // Tree: Look at center (0, y, 0)
    // Chaos: Random rotation (we can simulate this by looking at a wandering target or just simple interpolation)
    
    // For simplicity and stability: Always look at center, but in Chaos mode add some random rotation?
    // Let's stick to "Look at vertical axis" for Tree mode
    const lookAtPos = new Vector3(0, y, 0)
    
    // In Chaos mode, let's make them float randomly a bit
    if (mix > 0.8) {
       // subtle float
       groupRef.current.rotation.z += delta * 0.1
       groupRef.current.rotation.y += delta * 0.05
    } else {
       groupRef.current.lookAt(lookAtPos)
    }
    
    // Scale pulse
    const time = state.clock.elapsedTime
    const scale = 1 + Math.sin(time * 2 + randomOffset) * 0.02
    groupRef.current.scale.setScalar(scale)
  })

  return (
    <group ref={groupRef}>
      {/* Gold Frame */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[0.7, 0.9, 0.05]} />
        <meshStandardMaterial {...goldMaterial} />
      </mesh>
      
      {/* Photo */}
      <mesh>
        <planeGeometry args={[0.6, 0.8]} />
        <meshBasicMaterial map={texture} side={DoubleSide} />
      </mesh>
    </group>
  )
}
