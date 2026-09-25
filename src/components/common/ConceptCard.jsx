/**
 * ConceptCard — 概念评分卡片（第三阶段视觉升级）
 *
 * Props:
 *   concept     {object}  enriched score 对象（含 id/name/direction/shortDesc/score/percent）
 *   isHovered   {bool}    是否处于高亮状态（热力图联动）
 *   onMouseEnter/Leave    hover 回调
 */

const POS_COLOR = '#27AE60'
const NEG_COLOR = '#E74C3C'

/* ── 各概念 SVG inline 图标（36×36，strokeWidth 1.5，圆润线条） ── */
function ConceptSVG({ id, color }) {
  const props = { viewBox: '0 0 36 36', width: 36, height: 36, fill: 'none' }
  switch (id) {
    /* 正向概念 */
    case 'C01': // 细胞大小均一性 — 3个等大圆横排（体积均一）
      return (
        <svg {...props}>
          <circle cx="8"  cy="18" r="6" stroke={color} strokeWidth="1.5"/>
          <circle cx="18" cy="18" r="6" stroke={color} strokeWidth="1.5"/>
          <circle cx="28" cy="18" r="6" stroke={color} strokeWidth="1.5"/>
        </svg>
      )
    case 'C02': // 完整透明带 — 大圆 + 外层虚线圆（透明带）
      return (
        <svg {...props}>
          <circle cx="18" cy="18" r="8"  stroke={color} strokeWidth="1.5"/>
          <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="1" strokeDasharray="3 2"/>
        </svg>
      )
    case 'C03': // 卵裂球对称性 — 2×2 均等圆格 + 细连线（分裂同步对称）
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="5.5" stroke={color} strokeWidth="1.5"/>
          <circle cx="25" cy="11" r="5.5" stroke={color} strokeWidth="1.5"/>
          <circle cx="11" cy="25" r="5.5" stroke={color} strokeWidth="1.5"/>
          <circle cx="25" cy="25" r="5.5" stroke={color} strokeWidth="1.5"/>
          <line x1="16.5" y1="11" x2="19.5" y2="11" stroke={color} strokeWidth="1"/>
          <line x1="16.5" y1="25" x2="19.5" y2="25" stroke={color} strokeWidth="1"/>
          <line x1="11" y1="16.5" x2="11" y2="19.5" stroke={color} strokeWidth="1"/>
          <line x1="25" y1="16.5" x2="25" y2="19.5" stroke={color} strokeWidth="1"/>
        </svg>
      )
    case 'C04': // 胞质均质度 — 清晰大圆，内部干净
      return (
        <svg {...props}>
          <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="1.5"/>
          <circle cx="18" cy="18" r="2" stroke={color} strokeWidth="1.2" opacity="0.5"/>
        </svg>
      )
    case 'C05': // 卵裂球粘附性 — 两个紧邻圆（细胞紧密连接）
      return (
        <svg {...props}>
          <circle cx="13" cy="18" r="7" stroke={color} strokeWidth="1.5"/>
          <circle cx="23" cy="18" r="7" stroke={color} strokeWidth="1.5"/>
        </svg>
      )
    case 'C06': // 卵裂速率适宜性 — 圆内双箭头（节律适宜）
      return (
        <svg {...props}>
          <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="1.5"/>
          <path d="M10 15 L15 18 L10 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 15 L23 18 L18 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'C07': // 卵裂模式规律性 — 1→2 分裂模式
      return (
        <svg {...props}>
          <circle cx="9"  cy="18" r="6" stroke={color} strokeWidth="1.5"/>
          <circle cx="27" cy="13" r="5" stroke={color} strokeWidth="1.5"/>
          <circle cx="27" cy="23" r="5" stroke={color} strokeWidth="1.5"/>
          <path d="M15 18 L20 13" stroke={color} strokeWidth="1" strokeDasharray="2 1.5"/>
          <path d="M15 18 L20 23" stroke={color} strokeWidth="1" strokeDasharray="2 1.5"/>
        </svg>
      )
    /* 负向概念 */
    case 'C08': // 胞质碎片化 — 大圆 + 周围碎片三角
      return (
        <svg {...props}>
          <circle cx="18" cy="18" r="9" stroke={color} strokeWidth="1.5"/>
          <path d="M3 5 L6 11 L0 11 Z"   stroke={color} strokeWidth="1.2" fill="none"/>
          <path d="M30 3 L33 9 L27 9 Z"  stroke={color} strokeWidth="1.2" fill="none"/>
          <path d="M3 27 L6 33 L0 33 Z"  stroke={color} strokeWidth="1.2" fill="none"/>
          <path d="M31 26 L34 32 L28 32 Z" stroke={color} strokeWidth="1.2" fill="none"/>
        </svg>
      )
    case 'C09': // 胞质颗粒化 — 圆内底部颗粒聚集
      return (
        <svg {...props}>
          <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="1.5"/>
          <circle cx="12" cy="24" r="1.5" fill={color}/>
          <circle cx="18" cy="26" r="1.5" fill={color}/>
          <circle cx="24" cy="24" r="1.5" fill={color}/>
          <circle cx="9"  cy="21" r="1"   fill={color}/>
          <circle cx="27" cy="21" r="1"   fill={color}/>
        </svg>
      )
    case 'C10': // 胞质空泡化 — 大圆内部多个空心小圆（液泡）
      return (
        <svg {...props}>
          <circle cx="18" cy="18" r="14" stroke={color} strokeWidth="1.5"/>
          <circle cx="13" cy="15" r="4"  stroke={color} strokeWidth="1.2"/>
          <circle cx="23" cy="14" r="3"  stroke={color} strokeWidth="1.2"/>
          <circle cx="16" cy="23" r="3"  stroke={color} strokeWidth="1.2"/>
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <circle cx="18" cy="18" r="12" stroke={color} strokeWidth="1.5"/>
        </svg>
      )
  }
}

