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

export default db
