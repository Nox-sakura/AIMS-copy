/**
 * PatientDetail.jsx — 患者详情页
 *
 * 布局：左侧固定信息卡（sticky，宽 256px）+ 右侧主体滚动区
 *
 * 右侧区域：
 *   - IVF 周期 Tab：点击切换查看不同周期的评估记录
 *   - 胚胎评估时间线：彩色节点（Grade1绿/Grade2蓝/Grade3橙/Grade4红）
 *   - 医嘱记录：支持「添加医嘱」Modal，提交后 localOrders 追加到顶部
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, X, Phone, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import InfoCard from '../../components/InfoCard'
import TimelineItem from '../../components/TimelineItem'
import EmptyState from '../../components/EmptyState'
import { useAppContext } from '../../context/AppContext'
import { getPatientById } from '../../api/patients'
import { getAssessments } from '../../api/assessments'
import { formatDoctorWithTitle } from '../../utils/formatDoctor'

// 添加医嘱 Modal
function AddOrderModal({ doctorName, onClose, onSave }) {
  const [content, setContent] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-medical-text">添加医嘱</h3>
          <button onClick={onClose} className="text-medical-muted hover:text-medical-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">开嘱医师</label>
            <input readOnly value={doctorName} className="input-field bg-medical-bg text-medical-muted" />
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">医嘱内容 <span className="text-medical-red">*</span></label>
            <textarea
              rows={4}
              placeholder="请输入医嘱内容…"
              className="input-field resize-none"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">取消</button>
          <button
            onClick={() => onSave(content)}
            disabled={!content.trim()}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交医嘱
          </button>
        </div>
      </div>
    </div>
  )
}

const GRADE_COLORS = {
  grade1: 'bg-medical-green',
  grade2: 'bg-medical-blue',
  grade3: 'bg-medical-orange',
  grade4: 'bg-medical-red',
}

const CYCLE_RESULT_LABEL = {
  completed: { text: '已完成', cls: 'text-medical-green' },
  ongoing:   { text: '进行中', cls: 'text-medical-blue'  },
  failed:    { text: '未成功', cls: 'text-medical-red'   },
  cancelled: { text: '已取消', cls: 'text-medical-muted' },
  frozen:    { text: '全胚冷冻', cls: 'text-purple-600'  },
  preparing: { text: '准备中', cls: 'text-medical-muted' },
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, showToast } = useAppContext()

  const [patient, setPatient] = useState(null)
  const [allAssessments, setAllAssessments] = useState([])
  const [activeCycle, setActiveCycle] = useState(1)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [localOrders, setLocalOrders] = useState([])

  useEffect(() => {
    getPatientById(id).then(p => {
      if (p) {
        setPatient(p)
        setActiveCycle(p.currentCycle ?? 1)
        setLocalOrders(p.orders ?? [])
      }
    })
    getAssessments().then(setAllAssessments)
  }, [id])

  if (!patient) return null

  const cycleAssessments = allAssessments.filter(
    a => a.patientId === patient.id && a.cycleNo === activeCycle
  )

  const handleAddOrder = (content) => {
    const newOrder = {
      date: new Date().toISOString().slice(0, 10),
      content,
      doctor: currentUser?.name ?? '李明华',
    }
    setLocalOrders(prev => [newOrder, ...prev])
    setShowOrderModal(false)
    showToast('医嘱已添加', 'success')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`患者详情 — ${patient.name}`}
        breadcrumbs={[
          { label: '患者管理', path: '/patients' },
          { label: patient.name },
        ]}
        actions={
          !patient._isLegacy && (
            <button onClick={() => navigate('/assessment/new', { state: { prefilledPatient: patient } })} className="btn-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              新建评估
            </button>
          )
        }
      />

      <div className="p-6 flex gap-6 flex-1 overflow-auto">

        {/* ── 左侧信息卡片（sticky）── */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-4 space-y-4">
            <div className="card p-5">
              {/* 头像 + 基本信息 */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-medical-border">
                <div className="w-16 h-16 rounded-full bg-medical-blue flex items-center justify-center mb-3">
                  <span className="text-white text-2xl font-semibold">{patient.name[0]}</span>
                </div>
                <h3 className="text-base font-semibold text-medical-text">{patient.name}</h3>
                <p className="text-xs text-medical-muted font-mono mt-0.5">{patient.id}</p>
              </div>

              <div className="pt-4 space-y-3 text-sm">
                {[
                  { label: '年龄',     value: `${patient.age} 岁` },
                  { label: '科室',     value: patient.department },
                  { label: '主治医师', value: formatDoctorWithTitle(patient.doctor) },
                  { label: '入院日期', value: patient.admissionDate },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-2">
                    <span className="text-medical-muted flex-shrink-0">{row.label}</span>
                    <span className="text-medical-text text-right">{row.value}</span>
                  </div>
                ))}
                {/* 脱敏电话 */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-medical-muted flex-shrink-0">联系电话</span>
                  <span className="text-medical-text flex items-center gap-1">
                    <Phone className="w-3 h-3 text-medical-muted" />
                    {patient.phone}
                  </span>
                </div>
              </div>

              {patient.diagnosis && (
                <div className="mt-4 pt-4 border-t border-medical-border">
                  <p className="text-xs font-medium text-medical-muted mb-1.5">诊断</p>
                  <p className="text-sm text-medical-text leading-relaxed">{patient.diagnosis}</p>
                </div>
              )}

              {patient.notes && (
                <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs font-medium text-orange-700 mb-1">备注</p>
                  <p className="text-xs text-orange-700 leading-relaxed">{patient.notes}</p>
                </div>
              )}

              {!patient._isLegacy && (
                <button
                  onClick={() => navigate('/assessment/new', { state: { prefilledPatient: patient } })}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新建评估
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── 右侧主体 ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* 历史档案提示横幅 */}
          {patient._isLegacy && (
            <div className="card p-5 flex items-start gap-3 bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">历史档案</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  该患者为历史存档记录，详细周期数据、医嘱及评估报告尚未完成数字化迁移。
                  如需查阅，请联系信息科协助调取纸质档案。
                </p>
              </div>
            </div>
          )}

          {/* 周期、评估、医嘱：仅完整档案显示 */}
          {!patient._isLegacy && (
            <>
              {/* IVF 周期 Tab */}
              <InfoCard
                title="IVF 治疗周期"
                padding={false}
                actions={<span className="text-xs text-medical-muted">共 {patient.cycles.length} 个周期</span>}
              >
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {patient.cycles.map(c => {
                    const rl = CYCLE_RESULT_LABEL[c.result] ?? { text: c.result, cls: 'text-medical-muted' }
                    return (
                      <button
                        key={c.cycleNo}
                        onClick={() => setActiveCycle(c.cycleNo)}
                        className={[
                          'flex-shrink-0 flex flex-col items-start px-4 py-2.5 rounded-lg border text-sm transition-colors',
                          activeCycle === c.cycleNo
                            ? 'border-medical-blue bg-medical-blue-light text-medical-blue'
                            : 'border-medical-border bg-white text-medical-muted hover:border-medical-blue/40',
                        ].join(' ')}
                      >
                        <span className="font-medium">第 {c.cycleNo} 周期</span>
                        <span className="text-xs mt-0.5 opacity-75">{c.startDate}</span>
                        <span className={`text-xs mt-1 ${rl.cls}`}>{rl.text}</span>
                      </button>
                    )
                  })}
                </div>
              </InfoCard>

              {/* 胚胎评估时间线 */}
              <InfoCard
                title={`第 ${activeCycle} 周期 · 胚胎评估记录`}
                padding={false}
                actions={
                  <button onClick={() => navigate('/assessment/new', { state: { prefilledPatient: patient } })} className="text-xs text-medical-blue hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" />新建评估
                  </button>
                }
              >
                <div className="p-4">
                  {cycleAssessments.length === 0 ? (
                    <EmptyState
                      title="本周期暂无评估记录"
                      desc="点击右上角「新建评估」开始第一次评估"
                    />
                  ) : (
                    <div className="relative pl-6">
                      {/* 竖线 */}
                      <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-medical-border" />
                      {cycleAssessments.map((a, idx) => (
                        <div key={a.id} className="relative mb-5 last:mb-0">
                          {/* 节点圆点 */}
                          <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${GRADE_COLORS[a.grade] ?? 'bg-medical-muted'}`} />
                          <div className="bg-white border border-medical-border rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-medical-muted">{a.assessmentDate}</span>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full text-white ${GRADE_COLORS[a.grade] ?? 'bg-medical-muted'}`}>
                                    {a.gradeLabel}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-medical-text">胚胎编号：{a.embryoNo}</p>
                                <p className="text-xs text-medical-muted mt-0.5">操作医师：{formatDoctorWithTitle(a.doctor)}</p>
                              </div>
                              <button
                                onClick={() => navigate(`/assessment/${a.id}`)}
                                className="text-xs text-medical-blue hover:underline flex-shrink-0"
                              >
                                查看报告
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </InfoCard>

              {/* 医嘱记录 */}
              <InfoCard
                title="医嘱记录"
                actions={
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="text-xs text-medical-blue hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />添加医嘱
                  </button>
                }
              >
                {localOrders.length === 0 ? (
                  <EmptyState title="暂无医嘱记录" />
                ) : (
                  <div className="space-y-3">
                    {localOrders.map((o, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-medical-bg rounded-lg">
                        <div className="flex-shrink-0 text-right min-w-[72px]">
                          <p className="text-xs text-medical-muted">{o.date}</p>
                          <p className="text-xs font-medium text-medical-text mt-0.5">{o.doctor}</p>
                        </div>
                        <div className="w-px bg-medical-border flex-shrink-0" />
                        <p className="text-sm text-medical-text leading-relaxed flex-1">{o.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </InfoCard>
            </>
          )}
        </div>
      </div>

      {showOrderModal && !patient._isLegacy && (
        <AddOrderModal
          doctorName={currentUser?.name ?? '李明华'}
          onClose={() => setShowOrderModal(false)}
          onSave={handleAddOrder}
        />
      )}
    </div>
  )
}
