import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, InstancedMesh, Object3D, Color } from 'three'
import { useStore } from '../../store/useStore'
import { easing } from 'maath'

// Gourmet flavors
const FLAVORS = [
  { name: 'Strawberry', color: '#ffb7b2', icing: '#ff9aa2' }, // Soft Pink Bun, Hot Pink Icing
  { name: 'Chocolate', color: '#8d5524', icing: '#4a3728' }, // Brown Bun, Dark Chocolate Icing
  { name: 'Cream', color: '#e0c097', icing: '#ffffff' },      // Light Bun, White Icing
  { name: 'Matcha', color: '#c5dca0', icing: '#8da35c' },     // Green Bun, Green Icing
]

const SPRINKLE_COLORS = [
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'
]

interface SprinklesProps {
  count?: number
}

const Sprinkles = ({ count = 40 }: SprinklesProps) => {
  const meshRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  
  const sprinklesData = useMemo(() => {
    const data = []
    const R = 0.5 // Torus major radius
    const r = 0.26 // Icing tube radius
    
    for (let i = 0; i < count; i++) {
      // Standard:
      // x = (R + r cos θ) cos φ
      // y = (R + r cos θ) sin φ
      // z = r sin θ
      // where φ (phi) is 0..2PI (major), θ (theta) is 0..2PI (minor)
      
      const phi = Math.random() * Math.PI * 2
      const theta = Math.random() * Math.PI * 2
      
      // Position calculation
      const tx = (R + r * Math.cos(theta)) * Math.cos(phi)
      const ty = (R + r * Math.cos(theta)) * Math.sin(phi)
      const tz = r * Math.sin(theta)
      
      // Only keep if on "top" (z > 0.05 to ensure it's on the icing part)
      if (tz < 0.1) {
          i--
          continue
      }

      // Orientation: Sprinkle should lie flat or stick out? 
      // Let's make them random orientation but generally adhering to surface normal
      // Normal vector at this point:
      // nx = cos(theta) * cos(phi)
      // ny = cos(theta) * sin(phi)
      // nz = sin(theta)
      
      const pos = { x: tx, y: ty, z: tz }
      const rot = { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: Math.random() * Math.PI }
      const color = SPRINKLE_COLORS[Math.floor(Math.random() * SPRINKLE_COLORS.length)]
      
      data.push({ pos, rot, color })
    }
    return data
  }, [count])

  useLayoutEffect(() => {
    if (meshRef.current) {
      sprinklesData.forEach((data, i) => {
        dummy.position.set(data.pos.x, data.pos.y, data.pos.z)
        dummy.rotation.set(data.rot.x, data.rot.y, data.rot.z)
        dummy.scale.setScalar(0.4 + Math.random() * 0.4)
        dummy.updateMatrix()
        meshRef.current!.setMatrixAt(i, dummy.matrix)
        meshRef.current!.setColorAt(i, new Color(data.color))
      })
      meshRef.current.instanceMatrix.needsUpdate = true
      meshRef.current.instanceColor!.needsUpdate = true
    }
  }, [sprinklesData, dummy])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.02, 0.02, 0.1, 6]} />
      <meshStandardMaterial roughness={0.2} metalness={0.1} />
    </instancedMesh>
  )
}

interface GourmetDonutProps {
  index: number
  flavor: typeof FLAVORS[0]
  positionData: {
    tree: [number, number, number]
    chaos: [number, number, number]
  }
}

const GourmetDonut = ({ index, flavor, positionData }: GourmetDonutProps) => {
  const groupRef = useRef<Group>(null)
  const { mode } = useStore()
  
  // Local mix state
  const userData = useRef({ mix: 0 })

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const targetMix = mode === 'CHAOS' ? 1 : 0
    easing.damp(userData.current, 'mix', targetMix, 1.2, delta)
    const mix = userData.current.mix
    
    // Position
    const x = positionData.tree[0] * (1 - mix) + positionData.chaos[0] * mix
    const y = positionData.tree[1] * (1 - mix) + positionData.chaos[1] * mix
    const z = positionData.tree[2] * (1 - mix) + positionData.chaos[2] * mix
    
    groupRef.current.position.set(x, y, z)
    
    // Rotation
    const time = state.clock.elapsedTime
    groupRef.current.rotation.set(
      time * 0.5 + index, 
      time * 0.3 + index, 
      0
    )
    
    // Scale
    const scale = 0.5 // Base size
    groupRef.current.scale.setScalar(scale)
  })

  return (
    <group ref={groupRef}>
      {/* Base Donut (Bun) - Soft, rougher, baked color */}
      <mesh>
        <torusGeometry args={[0.5, 0.25, 64, 32]} />
        <meshStandardMaterial 
            color={flavor.color} 
            roughness={0.8} // Very rough for bread texture
            metalness={0.0}
        />
      </mesh>
      
      {/* Icing - Smooth, shiny, liquid-like, offset slightly up */}
      <group position={[0, 0, 0.04]}>
        <mesh>
            <torusGeometry args={[0.5, 0.24, 64, 32]} /> 
            <meshPhysicalMaterial 
            color={flavor.icing} 
            roughness={0.15} 
            metalness={0.0}
            clearcoat={1.0} // High polish/wet look
            clearcoatRoughness={0.1}
            reflectivity={1.0}
            />
        </mesh>
        
        {/* Sprinkles on top of icing */}
        <Sprinkles count={60} />
      </group>
    </group>
  )
}

export const Candies = () => {
  const items = useMemo(() => {
    // Duplicate flavors to have 2 of each (Total 8)
    const allFlavors = [...FLAVORS, ...FLAVORS]
    
    return allFlavors.map((flavor, i) => {
      // Chaos pos
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 6
      const chaos: [number, number, number] = [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ]
      
      // Tree pos: Floating uniformly
      // Golden Angle
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))
      const angle = i * goldenAngle + (Math.random() - 0.5) * 0.5
      
      // Vertical distribution (-4 to 6)
      const y = -4 + Math.random() * 10 

      // Radius
      // Attach closely to tree surface
      const treeRadiusAtY = Math.max(0, (7 - y) / 12 * 4.5)
      const rad = treeRadiusAtY + 0.1 + Math.random() * 0.3

      const tree: [number, number, number] = [
        Math.cos(angle) * rad,
        y,
        Math.sin(angle) * rad
      ]
      
      return { flavor, chaos, tree }
    })
  }, [])

  return (
    <group>
      {items.map((item, i) => (
        <GourmetDonut 
          key={i} 
          index={i} 
          flavor={item.flavor} 
          positionData={{ tree: item.tree, chaos: item.chaos }} 
        />
      ))}
    </group>
  )
}
