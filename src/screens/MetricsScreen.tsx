import { useState, useMemo } from 'react'
import ScreenLayout from '../components/ScreenLayout'
import { useActiveExercises } from '../hooks/useExercises'
import { useWorkoutLogsForExercise } from '../hooks/useWorkoutLogs'
import { getInitialDistribution, advanceDay, isComplete } from '../algorithm/repRedistribution'
import type { Exercise } from '../db/types'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export default function MetricsScreen() {
  const exercises = useActiveExercises()
  const [activeIdx, setActiveIdx] = useState(0)

  const clampedIdx = Math.min(activeIdx, Math.max(0, exercises.length - 1))
  const activeExercise = exercises[clampedIdx] ?? null

  if (exercises.length === 0) {
    return (
      <ScreenLayout>
        <div className="p-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Metrics</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            No exercises yet. Add one in Settings to start tracking.
          </p>
        </div>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout>
      <div className="flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Metrics</h1>
        </div>

        {/* Exercise tabs */}
        <div className="px-4 pb-3 overflow-x-auto flex gap-2" style={{ scrollbarWidth: 'none' }}>
          {exercises.map((ex, idx) => {
            const isActive = clampedIdx === idx
            return (
              <button
                key={ex.id}
                onClick={() => setActiveIdx(idx)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: isActive ? 'var(--color-accent)' : 'var(--color-surface-overlay)',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--color-border)'}`,
                }}
              >
                {ex.name}
              </button>
            )
          })}
        </div>

        {activeExercise && (
          <ExerciseMetrics exercise={activeExercise} />
        )}
      </div>
    </ScreenLayout>
  )
}

function ExerciseMetrics({ exercise }: { exercise: Exercise }) {
  const allLogs = useWorkoutLogsForExercise(exercise.id)
  const realLogs = useMemo(() => allLogs.filter(l => !l.isOverride), [allLogs])

  const today = new Date().toISOString().split('T')[0]

  // Cycle day: count unique dates with completed=true since cycle start
  const cycleStartDate = useMemo(() => {
    const history = exercise.maxRepsHistory ?? []
    if (history.length > 0) return history[history.length - 1].date
    return exercise.createdAt.split('T')[0]
  }, [exercise])

  const cycleDay = useMemo(() => {
    const dates = new Set(
      realLogs
        .filter(l => l.completed && l.date >= cycleStartDate)
        .map(l => l.date)
    )
    return dates.size + 1
  }, [realLogs, cycleStartDate])

  // Total cycle length
  const totalCycleLength = useMemo(() => {
    let sets = getInitialDistribution(exercise.maxReps)
    let count = 0
    while (!isComplete(sets, exercise.maxReps) && count < 500) {
      sets = advanceDay(sets)
      count++
    }
    return count + 1
  }, [exercise.maxReps])

  // Avg helpers
  function avgVolume(days: number): number {
    const cutoff = stepDate(today, -days + 1)
    const grouped: Record<string, number> = {}
    for (const log of realLogs) {
      if (log.date >= cutoff && log.date <= today) {
        const sum = log.actualSets.reduce((a, b) => a + b, 0)
        grouped[log.date] = (grouped[log.date] ?? 0) + sum
      }
    }
    const total = Object.values(grouped).reduce((a, b) => a + b, 0)
    return Math.round(total / days)
  }

  const avg7 = avgVolume(7)
  const avg28 = avgVolume(28)

  // Daily volume for line chart (last 28 days)
  const lineData = useMemo(() => {
    const cutoff = stepDate(today, -27)
    const grouped: Record<string, number> = {}
    for (const log of realLogs) {
      if (log.date >= cutoff && log.date <= today) {
        const sum = log.actualSets.reduce((a, b) => a + b, 0)
        grouped[log.date] = (grouped[log.date] ?? 0) + sum
      }
    }
    // Fill all 28 days, 0 for missing
    const result: { date: string; reps: number }[] = []
    for (let i = 27; i >= 0; i--) {
      const d = stepDate(today, -i)
      result.push({ date: d.slice(5), reps: grouped[d] ?? 0 })
    }
    return result
  }, [realLogs, today])

  // Current prescription bar chart
  const barData = exercise.currentDayPrescription.map((reps, i) => ({
    set: `S${i + 1}`,
    reps,
  }))

  // Max reps history display
  const history = exercise.maxRepsHistory ?? []

  const tooltipStyle = {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#f2f2f2',
    fontSize: '12px',
  }

  return (
    <div className="px-4 flex flex-col gap-5 pb-6">
      {/* Stats summary */}
      <div
        className="rounded-xl p-4 flex flex-col gap-2"
        style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex justify-between">
          <StatItem label="Max Reps" value={exercise.maxReps.toString()} />
          <StatItem label="Cycle Day" value={`${cycleDay} / ${totalCycleLength}`} />
        </div>
        <div className="flex justify-between mt-1">
          <StatItem label="7-day avg" value={`${avg7} reps`} />
          <StatItem label="28-day avg" value={`${avg28} reps`} />
        </div>
      </div>

      {/* Line chart: daily volume */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Daily Volume (28 days)
        </p>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#525252', fontSize: 10 }}
                tickLine={false}
                interval={6}
              />
              <YAxis tick={{ fill: '#525252', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="reps"
                stroke="#c0152a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#c0152a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart: current distribution */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Today's Prescription
        </p>
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="set" tick={{ fill: '#525252', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#525252', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="reps" fill="#c0152a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Max reps history */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Max Reps History
          </p>
          <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
          >
            {[...history].reverse().map((_entry, i) => {
              const current = history[history.length - 1 - i]
              const prev = history[history.length - 2 - i]
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    Updated to {current.value}
                    {prev ? ` (was ${prev.value})` : ''}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(current.date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
    </div>
  )
}

function stepDate(date: string, delta: number): string {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().split('T')[0]
}

function formatDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
