import { describe, expect, it } from "vitest"

import {
  calculateFinalGrade,
  calculatePredicate,
  calculatePredicateRanges,
  calculateWeightedAssessmentGrade,
} from "./grade-calculation"

describe("calculateFinalGrade", () => {
  it("returns null when every CP score is empty", () => {
    expect(calculateFinalGrade([])).toBeNull()
  })

  it("keeps valid boundary scores", () => {
    expect(calculateFinalGrade([0])).toBe(0)
    expect(calculateFinalGrade([100])).toBe(100)
  })

  it("calculates the average of all entered CP scores", () => {
    expect(calculateFinalGrade([70, 80, 90])).toBe(80)
    expect(calculateFinalGrade([76, 77])).toBe(76.5)
  })

  it("rejects invalid scores", () => {
    expect(() => calculateFinalGrade([-1])).toThrow("0 sampai 100")
    expect(() => calculateFinalGrade([101])).toThrow("0 sampai 100")
    expect(() => calculateFinalGrade([Number.NaN])).toThrow("0 sampai 100")
  })
})

describe("calculateWeightedAssessmentGrade", () => {
  it("uses 40 percent formative and 60 percent equally averaged PTS/PAS", () => {
    expect(calculateWeightedAssessmentGrade([70, 80], [80], [90])).toBe(81)
  })

  it("waits until formative, PTS, and PAS are all available", () => {
    expect(calculateWeightedAssessmentGrade([], [80], [90])).toBeNull()
    expect(calculateWeightedAssessmentGrade([80], [], [90])).toBeNull()
    expect(calculateWeightedAssessmentGrade([80], [90], [])).toBeNull()
  })

  it("validates every assessment score", () => {
    expect(() => calculateWeightedAssessmentGrade([101], [80], [90])).toThrow(
      "0 sampai 100",
    )
  })
})

describe("calculatePredicateRanges", () => {
  it.each([
    [
      60,
      [
        ["A", 88, 100],
        ["B", 74, 87],
        ["C", 60, 73],
        ["D", 0, 59],
      ],
    ],
    [
      65,
      [
        ["A", 89, 100],
        ["B", 77, 88],
        ["C", 65, 76],
        ["D", 0, 64],
      ],
    ],
    [
      70,
      [
        ["A", 90, 100],
        ["B", 80, 89],
        ["C", 70, 79],
        ["D", 0, 69],
      ],
    ],
  ])("matches the approved example when KKM is %i", (kkm, expected) => {
    expect(
      calculatePredicateRanges(kkm as number).map(
        ({ predicate, minimum, maximum }) => [predicate, minimum, maximum],
      ),
    ).toEqual(expected)
  })

  it("supports any valid KKM without fixed thresholds", () => {
    expect(calculatePredicateRanges(75)).toEqual([
      { predicate: "A", label: "Sangat Baik", minimum: 93, maximum: 100 },
      { predicate: "B", label: "Baik", minimum: 84, maximum: 92 },
      { predicate: "C", label: "Cukup", minimum: 75, maximum: 83 },
      { predicate: "D", label: "Kurang", minimum: 0, maximum: 74 },
    ])
  })

  it("rejects invalid KKM", () => {
    expect(() => calculatePredicateRanges(0)).toThrow("1 sampai 100")
    expect(() => calculatePredicateRanges(101)).toThrow("1 sampai 100")
    expect(() => calculatePredicateRanges(75.5)).toThrow("bilangan bulat")
  })
})

describe("calculatePredicate", () => {
  it("returns the correct predicate at every KKM 65 boundary", () => {
    expect(calculatePredicate(100, 65)).toBe("A")
    expect(calculatePredicate(89, 65)).toBe("A")
    expect(calculatePredicate(88, 65)).toBe("B")
    expect(calculatePredicate(77, 65)).toBe("B")
    expect(calculatePredicate(76, 65)).toBe("C")
    expect(calculatePredicate(65, 65)).toBe("C")
    expect(calculatePredicate(64, 65)).toBe("D")
    expect(calculatePredicate(0, 65)).toBe("D")
  })
})
