import { NormalizedLandmark } from '@mediapipe/tasks-vision'

export const detectGesture = (landmarks: NormalizedLandmark[]): 'IDLE' | 'PINCH' | 'OPEN' => {
  if (!landmarks || landmarks.length === 0) return 'IDLE'

  const thumbTip = landmarks[4]
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]

  const thumbIndexDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y)
  
  // Simple Pinch Detection (Thumb + Index close)
  if (thumbIndexDist < 0.05) {
    return 'PINCH'
  }

  // Check if hand is open (fingertips above knuckles for simple check, or spread out)
  // Assuming hand is upright. A better check is distance from wrist (0)
  const wrist = landmarks[0]
  const tips = [indexTip, middleTip, ringTip, pinkyTip]
  const isOpen = tips.every(tip => Math.hypot(tip.x - wrist.x, tip.y - wrist.y) > 0.2)

  if (isOpen) {
    return 'OPEN'
  }

  return 'IDLE'
}
