import { isScoringEligible, REFERENCE_VERSION } from '../../constants/gradingReference'
/**
 * LearningProgressBar.jsx — 学习进度底部统计栏
 */
import { BookOpen, Target } from 'lucide-react'
import { GRADE_STYLES } from './DualStandardPanel'

export default function LearningProgressBar({ cases, learningRecord }) {
  const submittedCases = cases.filter(c => learningRecord[c.id]?.submitted)
  const completedCount = submittedCases.length
  const totalCount = cases.length

  const scoredCases = submittedCases.filter(c => isScoringEligible(c) && learningRecord[c.id].referenceVersion === REFERENCE_VERSION)
  const humanMatchCount = scoredCases.filter(
    c => learningRecord[c.id].userGrade === c.humanLabel.grade
  ).length
  const humanAccuracy = scoredCases.length > 0
    ? Math.round(humanMatchCount / scoredCases.length * 100)
    : 0

  const gradeAccuracy = [1, 2, 3, 4].reduce((acc, g) => {
    const gradeCases = scoredCases.filter(c => c.humanLabel.grade === g)
    const correct = gradeCases.filter(c => learningRecord[c.id].userGrade === g).length
    acc[g] = gradeCases.length > 0 ? Math.round(correct / gradeCases.length * 100) : null
    return acc
  }, {})

  return (
    <div className="flex-shrink-0 h-16 border-t border-gray-200 bg-white
                    flex items-center px-6 gap-8">

      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-700 font-medium">
          {completedCount}
          <span className="text-gray-400 font-normal"> / {totalCount} 已完成</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-600">
          人工一致率（可计分）：
          <span className="font-semibold text-blue-700 ml-1">{scoredCases.length ? `${humanAccuracy}%` : '—'}</span>
        </span>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {[1, 2, 3, 4].map(g => {
          const s = GRADE_STYLES[g]
          return (
            <div key={g} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-400">G{g}</span>
              <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${s.bar}`}
                  style={{ width: `${gradeAccuracy[g] ?? 0}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${s.text}`}>
                {gradeAccuracy[g] === null ? '—' : `${gradeAccuracy[g]}%`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
