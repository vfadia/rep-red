import { useState, useEffect } from 'react'
import ScreenLayout from '../components/ScreenLayout'
import SetButton from '../components/SetButton'
import ConfirmDialog from '../components/ConfirmDialog'
import ExerciseForm from '../components/ExerciseForm'
import { useActiveExercises, updateExercise } from '../hooks/useExercises'
import { useWorkoutLogsForDate, addWorkoutLog, getLogsForExerciseOnDate } from '../hooks/useWorkoutLogs'
import { useToday } from '../hooks/useToday'
import { advanceDay, isComplete } from '../algorithm/repRedistribution'
import type { Exercise } from '../db/types'
import type { WorkoutLog } from '../db/types'

type SetState = { prescribed: number; actual: number; done: boolean }

export default function WorkoutScreen() {
  const today = useToday()
  const exercises = useActiveExercises()
  const todayLogs = useWorkoutLogsForDate(today)

  const [activeIdx, setActiveIdx] = useState(0)
  const [sets, setSets] = useState<SetState[]>([])
  const [isLogging, setIsLogging] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cycleCompleteExercise, setCycleCompleteExercise] = useState<Exercise | null>(null)
  const [showMaxRepsForm, setShowMaxRepsForm] = useState(false)

  const clampedIdx = Math.min(activeIdx, Math.max(0, exercises.length - 1))
  const activeExercise = exercises[clampedIdx] ?? null

  const exerciseLogs = todayLogs.filter(l => l.exerciseId === activeExercise?.id)

  // When switching tabs, initialize logging state
  useEffect(() => {
    if (!activeExercise) return
    const hasExistingLog = todayLogs.some(l => l.exerciseId === activeExercise.id)
    if (!hasExistingLog) {
      setIsLogging(true)
      setSets(activeExercise.currentDayPrescription.map(p => ({ prescribed: p, actual: p, done: false })))
    } else {
      setIsLogging(false)
    }
    setShowNotes(false)
  }, [activeIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCompleteAsPrescribed() {
    setSets(prev => prev.map(s => ({ ...s, actual: s.prescribed, done: true })))
  }

  async function handleSave() {
    if (!activeExercise || saving) return
    setSaving(true)
    try {
      const prescribedSets = sets.map(s => s.prescribed)
      const actualSets = sets.map(s => (s.done ? s.actual : 0))
      const completed = sets.every(s => s.done && s.actual >= s.prescribed)

      const existingLogs = await getLogsForExerciseOnDate(activeExercise.id, today)
      const attemptNumber = existingLogs.length + 1

      await addWorkoutLog({
        date: today,
        exerciseId: activeExercise.id,
        prescribedSets,
        actualSets,
        completed,
        attemptNumber,
        notes: '',
      })

      const wasAlreadyCompleted = existingLogs.some(l => l.completed)
      if (completed && !wasAlreadyCompleted) {
        const next = advanceDay(activeExercise.currentDayPrescription)
        await updateExercise(activeExercise.id, { currentDayPrescription: next })
        if (isComplete(next, activeExercise.maxReps)) {
          setCycleCompleteExercise(activeExercise)
        }
      }

      setIsLogging(false)
    } finally {
      setSaving(false)
    }
  }

  function handleLogAgain() {
    if (!activeExercise) return
    setSets(activeExercise.currentDayPrescription.map(p => ({ prescribed: p, actual: p, done: false })))
    setIsLogging(true)
  }

  const dateHeader = new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  if (exercises.length === 0) {
    return (
      <ScreenLayout>
        <div className="p-4 flex flex-col gap-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Workout
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No exercises yet. Go to{' '}
            <strong style={{ color: 'var(--color-text-secondary)' }}>Settings</strong> to add one.
          </p>
        </div>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout>
      <div className="flex flex-col">
        {/* Date header */}
        <div className="px-4 pt-4 pb-2">
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Today
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {dateHeader}
          </h1>
        </div>

        {/* Exercise tabs */}
        <div className="px-4 pb-3 overflow-x-auto flex gap-2" style={{ scrollbarWidth: 'none' }}>
          {exercises.map((ex, idx) => {
            const hasLog = todayLogs.some(l => l.exerciseId === ex.id)
            const isActive = clampedIdx === idx
            return (
              <button
                key={ex.id}
                onClick={() => setActiveIdx(idx)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: isActive ? 'var(--color-accent)' : 'var(--color-surface-overlay)',
                  color: isActive ? '#fff' : hasLog ? 'var(--color-success)' : 'var(--color-text-secondary)',
                  border: `1px solid ${isActive ? 'transparent' : hasLog ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
                }}
              >
                {ex.name}
                {hasLog && !isActive ? ' ✓' : ''}
              </button>
            )
          })}
        </div>

        {/* Exercise content */}
        {activeExercise && (
          <div className="px-4 flex flex-col gap-4">
            {isLogging ? (
              <LoggingView
                exercise={activeExercise}
                sets={sets}
                setSets={setSets}
                attemptNumber={exerciseLogs.length + 1}
                showNotes={showNotes}
                onToggleNotes={() => setShowNotes(n => !n)}
                onCompleteAsPrescribed={handleCompleteAsPrescribed}
                onSave={handleSave}
                saving={saving}
              />
            ) : (
              <CompletedView
                exercise={activeExercise}
                logs={exerciseLogs}
                onLogAgain={handleLogAgain}
              />
            )}
          </div>
        )}
      </div>

      {/* Cycle complete dialog */}
      {cycleCompleteExercise && !showMaxRepsForm && (
        <ConfirmDialog
          title="Cycle Complete! 🎉"
          message={`You've maxed out ${cycleCompleteExercise.name}. Time to re-test your max reps and start a new cycle.`}
          confirmLabel="Update Max Reps"
          onConfirm={() => setShowMaxRepsForm(true)}
          onCancel={() => setCycleCompleteExercise(null)}
        />
      )}
      {cycleCompleteExercise && showMaxRepsForm && (
        <ExerciseForm
          mode="maxReps"
          exercise={cycleCompleteExercise}
          onClose={() => {
            setShowMaxRepsForm(false)
            setCycleCompleteExercise(null)
          }}
        />
      )}
    </ScreenLayout>
  )
}

// ── Logging view ────────────────────────────────────────────────────────────

interface LoggingViewProps {
  exercise: Exercise
  sets: SetState[]
  setSets: React.Dispatch<React.SetStateAction<SetState[]>>
  attemptNumber: number
  showNotes: boolean
  onToggleNotes: () => void
  onCompleteAsPrescribed: () => void
  onSave: () => void
  saving: boolean
}

function LoggingView({
  exercise,
  sets,
  setSets,
  attemptNumber,
  showNotes,
  onToggleNotes,
  onCompleteAsPrescribed,
  onSave,
  saving,
}: LoggingViewProps) {
  const allDone = sets.every(s => s.done)

  return (
    <>
      {/* Name + attempt */}
      <div className="flex items-baseline justify-between mt-2">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {exercise.name}
        </h2>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Attempt {attemptNumber}
        </span>
      </div>

      {/* Setup notes */}
      {exercise.setupNotes && (
        <div>
          <button
            onClick={onToggleNotes}
            className="text-sm flex items-center gap-1 text-left"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <span>
              {showNotes
                ? exercise.setupNotes
                : exercise.setupNotes.slice(0, 50) + (exercise.setupNotes.length > 50 ? '…' : '')}
            </span>
            <span className="flex-shrink-0">{showNotes ? '▴' : '▾'}</span>
          </button>
        </div>
      )}

      {/* Set buttons */}
      <div className="flex gap-3 flex-wrap">
        {sets.map((s, idx) => (
          <SetButton
            key={idx}
            prescribed={s.prescribed}
            actual={s.actual}
            done={s.done}
            onChange={(actual, done) =>
              setSets(prev => prev.map((set, i) => (i === idx ? { ...set, actual, done } : set)))
            }
          />
        ))}
      </div>

      {/* Complete as prescribed */}
      {!allDone && (
        <button
          onClick={onCompleteAsPrescribed}
          className="rounded-lg py-3 text-sm font-semibold"
          style={{
            background: 'var(--color-surface-overlay)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          ✓ Complete as Prescribed
        </button>
      )}

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="rounded-lg py-3 text-sm font-semibold"
        style={{
          background: 'var(--color-accent)',
          color: '#fff',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Saving…' : 'Save Workout'}
      </button>
    </>
  )
}

// ── Completed view ──────────────────────────────────────────────────────────

interface CompletedViewProps {
  exercise: Exercise
  logs: WorkoutLog[]
  onLogAgain: () => void
}

function CompletedView({ exercise, logs, onLogAgain }: CompletedViewProps) {
  const lastLog = logs.at(-1)
  if (!lastLog) return null

  const setsDisplay = lastLog.actualSets.join(' · ')
  const { completed, attemptNumber } = lastLog

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 mt-2"
      style={{
        background: 'var(--color-surface-raised)',
        border: `1px solid ${completed ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
          {exercise.name}
        </span>
        <span
          className="text-sm"
          style={{ color: completed ? 'var(--color-success)' : 'var(--color-text-muted)' }}
        >
          {completed ? '✓ Completed' : '✗ Incomplete'} (Attempt {attemptNumber})
        </span>
      </div>
      <p className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
        {setsDisplay}
      </p>
      <button
        onClick={onLogAgain}
        className="rounded-lg py-2.5 text-sm font-semibold"
        style={{
          background: 'var(--color-surface-overlay)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        Log Again
      </button>
    </div>
  )
}
