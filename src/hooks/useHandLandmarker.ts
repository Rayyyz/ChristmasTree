import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { useEffect, useState } from 'react'

export const useHandLandmarker = () => {
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null)

  useEffect(() => {
    let mounted = true

    const createHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm'
        )
        
        if (!mounted) return

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.8,
          minHandPresenceConfidence: 0.8,
          minTrackingConfidence: 0.8,
        })
        
        if (mounted) {
          setLandmarker(handLandmarker)
          console.log('HandLandmarker initialized')
        }
      } catch (error) {
        console.error('Error initializing HandLandmarker:', error)
      }
    }

    createHandLandmarker()

    return () => {
      mounted = false
    }
  }, [])

  return landmarker
}
