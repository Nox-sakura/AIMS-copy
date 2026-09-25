/**
 * ConceptScoreRow — 概念评分单行
 * 正向指标绿色标注，负向指标红色标注。
 *
 * Props:
 *   name        {string}  概念名称
 *   score       {number}  得分（0–100）
 *   direction   {'pos'|'neg'}  正向/负向
 *   weight      {number}  权重（0–1，可选）
 *   description {string}  补充说明（可选）
 */
export default function ConceptScoreRow({ name, score, direction = 'pos', weight, description }) {
  const isPos = direction === 'pos'
  const isHigh = score >= 70

  // 颜色逻辑：正向高分=绿，正向低分=橙；负向高分=红，负向低分=灰
  const scoreColor = isPos
    ? (isHigh ? 'text-medical-green' : 'text-medical-orange')
    : (isHigh ? 'text-medical-red'   : 'text-medical-muted')

  const barColor = isPos
    ? (isHigh ? 'bg-medical-green' : 'bg-medical-orange')
    : (isHigh ? 'bg-medical-red'   : 'bg-gray-300')

  return (
    <div className="flex items-center gap-3 py-2 border-b border-medical-border last:border-0">
      {/* 概念名称 */}
      <div className="w-36 flex-shrink-0">
        <span className="text-sm text-medical-text">{name}</span>
        {description && (
          <p className="text-xs text-medical-muted mt-0.5 leading-tight">{description}</p>
        )}
      </div>

      {/* 进度条 */}
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* 分值 */}
      <div className="w-12 text-right flex-shrink-0">
        <span className={`text-sm font-semibold ${scoreColor}`}>{score}</span>
      </div>

      {/* 方向标签 */}
      <div className="w-10 flex-shrink-0">
        <span
          className={[
            'text-xs px-1.5 py-0.5 rounded',
            isPos ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
          ].join(' ')}
        >
          {isPos ? '正向' : '负向'}
        </span>
      </div>

      {/* 权重（可选） */}
      {weight !== undefined && (
        <div className="w-12 text-right flex-shrink-0">
          <span className="text-xs text-medical-muted">{(weight * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  )
}
