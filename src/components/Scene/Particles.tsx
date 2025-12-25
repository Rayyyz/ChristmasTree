import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, ShaderMaterial, Color, AdditiveBlending } from 'three'
import { useStore } from '../../store/useStore'
import { easing } from 'maath'

const COUNT = 24000 

const vertexShader = `
uniform float uTime;
uniform float uMix;
attribute vec3 aTreePosition;
attribute vec3 aChaosPosition;
attribute vec3 aColor;
attribute float aScale;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = aColor;
  
  vec3 pos = mix(aTreePosition, aChaosPosition, uMix);
  
  // Breeze effect REMOVED for static tree
  // float breeze = ...
  
  // Pos remains stable in Tree mode
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Breathing dynamic (pulsing size)
  // Use position components to create random phase offsets per particle
  float phase = pos.x * 13.0 + pos.y * 19.0 + pos.z * 7.0;
  
  // Irregular breathing rhythm
  float breathing = 1.0 + (sin(uTime * 2.0 + phase) + cos(uTime * 1.5 + phase * 0.5)) * 0.15; 
  
  // Size attenuation
  // Slightly larger base size for Disney-style magical look (150.0)
  // Apply individual scale factor (aScale)
  gl_PointSize = (150.0 * breathing * aScale) * (1.0 / -mvPosition.z);
  
  // Fade out slightly when moving/chaos
  vAlpha = 1.0 - smoothstep(0.8, 1.0, uMix) * 0.3;
}
`

const fragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Circular particle with soft edge
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  
  if (dist > 0.5) discard;
  
  // Disney-style Magical Glow
  
  // 1. Hot white core (Magic dust feel)
  float core = 1.0 - smoothstep(0.0, 0.15, dist);
  
  // 2. Soft glow body
  float body = 1.0 - smoothstep(0.15, 0.5, dist);
  
  // 3. Magical Halo color (Pale Yellow/Green/Blue tint based on original color)
  // We mix the original deep green with some magical gold/white
  vec3 magicColor = mix(vColor, vec3(1.0, 0.9, 0.7), 0.4);
  
  // Final Color Composition
  vec3 finalColor = mix(magicColor, vec3(1.0), core);
  
  // Alpha attenuation at edges for soft glow
  float alpha = body * vAlpha;
  
  gl_FragColor = vec4(finalColor, alpha);
}
`

export const Particles = () => {
  const pointsRef = useRef<Points>(null)
  const materialRef = useRef<ShaderMaterial>(null)
  const { mode } = useStore()
  
  const { treeData, chaosData, colors, scales } = useMemo(() => {
    const tree = new Float32Array(COUNT * 3)
    const chaos = new Float32Array(COUNT * 3)
    const cols = new Float32Array(COUNT * 3)
    const sc = new Float32Array(COUNT)
    const colorObj = new Color()

    for (let i = 0; i < COUNT; i++) {
      // Chaos: Galaxy distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 5 + Math.random() * 8
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      chaos[i * 3 + 2] = r * Math.cos(phi)

      // Tree: Strictly Cone Shape
      const yRatio = i / COUNT
      const y = yRatio * 12 - 5 // Taller tree (-5 to 7)
      
      // Radius profile: Standard Cone
      const baseRadius = 4.5
      const coneRadius = (1 - yRatio) * baseRadius
      
      // Volume filling: Random radius inside the cone volume
      // Use sqrt(random) for uniform distribution in a circle disk at height y
      const rRandom = Math.sqrt(Math.random()) * coneRadius
      
      // Add slight noise for "fluffy" edges but keep conical shape distinct
      const finalRadius = rRandom + (Math.random() - 0.5) * 0.2
      
      const angle = i * 0.132 + Math.random() * 6.28
      
      tree[i * 3] = Math.cos(angle) * finalRadius
      tree[i * 3 + 1] = y
      tree[i * 3 + 2] = Math.sin(angle) * finalRadius

      // Colors: 20% White, 80% Rich Pine Green
      if (Math.random() < 0.2) {
        colorObj.set('#ffffff')
      } else {
        const hue = 0.3 + Math.random() * 0.1 // Greenish
        const saturation = 0.6 + Math.random() * 0.4
        const lightness = 0.1 + Math.random() * 0.4 
        colorObj.setHSL(hue, saturation, lightness)
      }
      
      cols[i * 3] = colorObj.r
      cols[i * 3 + 1] = colorObj.g
      cols[i * 3 + 2] = colorObj.b

      // Random Scale: 0.5x to 1.5x
      sc[i] = 0.5 + Math.random()
    }
    return { treeData: tree, chaosData: chaos, colors: cols, scales: sc }
  }, [])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMix: { value: 0 }
  }), [])

  useFrame((state, delta) => {
    if (!materialRef.current) return
    
    // Update Uniforms
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    
    const targetMix = mode === 'CHAOS' ? 1 : 0
    easing.damp(materialRef.current.uniforms.uMix, 'value', targetMix, 1.5, delta)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={treeData}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePosition"
          count={COUNT}
          array={treeData}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaosPosition"
          count={COUNT}
          array={chaosData}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={COUNT}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={COUNT}
          array={scales}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}
