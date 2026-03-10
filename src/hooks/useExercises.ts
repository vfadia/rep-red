import { useState, useEffect } from 'react'
import { liveQuery } from 'dexie'
import { db } from '../db'
import type { Exercise } from '../db/types'

export function useActiveExercises(): Exercise[] {
  const [exercises, setExercises] = useState<Exercise[]>([])
  useEffect(() => {
    const sub = liveQuery(() =>
      db.exercises.orderBy('sortOrder').filter(e => e.isActive).toArray()
    ).subscribe({ next: setExercises, error: console.error })
    return () => sub.unsubscribe()
  }, [])
  return exercises
}

export function useAllExercises(): Exercise[] {
  const [exercises, setExercises] = useState<Exercise[]>([])
  useEffect(() => {
    const sub = liveQuery(() =>
      db.exercises.orderBy('sortOrder').toArray()
    ).subscribe({ next: setExercises, error: console.error })
    return () => sub.unsubscribe()
  }, [])
  return exercises
}

export async function addExercise(
  data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  await db.exercises.add({ ...data, id, createdAt: now, updatedAt: now })
  return id
}

export async function updateExercise(
  id: string,
  changes: Partial<Omit<Exercise, 'id' | 'createdAt'>>
): Promise<void> {
  await db.exercises.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id)
}
