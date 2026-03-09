import { describe, it, expect } from 'vitest'
import { getInitialDistribution, advanceDay, isComplete } from './repRedistribution'

describe('getInitialDistribution', () => {
  it('distributes evenly when total divides by 5', () => {
    expect(getInitialDistribution(5)).toEqual([2, 2, 2, 2, 2])  // total=10
  })
  it('puts remainder in early sets (remainder 2)', () => {
    expect(getInitialDistribution(6)).toEqual([3, 3, 2, 2, 2])  // total=12
  })
  it('puts remainder in early sets (remainder 4)', () => {
    expect(getInitialDistribution(7)).toEqual([3, 3, 3, 3, 2])  // total=14
  })
  it('puts remainder in early sets (remainder 3)', () => {
    expect(getInitialDistribution(4)).toEqual([2, 2, 2, 1, 1])  // total=8
  })
  it('works for max=1', () => {
    expect(getInitialDistribution(1)).toEqual([1, 1, 0, 0, 0])  // total=2, base=0, rem=2
  })
})

describe('advanceDay — max=5 worked examples (PRD Days 1–10)', () => {
  const cases: [number[], number[]][] = [
    [[2, 2, 2, 2, 2], [3, 2, 2, 2, 1]],  // Day 1 → 2
    [[3, 2, 2, 2, 1], [3, 3, 2, 2, 0]],  // Day 2 → 3
    [[3, 3, 2, 2, 0], [3, 3, 3, 1, 0]],  // Day 3 → 4
    [[3, 3, 3, 1, 0], [4, 3, 3, 0, 0]],  // Day 4 → 5
    [[4, 3, 3, 0, 0], [4, 4, 2, 0, 0]],  // Day 5 → 6
    [[4, 4, 2, 0, 0], [5, 4, 1, 0, 0]],  // Day 6 → 7
    [[5, 4, 1, 0, 0], [5, 5, 0, 0, 0]],  // Day 7 → 8
    [[5, 5, 0, 0, 0], [6, 4, 0, 0, 0]],  // Day 8 → 9
    [[6, 4, 0, 0, 0], [7, 3, 0, 0, 0]],  // Day 9 → 10
  ]
  cases.forEach(([input, expected], idx) => {
    it(`Day ${idx + 1} → ${idx + 2}: ${JSON.stringify(input)} → ${JSON.stringify(expected)}`, () => {
      expect(advanceDay(input)).toEqual(expected)
    })
  })

  it('does not mutate the input array', () => {
    const input = [2, 2, 2, 2, 2]
    advanceDay(input)
    expect(input).toEqual([2, 2, 2, 2, 2])
  })

  it('returns unchanged when all volume is in set 1', () => {
    expect(advanceDay([10, 0, 0, 0, 0])).toEqual([10, 0, 0, 0, 0])
  })
})

describe('isComplete', () => {
  it('returns true when set[0] equals maxReps * 2', () => {
    expect(isComplete([10, 0, 0, 0, 0], 5)).toBe(true)
  })
  it('returns true when set[0] exceeds maxReps * 2', () => {
    expect(isComplete([11, 0, 0, 0, 0], 5)).toBe(true)
  })
  it('returns false when volume is not yet consolidated', () => {
    expect(isComplete([7, 3, 0, 0, 0], 5)).toBe(false)  // Day 10 — not done
    expect(isComplete([9, 1, 0, 0, 0], 5)).toBe(false)
    expect(isComplete([2, 2, 2, 2, 2], 5)).toBe(false)  // Day 1
  })
})
