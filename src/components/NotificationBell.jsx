import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { notifications as initialNotifications } from '../mock/notifications'

/**
 * NotificationBell — 顶部消息提醒图标
 * 点击展开通知下拉面板，显示 mock 消息列表。
 * 支持：点击通知跳转路由、逐条标记已读、全部已读、动态角标。
 */
export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // 子任务D：通知列表改为 state 管理
  const [notifications, setNotifications] = useState(initialNotifications)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      {/* 铃铛按钮 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 rounded-md text-medical-muted hover:bg-medical-bg hover:text-medical-blue transition-colors"
        title="消息通知"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* 未读角标（动态计算，为0时隐藏） */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-medical-red rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* 下拉面板 */}
      {open && (
        <>
          {/* 点击外部关闭 */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-medical-border shadow-lg z-20 overflow-hidden">
            {/* 面板头：子任务E - "全部已读"按钮 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-medical-border">
              <span className="text-sm font-semibold text-medical-text">消息通知</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-medical-blue hover:underline transition-colors"
                >
                  全部已读
                </button>
              )}
            </div>

            {/* 通知列表 */}
            <ul className="divide-y divide-medical-border max-h-72 overflow-y-auto">
              {notifications.map(n => (
                <li
                  key={n.id}
                  className={!n.read ? 'bg-medical-blue-light/40' : ''}
                >
                  <div className="flex items-start gap-2 px-4 py-3">
                    {/* 类型图标 */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.type === 'warning' ? 'bg-orange-100' :
                      n.type === 'error'   ? 'bg-red-100'    :
                      n.type === 'success' ? 'bg-green-100'  : 'bg-blue-100'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        n.type === 'warning' ? 'text-medical-orange' :
                        n.type === 'error'   ? 'text-medical-red'    :
                        n.type === 'success' ? 'text-medical-green'  : 'text-medical-blue'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    {/* 中间：通知内容（可点击跳转） */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        navigate(n.path ?? '/dashboard')
                        setOpen(false)
                      }}
                    >
                      <p className={`text-sm leading-snug ${
                        n.read ? 'text-medical-muted' : 'text-medical-text'
                      }`}>
                        {n.message}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        n.read ? 'text-medical-muted/60' : 'text-medical-muted'
                      }`}>
                        {n.time}
                      </p>
                    </div>

                    {/* 右侧：已读按钮（未读时）或已读占位（已读时） */}
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(n.id)
                        }}
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-medical-muted hover:text-medical-green hover:bg-green-50 transition-colors mt-0.5"
                        title="标记为已读"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {n.read && (
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                        <Check className="w-3.5 h-3.5 text-medical-muted/30" />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* 子任务F：全部已读时的底部提示 */}
            {unreadCount === 0 && (
              <div className="px-4 py-3 text-center border-t border-medical-border">
                <p className="text-xs text-medical-muted">暂无未读通知</p>
              </div>
            )}

            {/* 底部入口 */}
            <div className="px-4 py-2 border-t border-medical-border text-center">
              <span className="text-xs text-medical-blue cursor-pointer hover:underline">
                查看全部消息
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
