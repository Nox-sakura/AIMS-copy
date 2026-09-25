/**
 * StatusBadge — 状态/评级徽章（含图标前缀）
 *
 * Props:
 *   type  {string}   徽章类型，见下方 CONFIG
 *   label {string}   自定义文字（可选，不传则使用默认文字）
 *   size  {'sm'|'md'} 尺寸，默认 'md'
 *
 * 支持的 type：
 *   评级：  'grade1' | 'grade2' | 'grade3' | 'grade4'
 *   状态：  'pending' | 'approved' | 'rejected' | 'reviewing' | 'processing'
 */

import {
  Clock,
  BadgeCheck,
  XCircle,
  RefreshCw,
  Loader,
} from 'lucide-react'

const CONFIG = {
  // ── 胚胎评级（原有等级配色）──────────────────────────────
  grade1: {
    label:    '一级胚胎',
    color:    '',
    styleObj: { backgroundColor: '#D6EAF8', color: '#1A5276', borderColor: '#AED6F1' },
    Icon:     null,
  },
  grade2: {
    label:    '二级胚胎',
    color:    '',
    styleObj: { backgroundColor: '#AED6F1', color: '#1A6EBD', borderColor: '#7FB3D3' },
    Icon:     null,
  },
  grade3: {
    label:    '三级胚胎',
    color:    '',
    styleObj: { backgroundColor: '#D5F5E3', color: '#1E8449', borderColor: '#A9DFBF' },
    Icon:     null,
  },
  grade4: {
    label:    '四级胚胎',
    color:    '',
    styleObj: { backgroundColor: '#A9DFBF', color: '#196F3D', borderColor: '#82C9A0' },
    Icon:     null,
  },

  // ── 报告状态 ──────────────────────────────────────────────────
  pending: {
    label: '待复核',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Icon:  Clock,
  },
  approved: {
    label: '已终审',
    color: 'bg-green-100 text-green-700 border-green-200',
    Icon:  BadgeCheck,
  },
  rejected: {
    label: '已驳回',
    color: 'bg-red-100 text-red-700 border-red-200',
    Icon:  XCircle,
  },
  reviewing: {
    label: '复核中',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    Icon:  RefreshCw,
  },
  processing: {
    label: '处理中',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    Icon:  Loader,
  },
}

export default function StatusBadge({ type, label, size = 'md' }) {
  const cfg = CONFIG[type] ?? {
    label: type,
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    Icon:  null,
  }
  const text = label ?? cfg.label
  const Icon = cfg.Icon

  const sizeClass = size === 'sm'
    ? 'text-xs px-1.5 py-0.5'
    : 'text-xs px-2.5 py-1'

  const iconSize = 14

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${cfg.color} ${sizeClass}`}
      style={cfg.styleObj}
    >
      {Icon && (
        <Icon
          size={iconSize}
          strokeWidth={2}
          className="shrink-0"
          aria-hidden="true"
        />
      )}
      {text}
    </span>
  )
}
