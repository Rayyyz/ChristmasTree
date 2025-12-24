import { useMemo } from 'react'
import { PhotoFrame } from './PhotoFrame'

// Import all images from src/assets/photos
const photoModules = import.meta.glob('/src/assets/photos/*.{jpg,jpeg,png,webp,svg}', { eager: true, query: '?url', import: 'default' })
const photoUrls = Object.values(photoModules) as string[]

export const Decorations = () => {
  const count = photoUrls.length
  
  const positions = useMemo(() => {
    return photoUrls.map((_, i) => {
      // Chaos: Random distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = 4 + Math.random() * 4
      const chaos: [number, number, number] = [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ]

      // Tree: Surface distribution with uniform randomness
      // Use Golden Angle for even horizontal distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))
      const angle = i * goldenAngle + (Math.random() - 0.5) * 0.5

      // Uniform vertical distribution with jitter
      const yStep = 10 / count // Height range approx 10 (-4 to 6)
      // Base y from -4 to 6
      const baseY = -4 + i * yStep
      // Add random jitter to y
      const y = baseY + (Math.random() - 0.5) * 1.0

      // Radius follows tree cone shape but slightly outside
      // Attach closely to tree surface
      const treeRadiusAtY = Math.max(0, (7 - y) / 12 * 4.5)
      const radius = treeRadiusAtY + 0.1 + Math.random() * 0.3
      
      const tree: [number, number, number] = [
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      ]
      
      return { tree, chaos }
    })
  }, [count])

  if (count === 0) return null

  return (
    <group>
      {photoUrls.map((url, i) => (
        <PhotoFrame 
          key={i}
          url={url}
          index={i}
          total={count}
          positionData={positions[i]}
        />
      ))}
    </group>
  )
}
