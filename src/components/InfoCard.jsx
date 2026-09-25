/**
 * InfoCard — 通用信息卡片容器
 *
 * Props:
 *   title    {string}  卡片标题（可选）
 *   actions  {node}    标题右侧操作区（可选）
 *   padding  {bool}    是否内置 padding，默认 true
 *   className {string} 额外 class
 *   children {node}   内容
 */
export default function InfoCard({
  title,
  actions,
  padding = true,
  className = '',
  children,
}) {
  return (
    <div className={`card ${className}`}>
      {/* 卡片头部 */}
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-medical-border">
          {title && (
            <h3 className="text-sm font-semibold text-medical-text">{title}</h3>
          )}
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      {/* 内容区 */}
      <div className={padding ? 'p-4' : ''}>
        {children}
      </div>
    </div>
  )
}
