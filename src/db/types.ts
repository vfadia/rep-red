export interface Exercise {
  id: string
  name: string
  setupNotes: string
  maxReps: number
  totalVolume: number
  currentDayPrescription: number[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  maxRepsHistory: { value: number; date: string }[]
}

export interface WorkoutLog {
  id: string
  date: string // YYYY-MM-DD
  exerciseId: string
  prescribedSets: number[]
  actualSets: number[]
  completed: boolean
  attemptNumber: number
  notes: string
  createdAt: string
  isOverride?: boolean
  overrideType?: 'force_advance' | 'volume_override' | 'max_reps_update'
}

export interface Routine {
  id: string
  name: string
  exerciseIds: string[]
  isDefault: boolean
}
