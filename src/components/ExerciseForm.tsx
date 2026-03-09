import { useState } from 'react'
import { getInitialDistribution } from '../algorithm/repRedistribution'
import { addExercise, updateExercise } from '../hooks/useExercises'
import type { Exercise } from '../db/types'

type Mode = 'add' | 'edit' | 'maxReps'

interface Props {
  mode: Mode
  exercise?: Exercise
  exerciseCount?: number
  onClose: () => void
}

export default function ExerciseForm({ mode, exercise, exerciseCount = 0, onClose }: Props) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [setupNotes, setSetupNotes] = useState(exercise?.setupNotes ?? '')
  const [maxReps, setMaxReps] = useState(exercise?.maxReps?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  const maxRepsNum = parseInt(maxReps, 10)
  const maxRepsValid = !isNaN(maxRepsNum) && maxRepsNum >= 1 && Number.isInteger(maxRepsNum)

  const isValid = (() => {
    if (mode === 'add') return name.trim().length > 0 && maxRepsValid
    if (mode === 'edit') return name.trim().length > 0
    if (mode === 'maxReps') return maxRepsValid
    return false
  })()

  async function handleSubmit() {
    if (!isValid || saving) return
    setSaving(true)
    try {
      if (mode === 'add') {
        await addExercise({
          name: name.trim(),
          setupNotes: setupNotes.trim(),
          maxReps: maxRepsNum,
          totalVolume: maxRepsNum * 2,
          currentDayPrescription: getInitialDistribution(maxRepsNum),
          isActive: true,
          sortOrder: exerciseCount,
        })
      } else if (mode === 'edit' && exercise) {
        await updateExercise(exercise.id, { name: name.trim(), setupNotes: setupNotes.trim() })
      } else if (mode === 'maxReps' && exercise) {
        await updateExercise(exercise.id, {
          maxReps: maxRepsNum,
          totalVolume: maxRepsNum * 2,
          currentDayPrescription: getInitialDistribution(maxRepsNum),
        })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'add' ? 'Add Exercise' : mode === 'edit' ? 'Edit Exercise' : 'Update Max Reps'

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-t-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--color-surface-overlay)',
          borderTop: '1px solid var(--color-border-strong)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-raised)' }}
          >
            Cancel
          </button>
        </div>

        {(mode === 'add' || mode === 'edit') && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Pull-ups"
                className="rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--color-surface-raised)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-strong)',
                }}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                Setup Notes
              </label>
              <textarea
                value={setupNotes}
                onChange={e => setSetupNotes(e.target.value)}
                placeholder="Optional setup cues…"
                rows={3}
                className="rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{
                  background: 'var(--color-surface-raised)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-strong)',
                }}
              />
            </div>
          </>
        )}

        {(mode === 'add' || mode === 'maxReps') && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Max Reps *
            </label>
            {mode === 'maxReps' && (
              <p className="text-xs mb-1" style={{ color: 'var(--color-warning)' }}>
                This will reset your current cycle.
              </p>
            )}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={maxReps}
              onChange={e => setMaxReps(e.target.value)}
              placeholder="e.g. 10"
              className="rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'var(--color-surface-raised)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-strong)',
              }}
              autoFocus={mode === 'maxReps'}
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="rounded-lg py-3 text-sm font-semibold transition-opacity"
          style={{
            background: isValid ? 'var(--color-accent)' : 'var(--color-surface-raised)',
            color: isValid ? '#fff' : 'var(--color-text-muted)',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
