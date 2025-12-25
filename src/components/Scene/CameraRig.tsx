import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { useStore } from '../../store/useStore'
import { Vector3 } from 'three'
import { useRef } from 'react'

export const CameraRig = () => {
  const { handPosition, handDetected, mode, handSize } = useStore()
  const angleRef = useRef(0)
  const radiusRef = useRef(20)
  const rotationSpeedRef = useRef(0) // For momentum
  
  useFrame((state, delta) => {
    // If NO hand detected, do NOT update camera manually.
    if (!handDetected) return

    if (mode === 'CHAOS') {
      // 1. Rotation with Momentum (Silky Smooth)
      // Damping the SPEED (0.3s) creates a nice inertia effect
      // handPosition.x controls speed: Left -> Rotate Left, Right -> Rotate Right
      easing.damp(rotationSpeedRef, 'current', handPosition.x * 2.5, 0.3, delta)
      angleRef.current += rotationSpeedRef.current * delta

      // 2. Fast Zoom Response
      // Damping 0.25s: Fast enough to feel real-time, smooth enough to hide jitter
      const clampedSize = Math.max(0.1, Math.min(0.4, handSize))
      // Map hand size to radius: Big Hand (0.4) -> Close (15), Small Hand (0.1) -> Far (50)
      const targetRadius = 50 - ((clampedSize - 0.1) / 0.3) * 35
      easing.damp(radiusRef, 'current', targetRadius, 0.25, delta)

      const x = Math.sin(angleRef.current) * radiusRef.current
      const z = Math.cos(angleRef.current) * radiusRef.current
      
      // 3. Smooth Height Control
      const y = 4 + handPosition.y * 5

      const targetPos = new Vector3(x, y, z)
      // Camera Position Damping: 0.3s for responsive tracking
      easing.damp3(state.camera.position, targetPos, 0.3, delta)
      state.camera.lookAt(0, 2, 0)

    } else {
      // Tree/Parallax Mode
      // Reset radius smooth ref to default for next time
      radiusRef.current = 20
      
      // Base position (Front view)
      const targetPos = new Vector3(0, 4, 20)
      
      // Parallax
      // Only apply parallax when hand is detected
      const parallaxX = handPosition.x * 5
      const parallaxY = handPosition.y * 3

      easing.damp3(state.camera.position, [targetPos.x + parallaxX, targetPos.y + parallaxY, targetPos.z], 0.5, delta)
      state.camera.lookAt(0, 2, 0)
    }
  })

  return null
}
