import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
uniform float uTime;
attribute float aSize;
attribute float aSpeed;
varying float vAlpha;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Size attenuation
  gl_PointSize = aSize * (300.0 / -mvPosition.z);
  
  // Twinkle effect
  // aSpeed acts as offset and speed multiplier
  float t = uTime * (0.5 + aSpeed);
  vAlpha = 0.3 + 0.7 * sin(t * 2.0 + aSpeed * 100.0);
}
`

const fragmentShader = `
uniform vec3 uColor;
varying float vAlpha;

void main() {
  float d = distance(gl_PointCoord, vec2(0.5));
  if(d > 0.5) discard;
  
  // Soft glow
  float strength = 1.0 - (d * 2.0);
  strength = pow(strength, 1.5);
  
  gl_FragColor = vec4(uColor, strength * vAlpha);
}
`

interface BackgroundSparklesProps {
  count?: number
  color?: string
  radius?: number
  minRadius?: number
}

export const BackgroundSparkles = ({ count = 2000, color = "#FFD700", radius = 60, minRadius = 40 }: BackgroundSparklesProps) => {
  const mesh = useRef<THREE.Points>(null)
  
  const { positions, sizes, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const speeds = new Float32Array(count)
    
    for(let i=0; i<count; i++) {
        // Distribute points in a spherical shell between minRadius and radius
        const r = minRadius + Math.random() * (radius - minRadius)
        
        // Spherical distribution
        const theta = 2 * Math.PI * Math.random()
        const phi = Math.acos(2 * Math.random() - 1)
        
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta)
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
        pos[i*3+2] = r * Math.cos(phi)
        
        // Random size
        sizes[i] = 0.5 + Math.random() * 2.5 
        
        // Speed
        speeds[i] = Math.random()
    }
    
    return { positions: pos, sizes, speeds }
  }, [count, radius, minRadius])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) }
  }), [color])

  useFrame((state) => {
    if(mesh.current && mesh.current.material) {
        (mesh.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aSpeed" count={count} array={speeds} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial 
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
