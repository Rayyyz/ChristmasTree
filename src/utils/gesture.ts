import { NormalizedLandmark } from '@mediapipe/tasks-vision'

export const detectGesture = (landmarks: NormalizedLandmark[]): 'IDLE' | 'FIST' | 'OPEN' => {
  if (!landmarks || landmarks.length === 0) return 'IDLE'

  // const thumbTip = landmarks[4]
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]

  const wrist = landmarks[0]
  
  // Tips for fingers (Index, Middle, Ring, Pinky)
  const tips = [indexTip, middleTip, ringTip, pinkyTip]
  
  // Calculate average distance of tips from wrist
  // This is a robust way to check Open vs Closed (Fist)
  const avgDist = tips.reduce((acc, tip) => acc + Math.hypot(tip.x - wrist.x, tip.y - wrist.y), 0) / 4

  // Thresholds based on hand size in frame
  // Typically, open hand tips are > 0.25 units away from wrist
  // Closed fist tips are < 0.15 units away from wrist
  
  if (avgDist < 0.15) {
    return 'FIST'
  }

  // Check if hand is open
  const isOpen = tips.every(tip => Math.hypot(tip.x - wrist.x, tip.y - wrist.y) > 0.2)
  
  if (isOpen) {
    return 'OPEN'
  }

  return 'IDLE'
}
