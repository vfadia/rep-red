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

  // Map date -> logs (real only, no overrides)
  const logsByDate = useMemo(() => {
    const map: Record<string, WorkoutLog[]> = {}
    for (const log of monthLogs) {
      if (log.isOverride) continue
      if (!map[log.date]) map[log.date] = []
      map[log.date].push(log)
    }
    return map
  }, [monthLogs])

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
            logs={logsByDate[selectedDay] ?? []}
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

  // Group logs by exerciseId, pick best attempt (prefer completed)
  const byExercise: Record<string, WorkoutLog[]> = {}
  for (const log of logs) {
    if (!byExercise[log.exerciseId]) byExercise[log.exerciseId] = []
    byExercise[log.exerciseId].push(log)
  }

  const loggedExerciseIds = new Set(Object.keys(byExercise))
  const relevantExercises = exercises.filter(ex => loggedExerciseIds.has(ex.id))

  if (relevantExercises.length === 0) {
    return (
      <div
        className="mx-4 mt-4 rounded-xl p-4"
        style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {formatted}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No workouts logged.</p>
      </div>
    )
  }

  return (
    <div
      className="mx-4 mt-4 rounded-xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {formatted}
      </p>
      <div className="flex flex-wrap gap-2">
        {relevantExercises.map(ex => {
          const exLogs = byExercise[ex.id] ?? []
          const completed = exLogs.some(l => l.completed)
          return (
            <span
              key={ex.id}
              className="text-sm px-2 py-0.5 rounded-lg"
              style={{
                background: completed ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                color: completed ? 'var(--color-success)' : 'var(--color-warning)',
                border: `1px solid ${completed ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
              }}
            >
              {ex.name} {completed ? '✓' : '✗'}
            </span>
          )
        })}
      </div>
    </div>
  )
}
