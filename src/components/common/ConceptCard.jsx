function ConceptSVG({ id, color }) {
  const props = { viewBox: '0 0 36 36', width: 36, height: 36, fill: 'none' }
  switch (id) {
    /* 形态图标 */
    case 'C01': // 细胞大小均一性 — 3个等大圆横排（体积均一）
      return (
        <svg {...props}>
          <circle cx="8"  cy="18" r="6" stroke={color} strokeWidth="1.5"/>
          <circle cx="18" cy="18" r="6" stroke={color} strokeWidth="1.5"/>
          <circle cx="28" cy="18" r="6" stroke={color} strokeWidth="1.5"/>
        </svg>
      )
    case 'C04': // 完整透明带 — 大圆 + 外层虚线圆（透明带）
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
    case 'C02': // 胞质均质度 — 清晰大圆，内部干净
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
    /* 碎片图标 */
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

export default function ConceptCard({ concept }) {
  const recorded = concept.status === 'recorded'
  const isFragmentation = concept.id === 'C08'
  const color = !recorded ? '#9CA3AF' : isFragmentation ? '#1A6EBD' : '#27AE60'
  const hasValue = recorded && concept.value !== null

  return (
    <article className="relative bg-white rounded-lg overflow-hidden h-full"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />
      <div className="pl-4 pr-3 py-3">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0"><ConceptSVG id={concept.id} color={color} /></div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-medical-text leading-tight">{concept.name}</p>
            <p className="text-xs text-medical-muted mt-1 leading-snug">{concept.shortDesc}</p>
          </div>
        </div>
        <div className="mt-3 text-sm font-semibold" style={{ color }}>
          {recorded ? concept.observation : concept.status === 'unreadable' ? '不可判读' : '待复核'}
          {hasValue && <span className="ml-2 tabular-nums">{concept.value}{concept.unit}</span>}
        </div>
        {isFragmentation && hasValue && concept.unit === '%' && (
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, concept.value))}%`, backgroundColor: color }} />
          </div>
        )}
      </div>
    </article>
  )
}

export function ConceptCardGroup({ scores }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scores.map(concept => <ConceptCard key={concept.id} concept={concept} />)}
      </div>
      <p className="text-[10px] text-gray-400 leading-relaxed">
        以上形态数据、热力图及模型指标为演示预设，非本图像实测结果。
      </p>
    </div>
  )
}
