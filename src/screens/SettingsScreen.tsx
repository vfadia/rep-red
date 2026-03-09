import { useState } from 'react'
import ScreenLayout from '../components/ScreenLayout'
import ExerciseForm from '../components/ExerciseForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAllExercises, updateExercise, deleteExercise } from '../hooks/useExercises'
import { addWorkoutLog } from '../hooks/useWorkoutLogs'
import { advanceDay } from '../algorithm/repRedistribution'
import type { Exercise } from '../db/types'

type FormState =
  | { open: false }
  | { open: true; mode: 'add' }
  | { open: true; mode: 'edit'; exercise: Exercise }
  | { open: true; mode: 'maxReps'; exercise: Exercise }
  | { open: true; mode: 'volumeOverride'; exercise: Exercise }

export default function SettingsScreen() {
  const exercises = useAllExercises()
  const [form, setForm] = useState<FormState>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null)
  const [forceAdvanceTarget, setForceAdvanceTarget] = useState<Exercise | null>(null)

  // Split active/inactive but preserve sortOrder within each group
  const active = exercises.filter(e => e.isActive)
  const inactive = exercises.filter(e => !e.isActive)
  const sorted = [...active, ...inactive]

  async function moveUp(exercise: Exercise) {
    const idx = sorted.indexOf(exercise)
    if (idx <= 0) return
    const prev = sorted[idx - 1]
    await updateExercise(exercise.id, { sortOrder: prev.sortOrder })
    await updateExercise(prev.id, { sortOrder: exercise.sortOrder })
  }

  async function moveDown(exercise: Exercise) {
    const idx = sorted.indexOf(exercise)
    if (idx >= sorted.length - 1) return
    const next = sorted[idx + 1]
    await updateExercise(exercise.id, { sortOrder: next.sortOrder })
    await updateExercise(next.id, { sortOrder: exercise.sortOrder })
  }

  async function toggleActive(exercise: Exercise) {
    await updateExercise(exercise.id, { isActive: !exercise.isActive })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteExercise(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function confirmForceAdvance() {
    if (!forceAdvanceTarget) return
    const today = new Date().toISOString().split('T')[0]
    const next = advanceDay(forceAdvanceTarget.currentDayPrescription)
    await updateExercise(forceAdvanceTarget.id, { currentDayPrescription: next })
    await addWorkoutLog({
      date: today,
      exerciseId: forceAdvanceTarget.id,
      prescribedSets: forceAdvanceTarget.currentDayPrescription,
      actualSets: [0, 0, 0, 0, 0],
      completed: false,
      attemptNumber: 0,
      notes: 'Force advanced',
      isOverride: true,
      overrideType: 'force_advance',
    })
    setForceAdvanceTarget(null)
  }

  return (
    <ScreenLayout>
      <div className="p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Exercises
          </h1>
          <button
            onClick={() => setForm({ open: true, mode: 'add' })}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            + Add
          </button>
        </div>

        {/* Exercise list */}
        {sorted.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No exercises yet. Tap + Add to get started.
          </p>
        )}

        {sorted.map((exercise, idx) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isFirst={idx === 0}
            isLast={idx === sorted.length - 1}
            onEdit={() => setForm({ open: true, mode: 'edit', exercise })}
            onMaxReps={() => setForm({ open: true, mode: 'maxReps', exercise })}
            onVolume={() => setForm({ open: true, mode: 'volumeOverride', exercise })}
            onForceAdvance={() => setForceAdvanceTarget(exercise)}
            onToggleActive={() => toggleActive(exercise)}
            onDelete={() => setDeleteTarget(exercise)}
            onMoveUp={() => moveUp(exercise)}
            onMoveDown={() => moveDown(exercise)}
          />
        ))}
      </div>

      {/* Exercise Form modal */}
      {form.open && form.mode === 'add' && (
        <ExerciseForm
          mode="add"
          exerciseCount={exercises.length}
          onClose={() => setForm({ open: false })}
        />
      )}
      {form.open && form.mode === 'edit' && (
        <ExerciseForm
          mode="edit"
          exercise={form.exercise}
          onClose={() => setForm({ open: false })}
        />
      )}
      {form.open && form.mode === 'maxReps' && (
        <ExerciseForm
          mode="maxReps"
          exercise={form.exercise}
          onClose={() => setForm({ open: false })}
        />
      )}
      {form.open && form.mode === 'volumeOverride' && (
        <ExerciseForm
          mode="volumeOverride"
          exercise={form.exercise}
          onClose={() => setForm({ open: false })}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Exercise?"
          message="This cannot be undone. Past logs are preserved."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Force advance confirmation */}
      {forceAdvanceTarget && (
        <ConfirmDialog
          title="Force Advance?"
          message="Skip today's prescription and advance to the next day. Use this if you completed the workout but forgot to log it."
          confirmLabel="Force ↑ Advance"
          onConfirm={confirmForceAdvance}
          onCancel={() => setForceAdvanceTarget(null)}
        />
      )}
    </ScreenLayout>
  )
}

