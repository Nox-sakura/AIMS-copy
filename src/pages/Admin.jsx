/**
 * Admin.jsx — 管理员控制台
 *
 * 功能区域：
 *   - 3张 KPI 卡片：本月报告总数 / 图像修正数 / 模型一致率
 *   - 账号注册审核表：通过/拒绝 → ConfirmModal → showToast + 行状态变更
 *   - BarChart：本月 Grade 1–4 分布（来自 gradeDistribution）
 *   - LineChart：近6个月模型一致率趋势（来自 monthlyConsistency，Y轴 85–100%）
 *   - 操作日志表：15条，含 actionType 图标映射（lucide 图标 + 彩色 pill 标签）
 *
 * 权限：此页面仅 role=admin 的用户应可见（当前无路由守卫，仅 UI 约束）
 */
import { useState, useEffect } from 'react'
import {
  FileText, CheckCircle, XCircle, Download, LogIn, Settings, Shield, GraduationCap,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import InfoCard from '../components/InfoCard'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import { useAppContext } from '../context/AppContext'
import { getUsers } from '../api/users'
import { formatDoctorWithTitle } from '../utils/formatDoctor'
import { getGradeDistribution, getMonthlyConsistency } from '../api/stats'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, Legend,
  ResponsiveContainer,
} from 'recharts'

// lucide 图标映射 by actionType
const ACTION_ICON = {
  submit:  <FileText   className="w-3.5 h-3.5" />,
  approve: <CheckCircle className="w-3.5 h-3.5" />,
  reject:  <XCircle    className="w-3.5 h-3.5" />,
  export:  <Download   className="w-3.5 h-3.5" />,
  login:   <LogIn      className="w-3.5 h-3.5" />,
  modify:  <Settings   className="w-3.5 h-3.5" />,
  admin:      <Shield        className="w-3.5 h-3.5" />,
  education:  <GraduationCap className="w-3.5 h-3.5" />,
}

const ACTION_COLOR = {
  submit:  'text-medical-blue  bg-blue-50',
  approve: 'text-medical-green bg-green-50',
  reject:  'text-medical-red   bg-red-50',
  export:  'text-purple-600    bg-purple-50',
  login:   'text-medical-muted bg-gray-100',
  modify:  'text-medical-orange bg-orange-50',
  admin:     'text-medical-blue  bg-blue-50',
  education: 'text-blue-600     bg-blue-50',
}

