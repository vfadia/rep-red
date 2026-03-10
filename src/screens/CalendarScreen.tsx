import { useState, useMemo } from 'react'
import ScreenLayout from '../components/ScreenLayout'
import { useActiveExercises } from '../hooks/useExercises'
import { useWorkoutLogsForDateRange } from '../hooks/useWorkoutLogs'
import type { WorkoutLog } from '../db/types'

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function CalendarScreen() {
  const today = new Date().toISOString().split('T')[0]
  const todayDate = new Date(today + 'T12:00:00')

  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth()) // 0-based
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [filterExerciseId, setFilterExerciseId] = useState<string | null>(null)

  const exercises = useActiveExercises()

  // Load logs for displayed month + one extra month back for streak calculation
  const firstOfMonth = `${year}-${pad(month + 1)}-01`
  const lastOfMonth = toDateStr(year, month, daysInMonth(year, month))

  // For streak, load last 90 days
  const ninetyDaysAgo = (() => {
    const d = new Date(today + 'T12:00:00')
    d.setDate(d.getDate() - 90)
    return d.toISOString().split('T')[0]
  })()

  const monthLogs = useWorkoutLogsForDateRange(firstOfMonth, lastOfMonth)
  const streakLogs = useWorkoutLogsForDateRange(ninetyDaysAgo, today)

  // Map date -> non-override logs (respects exercise filter) — used for calendar grid colors
  const logsByDate = useMemo(() => {
    const map: Record<string, WorkoutLog[]> = {}
    for (const log of monthLogs) {
      if (log.isOverride) continue
      if (filterExerciseId && log.exerciseId !== filterExerciseId) continue
      if (!map[log.date]) map[log.date] = []
      map[log.date].push(log)
    }
    return map
  }, [monthLogs, filterExerciseId])

  // Map date -> all logs including overrides (respects exercise filter) — used for DayDetail
  const allLogsByDate = useMemo(() => {
    const map: Record<string, WorkoutLog[]> = {}
    for (const log of monthLogs) {
      if (filterExerciseId && log.exerciseId !== filterExerciseId) continue
      if (!map[log.date]) map[log.date] = []
      map[log.date].push(log)
    }
    return map
  }, [monthLogs, filterExerciseId])

  // Day status: 'done' | 'partial' | 'none'
  function dayStatus(dateStr: string): 'done' | 'partial' | 'none' {
    const logs = logsByDate[dateStr]
    if (!logs || logs.length === 0) return 'none'
    if (logs.some(l => l.completed)) return 'done'
    return 'partial'
  }

  // Streak calculation
  const streak = useMemo(() => {
    const streakMap: Record<string, boolean> = {}
    for (const log of streakLogs) {
      if (!log.isOverride && log.completed) {
        streakMap[log.date] = true
      }
    }
    let count = 0
    let d = new Date(today + 'T12:00:00')
    while (true) {
      const dateStr = d.toISOString().split('T')[0]
      if (!streakMap[dateStr]) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  }, [streakLogs, today])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    const nextYear = month === 11 ? year + 1 : year
    const nextMon = month === 11 ? 0 : month + 1
    // Don't navigate past current month
    const todayYear = todayDate.getFullYear()
    const todayMonth = todayDate.getMonth()
    if (nextYear > todayYear || (nextYear === todayYear && nextMon > todayMonth)) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const days = daysInMonth(year, month)
  const startDay = firstDayOfMonth(year, month) // 0=Sun

  const isCurrentMonth =
    year === todayDate.getFullYear() && month === todayDate.getMonth()

  return (
    <ScreenLayout>
      <div className="flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Calendar</h1>
        </div>

        {/* Month nav + streak */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-lg"
              style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-overlay)' }}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {monthLabel}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-lg"
              style={{
                color: isCurrentMonth ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                background: 'var(--color-surface-overlay)',
                opacity: isCurrentMonth ? 0.4 : 1,
              }}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          {streak > 0 && (
            <span className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>
              🔥 {streak} day{streak !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Exercise filter pills */}
        {exercises.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterExerciseId(null)}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: filterExerciseId === null ? 'var(--color-accent)' : 'var(--color-surface-overlay)',
                color: filterExerciseId === null ? '#000' : 'var(--color-text-secondary)',
              }}
            >
              All
            </button>
            {exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => setFilterExerciseId(filterExerciseId === ex.id ? null : ex.id)}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: filterExerciseId === ex.id ? 'var(--color-accent)' : 'var(--color-surface-overlay)',
                  color: filterExerciseId === ex.id ? '#000' : 'var(--color-text-secondary)',
                }}
              >
                {ex.name}
              </button>
            ))}
          </div>
        )}

        {/* Weekday headers */}
        <div className="px-4 grid grid-cols-7 gap-1 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div
              key={d}
              className="text-center text-xs font-medium py-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="px-4 grid grid-cols-7 gap-1">
          {/* Empty cells for start day offset */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1
            const dateStr = toDateStr(year, month, day)
            const status = dayStatus(dateStr)
            const isToday = dateStr === today
            const isFuture = dateStr > today
            const isSelected = selectedDay === dateStr

            let bg = 'transparent'
            let borderColor = 'transparent'
            if (status === 'done') bg = 'rgba(34,197,94,0.15)'
            if (status === 'partial') bg = 'rgba(245,158,11,0.15)'
            if (isToday) borderColor = 'var(--color-accent)'
            if (isSelected) borderColor = 'var(--color-text-secondary)'

            return (
              <button
                key={day}
                onClick={() => !isFuture && setSelectedDay(isSelected ? null : dateStr)}
                disabled={isFuture}
                className="aspect-square flex items-center justify-center rounded-lg text-sm font-medium"
                style={{
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  color: isFuture
                    ? 'var(--color-text-muted)'
                    : isToday
                    ? 'var(--color-accent-glow)'
                    : 'var(--color-text-primary)',
                  opacity: isFuture ? 0.3 : 1,
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-4 pt-3 flex gap-4">
          <LegendItem color="rgba(34,197,94,0.5)" label="Completed" />
          <LegendItem color="rgba(245,158,11,0.5)" label="Attempted" />
        </div>

        {/* Selected day detail panel */}
        {selectedDay && (
          <DayDetail
            date={selectedDay}
            logs={allLogsByDate[selectedDay] ?? []}
            exercises={exercises}
          />
        )}
      </div>
    </ScreenLayout>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded" style={{ background: color }} />
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
  )
}

function DayDetail({
  date,
  logs,
  exercises,
}: {
  date: string
  logs: WorkoutLog[]
  exercises: { id: string; name: string }[]
}) {
  const formatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const exerciseMap = Object.fromEntries(exercises.map(ex => [ex.id, ex.name]))

  // Sort logs: non-overrides first, then by attemptNumber
  const sorted = [...logs].sort((a, b) => {
    if (!!a.isOverride !== !!b.isOverride) return a.isOverride ? 1 : -1
    return a.attemptNumber - b.attemptNumber
  })

  return (
    <div
      className="mx-4 mt-4 rounded-xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {formatted}
      </p>

      {sorted.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No workouts on this day.</p>
      ) : (
        sorted.map(log => (
          <LogCard key={log.id} log={log} exerciseName={exerciseMap[log.exerciseId] ?? log.exerciseId} />
        ))
      )}
    </div>
  )
}

function LogCard({ log, exerciseName }: { log: WorkoutLog; exerciseName: string }) {
  const isOverride = !!log.isOverride

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1.5"
      style={{
        background: 'var(--color-surface-overlay)',
        border: '1px solid var(--color-border)',
        opacity: isOverride ? 0.6 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {exerciseName}
        </span>
        <div className="flex items-center gap-2">
          {isOverride && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(148,163,184,0.15)',
                color: 'var(--color-text-muted)',
                border: '1px solid rgba(148,163,184,0.2)',
              }}
            >
              Override
            </span>
          )}
          <span
            className="text-xs font-medium"
            style={{ color: log.completed ? 'var(--color-success)' : 'var(--color-warning)' }}
          >
            {log.completed ? '✓' : '✗'} Attempt {log.attemptNumber}
          </span>
        </div>
      </div>

      {/* Prescribed sets */}
      {log.prescribedSets.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs w-20 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
            Prescribed:
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {log.prescribedSets.join(' · ')}
          </span>
        </div>
      )}

      {/* Actual sets */}
      {log.actualSets.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs w-20 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
            Actual:
          </span>
          <div className="flex gap-1 flex-wrap">
            {log.actualSets.map((actual, i) => {
              const prescribed = log.prescribedSets[i] ?? 0
              const met = actual >= prescribed
              return (
                <span
                  key={i}
                  className="text-xs"
                  style={{ color: met ? 'var(--color-success)' : 'var(--color-warning)' }}
                >
                  {actual}{i < log.actualSets.length - 1 ? ' ·' : ''}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {log.notes && log.notes.trim() && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Notes: {log.notes}
        </p>
      )}
    </div>
  )
}
