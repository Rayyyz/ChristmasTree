import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, Color } from 'three'
import { useStore } from '../../store/useStore'
import { easing } from 'maath'

const COUNT = 150

export const Ornaments = () => {
  const meshRef = useRef<InstancedMesh>(null)
  const { mode } = useStore()
  
  const { treeData, chaosData, colors } = useMemo(() => {
    const tree = new Float32Array(COUNT * 3)
    const chaos = new Float32Array(COUNT * 3)
    const cols = new Float32Array(COUNT * 3)
    const colorObj = new Color()

    for (let i = 0; i < COUNT; i++) {
      // Chaos
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 5 + Math.random() * 5
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaos[i * 3 + 2] = r * Math.cos(phi)

      // Tree: Uniform distribution around cone
      // Golden Angle for horizontal evenness
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))
      const angle = i * goldenAngle + (Math.random() - 0.5) * 0.5

      // Vertical distribution (-4.5 to 6.5)
      const yStep = 11 / COUNT 
      const baseY = -4.5 + i * yStep
      const y = baseY + (Math.random() - 0.5) * 1.0

      // Radius follows tree cone
      // Attach closely to tree surface
      const treeRadiusAtY = Math.max(0, (7 - y) / 12 * 4.5)
      const radius = treeRadiusAtY + 0.1 + Math.random() * 0.3
      
      tree[i * 3] = Math.cos(angle) * radius
      tree[i * 3 + 1] = y
      tree[i * 3 + 2] = Math.sin(angle) * radius

      // Colors: Gold, Red, Warm White
      const rand = Math.random()
      if (rand > 0.6) colorObj.set('#FFD700') // Gold
      else if (rand > 0.3) colorObj.set('#D30000') // Rich Red
      else colorObj.set('#FFFAF0') // Warm White
      
      cols[i * 3] = colorObj.r
      cols[i * 3 + 1] = colorObj.g
      cols[i * 3 + 2] = colorObj.b
    }
    return { treeData: tree, chaosData: chaos, colors: cols }
  }, [])

  const dummy = useMemo(() => new Object3D(), [])
  const mixRef = useRef({ value: 0 })

  useLayoutEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < COUNT; i++) {
        meshRef.current.setColorAt(i, new Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]))
      }
      meshRef.current.instanceColor!.needsUpdate = true
    }
  }, [colors])

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    const target = mode === 'CHAOS' ? 1 : 0
    easing.damp(mixRef.current, 'value', target, 1.5, delta)
    const mix = mixRef.current.value

    for (let i = 0; i < COUNT; i++) {
      const x = treeData[i * 3] * (1 - mix) + chaosData[i * 3] * mix
      const y = treeData[i * 3 + 1] * (1 - mix) + chaosData[i * 3 + 1] * mix
      const z = treeData[i * 3 + 2] * (1 - mix) + chaosData[i * 3 + 2] * mix

      dummy.position.set(x, y, z)
      
      // Static size
      dummy.scale.setScalar(0.2)
      
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        metalness={1} 
        roughness={0.1}
        emissive="#ffaa00"
        emissiveIntensity={0.8}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