interface CardProps {
  exercise: Exercise
  isFirst: boolean
  isLast: boolean
  onEdit: () => void
  onMaxReps: () => void
  onVolume: () => void
  onForceAdvance: () => void
  onToggleActive: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function ExerciseCard({
  exercise,
  isFirst,
  isLast,
  onEdit,
  onMaxReps,
  onVolume,
  onForceAdvance,
  onToggleActive,
  onDelete,
  onMoveUp,
  onMoveDown,
}: CardProps) {
  const prescription = exercise.currentDayPrescription.join(' · ')

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border)',
        opacity: exercise.isActive ? 1 : 0.6,
      }}
    >
      {/* Top row: name + status badge + reorder */}
      <div className="flex items-center gap-2">
        <span className="flex-1 font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
          {exercise.name}
        </span>
        <span
          className="text-2xs font-bold px-2 py-0.5 rounded"
          style={{
            background: exercise.isActive ? 'var(--color-accent-dim)' : 'var(--color-surface-overlay)',
            color: exercise.isActive ? 'var(--color-accent-glow)' : 'var(--color-text-muted)',
          }}
        >
          {exercise.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="w-7 h-7 flex items-center justify-center rounded text-sm"
          style={{ color: isFirst ? 'var(--color-text-muted)' : 'var(--color-text-secondary)', background: 'var(--color-surface-overlay)' }}
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="w-7 h-7 flex items-center justify-center rounded text-sm"
          style={{ color: isLast ? 'var(--color-text-muted)' : 'var(--color-text-secondary)', background: 'var(--color-surface-overlay)' }}
          aria-label="Move down"
        >
          ↓
        </button>
      </div>

      {/* Prescription preview */}
      <p className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
        {prescription}
      </p>

      {/* Action row */}
      <div className="flex flex-wrap gap-2">
        <ActionButton label="Edit" onClick={onEdit} />
        <ActionButton label="Max Reps" onClick={onMaxReps} />
        <ActionButton label="Volume" onClick={onVolume} />
        <ActionButton label="Force ↑" onClick={onForceAdvance} />
        <ActionButton
          label={exercise.isActive ? 'Deactivate' : 'Activate'}
          onClick={onToggleActive}
        />
        {!exercise.isActive && (
          <ActionButton label="Delete" onClick={onDelete} destructive />
        )}
      </div>
    </div>
  )
}

function ActionButton({
  label,
  onClick,
  destructive = false,
}: {
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{
        background: destructive ? 'rgba(239,68,68,0.12)' : 'var(--color-surface-overlay)',
        color: destructive ? 'var(--color-destructive)' : 'var(--color-text-secondary)',
        border: `1px solid ${destructive ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`,
      }}
    >
      {label}
    </button>
  )
}
