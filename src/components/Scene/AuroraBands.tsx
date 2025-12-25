import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, ShaderMaterial, AdditiveBlending, DoubleSide, Group, Mesh } from 'three'
import { useStore } from '../../store/useStore'
import { easing } from 'maath'

const vertexShader = `
uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

// Simple 2D Noise
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; 
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g10 *= norm.y;
  g01 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

void main() {
  vUv = uv;
  
  // Displacement
  vec3 pos = position;
  // Slower, more fluid noise movement
  float n = cnoise(vec2(uv.x * 3.0 - uTime * 0.15, uv.y * 2.0 + uTime * 0.1));
  float displacement = n * 0.8; // Increased amplitude for more "breath"
  
  // Displace along normal
  pos += normal * displacement;

  vPosition = pos;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vPosition;

// Simple 2D Noise
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float cnoise(vec2 P) {
  // Reused noise function from Vertex
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g10 *= norm.y;
  g01 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

void main() {
  // Flowing texture effect
  float n = cnoise(vec2(vUv.x * 6.0 - uTime * 0.4, vUv.y * 2.0 + uTime * 0.1));
  
  // Create ethereal strands - softer threshold
  float intensity = smoothstep(-0.2, 0.8, n);
  
  // Gradient Blending
  float mixFactor = 0.5 + 0.5 * sin(vUv.x * 3.14 + uTime * 0.5);
  vec3 color = mix(uColor1, uColor2, mixFactor);
  
  // Alpha composition
  // Sine wave fade for continuous soft edge (no flat plateau)
  float edgeAlpha = sin(vUv.y * 3.14159);
  
  // Soft edges at seam (left/right) to hide noise discontinuity
  float seamAlpha = smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.9, 1.0, vUv.x));
  
  // Curtain effect - slower and softer
  float curtain = 0.5 + 0.5 * sin(vUv.x * 15.0 + n * 3.0);
  
  // Final alpha
  float alpha = edgeAlpha * seamAlpha * (intensity * 0.6 + curtain * 0.3) * uOpacity;
  
  gl_FragColor = vec4(color, alpha);
}
`

interface BandProps {
  position: [number, number, number]
  radiusTop: number
  radiusBottom: number
  height: number
  color1: string
  color2: string
}

const Band = ({ position, radiusTop, radiusBottom, height, color1, color2 }: BandProps) => {
  const materialRef = useRef<ShaderMaterial>(null)
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new Color(color1) },
    uColor2: { value: new Color(color2) },
    uOpacity: { value: 0 }
  }), [color1, color2])
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh position={position}>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, 64, 48, true]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={DoubleSide}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

export const AuroraBands = () => {
  const { mode } = useStore()
  const groupRef = useRef<Group>(null)
  const mixRef = useRef({ value: 0 })
  
  // Calculate band dimensions based on tree shape
  // Tree Top: y=7, r=0
  // Tree Base: y=-5, r=4.5
  // r = (7 - y) / 12 * 4.5
  
  const bands = useMemo(() => {
    return [
      {
        y: 4.5,
        h: 1.5,
        c1: '#FFFFFF', // White
        c2: '#FFD700', // Gold
      },
      {
        y: 1.5,
        h: 2.0,
        c1: '#FFD700', // Gold
        c2: '#4169E1', // Royal Blue
      },
      {
        y: -1.5,
        h: 2.0,
        c1: '#4169E1', // Royal Blue
        c2: '#9400D3', // Dark Violet
      },
      {
        y: -4.5,
        h: 2.0,
        c1: '#9400D3', // Dark Violet
        c2: '#FF69B4', // Hot Pink
      }
    ].map(b => {
      const yTop = b.y + b.h / 2
      const yBottom = b.y - b.h / 2
      const rTop = Math.max(0, (7 - yTop) / 12 * 4.5) + 1 // +1.2 offset to hover further outside tree
      const rBottom = Math.max(0, (7 - yBottom) / 12 * 4.5) + 1.3 // slightly wider at bottom for flare
      return {
        ...b,
        radiusTop: rTop,
        radiusBottom: rBottom
      }
    })
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    
    // Animation Mix: 0 (Tree) -> 1 (Chaos/Expanded)
    const targetMix = mode === 'CHAOS' ? 1 : 0
    easing.damp(mixRef.current, 'value', targetMix, 1.5, delta)
    const mix = mixRef.current.value
    
    // Rotation speed increases with chaos
    groupRef.current.rotation.y -= delta * (0.1 + mix * 0.2)
    
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as Mesh
      const material = mesh.material as ShaderMaterial
      
      const originalY = bands[i].y
      
      // Expansion logic
      // Scale: 1 -> 5 (Explode outwards)
      const scale = 1 + mix * 4
      
      // Position Y: Spread out vertically
      mesh.position.y = originalY * (1 + mix * 0.8)
      mesh.scale.set(scale, 1, scale) // Keep height scale 1, only expand radius
      
      // Opacity logic
      // Tree: 0.8, Chaos: 0.3 (visible but faint phantom)
      const targetOpacity = 0.8 * (1 - mix) + 0.3 * mix
      
      if (material && material.uniforms) {
        material.uniforms.uOpacity.value = targetOpacity
      }
    })
  })

  return (
    <group ref={groupRef}>
      {bands.map((b, i) => (
        <Band
          key={i}
          position={[0, b.y, 0]}
          radiusTop={b.radiusTop}
          radiusBottom={b.radiusBottom}
          height={b.h}
          color1={b.c1}
          color2={b.c2}
        />
      ))}
    </group>
  )
}
