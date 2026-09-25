/**
 * PatientPortalLayout.jsx — 双视角容器
 *
 * 顶部 Tab 切换：
 *   [医生管理视角]  →  /patient-portal/doctor
 *   [患者视角预览]  →  /patient-portal/patient
 *
 * 使用 NavLink 驱动路由，<Outlet /> 渲染子路由内容。
 */
import { NavLink, Outlet } from 'react-router-dom'

export default function PatientPortalLayout() {
  const tabBase = 'px-4 py-2.5 text-sm transition-colors border-b-2'
  const tabActive = `${tabBase} border-medical-blue text-medical-blue font-medium`
  const tabInactive = `${tabBase} border-transparent text-medical-muted hover:text-medical-text`

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 56px)' }}>
      {/* 页面标题 + Tab 导航 */}
      <div className="flex-shrink-0 border-b border-medical-border bg-white">
        <div className="px-6 pt-4 pb-0">
          <h1 className="text-base font-semibold text-medical-text mb-3">💊 患者助手管理</h1>
          <div className="flex gap-0">
            <NavLink
              to="doctor"
              className={({ isActive }) => isActive ? tabActive : tabInactive}
            >
              医生管理视角
            </NavLink>
            <NavLink
              to="patient"
              className={({ isActive }) => isActive ? tabActive : tabInactive}
            >
              患者视角预览
            </NavLink>
          </div>
        </div>
      </div>

      {/* 子路由内容 */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
