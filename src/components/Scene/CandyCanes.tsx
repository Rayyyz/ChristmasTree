import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, CatmullRomCurve3, Vector3, CanvasTexture, RepeatWrapping } from 'three'
import { useStore } from '../../store/useStore'
import { easing } from 'maath'

const CANE_COUNT = 10

// Generate Candy Cane Curve
const curve = new CatmullRomCurve3([
  new Vector3(0, -1, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, 1.5, 0),
  new Vector3(0.5, 1.8, 0),
  new Vector3(1, 1.5, 0),
  new Vector3(1, 1.2, 0),
])

// Procedural Candy Texture
const useCandyTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    // White Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 512, 512)
    
    // Red Stripes (Diagonal)
    ctx.fillStyle = '#d60000'
    
    // Draw 2 red stripes.
    // Each red stripe width = 1/5 circumference = 20%
    // White stripe width = 30%
    // Circumference corresponds to 512 pixels (Texture width)
    // Red width X = 512 * 0.2 = 102.4 pixels
    // Gap = 512 * 0.3 = 153.6 pixels
    // Pattern Period = 256 pixels (2 stripes per 512)
    
    // Draw slanted stripes (slope = 1, 45 degrees in UV space)
    // y = x - offset
    
    const stripeWidthX = 102.4
    
    // To ensure seamless tiling, we draw stripes that wrap around the canvas edges.
    // We iterate enough offsets to cover the whole diagonal.
    
    for (let offset = -512; offset < 1024; offset += 256) {
        ctx.beginPath()
        // Define a parallelogram for the stripe
        // Point 1: (offset, 0)
        // Point 2: (offset + stripeWidthX, 0)
        // Point 3: (offset + stripeWidthX + 512, 512) -- x shifts by 512 for 45 deg slope
        // Point 4: (offset + 512, 512)
        
        ctx.moveTo(offset, 0)
        ctx.lineTo(offset + stripeWidthX, 0)
        ctx.lineTo(offset + stripeWidthX + 512, 512)
        ctx.lineTo(offset + 512, 512)
        ctx.closePath()
        ctx.fill()
    }
    
    const texture = new CanvasTexture(canvas)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    // U repeat = 1 (Full circumference)
    // V repeat = 4 (Adjusts the spiral tightness/angle. Higher = flatter angle, Lower = steeper)
    // A value of 4 gives a nice balanced spiral look (~30-45 degree apparent angle)
    texture.repeat.set(1, 4) 
    
    return texture
  }, [])
}

interface CandyCaneProps {
  index: number
  positionData: {
    tree: [number, number, number]
    chaos: [number, number, number]
  }
}

const CandyCane = ({ index, positionData }: CandyCaneProps) => {
  const groupRef = useRef<Group>(null)
  const { mode } = useStore()
  const userData = useRef({ mix: 0 })
  const texture = useCandyTexture()

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
    
    // Rotation: Spin in chaos, static upright in tree
    const time = state.clock.elapsedTime
    
    if (mix < 0.2) {
        // Tree mode: Upright but tilted slightly
        groupRef.current.rotation.set(0, index * 1.5, 0.2)
    } else {
        // Chaos: Tumble
        groupRef.current.rotation.set(time + index, time, 0)
    }

    groupRef.current.scale.setScalar(0.5)
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.12, 32, false]} />
        {/* Candy Material: High Gloss, Clearcoat */}
        <meshPhysicalMaterial 
            map={texture}
            color="white"
            roughness={0.15}
            metalness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            reflectivity={1.0}
            emissive="white"
            emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  )
}

export const CandyCanes = () => {
    const items = useMemo(() => {
        return Array.from({ length: CANE_COUNT }).map((_, i) => {
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
          const yStep = 10 / CANE_COUNT
          const baseY = -4 + i * yStep
          const y = baseY + (Math.random() - 0.5) * 1.5

          // Radius
          // Attach closely to tree surface
          const treeRadiusAtY = Math.max(0, (7 - y) / 12 * 4.5)
          const rad = treeRadiusAtY + 0.1 + Math.random() * 0.3

          const tree: [number, number, number] = [
            Math.cos(angle) * rad,
            y,
            Math.sin(angle) * rad
          ]
          
          return { chaos, tree }
        })
      }, [])

  return (
    <group>
        {items.map((item, i) => (
            <CandyCane key={i} index={i} positionData={item} />
        ))}
    </group>
  )
}
