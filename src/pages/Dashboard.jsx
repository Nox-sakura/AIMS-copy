/**
 * Dashboard.jsx — 主工作台
 *
 * 功能区域：
 *   - 顶部：动态日期 + 4张 KPI 卡片（今日评估/待复核/患者数/一致率）
 *   - 左列：最近评估表格（600ms Skeleton 加载）+ 趋势图
 *   - 右列：快捷操作 + 待办事项
 *
 * 第三阶段：卡片右上角圆形彩色图标 + 趋势箭头图标
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Sector,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus,
  Users, Plus, ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import InfoCard from '../components/InfoCard'
import Skeleton from '../components/Skeleton'
import { useAppContext } from '../context/AppContext'
import { getUsers } from '../api/users'
import { getWeeklyTrend } from '../api/stats'
import { formatDoctorWithTitle } from '../utils/formatDoctor'


// 自定义 Recharts Tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-medical-border rounded-lg shadow-md p-3 text-xs">
      <p className="font-medium text-medical-text mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}：{p.value} 份
        </p>
      ))}
    </div>
  )
}

/* ── KPI 卡片迷你可视化组件 ── */

// 卡片1：放大版柱状图（周一至周日，7根柱，周三高亮）
function MiniBarChart() {
  const data = [
    { v: 14 }, { v: 21 }, { v: 17 }, { v: 22 },
    { v: 15 }, { v: 6  }, { v: 3  },
  ]
  return (
    <BarChart
      width={76} height={64} data={data}
      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      barCategoryGap={4}
    >
      <Bar dataKey="v" isAnimationActive={false} radius={[2, 2, 0, 0]}>
        {data.map((_, i) => (
          <Cell
            key={i}
            fill={i === 6 ? 'transparent' : i === 2 ? '#1255A0' : '#AED6F1'}
          />
        ))}
      </Bar>
    </BarChart>
  )
}

// 卡片2：两段环形饼图（待复核 / 已完成，数据由外部传入）
function DonutProgress({ data, activeIndex, activeShape, onMouseEnter, onMouseLeave }) {
  const pieData = data || [
    { name: '待复核', value: 5  },
    { name: '已完成', value: 13 },
  ]
  return (
    <PieChart width={92} height={88}>
      <Pie
        data={pieData}
        cx={44} cy={42}
        innerRadius={22} outerRadius={34}
        startAngle={90} endAngle={-270}
        dataKey="value"
        strokeWidth={0}
        isAnimationActive={false}
        activeIndex={activeIndex ?? undefined}
        activeShape={activeShape}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {pieData.map((_, i) => (
          <Cell key={i} fill={i === 0 ? '#E67E22' : '#27AE60'} />
        ))}
      </Pie>
    </PieChart>
  )
}

// 卡片3：三个简笔画小人（代表多名患者）
function StickPersons() {
  const figures = [
    { cx: 14, color: '#AED6F1' },
    { cx: 38, color: '#1A6EBD' },
    { cx: 62, color: '#AED6F1' },
  ]
  return (
    <svg width={76} height={72} viewBox="0 0 76 72" style={{ display: 'block' }}>
      {figures.map(({ cx, color }) => (
        <g key={cx} stroke={color} strokeWidth={2} strokeLinecap="round" fill="none">
          {/* 头部 */}
          <circle cx={cx} cy={22} r={5} />
          {/* 身体 */}
          <line x1={cx} y1={27} x2={cx} y2={44} />
          {/* 左手臂 */}
          <line x1={cx} y1={32} x2={cx - 7} y2={39} />
          {/* 右手臂 */}
          <line x1={cx} y1={32} x2={cx + 7} y2={39} />
          {/* 左腿 */}
          <line x1={cx} y1={44} x2={cx - 6} y2={57} />
          {/* 右腿 */}
          <line x1={cx} y1={44} x2={cx + 6} y2={57} />
        </g>
      ))}
    </svg>
  )
}

// 卡片4：竖向温度计进度条（91.3%）
function ThermometerGauge() {
  const tubeX = 24, tubeY = 5, tubeW = 14, tubeH = 48
  const tubeBottom = tubeY + tubeH          // 53
  const bulbCX = tubeX + tubeW / 2          // 31
  const bulbCY = tubeBottom + 8             // 61
  const bulbR  = 9
  const fillH  = Math.round(0.913 * tubeH) // 44
  const fillY  = tubeBottom - fillH         // 9
  const ticks  = [0.25, 0.5, 0.75].map(p => tubeBottom - p * tubeH)
  return (
    <svg width={76} height={72} viewBox="0 0 76 72" style={{ display: 'block' }}>
      {/* 管内填充 */}
      <rect x={tubeX} y={fillY} width={tubeW} height={fillH} rx={6} fill="#27AE60" />
      {/* 外框管 */}
      <rect x={tubeX} y={tubeY} width={tubeW} height={tubeH} rx={7}
        stroke="#DDE3EC" strokeWidth={2} fill="none" />
      {/* 底部球泡 */}
      <circle cx={bulbCX} cy={bulbCY} r={bulbR} fill="#27AE60" />
      {/* 刻度线（左侧） */}
      {ticks.map((ty, i) => (
        <line key={i} x1={tubeX - 4} y1={ty} x2={tubeX - 1} y2={ty}
          stroke="#B0BEC5" strokeWidth={1.5} />
      ))}
      {/* 百分比文字 */}
      <text
        x={tubeX + tubeW + 5}
        y={tubeY + tubeH / 2 + 4}
        fontSize={10} fontWeight="600" fill="#27AE60"
      >
        91.3%
      </text>
    </svg>
  )
}

