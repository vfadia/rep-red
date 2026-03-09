import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, WorkoutLog, Routine } from './types'

const db = new Dexie('rep-red') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  workoutLogs: EntityTable<WorkoutLog, 'id'>
  routines: EntityTable<Routine, 'id'>
}

db.version(1).stores({
  exercises:   'id, isActive, sortOrder',
  workoutLogs: 'id, date, exerciseId, [date+exerciseId]',
  routines:    'id, isDefault',
})

db.version(2).stores({
  exercises:   'id, isActive, sortOrder',
  workoutLogs: 'id, date, exerciseId, [date+exerciseId]',
  routines:    'id, isDefault',
}).upgrade(tx =>
  tx.table('exercises').toCollection().modify((ex: Record<string, unknown>) => {
    if (!ex.maxRepsHistory) ex.maxRepsHistory = []
  })
)

export default db
