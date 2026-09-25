/**
 * EmptyState — 空状态占位
 * 无数据时展示的友好提示。
 *
 * Props:
 *   icon     {node}    自定义图标（可选，不传显示默认图标）
 *   title    {string}  标题文字
 *   desc     {string}  描述文字（可选）
 *   action   {node}    操作按钮（可选）
 */
export default function EmptyState({ icon, title = '暂无数据', desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* 图标区 */}
      <div className="w-16 h-16 rounded-full bg-medical-bg flex items-center justify-center mb-4">
        {icon ?? (
          <svg className="w-8 h-8 text-medical-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        )}
      </div>

      <p className="text-sm font-medium text-medical-text">{title}</p>

      {desc && (
        <p className="text-sm text-medical-muted mt-1 max-w-xs leading-relaxed">{desc}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
