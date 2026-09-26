/**
 * AssessmentCompare.jsx — 多胚胎横向对比页
 *
 * 功能：
 *   - 最多同时对比6枚胚胎，通过 AddEmbryoModal 新增
 *   - 多列并排对比区：图像占位 + 评级 + 各维度概念进度条
 *   - RadarChart 雷达图：取前5个正向概念维度，多系列（每胚胎一色）
 *   - 移植优先级排序：可通过 ChevronUp/Down 手动调整顺序 → 确认后 showToast
 *
 * 颜色编码：COMPARE_COLORS 数组按顺序分配给各胚胎（蓝/绿/橙/紫/红/青）
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import InfoCard from '../../components/InfoCard'
import StatusBadge from '../../components/StatusBadge'
import PatientInfoBar from '../../components/common/PatientInfoBar'
import { useAppContext } from '../../context/AppContext'
import { assessments } from '../../mock/assessments'
import { concepts } from '../../mock/concepts'
import { patients } from '../../mock/patients'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, ResponsiveContainer, Tooltip,
} from 'recharts'

// 雷达图维度：取前5项正向指标
const RADAR_CONCEPTS = concepts.filter(c => c.direction === 'pos').slice(0, 5)

const COMPARE_COLORS = ['#1A6EBD', '#27AE60', '#E67E22', '#9B59B6', '#E74C3C', '#1ABC9C']

// 添加胚胎 Modal
function AddEmbryoModal({ all, selected, onAdd, onClose }) {
  const available = all.filter(a => !selected.find(s => s.id === a.id))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-medical-text">选择对比胚胎</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-medical-muted" /></button>
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-medical-muted text-center py-4">无更多可添加的胚胎</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {available.map(a => (
              <div
                key={a.id}
                onClick={() => onAdd(a)}
                className="flex items-center gap-3 p-3 rounded-lg border border-medical-border hover:border-medical-blue hover:bg-medical-blue-light cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-medical-text">{a.embryoNo}</p>
                  <p className="text-xs text-medical-muted">{a.patientId} · {a.assessmentDate}</p>
                </div>
                <StatusBadge type={a.grade} size="sm" />
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-secondary w-full mt-4">关闭</button>
      </div>
    </div>
  )
}

export default function AssessmentCompare() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useAppContext()

  const current     = assessments.find(a => a.id === id) ?? assessments[0]
  const patient     = patients.find(p => p.id === current.patientId)
  const samePatient = assessments.filter(a => a.patientId === current.patientId && a.id !== current.id)

  const [selected, setSelected] = useState([
    current,
    samePatient[0] ?? assessments[1],
    samePatient[1] ?? assessments[2],
  ])
  const [priority, setPriority] = useState(
    [current, samePatient[0] ?? assessments[1], samePatient[1] ?? assessments[2]].map(a => a.id)
  )
  const [showAddModal, setShowAddModal] = useState(false)

  const sortedSelected = priority.map(pid => selected.find(s => s.id === pid)).filter(Boolean)

  const addEmbryo = (a) => {
    if (selected.length >= 6) return
    setSelected(prev => [...prev, a])
    setPriority(prev => [...prev, a.id])
    setShowAddModal(false)
  }

  const removeEmbryo = (aId) => {
    if (selected.length <= 1) return
    setSelected(prev => prev.filter(s => s.id !== aId))
    setPriority(prev => prev.filter(p => p !== aId))
  }

  const movePriority = (idx, dir) => {
    const next = [...priority]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setPriority(next)
  }

  // 雷达图数据
  const radarData = RADAR_CONCEPTS.map(concept => {
    const row = { subject: concept.name }
    sortedSelected.forEach(a => {
      const s = a.conceptScores.find(s => s.id === concept.id)
      row[a.embryoNo] = s?.score ?? 0
    })
    return row
  })

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="多胚胎对比"
        breadcrumbs={[
          { label: '评估详情', path: `/assessment/${id}` },
          { label: '多胚胎对比' },
        ]}
        actions={
          <button onClick={() => navigate(`/assessment/${id}`)} className="btn-secondary">返回报告</button>
        }
      />

      <div className="p-6 space-y-4 flex-1 overflow-auto">
        {patient && <PatientInfoBar patient={patient} assessment={current} />}

        {/* ── 胚胎选择栏 ── */}
        <InfoCard
          title="已选胚胎"
          actions={<span className="text-xs text-medical-muted">最多可选 6 枚，已选 {selected.length}/6</span>}
        >
          <div className="flex flex-wrap gap-2 items-center">
            {sortedSelected.map((a, i) => (
              <div
                key={a.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: COMPARE_COLORS[i], backgroundColor: COMPARE_COLORS[i] + '18' }}
              >
                <span className="font-medium" style={{ color: COMPARE_COLORS[i] }}>{a.embryoNo}</span>
                <StatusBadge type={a.grade} size="sm" />
                <button
                  onClick={() => removeEmbryo(a.id)}
                  className="text-medical-muted hover:text-medical-red ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {selected.length < 6 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-medical-border text-sm text-medical-muted hover:border-medical-blue hover:text-medical-blue transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加对比胚胎
              </button>
            )}
          </div>
        </InfoCard>

        {/* ── 并排对比栏 ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sortedSelected.length}, minmax(0, 1fr))` }}>
          {sortedSelected.map((a, colIdx) => (
            <div key={a.id} className="card overflow-hidden">
              {/* 列头 */}
              <div
                className="px-3 py-2.5 text-white text-center text-sm font-semibold"
                style={{ backgroundColor: COMPARE_COLORS[colIdx] }}
              >
                {a.embryoNo}
              </div>
              <div className="p-3 space-y-3">
                {/* 图像缩略图 */}
                <div className="aspect-[4/3] rounded-lg bg-gray-200 flex items-center justify-center border border-medical-border">
                  <p className="text-xs text-medical-muted">显微镜图</p>
                </div>
                {/* 评级 */}
                <div className="text-center">
                  <StatusBadge type={a.grade} />
                  <p className="text-xs text-medical-muted mt-1">置信度 {(a.confidence * 100).toFixed(1)}%</p>
                </div>
                {/* 概念得分条 */}
                <div className="space-y-2">
                  {a.conceptScores.slice(0, 5).map(s => {
                    const c = concepts.find(cc => cc.id === s.id)
                    const isPos = c?.direction !== 'neg'
                    return (
                      <div key={s.id}>
                        <div className="flex justify-between text-[10px] text-medical-muted mb-0.5">
                          <span className="truncate">{c?.name ?? s.id}</span>
                          <span className="flex-shrink-0 ml-1">{s.score.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${isPos ? 'bg-medical-blue' : 'bg-medical-red'}`}
                            style={{ width: `${Math.min(100, s.score)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 雷达图对比 ── */}
        <InfoCard title="概念维度雷达对比（5维度）">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#DDE3EC" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#7F8C8D' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDE3EC' }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              {sortedSelected.map((a, idx) => (
                <Radar
                  key={a.id}
                  name={a.embryoNo}
                  dataKey={a.embryoNo}
                  stroke={COMPARE_COLORS[idx]}
                  fill={COMPARE_COLORS[idx]}
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </InfoCard>

        {/* ── 优先级排序 ── */}
        <InfoCard title="移植优先级排序">
          <div className="space-y-2">
            {sortedSelected.map((a, idx) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 bg-medical-bg rounded-lg border border-medical-border"
              >
                <span className="text-medical-muted text-sm select-none">⠿</span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: COMPARE_COLORS[idx] }}
                >
                  {idx + 1}
                </div>
                <span className="font-medium text-medical-text flex-1">{a.embryoNo}</span>
                <StatusBadge type={a.grade} size="sm" />
                <span className="text-xs text-medical-muted">置信 {(a.confidence * 100).toFixed(0)}%</span>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => movePriority(idx, -1)}
                    disabled={idx === 0}
                    className="text-medical-muted hover:text-medical-blue disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => movePriority(idx, 1)}
                    disabled={idx === sortedSelected.length - 1}
                    className="text-medical-muted hover:text-medical-blue disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => showToast('移植优先级已标记', 'success')}
              className="btn-primary"
            >
              确认优先级
            </button>
          </div>
        </InfoCard>
      </div>

      {showAddModal && (
        <AddEmbryoModal
          all={assessments}
          selected={selected}
          onAdd={addEmbryo}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
