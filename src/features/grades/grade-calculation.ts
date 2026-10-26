export type GradePredicate = "A" | "B" | "C" | "D"

export type PredicateRange = Readonly<{
  predicate: GradePredicate
  label: string
  minimum: number
  maximum: number
}>

export class GradeCalculationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GradeCalculationError"
  }
}

function validateScore(score: number, label: string) {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new GradeCalculationError(`${label} harus berupa angka 0 sampai 100.`)
  }
}

export function calculateFinalGrade(scores: ReadonlyArray<number>) {
  if (scores.length === 0) return null
  scores.forEach((score) => validateScore(score, "Nilai"))
  const average =
    scores.reduce((total, score) => total + score, 0) / scores.length
  return Math.round(average * 100) / 100
}

export function calculateWeightedAssessmentGrade(
  formativeScores: ReadonlyArray<number>,
  midtermScores: ReadonlyArray<number>,
  finalScores: ReadonlyArray<number>,
) {
  if (
    formativeScores.length === 0 ||
    midtermScores.length === 0 ||
    finalScores.length === 0
  ) {
    return null
  }

  const formativeAverage = calculateFinalGrade(formativeScores)
  const summativeAverage = calculateFinalGrade([
    calculateFinalGrade(midtermScores) as number,
    calculateFinalGrade(finalScores) as number,
  ])

  return (
    Math.round(
      ((formativeAverage as number) * 0.4 +
        (summativeAverage as number) * 0.6) *
        100,
    ) / 100
  )
}

export function calculatePredicateRanges(
  kkm: number,
): ReadonlyArray<PredicateRange> {
  if (!Number.isInteger(kkm) || kkm < 1 || kkm > 100) {
    throw new GradeCalculationError(
      "KKM harus berupa bilangan bulat 1 sampai 100.",
    )
  }

  if (kkm === 100) {
    return [
      { predicate: "A", label: "Sangat Baik", minimum: 100, maximum: 100 },
      { predicate: "D", label: "Kurang", minimum: 0, maximum: 99 },
    ]
  }

  const intervalLength = Math.ceil((100 - kkm) / 3)
  const cMaximum = Math.min(100, kkm + intervalLength - 1)
  const bMaximum = Math.min(100, cMaximum + intervalLength)

  const ranges: ReadonlyArray<PredicateRange> = [
    {
      predicate: "A",
      label: "Sangat Baik",
      minimum: bMaximum + 1,
      maximum: 100,
    },
    { predicate: "B", label: "Baik", minimum: cMaximum + 1, maximum: bMaximum },
    { predicate: "C", label: "Cukup", minimum: kkm, maximum: cMaximum },
    { predicate: "D", label: "Kurang", minimum: 0, maximum: kkm - 1 },
  ]

  return ranges.filter((range) => range.minimum <= range.maximum)
}

export function calculatePredicate(score: number, kkm: number): GradePredicate {
  validateScore(score, "Nilai akhir")
  const range = calculatePredicateRanges(kkm).find(
    (candidate) => score >= candidate.minimum && score <= candidate.maximum,
  )
  if (!range)
    throw new GradeCalculationError("Predikat nilai belum dapat ditentukan.")
  return range.predicate
}
