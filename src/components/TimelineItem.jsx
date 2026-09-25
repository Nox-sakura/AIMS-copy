import StatusBadge from './StatusBadge'

/**
 * TimelineItem — 历史时间线单条记录
 *
 * Props:
 *   date        {string}  日期文字
 *   embryoNo    {string}  胚胎编号
 *   grade       {string}  评级 type，传给 StatusBadge（如 'grade1'）
 *   doctor      {string}  操作医师
 *   status      {string}  状态 type，传给 StatusBadge
 *   isLast      {bool}    是否最后一条（控制连接线）
 *   onView      {func}    查看报告回调
 */
export default function TimelineItem({
  date,
  embryoNo,
  grade,
  doctor,
  status,
  isLast = false,
  onView,
}) {
  return (
    <div className="flex gap-4">
      {/* 时间轴线 */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-3 h-3 rounded-full bg-medical-blue border-2 border-white ring-2 ring-medical-blue mt-1" />
        {!isLast && <div className="w-0.5 bg-medical-border flex-1 mt-1 mb-0" />}
      </div>

      {/* 内容卡片 */}
      <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
        <div className="card p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-3">
            {/* 左侧信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-medical-text">
                  胚胎 {embryoNo}
                </span>
                {grade && <StatusBadge type={grade} size="sm" />}
                {status && <StatusBadge type={status} size="sm" />}
              </div>

              <div className="mt-1.5 flex items-center gap-3 text-xs text-medical-muted">
                {/* 日期 */}
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {date}
                </span>

                {/* 医师（医疗合规字段） */}
                {doctor && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {doctor}
                  </span>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <button
              onClick={onView}
              className="flex-shrink-0 text-xs text-medical-blue hover:underline"
            >
              查看报告
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
