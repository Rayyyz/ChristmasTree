import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, Color, DoubleSide } from 'three'
import { generateSnowflakeTexture } from '../../utils/snowflakeGenerator'

const TOTAL_SNOW = 4000
const VARIATIONS = 12
const PER_GROUP = Math.ceil(TOTAL_SNOW / VARIATIONS)

interface SnowGroupProps {
  seed: number
}

const SnowGroup = ({ seed }: SnowGroupProps) => {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  
  // Generate a unique exquisite snowflake texture for this group
  const texture = useMemo(() => generateSnowflakeTexture(seed), [seed])

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < PER_GROUP; i++) {
      // Cylinder distribution for background coverage
      // r = R * random() gives higher density at center (1/r), good for visibility near tree
      const r = Math.random() * 90 
      const theta = Math.random() * Math.PI * 2
      
      const x = r * Math.cos(theta)
      const z = r * Math.sin(theta)
      const y = (Math.random() - 0.5) * 120 // -60 to 60

      const speed = 0.5 + Math.random() * 2.0
      // 60% Gold (#FFD700), 40% Silver (#E0E0E0) - High gloss
      const isGold = Math.random() > 0.4
      const color = isGold ? new Color('#FFD700') : new Color('#E0E0E0')
      
      // Random initial rotation and spin speed
      const spin = (Math.random() - 0.5) * 2
      
      temp.push({ x, y, z, speed, color, spin })
    }
    return temp
  }, [])

  useLayoutEffect(() => {
    if (meshRef.current) {
      particles.forEach((p, i) => {
        meshRef.current!.setColorAt(i, p.color)
      })
      meshRef.current.instanceColor!.needsUpdate = true
    }
  }, [particles])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    particles.forEach((p, i) => {
      // Fall logic
      p.y -= p.speed * delta
      
      if (p.y < -60) {
        p.y = 60
        // Reset to random position at top to maintain distribution
        const r = Math.random() * 90
        const theta = Math.random() * Math.PI * 2
        p.x = r * Math.cos(theta)
        p.z = r * Math.sin(theta)
      }

      const time = state.clock.elapsedTime
      
      // Swaying motion
      dummy.position.set(
        p.x + Math.sin(time * 0.5 + i) * 1.5, // Wider sway
        p.y,
        p.z + Math.cos(time * 0.3 + i) * 1.5
      )
      
      // Rotation (Spinning as they fall)
      dummy.rotation.x = time * p.spin
      dummy.rotation.y = time * p.spin * 0.5
      dummy.rotation.z = time * 0.2 // Gentle tilt
      
      // Size variation
      const scale = 0.3 + Math.sin(time + i) * 0.05
      dummy.scale.setScalar(scale)
      
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PER_GROUP]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial 
        alphaMap={texture}
        transparent={true}
        depthWrite={false} // Important for transparency
        side={DoubleSide}
        metalness={1} // Maximum metal
        roughness={0.2}
        emissiveIntensity={0.2} // Slight glow
        color="white" // Base color white, instance color tints it
      />
    </instancedMesh>
  )
}

export const Snow = () => {
  // Render multiple groups, each with a different snowflake texture
  return (
    <group>
      {Array.from({ length: VARIATIONS }).map((_, i) => (
        <SnowGroup key={i} seed={i * 1337} />
      ))}
    </group>
  )
}
