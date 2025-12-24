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
import { useEffect } from 'react'
import { useStore } from '../../store/useStore'

export const Experience = () => {
  const { gesture, setMode } = useStore()

  useEffect(() => {
    if (gesture === 'PINCH') {
      setMode('TREE')
    } else if (gesture === 'OPEN') {
      setMode('CHAOS')
    }
  }, [gesture, setMode])

  return (
    <>
      <OrbitControls makeDefault />
      <Environment preset="lobby" background={false} />
      
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
      <BackgroundSparkles count={4000} color="#FFD700" radius={90} />
      <BackgroundSparkles count={4000} color="#ffffff" radius={90} />
      
      {/* Post Processing */}
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom 
          luminanceThreshold={1.0} 
          intensity={2.0} 
          radius={0.85} 
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
