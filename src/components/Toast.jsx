/**
 * Toast.jsx — 全局通知浮层
 * 固定在右上角（fixed top-4 right-4），消费 AppContext.toasts 队列。
 * 3秒后自动消失，也可点击 × 手动关闭。
 * type 支持：success（绿）/ warning（橙）/ error（红）
 */
import { useAppContext } from '../context/AppContext'
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react'

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    iconColor: 'text-green-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    iconColor: 'text-orange-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-500',
  },
}

export default function Toast() {
  const { toasts, dismissToast } = useAppContext()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map(toast => {
        const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.success
        const Icon = cfg.icon
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
              border min-w-[280px] max-w-sm
              ${cfg.bg} ${cfg.border} ${cfg.text}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.iconColor}`} />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
