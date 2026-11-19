import type { Plan } from '../agent/plan'
import { LESSONS } from '../content/lessons'
import { useStore } from '../store'

/** Everything in a generated plan apart from the pattern rows: what was understood, what to buy, what to learn. */
export function PlanDetails({ plan, openLesson }: { plan: Plan; openLesson: (id: string) => void }) {
  const { state } = useStore()
  return (
    <>
      <section className="card">
        <span className="tag">Designed by the AI coach · {plan.difficulty}</span>
        <p>{plan.summary}</p>
        <p className="sub"><b>What the designer understood:</b> {plan.what_i_saw}</p>
        {plan.assumptions.length > 0 && (
          <details className="more"><summary>What it assumed ({plan.assumptions.length})</summary>
            <ul className="plain">{plan.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
          </details>
        )}
      </section>

      <section className="card">
        <h2>Yarn and tools</h2>
        <p><b>{plan.yarn.weight}</b> · {plan.yarn.amount}{plan.yarn.colours.length ? ` · ${plan.yarn.colours.join(', ')}` : ''}</p>
        {plan.yarn.note && <p className="sub">{plan.yarn.note}</p>}
        <ul className="kit">{plan.tools.map((t) => <li key={t.name} className="why"><span><b>{t.name}</b><small>{t.why}</small></span><b>{t.size_or_qty}</b></li>)}</ul>
      </section>

      <section className="card">
        <h2>Skills, in the order to learn them</h2>
        <ol className="skills">
          {plan.skills.map((s) => {
            const lesson = s.lesson_id ? LESSONS.find((l) => l.id === s.lesson_id) : undefined
            const fresh = plan.new_lessons.find((l) => l.skill === s.name)
            return (
              <li key={s.name}>
                {lesson ? (
                  <button className="lesson" onClick={() => openLesson(lesson.id)}>
                    <span><b>{s.name}</b><small>{s.why}</small></span>
                    <span className={`tag ${state.lessons[lesson.id] ? 'ok' : ''}`}>{state.lessons[lesson.id] ? 'Done' : 'Lesson'}</span>
                  </button>
                ) : fresh ? (
                  <details className="howto">
                    <summary><b>{fresh.title}</b> <span className="tag new">New lesson</span></summary>
                    <p className="sub">{s.why}</p>
                    <p><b>Goal:</b> {fresh.goal}</p>
                    <ol className="steps">{fresh.steps.map((st, n) => <li key={n}>{st}</li>)}</ol>
                    <div className="callout ok"><b>You have it when</b><p>{fresh.check}</p></div>
                    {fresh.watch && <div className="callout warn"><b>Watch out</b><p>{fresh.watch}</p></div>}
                  </details>
                ) : <p><b>{s.name}</b> {s.why}</p>}
              </li>
            )
          })}
        </ol>
        {plan.new_lessons.length > 0 && <p className="sub">New lessons were written by the AI designer for this plan. They have no diagrams and no person has checked them.</p>}
      </section>

      {plan.not_checked.length > 0 && (
        <div className="callout warn">
          <b>Not machine-checked</b>
          <ul className="plain">{plan.not_checked.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      )}
    </>
  )
}
