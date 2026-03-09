import { useState, useEffect } from 'react'
import { liveQuery } from 'dexie'
import { db } from '../db'
import type { WorkoutLog } from '../db/types'

export function useWorkoutLogsForDate(date: string): WorkoutLog[] {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  useEffect(() => {
    const sub = liveQuery(() =>
      db.workoutLogs.where('date').equals(date).toArray()
    ).subscribe({ next: setLogs, error: console.error })
    return () => sub.unsubscribe()
  }, [date])
  return logs
}

export function useWorkoutLogsForExercise(exerciseId: string): WorkoutLog[] {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  useEffect(() => {
    const sub = liveQuery(() =>
      db.workoutLogs.where('exerciseId').equals(exerciseId).toArray()
    ).subscribe({ next: setLogs, error: console.error })
    return () => sub.unsubscribe()
  }, [exerciseId])
  return logs
}

export async function addWorkoutLog(
  data: Omit<WorkoutLog, 'id' | 'createdAt'>
): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  await db.workoutLogs.add({ ...data, id, createdAt })
  return id
}

export async function getLogsForExerciseOnDate(
  exerciseId: string,
  date: string
): Promise<WorkoutLog[]> {
  return db.workoutLogs.where('[date+exerciseId]').equals([date, exerciseId]).toArray()
}

export async function getLatestLogForExercise(
  exerciseId: string
): Promise<WorkoutLog | undefined> {
  return db.workoutLogs
    .where('exerciseId')
    .equals(exerciseId)
    .sortBy('createdAt')
    .then(logs => logs.at(-1))
}

export function useWorkoutLogsForDateRange(startDate: string, endDate: string): WorkoutLog[] {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  useEffect(() => {
    const sub = liveQuery(() =>
      db.workoutLogs.where('date').between(startDate, endDate, true, true).toArray()
    ).subscribe({ next: setLogs, error: console.error })
    return () => sub.unsubscribe()
  }, [startDate, endDate])
  return logs
}
