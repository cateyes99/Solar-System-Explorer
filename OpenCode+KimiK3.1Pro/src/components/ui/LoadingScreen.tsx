import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BrandMark } from './Header'

export function LoadingScreen() {
  const [progress, setProgress] = useState(8)
  useEffect(() => {
    const timer = window.setInterval(() => setProgress((value) => Math.min(94, value + Math.max(1, (94 - value) * 0.08))), 120)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <motion.div className="loading-screen" exit={{ opacity: 0 }} transition={{ duration: 0.65 }}>
      <div className="loading-stars" />
      <div className="loading-brand"><BrandMark /><span>ASTRA</span></div>
      <div className="loading-orrery"><div className="loading-sun" /><i className="loading-orbit one"><b /></i><i className="loading-orbit two"><b /></i><i className="loading-orbit three"><b /></i></div>
      <span className="eyebrow">AN INTERACTIVE FIELD GUIDE</span><h1>Preparing the Solar System<span>…</span></h1><p>Warming up our star. Putting every world in motion.</p>
      <div className="loading-progress"><div><i style={{ width: `${progress}%` }} /></div><span>{Math.round(progress)}%</span></div>
    </motion.div>
  )
}
