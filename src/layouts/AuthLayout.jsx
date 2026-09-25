import { Outlet } from 'react-router-dom'
import Toast from '../components/Toast'

/**
 * AuthLayout — 认证页布局
 * 全屏居中，maxWidth 默认 max-w-md，可通过子路由自行覆盖（如 Login 使用 max-w-3xl）
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-medical-bg flex flex-col items-center justify-center px-4">
      {/* 页面卡片内容由子路由填充 */}
      <div className="w-full max-w-3xl">
        <Outlet />
      </div>

      {/* 底部版权信息 */}
      <p className="mt-10 text-xs text-medical-muted">
        © 2026 AIMS Medical Technology. All rights reserved.
      </p>

      {/* Toast 通知（auth 页面也需要） */}
      <Toast />
    </div>
  )
}
