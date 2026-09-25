/**
 * MainLayout.jsx — 主应用三栏布局
 *
 * 结构：
 *   ┌──────────────────────────────────────────┐
 *   │  Header（顶部：Logo / 当前页名 / 用户信息）│
 *   ├──────────┬───────────────────────────────┤
 *   │ Sidebar  │  <Outlet />（子页面内容）       │
 *   │ 导航栏   │                               │
 *   └──────────┴───────────────────────────────┘
 *
 * 导航栏支持折叠（宽 240px ↔ 64px），用户信息来自 AppContext.currentUser。
 * 管理控制台导航项会在 role=admin 且有待审核用户时显示红色数字角标。
 * 第三阶段：导航图标改为 lucide-react，选中状态改为实色蓝背景+白色文字。
 */
import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  FileText,
  MessageCircle,
  Settings,
  Menu,
  Bot,
  GraduationCap,
} from 'lucide-react'
import AgentPanel from '../components/agent/AgentPanel'
import NotificationBell from '../components/NotificationBell'
import Toast from '../components/Toast'
import { useAppContext } from '../context/AppContext'
import { users } from '../mock/users'

const pendingCount = users.filter(u => u.status === 'pending').length

/* ── 导航菜单定义 ── */
const NAV_ITEMS = [
  { key: 'dashboard',     label: '工作台',    path: '/dashboard',      Icon: LayoutDashboard },
  { key: 'patients',      label: '患者管理',  path: '/patients',       Icon: Users           },
  { key: 'assessment',    label: '新建评估',  path: '/assessment/new', Icon: PlusCircle      },
  { key: 'reports',       label: '报告管理',  path: '/reports',        Icon: FileText        },
  { key: 'education',     label: '医教智能体',  path: '/education',      Icon: GraduationCap, requiredPermission: 'education_access' },
  { key: 'patient-portal',label: '患者助手',  path: '/patient-portal', Icon: MessageCircle   },
  { key: 'admin',         label: '管理控制台',path: '/admin',          Icon: Settings        },
]

const ROLE_LABEL = {
  embryologist: '胚胎学家',
  senior:       '主任医师',
  admin:        '管理员',
}

/* ── 顶部 Header ── */
function Header({ collapsed, onToggle }) {
  const location = useLocation()
  const { currentUser } = useAppContext()
  const current = NAV_ITEMS.find(item =>
    location.pathname.startsWith('/' + item.key) ||
    location.pathname === item.path
  )

  return (
    <header className="h-14 bg-white border-b border-medical-border flex items-center px-4 gap-4 flex-shrink-0 z-10">
      <button
        onClick={onToggle}
        className="p-1.5 rounded-md text-medical-muted hover:bg-medical-bg hover:text-medical-blue transition-colors"
        title={collapsed ? '展开导航' : '收起导航'}
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-medical-blue flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <span className="text-medical-blue font-semibold text-sm tracking-wide hidden sm:block">
          AIMS
        </span>
      </div>

      {current && (
        <div className="flex items-center gap-1.5 text-sm text-medical-muted border-l border-medical-border pl-4">
          <span className="text-medical-text font-medium">{current.label}</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <div className="w-px h-5 bg-medical-border" />
        <div className="flex items-center gap-2 cursor-pointer hover:bg-medical-bg rounded-md px-2 py-1 transition-colors">
          <div className="w-7 h-7 rounded-full bg-medical-blue-light flex items-center justify-center">
            <span className="text-medical-blue text-xs font-semibold">
              {currentUser?.avatar ?? '?'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-medical-text leading-none">
              {currentUser?.name ?? '未登录'}
            </p>
            <p className="text-xs text-medical-muted mt-0.5">
              {currentUser?.title ?? ROLE_LABEL[currentUser?.role] ?? currentUser?.role}
            </p>
          </div>
          <svg className="w-4 h-4 text-medical-muted hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </header>
  )
}

/* ── 左侧导航栏 ── */
function Sidebar({ collapsed }) {
  const location = useLocation()
  const { currentUser } = useAppContext()

  return (
    <aside
      className="bg-white border-r border-medical-border flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden"
      style={{ width: collapsed ? 64 : 240 }}
    >
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.filter(item =>
            !item.requiredPermission ||
            currentUser?.permissions?.[item.requiredPermission]
          ).map(item => {
            const isActive =
              item.key === 'assessment'
                ? location.pathname.startsWith('/assessment')
                : location.pathname.startsWith(item.path)

            const { Icon } = item

            return (
              <li key={item.key}>
                <NavLink
                  to={item.path}
                  className={() =>
                    [
                      'flex items-center gap-3 px-2 py-2.5 rounded-md text-sm transition-colors duration-150',
                      isActive
                        ? 'bg-medical-blue text-white font-medium'
                        : 'text-medical-muted hover:bg-medical-blue-light hover:text-medical-blue',
                    ].join(' ')
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {/* 图标 + 可选角标 */}
                  <span className={`flex-shrink-0 relative ${collapsed ? 'mx-auto' : ''}`}>
                    <Icon size={20} strokeWidth={1.8} />
                    {/* 管理员角标：待审核用户数 */}
                    {item.key === 'admin' && currentUser?.role === 'admin' && pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-medical-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <span className="ml-auto w-1 h-4 rounded-full bg-white/60" />
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 底部新建评估快捷按钮 */}
      <div className="p-3 border-t border-medical-border">
        <NavLink
          to="/assessment/new"
          className="flex items-center justify-center gap-2 w-full bg-medical-blue text-white rounded-md py-2 text-sm font-medium hover:bg-medical-blue-dark transition-colors"
          title={collapsed ? '新建评估' : undefined}
        >
          <PlusCircle size={16} className="flex-shrink-0" />
          {!collapsed && <span>新建评估</span>}
        </NavLink>
      </div>
    </aside>
  )
}

/* ── 主布局容器 ── */
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { agentOpen, setAgentOpen } = useAppContext()

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1 overflow-y-auto bg-medical-bg">
          <Outlet />
        </main>
      </div>
      <Toast />

      {/* 悬浮触发按钮 */}
      <button
        onClick={() => setAgentOpen(true)}
        title="临床智能助手"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-medical-blue text-white shadow-lg flex items-center justify-center hover:bg-medical-blue-dark transition-colors"
      >
        <Bot className="w-5 h-5" />
      </button>

      {/* 面板覆盖层（始终 mounted，AgentPanel 内部控制 translate） */}
      <div className="fixed inset-y-0 right-0 z-50 w-[420px] pointer-events-none">
        <div className={`h-full ${agentOpen ? 'pointer-events-auto shadow-2xl' : 'pointer-events-none'}`}>
          <AgentPanel />
        </div>
      </div>
    </div>
  )
}
