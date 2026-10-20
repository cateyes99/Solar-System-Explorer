import { motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { FactPill, Figure, LessonSection, ModelBadge } from './common'

function FusionAnimation() {
  const reduced = useSimulationStore((s) => s.reducedMotion)
  const loop = reduced ? undefined : { duration: 4, repeat: Infinity, times: [0, 0.45, 0.55, 1] }
  return (
    <svg viewBox="0 0 320 150" className="h-auto w-full" role="img" aria-label="Two hydrogen nuclei crash together and become helium, giving off light">
      <defs>
        <radialGradient id="fusion-glow">
          <stop offset="0%" stopColor="#fff6c8" />
          <stop offset="100%" stopColor="#ff9a3c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.circle
        cx={160}
        cy={75}
        r={60}
        fill="url(#fusion-glow)"
        initial={{ opacity: reduced ? 0.8 : 0 }}
        animate={reduced ? undefined : { opacity: [0, 0, 0.95, 0] }}
        transition={loop}
      />
      <motion.g initial={{ x: reduced ? 105 : 0 }} animate={reduced ? undefined : { x: [0, 105, 105, 105], opacity: [1, 1, 0, 0] }} transition={loop}>
        <circle cx={40} cy={75} r={16} fill="#f87171" />
        <text x={40} y={80} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">H</text>
      </motion.g>
      <motion.g initial={{ x: reduced ? -105 : 0 }} animate={reduced ? undefined : { x: [0, -105, -105, -105], opacity: [1, 1, 0, 0] }} transition={loop}>
        <circle cx={280} cy={75} r={16} fill="#f87171" />
        <text x={280} y={80} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">H</text>
      </motion.g>
      <motion.g initial={{ opacity: reduced ? 1 : 0 }} animate={reduced ? undefined : { opacity: [0, 0, 1, 1], scale: [0.6, 0.6, 1, 1] }} transition={loop} style={{ originX: '160px', originY: '75px' }}>
        <circle cx={160} cy={75} r={22} fill="#60a5fa" />
        <text x={160} y={81} textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">He</text>
      </motion.g>
      {[-1, 1].map((dir) => (
        <motion.path
          key={dir}
          d={`M ${160 + dir * 30} 75 q ${dir * 10} -10 ${dir * 20} 0 t ${dir * 20} 0 t ${dir * 20} 0`}
          stroke="#fde68a"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={reduced ? undefined : { opacity: [0, 0, 1, 0], x: [0, 0, 0, dir * 50] }}
          transition={loop}
        />
      ))}
    </svg>
  )
}

export default function SunLesson() {
  const openLesson = useSimulationStore((s) => s.openLesson)
  return (
    <div>
      <LessonSection title="What is the Sun?">
        <p>
          The Sun is a <strong className="text-amber-200">star</strong> – a gigantic ball of glowing gas, mostly hydrogen and helium.
          The stars you see at night are suns too. Ours just looks bigger and brighter because it is so close.
        </p>
      </LessonSection>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <FactPill value="1.3 million" label="Earths could fit inside" />
        <FactPill value="8 min 20 s" label="for sunlight to reach Earth" />
        <FactPill value="99.8%" label="of all the Solar System’s mass" />
      </div>

      <LessonSection title="Why does it shine?">
        <p>
          The middle of the Sun – its core – is about <strong className="text-amber-200">15 million °C</strong>. It is so hot and
          squashed that tiny hydrogen particles crash together and join up to make helium. This is called{' '}
          <strong className="text-amber-200">nuclear fusion</strong>.
        </p>
        <p>Every time this happens, a little bit of matter turns into a lot of energy. That energy slowly makes its way out and leaves the Sun as light and heat.</p>
      </LessonSection>
      <Figure caption={<ModelBadge>Simplified picture of fusion</ModelBadge>}>
        <FusionAnimation />
      </Figure>

      <LessonSection title="Why do planets orbit the Sun?">
        <p>
          The Sun is so heavy that its <strong className="text-cyan-200">gravity</strong> pulls on everything around it. The planets are
          also zooming sideways very fast. The pull and the sideways speed balance out, so instead of falling in or flying away, each
          planet keeps curving around the Sun. That path is called an <strong className="text-cyan-200">orbit</strong>.
        </p>
        <button type="button" className="btn-primary mt-2" onClick={() => openLesson('orbits')}>
          Open the Orbits lesson
        </button>
      </LessonSection>
    </div>
  )
}
