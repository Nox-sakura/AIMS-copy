/**
 * PatientList.jsx — 患者管理列表页
 *
 * 功能：
 *   - 实时搜索（姓名/ID）+ 周期状态下拉筛选
 *   - 表格视图 / 卡片视图切换（LayoutList / LayoutGrid）
 *   - 静态分页（PAGE_SIZE=8），筛选变化时自动重置到第1页
 *   - 新建患者 Modal → 提交后追加到列表顶部 + Toast 通知
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutList, LayoutGrid, Plus, Search, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Skeleton from '../../components/Skeleton'
import { useAppContext } from '../../context/AppContext'
import { getPatients } from '../../api/patients'

const PAGE_SIZE = 8

const CYCLE_STATUS_MAP = {
  active:     { label: '进行中', badge: 'reviewing' },
  completed:  { label: '已完成', badge: 'approved'  },
  paused:     { label: '暂停',   badge: 'pending'   },
}

const DIAGNOSIS_OPTIONS = ['原发不孕', '继发不孕', '输卵管梗阻', '卵巢储备功能减退', '多囊卵巢综合征', '男方因素', '不明原因不孕']

// 新建患者 Modal
function NewPatientModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', age: '', phone: '', diagnosis: '原发不孕' })
  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSave = () => {
    onSave({
      id: `P-${Date.now()}`,
      name: form.name || '新患者',
      age: Number(form.age) || 30,
      phone: form.phone || '—',
      diagnosis: form.diagnosis,
      department: '生殖医学科',
      cycleStatus: 'active',
      currentCycle: 1,
      lastAssessmentDate: null,
      doctor: '李明华',
      admissionDate: new Date().toISOString().slice(0, 10),
      cycles: [],
      orders: [],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-medical-text">新建患者档案</h3>
          <button onClick={onClose} className="text-medical-muted hover:text-medical-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">患者ID</label>
              <input readOnly value="自动生成" className="input-field bg-medical-bg text-medical-muted" />
            </div>
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">姓名 <span className="text-medical-red">*</span></label>
              <input type="text" placeholder="请输入姓名" className="input-field" value={form.name} onChange={f('name')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">年龄</label>
              <input type="number" placeholder="岁" className="input-field" value={form.age} onChange={f('age')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-medical-text mb-1.5">手机号</label>
              <input type="tel" placeholder="请输入手机号" className="input-field" value={form.phone} onChange={f('phone')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">不孕原因</label>
            <select className="input-field" value={form.diagnosis} onChange={f('diagnosis')}>
              {DIAGNOSIS_OPTIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">取消</button>
          <button onClick={handleSave} className="btn-primary flex-1">创建</button>
        </div>
      </div>
    </div>
  )
}

export default function PatientList() {
  const navigate = useNavigate()
  const { showToast } = useAppContext()

  const [patients, setPatients] = useState([])
  const [search, setSearch]     = useState('')
  const [cycleFilter, setCycle] = useState('all')
  const [viewMode, setViewMode] = useState('table')
  const [page, setPage]         = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getPatients().then(data => {
      setPatients(data)
      setLoading(false)
    })
  }, [])

  const filtered = patients.filter(p => {
    const matchSearch = !search ||
      p.name.includes(search) || p.id.toLowerCase().includes(search.toLowerCase())
    const matchCycle  = cycleFilter === 'all' || p.cycleStatus === cycleFilter
    return matchSearch && matchCycle
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // 搜索/筛选变化时重置页码
  useEffect(() => { setPage(1) }, [search, cycleFilter])

  const handleNewPatient = (newP) => {
    setPatients(prev => [newP, ...prev])
    setShowModal(false)
    showToast(`患者 ${newP.name} 档案已创建`, 'success')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="患者管理"
        breadcrumbs={[{ label: '患者管理' }]}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            新建患者
          </button>
        }
      />

      <div className="p-6 space-y-4 flex-1 overflow-auto">

        {/* 搜索 & 筛选栏 */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-48 max-w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索姓名或患者ID"
              className="input-field pl-9"
            />
          </div>

          {/* 周期状态筛选 */}
          <div className="flex gap-1 bg-white border border-medical-border rounded-lg p-0.5">
            {[
              { key: 'all',       label: '全部' },
              { key: 'active',    label: '进行中' },
              { key: 'paused',    label: '暂停' },
              { key: 'completed', label: '已完成' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setCycle(f.key)}
                className={[
                  'px-3 py-1.5 text-xs rounded-md transition-colors',
                  cycleFilter === f.key
                    ? 'bg-medical-blue text-white font-medium'
                    : 'text-medical-muted hover:text-medical-text',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-medical-muted">共 {filtered.length} 条</span>

            {/* 视图切换 */}
            <div className="flex gap-0.5 border border-medical-border rounded-md p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-medical-blue text-white' : 'text-medical-muted hover:text-medical-text'}`}
                title="表格视图"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-medical-blue text-white' : 'text-medical-muted hover:text-medical-text'}`}
                title="卡片视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        {loading ? (
          <div className="card overflow-hidden"><Skeleton variant="table" rows={8} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="未找到匹配的患者" desc="请尝试修改搜索条件" />
        ) : viewMode === 'table' ? (
          /* 表格视图 */
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-medical-border bg-medical-bg">
                  {['患者ID', '姓名', '年龄', '当前周期', '周期状态', '主治医师', '最近评估', '操作'].map(h => (
                    <th key={h} className="text-left text-xs font-medium text-medical-muted px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-medical-border">
                {paged.map(p => {
                  const cs = CYCLE_STATUS_MAP[p.cycleStatus] ?? { label: p.cycleStatus, badge: 'pending' }
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-medical-bg transition-colors cursor-pointer"
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-medical-muted">{p.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-medical-blue-light flex items-center justify-center flex-shrink-0">
                            <span className="text-medical-blue text-xs font-medium">{p.name[0]}</span>
                          </div>
                          <span className="font-medium text-medical-text">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-medical-muted">{p.age} 岁</td>
                      <td className="px-4 py-3 text-medical-muted">第 {p.currentCycle} 周期</td>
                      <td className="px-4 py-3"><StatusBadge type={cs.badge} label={cs.label} size="sm" /></td>
                      <td className="px-4 py-3 text-medical-muted">{p.doctor}</td>
                      <td className="px-4 py-3 text-medical-muted text-xs">{p.lastAssessmentDate ?? '—'}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/patients/${p.id}`)} className="text-xs text-medical-blue hover:underline">详情</button>
                          <span className="text-medical-border">|</span>
                          <button onClick={() => navigate('/assessment/new')} className="text-xs text-medical-blue hover:underline">新建评估</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* 卡片视图 */
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {paged.map(p => {
              const cs = CYCLE_STATUS_MAP[p.cycleStatus] ?? { label: p.cycleStatus, badge: 'pending' }
              return (
                <div
                  key={p.id}
                  className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/patients/${p.id}`)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-medical-blue flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">{p.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-medical-text">{p.name}</p>
                      <p className="text-xs text-medical-muted font-mono">{p.id}</p>
                    </div>
                    <StatusBadge type={cs.badge} label={cs.label} size="sm" />
                  </div>
                  <div className="space-y-1.5 text-xs text-medical-muted">
                    <p>年龄：{p.age} 岁 · 第 {p.currentCycle} 周期</p>
                    <p className="truncate">{p.diagnosis}</p>
                    <p>主治医师：{p.doctor}</p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-medical-border">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/patients/${p.id}`) }}
                      className="flex-1 text-xs text-center py-1.5 rounded border border-medical-border hover:border-medical-blue hover:text-medical-blue transition-colors"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/assessment/new') }}
                      className="flex-1 text-xs text-center py-1.5 rounded bg-medical-blue text-white hover:bg-medical-blue-dark transition-colors"
                    >
                      新建评估
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 分页 */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-medical-muted">
              共 {filtered.length} 条，当前第 {page}/{totalPages} 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-medical-border rounded-md text-medical-muted hover:border-medical-blue hover:text-medical-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`e${i}`} className="px-1 text-xs text-medical-muted">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-md border transition-colors ${
                        page === p
                          ? 'bg-medical-blue text-white border-medical-blue'
                          : 'border-medical-border text-medical-muted hover:border-medical-blue hover:text-medical-blue'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )
              }
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-medical-border rounded-md text-medical-muted hover:border-medical-blue hover:text-medical-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 新建患者弹窗 */}
      {showModal && (
        <NewPatientModal
          onClose={() => setShowModal(false)}
          onSave={handleNewPatient}
        />
      )}
    </div>
  )
}
