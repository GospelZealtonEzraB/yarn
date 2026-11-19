import { useEffect, useState } from 'react'
import { Builder } from './screens/Builder'
import { Coach } from './screens/Coach'
import { Lab } from './screens/Lab'
import { Learn } from './screens/Learn'
import { Lesson } from './screens/Lesson'
import { Practice } from './screens/Practice'
import { Projects } from './screens/Projects'
import { load, save, StoreContext, type State } from './store'

type Tab = 'learn' | 'make' | 'practice' | 'lab' | 'coach'
const TABS: [Tab, string, string][] = [
  ['learn', 'Learn', 'M4 6h7a3 3 0 013 3v10a2 2 0 00-2-2H4zM20 6h-6v13'],
  ['make', 'Make', 'M5 14c0-6 3-9 7-9s7 3 7 9v4H5zM5 14h14'],
  ['practice', 'Practice', 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 9a3 3 0 100 6 3 3 0 000-6z'],
  ['lab', 'Lab', 'M4 8l4 8 4-8 4 8 4-8'],
  ['coach', 'Coach', 'M5 7h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2zM12 9.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM8 7l1.5-2h5L16 7'],
]

export default function App() {
  const [state, setState] = useState<State>(load)
  const [tab, setTab] = useState<Tab>('learn')
  const [lesson, setLesson] = useState<string | null>(null)
  const [project, setProject] = useState<string | null>(null)
  const set = (patch: Partial<State>) => setState((s) => { const next = { ...s, ...patch }; save(next); return next })
  useEffect(() => { window.scrollTo(0, 0) }, [tab, lesson, project])

  return (
    <StoreContext.Provider value={{ state, set }}>
      <main>
        {tab === 'learn' && (lesson ? <Lesson key={lesson} id={lesson} back={() => setLesson(null)} open={setLesson} /> : <Learn open={setLesson} openProject={(id) => { setTab('make'); setProject(id) }} />)}
        {tab === 'make' && (project ? <Builder id={project} back={() => setProject(null)} openLesson={(id) => { setTab('learn'); setLesson(id) }} /> : <Projects open={setProject} />)}
        {tab === 'practice' && <Practice />}
        {tab === 'lab' && <Lab />}
        {tab === 'coach' && <Coach />}
      </main>
      <nav className="tabs" aria-label="Sections">
        {TABS.map(([id, name, icon]) => (
          <button key={id} aria-current={tab === id} onClick={() => { setTab(id); setLesson(null); setProject(null) }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icon} /></svg>{name}
          </button>
        ))}
      </nav>
    </StoreContext.Provider>
  )
}
