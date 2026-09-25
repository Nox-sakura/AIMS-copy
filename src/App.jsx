import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useAppContext } from './context/AppContext'

// 布局
import MainLayout  from './layouts/MainLayout'
import AuthLayout  from './layouts/AuthLayout'

// 认证页
import Login          from './pages/auth/Login'
import Register       from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// 主功能页
import Dashboard          from './pages/Dashboard'
import PatientList        from './pages/patients/PatientList'
import PatientDetail      from './pages/patients/PatientDetail'
import NewAssessment      from './pages/assessment/NewAssessment'
import AssessmentDetail   from './pages/assessment/AssessmentDetail'
import AssessmentCompare  from './pages/assessment/AssessmentCompare'
import Reports            from './pages/Reports'
import PatientPortal       from './pages/PatientPortal'
import Admin              from './pages/Admin'

// 医教智能体模块（懒加载）
const EducationLayout = lazy(() => import('./pages/Education/EducationLayout'))
const CaseAgent       = lazy(() => import('./pages/Education/CaseAgent'))
const TrainingGround  = lazy(() => import('./pages/Education/TrainingGround'))

// 教育模块权限守卫
function EducationGuard({ children }) {
  const { currentUser, showToast } = useAppContext()
  const hasAccess = !!currentUser?.permissions?.education_access

  useEffect(() => {
    if (!hasAccess) showToast('暂无教育模块权限', 'warning')
  }, [hasAccess]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasAccess) return <Navigate to="/dashboard" replace />
  return children
}

/**
 * App.jsx — 路由配置入口
 *
 * 权限路由守卫（ProtectedRoute）待第二阶段实现。
 * 当前所有路由均可直接访问，无需登录验证。
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── 认证路由（全屏卡片式布局）── */}
        <Route element={<AuthLayout />}>
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* ── 主应用路由（三栏式布局）── */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard"                    element={<Dashboard />} />

          <Route path="/patients"                     element={<PatientList />} />
          <Route path="/patients/:id"                 element={<PatientDetail />} />

          <Route path="/assessment/new"               element={<NewAssessment />} />
          <Route path="/assessment/:id"               element={<AssessmentDetail />} />
          <Route path="/assessment/:id/compare"       element={<AssessmentCompare />} />

          <Route path="/reports"                      element={<Reports />} />
          <Route path="/patient-portal" element={<PatientPortal />} />
          <Route path="/admin"                        element={<Admin />} />

          {/* 医教智能体模块路由 */}
          <Route path="/education" element={
            <EducationGuard>
              <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400">加载中...</div>}>
                <EducationLayout />
              </Suspense>
            </EducationGuard>
          }>
            <Route index element={<Navigate to="case-agent" replace />} />
            <Route path="case-agent" element={
              <Suspense fallback={null}><CaseAgent /></Suspense>
            } />
            <Route path="training" element={
              <Suspense fallback={null}><TrainingGround /></Suspense>
            } />
          </Route>
        </Route>

        {/* ── 默认重定向 ── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
