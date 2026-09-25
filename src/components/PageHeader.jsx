import { Link } from 'react-router-dom'

/**
 * PageHeader — 页面标题 + 面包屑导航
 *
 * Props:
 *   title       {string}  页面主标题（必填）
 *   breadcrumbs {Array}   面包屑数组，每项 { label, path }，最后一项不传 path
 *   actions     {node}    右侧操作区（按钮等，可选）
 */
export default function PageHeader({ title, breadcrumbs = [], actions }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-medical-border bg-white">
      {/* 面包屑 */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-medical-muted mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  className="hover:text-medical-blue transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-medical-text">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* 标题行 */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-medical-text">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
