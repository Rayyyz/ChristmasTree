import { CanvasTexture } from 'three'

export const generateSnowflakeTexture = (seed: number): CanvasTexture => {
  const size = 256
  const center = size / 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Pseudo-random based on seed
  const random = () => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  // Clear
  ctx.clearRect(0, 0, size, size)
  
  // Style
  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#ffffff'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  // Shadows for volume
  ctx.shadowColor = 'rgba(255,255,255,0.5)'
  ctx.shadowBlur = 4

  // Parameters
  const armLength = center * 0.8
  const branchCount = Math.floor(random() * 3) + 2 // 2 to 4 branches per arm
  const hasPlate = random() > 0.5 // Hexagonal plate in center
  const plateSize = (random() * 0.2 + 0.1) * center
  const branchAngle = (random() * 0.3 + 0.3) // Angle of sub-branches

  const drawArm = () => {
    // Main Spine
    ctx.lineWidth = random() * 2 + 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -armLength)
    ctx.stroke()

    // Plate
    if (hasPlate) {
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, -plateSize)
      // Small decoration on plate
      ctx.lineTo(plateSize * 0.5, -plateSize * 0.8)
      ctx.stroke()
    }

    // Branches
    for (let i = 1; i <= branchCount; i++) {
      const dist = (i / (branchCount + 1)) * armLength
      const branchLen = (1 - i / (branchCount + 1)) * armLength * 0.6
      
      ctx.lineWidth = Math.max(1, ctx.lineWidth * 0.8)
      
      ctx.save()
      ctx.translate(0, -dist)
      
      // Left
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(-Math.sin(branchAngle) * branchLen, -Math.cos(branchAngle) * branchLen)
      ctx.stroke()
      
      // Right
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.sin(branchAngle) * branchLen, -Math.cos(branchAngle) * branchLen)
      ctx.stroke()
      
      // Secondary branches for "Exquisite" look
      if (branchLen > 20 && random() > 0.3) {
         ctx.save()
         ctx.translate(Math.sin(branchAngle) * branchLen * 0.5, -Math.cos(branchAngle) * branchLen * 0.5)
         ctx.beginPath()
         ctx.moveTo(0,0)
         ctx.lineTo(5, -10)
         ctx.stroke()
         ctx.restore()
      }

      ctx.restore()
    }
  }

  // Draw 6 times
  ctx.translate(center, center)
  for (let i = 0; i < 6; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI * 2) / 6)
    drawArm()
    ctx.restore()
  }
  
  // Center Hexagon fill (optional)
  if (random() > 0.7) {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
          ctx.lineTo(Math.cos(i * Math.PI / 3) * 10, Math.sin(i * Math.PI / 3) * 10)
      }
      ctx.closePath()
      ctx.fill()
  }

  const texture = new CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}
