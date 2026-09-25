/**
 * StepForm — 分步表单容器
 *
 * Props:
 *   steps       {Array}   步骤定义数组，每项 { label }
 *   currentStep {number}  当前步骤索引（0-based）
 *   onPrev      {func}    上一步回调
 *   onNext      {func}    下一步回调
 *   onSubmit    {func}    最后一步提交回调
 *   children    {node}    当前步骤内容
 *   submitting  {bool}    提交中状态
 */
export default function StepForm({
  steps = [],
  currentStep = 0,
  onPrev,
  onNext,
  onSubmit,
  children,
  submitting = false,
}) {
  const isFirst = currentStep === 0
  const isLast  = currentStep === steps.length - 1

  return (
    <div className="flex flex-col gap-6">
      {/* 步骤指示器 */}
      <div className="flex items-center">
        {steps.map((step, idx) => {
          const done    = idx < currentStep
          const active  = idx === currentStep
          const pending = idx > currentStep

          return (
            <div key={idx} className="flex items-center flex-1 last:flex-none">
              {/* 步骤圆点 */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                    done    && 'bg-medical-blue border-medical-blue text-white',
                    active  && 'bg-white border-medical-blue text-medical-blue',
                    pending && 'bg-white border-medical-border text-medical-muted',
                  ].filter(Boolean).join(' ')}
                >
                  {done ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={[
                    'text-xs mt-1.5 whitespace-nowrap',
                    active  ? 'text-medical-blue font-medium' : 'text-medical-muted',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* 连接线 */}
              {idx < steps.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 mx-2 mb-4 transition-colors',
                    done ? 'bg-medical-blue' : 'bg-medical-border',
                  ].join(' ')}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* 步骤内容 */}
      <div className="card p-6 min-h-48">
        {children}
      </div>

      {/* 底部导航按钮 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          className="btn-ghost disabled:opacity-30"
        >
          ← 上一步
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary px-8"
          >
            {submitting ? '提交中…' : '确认提交'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="btn-primary"
          >
            下一步 →
          </button>
        )}
      </div>
    </div>
  )
}
