export function getInitialDistribution(maxReps: number): number[] {
  const total = maxReps * 2
  const base = Math.floor(total / 5)
  const remainder = total % 5
  const sets = [base, base, base, base, base]
  for (let i = 0; i < remainder; i++) sets[i]++
  return sets
}

export function advanceDay(currentSets: number[]): number[] {
  const sets = [...currentSets]

  // Step 1: find last non-zero set and subtract 1
  let lastNonZero = -1
  for (let i = 4; i >= 0; i--) {
    if (sets[i] > 0) { lastNonZero = i; break }
  }
  if (lastNonZero <= 0) return sets  // all volume in set 1, nothing to redistribute

  sets[lastNonZero]--

  // Step 2: find first drop among sets[1..lastNonZero-1]; default to index 0
  // NOTE: loop must stop at lastNonZero-1 (not 4) — otherwise the just-decremented
  // set gets identified as a "drop" and the decrement is immediately undone.
  let targetIndex = 0
  for (let i = 1; i < lastNonZero; i++) {
    if (sets[i] > 0 && sets[i] < sets[i - 1]) { targetIndex = i; break }
  }

  sets[targetIndex]++
  return sets
}

export function isComplete(sets: number[], maxReps: number): boolean {
  return sets[0] >= maxReps * 2
}