export default function ConceptCard({ concept, isHovered, onClick }) {
  const isPos   = concept.direction === 'pos'
  const color   = isPos ? POS_COLOR : NEG_COLOR
  const pct     = concept.percent ?? 0
  const barFill = Math.min(100, pct)

  return (
    <div
      className="relative bg-white rounded-lg overflow-hidden cursor-pointer select-none
        transition-all duration-200"
      style={{
        boxShadow: isHovered
          ? `0 4px 16px ${color}33, 0 0 0 2px ${color}`
          : '0 1px 4px rgba(0,0,0,0.07)',
        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
      }}
      onClick={onClick}
    >
      {/* 左侧颜色竖条 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: color }}
      />

      <div className="pl-4 pr-3 py-3">
        {/* 顶行：图标 + 名称 + 方向标签 */}
        <div className="flex items-start gap-2 mb-1.5">
          <div className="flex-shrink-0 mt-0.5">
            <ConceptSVG id={concept.id} color={color} />
          </div>
          <div className="flex-1 min-w-0 pt-1.5">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-sm font-semibold text-medical-text leading-tight">
                {concept.name ?? concept.id}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{
                  backgroundColor: isPos ? '#E8F8EF' : '#FDE8E8',
                  color,
                }}
              >
                {isPos ? '正向 ↑' : '负向 ↓'}
              </span>
            </div>

            {/* 通俗解释 */}
            {concept.shortDesc && (
              <p className="text-xs mt-0.5 leading-snug" style={{ color: '#6B7280' }}>
                {concept.shortDesc}
              </p>
            )}
          </div>
        </div>

        {/* 进度条 */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${barFill}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs font-bold tabular-nums flex-shrink-0 w-12 text-right" style={{ color }}>
            {pct.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * ConceptCardGroup — 带分组标题的概念卡片网格
 *
 * Props:
 *   scores       enriched scores 数组
 *   hoveredId    当前 hover 的概念 id（热力图联动）
 *   onHover(id)  hover 变化回调
 */
export function ConceptCardGroup({ scores, hoveredId, onHover }) {
  const posScores = scores.filter(s => s.direction === 'pos')
  const negScores = scores.filter(s => s.direction === 'neg')
  const [expanded, setExpanded] = useState(false)

  const allCards = [...posScores, ...negScores]
  const COLLAPSE_LIMIT = 6
  const showExpand = allCards.length > COLLAPSE_LIMIT
  const visible = expanded ? allCards : allCards.slice(0, COLLAPSE_LIMIT)

  const visiblePos = visible.filter(s => s.direction === 'pos')
  const visibleNeg = visible.filter(s => s.direction === 'neg')

  return (
    <div className="space-y-4">
      {/* 正向概念组 */}
      {visiblePos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className="text-xs font-semibold" style={{ color: '#27AE60' }}>支持该评级的特征</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#E8F8EF' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visiblePos.map(s => (
              <ConceptCard
                key={s.id}
                concept={s}
                isHovered={hoveredId === s.id}
                onClick={() => onHover?.(hoveredId === s.id ? null : s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 负向概念组 */}
      {visibleNeg.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="text-xs font-semibold" style={{ color: '#E74C3C' }}>需关注的特征</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#FDE8E8' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleNeg.map(s => (
              <ConceptCard
                key={s.id}
                concept={s}
                isHovered={hoveredId === s.id}
                onClick={() => onHover?.(hoveredId === s.id ? null : s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 折叠控制 */}
      {showExpand && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full py-2 text-xs font-medium border border-dashed rounded-lg transition-colors"
          style={{ color: '#1A6EBD', borderColor: '#1A6EBD33' }}
        >
          {expanded
            ? '收起概念 ↑'
            : `展开全部 ${allCards.length} 个概念 ↓`}
        </button>
      )}
    </div>
  )
}

// useState 补充导入（组件内部使用）
import { useState } from 'react'
