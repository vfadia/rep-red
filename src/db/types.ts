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
}

export interface Routine {
  id: string
  name: string
  exerciseIds: string[]
  isDefault: boolean
}
