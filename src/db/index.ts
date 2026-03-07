import db from './schema'
import type { Routine } from './types'

export { db }

export async function seedDatabase(): Promise<void> {
  const count = await db.routines.count()
  if (count === 0) {
    const routine: Routine = {
      id: crypto.randomUUID(),
      name: 'Daily Calisthenics',
      exerciseIds: [],
      isDefault: true,
    }
    await db.routines.add(routine)
  }
}
