/**
 * TrainingCaseCard.jsx — 训练案例列表卡片
 */
import { Microscope, CheckCircle2, Circle } from 'lucide-react'

function DifficultyBadge({ difficulty }) {
  const styles = {
    easy:   'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard:   'bg-red-100 text-red-700',
  }
  const labels = { easy: '简单', medium: '中等', hard: '困难' }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${styles[difficulty]}`}>
      {labels[difficulty]}
    </span>
  )
}

export default function TrainingCaseCard({ caseData, isSelected, isCompleted, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer
                  transition-all duration-150
                  ${isSelected
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}
                  ${isCompleted ? 'opacity-75' : ''}`}
    >
      {/* 选中态：左侧色竖线 */}
      {isSelected && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r" />
      )}

      {/* 缩略图（真实图像 + 兜底图标） */}
      <div className="w-14 h-10 rounded-lg bg-gray-100 flex-shrink-0
                      border border-gray-200 overflow-hidden relative">
        {caseData.imageUrl ? (
          <img
            src={caseData.imageUrl}
            alt={caseData.id}
            className="w-full h-full object-cover"
            onError={e => {
              e.currentTarget.style.display = 'none'
              const fallback = e.currentTarget.parentElement.querySelector('.thumb-fallback')
              if (fallback) fallback.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="thumb-fallback absolute inset-0 items-center justify-center"
          style={{ display: caseData.imageUrl ? 'none' : 'flex' }}
        >
          <Microscope className="w-5 h-5 text-gray-300" />
        </div>
      </div>

      {/* 信息区 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800">{caseData.id}</span>
          {isCompleted
            ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <DifficultyBadge difficulty={caseData.difficulty} />
          <span className="text-xs text-gray-400">脱敏训练数据</span>
        </div>
      </div>
    </div>
  )
}
