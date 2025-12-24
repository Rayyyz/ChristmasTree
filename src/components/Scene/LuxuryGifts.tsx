import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, Color } from 'three'
import { useStore } from '../../store/useStore'
import { easing } from 'maath'

const COUNT = 100

export const LuxuryGifts = () => {
  const boxRef = useRef<InstancedMesh>(null)
  const ribbonVRef = useRef<InstancedMesh>(null)
  const ribbonHRef = useRef<InstancedMesh>(null)
  const bowRef = useRef<InstancedMesh>(null)
  
  const { mode } = useStore()
  
  const { treeData, chaosData, boxColors, ribbonColors, bowVisibility } = useMemo(() => {
    const tree = new Float32Array(COUNT * 3)
    const chaos = new Float32Array(COUNT * 3)
    const bColors = new Float32Array(COUNT * 3)
    const rColors = new Float32Array(COUNT * 3)
    const bowVis = new Float32Array(COUNT)
    
    const colorObj = new Color()

    for (let i = 0; i < COUNT; i++) {
      // Chaos: Random floating
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 6 + Math.random() * 6
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaos[i * 3 + 2] = r * Math.cos(phi)

      // Tree: Base accumulation
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 4
      tree[i * 3] = Math.cos(angle) * radius
      tree[i * 3 + 1] = -4.5 + Math.random() * 1.5
      tree[i * 3 + 2] = Math.sin(angle) * radius

      // Colors logic
      // 60% Gold Box + Red Ribbon
      // 30% Red Box + Gold Ribbon
      // 10% Silver Box + Red Ribbon
      const rand = Math.random()
      
      let boxHex, ribbonHex
      
      if (rand > 0.4) {
         // Gold Box
         boxHex = '#FFD700'
         ribbonHex = '#8B0000' // Dark Red
      } else if (rand > 0.1) {
         // Red Box
         boxHex = '#8B0000'
         ribbonHex = '#FFD700' // Gold
      } else {
         // Silver Box
         boxHex = '#C0C0C0'
         ribbonHex = '#8B0000'
      }

      colorObj.set(boxHex)
      bColors[i * 3] = colorObj.r
      bColors[i * 3 + 1] = colorObj.g
      bColors[i * 3 + 2] = colorObj.b

      colorObj.set(ribbonHex)
      rColors[i * 3] = colorObj.r
      rColors[i * 3 + 1] = colorObj.g
      rColors[i * 3 + 2] = colorObj.b
      
      // 50% chance of having a bow
      bowVis[i] = Math.random() > 0.5 ? 1 : 0
    }
    return { treeData: tree, chaosData: chaos, boxColors: bColors, ribbonColors: rColors, bowVisibility: bowVis }
  }, [])

  const dummy = useMemo(() => new Object3D(), [])
  const mixRef = useRef({ value: 0 })

  useLayoutEffect(() => {
    if (boxRef.current && ribbonVRef.current && ribbonHRef.current && bowRef.current) {
      for (let i = 0; i < COUNT; i++) {
        const bCol = new Color(boxColors[i * 3], boxColors[i * 3 + 1], boxColors[i * 3 + 2])
        const rCol = new Color(ribbonColors[i * 3], ribbonColors[i * 3 + 1], ribbonColors[i * 3 + 2])
        
        boxRef.current.setColorAt(i, bCol)
        ribbonVRef.current.setColorAt(i, rCol)
        ribbonHRef.current.setColorAt(i, rCol)
        bowRef.current.setColorAt(i, rCol)
      }
      boxRef.current.instanceColor!.needsUpdate = true
      ribbonVRef.current.instanceColor!.needsUpdate = true
      ribbonHRef.current.instanceColor!.needsUpdate = true
      bowRef.current.instanceColor!.needsUpdate = true
    }
  }, [boxColors, ribbonColors])

  useFrame((state, delta) => {
    if (!boxRef.current || !ribbonVRef.current || !ribbonHRef.current || !bowRef.current) return

    const target = mode === 'CHAOS' ? 1 : 0
    easing.damp(mixRef.current, 'value', target, 1.0, delta)
    const mix = mixRef.current.value
    const time = state.clock.elapsedTime

    for (let i = 0; i < COUNT; i++) {
      const x = treeData[i * 3] * (1 - mix) + chaosData[i * 3] * mix
      const y = treeData[i * 3 + 1] * (1 - mix) + chaosData[i * 3 + 1] * mix
      const z = treeData[i * 3 + 2] * (1 - mix) + chaosData[i * 3 + 2] * mix

      dummy.position.set(x, y, z)
      
      if (mix < 0.2) {
        dummy.rotation.set(0, i, 0)
      } else {
        dummy.rotation.set(time + i, time + i, time)
      }
      
      const scale = 0.4 + Math.sin(time + i) * 0.05
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      
      // Update Box & Ribbons
      boxRef.current.setMatrixAt(i, dummy.matrix)
      ribbonVRef.current.setMatrixAt(i, dummy.matrix)
      ribbonHRef.current.setMatrixAt(i, dummy.matrix)
      
      // Update Bow
      if (bowVisibility[i] > 0.5) {
        // Position bow on top of the box
        // Box is 1x1x1 (scaled by dummy.scale)
        // We need to move it up by 0.5 * scale to sit on the face
        dummy.translateY(0.5 * scale) 
        dummy.updateMatrix()
        bowRef.current.setMatrixAt(i, dummy.matrix)
      } else {
        // Hide bow
        // We can't just set scale to 0 if we reuse dummy next time without reset, 
        // but we reset dummy.position/rotation/scale at start of loop, so it's fine to mutate here.
        // However, we just need a temp matrix for zero scale.
        // Easier: modify dummy scale to 0
        dummy.scale.set(0, 0, 0)
        dummy.updateMatrix()
        bowRef.current.setMatrixAt(i, dummy.matrix)
      }
    }
    
    boxRef.current.instanceMatrix.needsUpdate = true
    ribbonVRef.current.instanceMatrix.needsUpdate = true
    ribbonHRef.current.instanceMatrix.needsUpdate = true
    bowRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {/* Box */}
      <instancedMesh ref={boxRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.6} roughness={0.2} envMapIntensity={1.5} />
      </instancedMesh>
      
      {/* Vertical Ribbon (Wrap around X) */}
      <instancedMesh ref={ribbonVRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[0.2, 1.02, 1.02]} />
        <meshStandardMaterial metalness={0.1} roughness={0.9} envMapIntensity={0.5} />
      </instancedMesh>

      {/* Horizontal Ribbon (Wrap around Z) */}
      <instancedMesh ref={ribbonHRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[1.02, 1.02, 0.2]} />
        <meshStandardMaterial metalness={0.1} roughness={0.9} envMapIntensity={0.5} />
      </instancedMesh>
      
      {/* Bow (Torus Knot) */}
      <instancedMesh ref={bowRef} args={[undefined, undefined, COUNT]}>
        {/* Knot shape to simulate a bow */}
        <torusKnotGeometry args={[0.25, 0.08, 64, 8, 2, 3]} />
        <meshStandardMaterial metalness={0.1} roughness={0.9} envMapIntensity={0.5} />
      </instancedMesh>
    </group>
  )
}
