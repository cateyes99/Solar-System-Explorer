import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, Clock3, GraduationCap } from 'lucide-react'
import { LESSONS } from '../../data/lessons'
import type { BodyId, LessonId } from '../../types'
import { useSimulationStore } from '../../store/simulationStore'
import { Modal } from '../ui/Modal'
import { DayNightDemo, DistanceExplorer, FusionVisual, GravityLab, MoonPhaseDemo, OrbitDemo, SeasonsDemo, SizeComparison } from './LessonVisuals'

const lessonCopy: Record<LessonId, { heading: string; introduction: string; points: [string, string][]; target: BodyId | null }> = {
  sun: { heading: 'Meet the star that makes it all possible', introduction: 'The Sun looks small from Earth because it is about 150 million kilometres away. Up close, it is an enormous, glowing sphere of plasma with no solid surface.', points: [['It shines because of fusion', 'Deep in the core, immense pressure joins hydrogen nuclei to make helium. A little mass becomes a lot of energy.'], ['Its gravity is a guiding hand', 'The Sun’s huge mass pulls on every planet. Their forward motion and this pull together create orbits.'], ['Energy takes a journey', 'Energy can spend thousands of years moving through the Sun, then just 8 minutes 20 seconds traveling from its surface to Earth.']], target: 'sun' },
  sizes: { heading: 'How big is big, really?', introduction: 'Numbers like 139,820 kilometres are hard to imagine. Direct comparison turns those numbers into something your eyes can understand.', points: [['Diameter means width', 'It is the distance through the middle of a planet, from one side to the other.'], ['Volume grows quickly', 'A world twice as wide has about eight times as much room inside. That is why Jupiter can hold so many Earths.']], target: 'jupiter' },
  distances: { heading: 'Space is mostly… space', introduction: 'The planets are astonishingly far apart. Our main scene squeezes those distances together so you can see the whole family at once.', points: [['Distance changes sunlight', 'Neptune receives about 900 times less sunlight per square metre than Earth because it is so much farther away.'], ['Light becomes a clock', 'When you see a planet, you see sunlight that left the Sun minutes or hours earlier.']], target: 'neptune' },
  gravity: { heading: 'Meet the invisible pull', introduction: 'Gravity attracts every object with mass to every other object. More mass means a stronger pull. Distance matters too: gravity becomes weaker as objects move apart.', points: [['Mass is not weight', 'Mass is how much material something contains. Weight is the force of gravity pulling on that mass.'], ['Gravity connects the system', 'The Sun pulls on planets, planets pull on moons, and every object pulls back with an equal force.']], target: 'earth' },
  'day-night': { heading: 'Why does the Sun rise every morning?', introduction: 'It looks as though the Sun moves across our sky, but the apparent motion comes from Earth turning beneath us.', points: [['One spin, one day', 'Earth rotates once in just under 24 hours. Different places rotate into and out of sunlight.'], ['Everyone’s noon is different', 'When it is daytime where you are, people on the opposite side of Earth can be sleeping under the stars.']], target: 'earth' },
  seasons: { heading: 'A small tilt creates four seasons', introduction: 'Earth travels around the Sun with its axis tilted. That tilt stays pointed in nearly the same direction throughout the year.', points: [['Tilt changes the sunlight', 'When your hemisphere tilts toward the Sun, sunlight arrives more directly and days are longer: summer.'], ['Opposite seasons', 'When the north has summer, the south has winter. Six months later, they swap.']], target: 'earth' },
  'moon-phases': { heading: 'The Moon is not changing shape', introduction: 'Half of the Moon is always lit by the Sun. As the Moon orbits Earth, we see different amounts of that illuminated half.', points: [['It is about viewpoint', 'The changing angle between the Sun, Moon, and Earth creates the phases.'], ['Not Earth’s shadow', 'Ordinary phases are not shadows from Earth. A lunar eclipse is a different, much rarer event.']], target: 'moon' },
  orbits: { heading: 'The art of falling without falling down', introduction: 'Planets move forward through space while gravity continuously pulls them toward the Sun. The combination creates a curved path.', points: [['Inertia keeps them moving', 'With almost no friction in space, a planet does not need a constant push to maintain its motion.'], ['Orbits are slightly elliptical', 'Our main scene uses circles for clarity. Real planetary orbits are stretched circles called ellipses.']], target: null },
}

export function LearnPanel() {
  const [lessonId, setLessonId] = useState<LessonId>('sun')
  const activeModal = useSimulationStore((state) => state.activeModal)
  const setActiveModal = useSimulationStore((state) => state.setActiveModal)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const lessonIndex = LESSONS.findIndex((lesson) => lesson.id === lessonId)
  const copy = lessonCopy[lessonId]

  const visuals: Record<LessonId, React.ReactNode> = {
    sun: <FusionVisual />, sizes: <SizeComparison />, distances: <DistanceExplorer />, gravity: <GravityLab />,
    'day-night': <DayNightDemo />, seasons: <SeasonsDemo />, 'moon-phases': <MoonPhaseDemo />, orbits: <OrbitDemo />,
  }
  const visit = () => {
    if (!copy.target) return
    setActiveModal(null)
    selectBody(copy.target, true)
  }

  return (
    <Modal open={activeModal === 'learn'} title="Explore & Learn" eyebrow="THE ASTRA FIELD SCHOOL" size="large" className="learn-modal">
      <div className="learn-layout">
        <aside className="lesson-list" aria-label="Lessons"><div className="lesson-list__intro"><GraduationCap size={19} /><span>8 interactive lessons<br /><small>Curiosity is your only prerequisite.</small></span></div>{LESSONS.map((lesson) => <button key={lesson.id} className={lesson.id === lessonId ? 'active' : ''} onClick={() => setLessonId(lesson.id)}><span>{lesson.number}</span><div><strong>{lesson.title}</strong><small>{lesson.subtitle}</small></div><ArrowRight size={14} /></button>)}</aside>
        <article className="lesson-content">
          <AnimatePresence mode="wait">
            <motion.div key={lessonId} initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.25 }}>
              <div className="lesson-meta"><span>LESSON {LESSONS[lessonIndex].number}</span><span><Clock3 size={13} />{LESSONS[lessonIndex].duration}</span></div>
              <h3>{copy.heading}</h3><p className="lesson-intro">{copy.introduction}</p>
              {visuals[lessonId]}
              <div className="lesson-notes">{copy.points.map(([title, text]) => <section key={title}><BookOpen size={15} /><div><h4>{title}</h4><p>{text}</p></div></section>)}</div>
              <div className="lesson-footer">{copy.target && <button className="secondary-button" onClick={visit}>Visit in the Solar System<ArrowRight size={15} /></button>}<button className="text-button" onClick={() => setLessonId(LESSONS[(lessonIndex + 1) % LESSONS.length].id)}>Next: {LESSONS[(lessonIndex + 1) % LESSONS.length].title}<ArrowRight size={14} /></button></div>
            </motion.div>
          </AnimatePresence>
        </article>
      </div>
    </Modal>
  )
}