const miniViz = [MiniBarChart, DonutProgress, StickPersons, ThermometerGauge]

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, reports, assessments } = useAppContext()
  const [loading, setLoading] = useState(true)
  const [activePieIndex, setActivePieIndex] = useState(null)
  const [weeklyTrendData, setWeeklyTrendData] = useState([])
  const [usersData, setUsersData] = useState([])

  const pendingCount   = reports.filter(r => r.status === 'pending' || r.status === 'reviewing').length
  const completedCount = reports.filter(r => r.status === 'approved' || r.status === 'rejected').length
  const donutPieData = [
    { name: '待复核', value: pendingCount },
    { name: '已完成', value: completedCount },
  ]

  const renderActiveShape = (props) => {
    const {
      cx, cy, innerRadius, outerRadius,
      startAngle, endAngle, fill,
      payload, value,
    } = props
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 3}
          outerRadius={innerRadius - 1}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.4}
        />
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill={fill}
          fontSize={13}
          fontWeight={700}
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy + 9}
          textAnchor="middle"
          fill="#7F8C8D"
          fontSize={9}
        >
          {payload.name}
        </text>
      </g>
    )
  }

  /* ── KPI 卡片数据 ── */
  const STATS = [
    {
      label: '今日评估数',
      value: '11',
      unit: '份',
      trend: '+4',
      trendUp: true,
    },
    {
      label: '待复核报告',
      value: String(pendingCount),
      unit: '份',
      trend: '+2',
      trendUp: false,
    },
    {
      label: '本月患者数',
      value: '312',
      unit: '人',
      trend: '+28',
      trendUp: true,
    },
    {
      label: '模型一致率',
      value: '91.3',
      unit: '%',
      trend: '+0.8%',
      trendUp: true,
    },
  ]

  const recentAssessments = assessments.slice(0, 5)
  const pendingReports    = reports.filter(r => r.status === 'pending' || r.status === 'reviewing').slice(0, 4)
  const pendingUsers      = usersData.filter(u => u.status === 'pending')

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600)
    getWeeklyTrend().then(setWeeklyTrendData)
    getUsers().then(setUsersData)
    return () => clearTimeout(t)
  }, [])

  const today = format(new Date(), 'yyyy年M月d日 · EEEE', { locale: zhCN })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="工作台"
        breadcrumbs={[{ label: '工作台' }]}
        actions={<span className="text-sm text-medical-muted">{today}</span>}
      />

      <div className="p-6 space-y-6 flex-1 overflow-auto">

        {/* ── KPI 卡片 ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map((stat, idx) => {
            const VizComponent = miniViz[idx]
            return (
              <div key={stat.label} className="card p-4">
                <div className="flex items-center">
                  {/* 左侧文字区 */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-medical-muted">{stat.label}</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-bold text-medical-text">{stat.value}</span>
                      <span className="text-sm text-medical-muted">{stat.unit}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs mt-1.5 ${
                      stat.trendUp === true  ? 'text-medical-green' :
                      stat.trendUp === false ? 'text-medical-red'   : 'text-medical-muted'
                    }`}>
                      {stat.trendUp === true  && <TrendingUp  size={13} />}
                      {stat.trendUp === false && <TrendingDown size={13} />}
                      {stat.trendUp === null  && <Minus size={13} />}
                      <span>{stat.trend}</span>
                    </div>
                  </div>
                  {/* 右侧图形区 */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{ width: idx === 1 ? 92 : 80 }}
                  >
                    {idx === 1
                      ? <DonutProgress
                          data={donutPieData}
                          activeIndex={activePieIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, i) => setActivePieIndex(i)}
                          onMouseLeave={() => setActivePieIndex(null)}
                        />
                      : <VizComponent />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── 左侧：最近评估 + 趋势图 ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* 最近评估记录 */}
            <InfoCard
              title="最近评估记录"
              padding={false}
              actions={
                <button onClick={() => navigate('/reports')} className="text-xs text-medical-blue hover:underline">
                  查看全部
                </button>
              }
            >
              {loading ? (
                <Skeleton variant="table" rows={5} />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-medical-border bg-gray-50">
                      {['患者ID', '胚胎编号', '评级', '状态', '医师', '日期', '操作'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-medical-muted px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-medical-border">
                    {recentAssessments.map(a => (
                      <tr key={a.id} className="hover:bg-medical-bg transition-colors">
                        <td className="px-4 py-3 text-medical-muted font-mono text-xs">{a.patientId}</td>
                        <td className="px-4 py-3 font-medium text-medical-text">{a.embryoNo}</td>
                        <td className="px-4 py-3"><StatusBadge type={a.grade} size="sm" /></td>
                        <td className="px-4 py-3"><StatusBadge type={a.status} size="sm" /></td>
                        <td className="px-4 py-3 text-medical-muted text-xs">{formatDoctorWithTitle(a.doctor)}</td>
                        <td className="px-4 py-3 text-medical-muted text-xs">{a.assessmentDate}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/assessment/${a.id}`)}
                            className="text-xs text-medical-blue hover:underline"
                          >
                            查看
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </InfoCard>

            {/* 本周评估趋势图 */}
            <InfoCard title="本周评估趋势">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradAssess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1A6EBD" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1A6EBD" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#27AE60" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#7F8C8D' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7F8C8D' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="assessments" name="评估数"
                    stroke="#1A6EBD" strokeWidth={2} fill="url(#gradAssess)" />
                  <Area type="monotone" dataKey="approved" name="已终审"
                    stroke="#27AE60" strokeWidth={2} fill="url(#gradApproved)" strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-medical-muted">
                  <span className="inline-block w-6 h-0.5 bg-medical-blue rounded" />
                  评估数
                </div>
                <div className="flex items-center gap-1.5 text-xs text-medical-muted">
                  <span className="inline-block w-6 h-0.5 bg-medical-green rounded" style={{ borderTop: '2px dashed #27AE60', background: 'none' }} />
                  已终审
                </div>
              </div>
            </InfoCard>
          </div>

          {/* ── 右侧栏 ── */}
          <div className="space-y-4">

            {/* 快捷操作 */}
            <InfoCard title="快捷操作">
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/assessment/new')}
                  className="w-full flex items-center gap-3 p-4 rounded-lg bg-medical-blue text-white hover:bg-medical-blue-dark transition-colors"
                >
                  <Plus className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">新建评估</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                </button>
                <button
                  onClick={() => navigate('/patients')}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-medical-border hover:border-medical-blue hover:bg-medical-blue-light transition-colors"
                >
                  <Users className="w-5 h-5 text-medical-blue flex-shrink-0" />
                  <span className="text-sm font-medium text-medical-text">查看患者列表</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-medical-muted" />
                </button>
              </div>
            </InfoCard>

            {/* 待办事项 */}
            <InfoCard title="待办事项">
              <div className="space-y-1">
                {pendingReports.length > 0 ? (
                  pendingReports.map(r => (
                    <div
                      key={r.id}
                      onClick={() => navigate(`/assessment/${r.assessmentId}`)}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-medical-bg cursor-pointer group"
                    >
                      <div className="w-2 h-2 rounded-full bg-medical-orange flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-medical-text truncate">{r.patientName} · {r.embryoNo}</p>
                        <p className="text-xs text-medical-muted">待复核报告</p>
                      </div>
                      <StatusBadge type={r.status} size="sm" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-medical-muted text-center py-4">暂无待办事项</p>
                )}

                {/* 管理员可见：待审核注册 */}
                {currentUser?.role === 'admin' && pendingUsers.length > 0 && (
                  <>
                    <div className="border-t border-medical-border pt-2 mt-2">
                      <p className="text-xs text-medical-muted mb-2">待审核注册申请</p>
                    </div>
                    {pendingUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-medical-bg cursor-pointer"
                      >
                        <div className="w-2 h-2 rounded-full bg-medical-blue flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-medical-text">{u.name}</p>
                          <p className="text-xs text-medical-muted">{u.title} · {u.applyDate}</p>
                        </div>
                        <span className="text-xs text-medical-blue">审核</span>
                      </div>
                    ))}
                  </>
                )}

                {/* 今日取卵提醒 */}
                <div
                  onClick={() => navigate('/assessment/new')}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-medical-bg cursor-pointer border border-dashed border-medical-border mt-1"
                >
                  <div className="w-2 h-2 rounded-full bg-medical-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-medical-text truncate">患者 P-2024-089 今日取卵</p>
                    <p className="text-xs text-medical-muted">请及时创建评估</p>
                  </div>
                  <span className="text-xs text-medical-blue">新建</span>
                </div>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  )
}
