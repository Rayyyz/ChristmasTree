import { OrbitControls, Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Particles } from './Particles'
import { Decorations } from './Decorations'
import { Snow } from './Snow'
import { LuxuryGifts } from './LuxuryGifts'
import { Ornaments } from './Ornaments'
import { Candies } from './Candies'
import { CandyCanes } from './CandyCanes'
import { Star } from './Star'
import { AuroraBands } from './AuroraBands'
import { BackgroundSparkles } from './BackgroundSparkles'
import { CameraRig } from './CameraRig'
import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

export const Experience = () => {
  const { gesture, setMode, handDetected } = useStore()

  useEffect(() => {
    if (gesture === 'OPEN') {
      setMode('CHAOS')
    }else {
      setMode('TREE')
    }
  }, [gesture, setMode])

  return (
    <>
      <OrbitControls makeDefault enabled={!handDetected} />
      <CameraRig />
      {/* Use local HDRI to prevent fetch errors on some devices */}
      <Environment files="/st_fagans_interior_1k.hdr" background={false} />
      
      {/* Main Elements */}
      <Particles />
      <Decorations />
      <Snow />
      <LuxuryGifts />
      <Ornaments />
      <Candies />
      <CandyCanes />
      <Star />
      <AuroraBands />

      {/* Atmosphere */}
      <BackgroundSparkles count={4000} color="#FFD700" radius={90} minRadius={60} />
      <BackgroundSparkles count={4000} color="#ffffff" radius={90} minRadius={60} />
      
      {/* Post Processing */}
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom 
          luminanceThreshold={1} 
          luminanceSmoothing={0.9}
          intensity={1.5} 
          radius={0.85} 
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