export default function Admin() {
  const { showToast, reports, logs, addLog, currentUser } = useAppContext()

  const [usersList, setUsersList] = useState([])
  const [gradeDistribution, setGradeDistribution] = useState([])
  const [monthlyConsistency, setMonthlyConsistency] = useState([])
  const [educationPermissions, setEducationPermissions] = useState({})

  useEffect(() => {
    getUsers().then(data => {
      setUsersList(data)
      setEducationPermissions(Object.fromEntries(
        data.map(u => [u.id, u.permissions?.education_access ?? false])
      ))
    })
    getGradeDistribution().then(setGradeDistribution)
    getMonthlyConsistency().then(setMonthlyConsistency)
  }, [])

  const totalReports = gradeDistribution.reduce((sum, d) => sum + d.count, 0)
  const KPI_CARDS = [
    { label: '本月报告总数',   value: totalReports, unit: '份',  color: 'text-medical-blue'  },
    { label: '图像预处理修正', value: 34,   unit: '张',  color: 'text-purple-600'    },
    { label: '当月模型一致率', value: `${monthlyConsistency.at(-1)?.rate ?? '--'}%`, unit: '', color: 'text-medical-green' },
  ]

  const handleEducationPermissionChange = (userId, userName, newValue) => {
    setEducationPermissions(prev => ({ ...prev, [userId]: newValue }))
    addLog({
      user: currentUser?.name ?? '管理员',
      role: '管理员',
      actionType: 'admin',
      action: `${newValue ? '开启' : '关闭'}教育模块权限`,
      target: `用户 ${userName}`,
      time: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).replace(/\//g, '-'),
      ip: '127.0.0.1',
      module: 'admin',
      payload: {
        targetUserId: userId,
        newValue,
        adminId: currentUser?.id,
        action: 'admin_toggle_education_access',
      },
    })
    showToast(
      `已${newValue ? '开启' : '关闭'} ${userName} 的教育模块权限`,
      newValue ? 'success' : 'warning'
    )
  }

  const pendingUsers = usersList.filter(u => u.status === 'pending')
  const [confirmUser, setConfirmUser] = useState(null)
  const [confirmAction, setAction]    = useState(null) // 'approve' | 'reject'
  const [processedIds, setProcessed]  = useState([])

  const openConfirm = (user, action) => { setConfirmUser(user); setAction(action) }

  const handleConfirm = () => {
    if (confirmUser) {
      setProcessed(prev => [...prev, confirmUser.id])
      showToast(
        confirmAction === 'approve'
          ? `已通过 ${confirmUser.name} 的注册申请`
          : `已拒绝 ${confirmUser.name} 的注册申请`,
        confirmAction === 'approve' ? 'success' : 'warning'
      )
    }
    setConfirmUser(null)
    setAction(null)
  }

  const activePending = pendingUsers.filter(u => !processedIds.includes(u.id))

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="管理员控制台"
        breadcrumbs={[{ label: '管理控制台' }]}
        actions={
          <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1 rounded-full font-medium">
            管理员模式
          </span>
        }
      />

      <div className="p-6 space-y-6 flex-1 overflow-auto">

        {/* ── KPI 数据卡片 ── */}
        <div className="grid grid-cols-3 gap-4">
          {KPI_CARDS.map(k => (
            <div key={k.label} className="card p-5 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-medical-muted">{k.label}</p>
                <p className={`text-3xl font-bold mt-1 ${k.color}`}>
                  {k.value}<span className="text-base font-medium ml-1">{k.unit}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 账号审核 ── */}
        <InfoCard
          title="账号注册审核"
          actions={
            <span className={`text-xs px-2 py-0.5 rounded-full ${activePending.length > 0 ? 'bg-orange-100 text-orange-600' : 'text-medical-muted'}`}>
              {activePending.length > 0 ? `${activePending.length} 条待审核` : '全部已处理'}
            </span>
          }
        >
          {activePending.length === 0 ? (
            <EmptyState title="暂无待审核申请" desc="所有注册申请均已处理" />
          ) : (
            <div className="space-y-3">
              {activePending.map(u => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 p-4 border border-medical-border rounded-lg hover:bg-medical-bg transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-medical-blue-light flex items-center justify-center flex-shrink-0">
                    <span className="text-medical-blue font-semibold">{u.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-medical-text">{u.name}</span>
                      <span className="text-xs text-medical-muted">{u.title}</span>
                      <span className="text-xs text-medical-muted">·</span>
                      <span className="text-xs text-medical-muted">{u.department}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-medical-muted flex-wrap">
                      <span>工号：{u.employeeId}</span>
                      <span>执照：{u.licenseNo}</span>
                      <span>申请时间：{u.applyDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openConfirm(u, 'approve')}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      通过
                    </button>
                    <button
                      onClick={() => openConfirm(u, 'reject')}
                      className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InfoCard>

        {/* ── 图表区：评级分布 + 一致率趋势 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* 本月评级分布 BarChart */}
          <InfoCard title="本月评级分布">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={gradeDistribution} barSize={42}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="grade" tick={{ fontSize: 12, fill: '#7F8C8D' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#7F8C8D' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE3EC' }}
                  cursor={{ fill: '#F5F7FA' }}
                  formatter={(v) => [`${v} 份`, '数量']}
                />
                <Bar dataKey="count" name="数量" radius={[4, 4, 0, 0]}>
                  {gradeDistribution.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </InfoCard>

          {/* 近6个月模型一致率趋势 LineChart */}
          <InfoCard title="近6个月模型一致率趋势">
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={monthlyConsistency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE3EC" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7F8C8D' }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[85, 100]}
                  tick={{ fontSize: 12, fill: '#7F8C8D' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE3EC' }}
                  formatter={(v) => [`${v}%`, '一致率']}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="模型一致率"
                  stroke="#27AE60"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#27AE60' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </InfoCard>
        </div>

        {/* ── 医教智能体权限管理 ── */}
        <InfoCard title="医教智能体模块权限">
          <div className="space-y-0">
            {usersList.filter(u => u.status === 'active').map(u => (
              <div key={u.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-medical-blue-light flex items-center justify-center flex-shrink-0">
                    <span className="text-medical-blue text-xs font-semibold">{u.avatar}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-medical-text">{u.name}</p>
                      <span className="text-xs text-medical-muted">{u.title}</span>
                      {educationPermissions[u.id] && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5
                                         bg-blue-50 text-blue-700 border border-blue-200
                                         rounded-full text-xs font-medium">
                          <GraduationCap className="w-3 h-3" />
                          教育
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-medical-muted">
                      允许该账号访问案例分析 Agent 与胚胎评估训练场
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleEducationPermissionChange(u.id, u.name, !educationPermissions[u.id])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                              ${educationPermissions[u.id] ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                                    ${educationPermissions[u.id] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </InfoCard>

        {/* ── 操作日志 ── */}
        <InfoCard
          title="操作日志"
          actions={<span className="text-xs text-medical-muted">最近 {logs.length} 条</span>}
          padding={false}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-medical-border bg-medical-bg">
                {['日志ID', '操作用户', '角色', '操作类型', '操作对象', 'IP 地址', '时间戳'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-medical-muted px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-medical-border">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-medical-bg transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-medical-muted">{log.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-medical-blue-light flex items-center justify-center flex-shrink-0">
                        <span className="text-medical-blue text-xs font-medium">{log.user[0]}</span>
                      </div>
                      <span className="text-medical-text">{formatDoctorWithTitle(log.user)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-medical-muted">{log.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${ACTION_COLOR[log.actionType] ?? 'text-medical-muted bg-gray-100'}`}>
                      {ACTION_ICON[log.actionType]}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-medical-muted max-w-[180px] truncate" title={log.target}>
                    {log.target}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-medical-muted">{log.ip}</td>
                  <td className="px-4 py-3 text-xs text-medical-muted whitespace-nowrap">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </InfoCard>

      </div>

      {/* 确认审核弹窗 */}
      <ConfirmModal
        open={!!confirmUser}
        title={confirmAction === 'approve' ? '确认通过注册申请' : '确认拒绝注册申请'}
        message={
          confirmUser
            ? confirmAction === 'approve'
              ? `确认通过 ${confirmUser.name}（${confirmUser.title}）的注册申请？通过后该用户可立即登录系统。`
              : `确认拒绝 ${confirmUser.name} 的注册申请？此操作将通过短信通知申请人。`
            : ''
        }
        confirmLabel={confirmAction === 'approve' ? '确认通过' : '确认拒绝'}
        danger={confirmAction === 'reject'}
        onConfirm={handleConfirm}
        onCancel={() => { setConfirmUser(null); setAction(null) }}
      />
    </div>
  )
}
