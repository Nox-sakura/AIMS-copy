/**
 * Reports.jsx — 报告管理列表页
 *
 * 功能：
 *   - 筛选栏：评级下拉 + 状态下拉 + 日期范围 + RotateCcw 重置
 *   - 表格：报告编号/患者/胚胎/评级/医师/日期/状态/操作
 *   - 批量选择（Set 实现，O(1) 操作）
 *   - 浮动批量操作栏（fixed bottom-6 z-40）：仅 senior/admin 角色可见
 *   - 操作："查看"跳转评估详情，"导出"触发 Toast
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { useAppContext } from '../context/AppContext'
import { formatDoctorWithTitle } from '../utils/formatDoctor'

const STATUS_OPTS = [
  { key: 'all',       label: '全部状态' },
  { key: 'pending',   label: '待复核' },
  { key: 'reviewing', label: '复核中' },
  { key: 'approved',  label: '已终审' },
  { key: 'rejected',  label: '已驳回' },
]

const GRADE_OPTS = [
  { key: 'all',    label: '全部评级' },
  { key: 'grade1', label: 'Grade 1'  },
  { key: 'grade2', label: 'Grade 2'  },
  { key: 'grade3', label: 'Grade 3'  },
  { key: 'grade4', label: 'Grade 4'  },
]

export default function Reports() {
  const navigate = useNavigate()
  const { currentUser, showToast, reports, confirmReport } = useAppContext()

  const [statusFilter, setStatus] = useState('all')
  const [gradeFilter,  setGrade]  = useState('all')
  const [dateFrom,     setFrom]   = useState('')
  const [dateTo,       setTo]     = useState('')
  const [selected, setSelected]   = useState(new Set())

  const isDirector = currentUser?.role === 'senior' || currentUser?.role === 'admin'

  const filtered = reports.filter(r => {
    const myName = currentUser?.name
    const matchDoctor = r.reviewDoctor === myName || r.reviewDoctor === null
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchGrade  = gradeFilter  === 'all' || r.grade  === gradeFilter
    const matchFrom   = !dateFrom || r.submitDate >= dateFrom
    const matchTo     = !dateTo   || r.submitDate <= dateTo
    return matchDoctor && matchStatus && matchGrade && matchFrom && matchTo
  })

  const handleReset = () => {
    setStatus('all'); setGrade('all'); setFrom(''); setTo('')
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkApprove = () => {
    const count = selected.size
    selected.forEach(id => confirmReport(id, currentUser?.name))
    setSelected(new Set())
    showToast(`已批量终审 ${count} 份报告`, 'success')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="报告管理"
        breadcrumbs={[{ label: '报告管理' }]}
        actions={<span className="text-sm text-medical-muted">我的报告 · 共 {filtered.length} 份</span>}
      />

      <div className="p-6 space-y-4 flex-1 overflow-auto">

        {/* 筛选栏 */}
        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            {/* 评级下拉 */}
            <div>
              <label className="block text-xs text-medical-muted mb-1">评级</label>
              <select className="input-field w-auto text-sm" value={gradeFilter} onChange={e => setGrade(e.target.value)}>
                {GRADE_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            {/* 状态下拉 */}
            <div>
              <label className="block text-xs text-medical-muted mb-1">状态</label>
              <select className="input-field w-auto text-sm" value={statusFilter} onChange={e => setStatus(e.target.value)}>
                {STATUS_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
            {/* 日期范围 */}
            <div>
              <label className="block text-xs text-medical-muted mb-1">日期范围</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)} className="input-field w-auto text-sm" />
                <span className="text-medical-muted text-sm">—</span>
                <input type="date" value={dateTo} onChange={e => setTo(e.target.value)} className="input-field w-auto text-sm" />
              </div>
            </div>
            {/* 重置 */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-medical-muted hover:text-medical-blue transition-colors pb-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置筛选
            </button>
          </div>
        </div>

        {/* 报告列表 */}
        {filtered.length === 0 ? (
          <EmptyState title="未找到匹配的报告" desc="请尝试调整筛选条件" />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-medical-border bg-medical-bg">
                  {isDirector && (
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={selected.size > 0 && selected.size === filtered.length}
                        onChange={toggleAll}
                        className="rounded border-medical-border"
                      />
                    </th>
                  )}
                  {['报告编号', '患者姓名', '胚胎编号', '评级', '提交医师', '终审医师', '提交日期', '状态', '操作'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-medical-muted px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-medical-border">
                {filtered.map(r => (
                  <tr
                    key={r.id}
                    className={`hover:bg-medical-bg transition-colors ${selected.has(r.id) ? 'bg-medical-blue-light' : ''}`}
                  >
                    {isDirector && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="rounded border-medical-border"
                        />
                      </td>
                    )}
                    <td
                      className="px-4 py-3 font-mono text-xs text-medical-blue hover:underline cursor-pointer"
                      onClick={() => navigate(`/assessment/${r.assessmentId}`)}
                    >
                      {r.id}
                    </td>
                    <td className="px-4 py-3 text-medical-text">{r.patientName}</td>
                    <td className="px-4 py-3 font-medium text-medical-text">{r.embryoNo}</td>
                    <td className="px-4 py-3"><StatusBadge type={r.grade} size="sm" /></td>
                    <td className="px-4 py-3 text-medical-muted">{formatDoctorWithTitle(r.submitDoctor)}</td>
                    <td className="px-4 py-3 text-medical-muted">{r.reviewDoctor ? formatDoctorWithTitle(r.reviewDoctor) : '—'}</td>
                    <td className="px-4 py-3 text-medical-muted text-xs">{r.submitDate}</td>
                    <td className="px-4 py-3"><StatusBadge type={r.status} size="sm" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (r._isLightweight) {
                              showToast('历史存档，完整数据待迁移', 'warning')
                              return
                            }
                            navigate(`/assessment/${r.assessmentId}`)
                          }}
                          className="text-xs text-medical-blue hover:underline"
                        >
                          查看
                        </button>
                        <span className="text-medical-border">|</span>
                        <button
                          onClick={() => showToast('PDF 报告导出中…', 'success')}
                          className="text-xs text-medical-muted hover:text-medical-text"
                        >
                          导出
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 批量操作浮动栏（仅主任/管理员） */}
      {isDirector && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-medical-border rounded-xl shadow-xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm text-medical-text">已选 <strong>{selected.size}</strong> 份报告</span>
          <button onClick={handleBulkApprove} className="btn-primary text-sm">
            批量终审
          </button>
          <button onClick={() => setSelected(new Set())} className="btn-ghost text-sm">
            取消
          </button>
        </div>
      )}
    </div>
  )
}
