import { useEffect, useRef, useState } from 'react'
import { useHandLandmarker } from '../../hooks/useHandLandmarker'
import { useStore } from '../../store/useStore'
import { detectGesture } from '../../utils/gesture'

export const HandTracker = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const landmarker = useHandLandmarker()
  const { setHandDetected, setGesture } = useStore()
  const requestRef = useRef<number>()
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)

  // 1. 独立启动摄像头，不依赖模型加载
  useEffect(() => {
    let stream: MediaStream | null = null

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadeddata = () => {
            setCameraReady(true)
          }
        }
      } catch (err) {
        console.error('Error accessing webcam:', err)
        setError('Camera access denied')
      }
    }

    startWebcam()

    return () => {
      if (stream) {
         stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // 2. 模型加载完成后启动检测循环
  useEffect(() => {
    if (!landmarker || !cameraReady || !videoRef.current) return

    const predictWebcam = () => {
      if (!videoRef.current || !landmarker) return

      if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          const nowInMs = Date.now()
          const results = landmarker.detectForVideo(videoRef.current, nowInMs)
      
          if (results.landmarks && results.landmarks.length > 0) {
            setHandDetected(true)
            const gesture = detectGesture(results.landmarks[0])
            setGesture(gesture)
          } else {
            setHandDetected(false)
            setGesture('IDLE')
          }
      }
      requestRef.current = requestAnimationFrame(predictWebcam)
    }

    // 启动预测
    requestRef.current = requestAnimationFrame(predictWebcam)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [landmarker, cameraReady, setGesture, setHandDetected])

  return (
    <div className="absolute top-4 left-4 z-50">
        <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-48 rounded-lg border-2 border-white/20 transition-opacity duration-500 ${cameraReady ? 'opacity-50' : 'opacity-0'}`}
        style={{ transform: 'scaleX(-1)' }}
        />
        {!landmarker && !error && <div className="text-white/50 text-xs mt-1">Loading AI Model...</div>}
        {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
    </div>
  )
}
