import { getMorphologyEvidence, evidenceSummary } from '../../utils/morphologyEvidence'
import MorphologyImages from '../../components/common/MorphologyImages'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, GitCompare, ChevronDown, ChevronUp, CheckCircle, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import InfoCard from '../../components/InfoCard'
import ConfirmModal from '../../components/ConfirmModal'
import PatientInfoBar from '../../components/common/PatientInfoBar'
import { ConceptCardGroup } from '../../components/common/ConceptCard'
import PDFPreviewModal from '../../components/report/PDFPreviewModal'
import { useAppContext } from '../../context/AppContext'
import { getAssessmentById } from '../../api/assessments'
import { getPatientById } from '../../api/patients'
import { formatDoctorWithTitle } from '../../utils/formatDoctor'

const GRADE_COLOR = {
  grade1: 'text-[#1A5276]',
  grade2: 'text-medical-blue',
  grade3: 'text-[#1E8449]',
  grade4: 'text-[#196F3D]',
}

const GRADE_BG = {
  grade1: 'bg-[#D6EAF8] border-[#AED6F1]',
  grade2: 'bg-[#AED6F1] border-[#7FB3D3]',
  grade3: 'bg-[#D5F5E3] border-[#A9DFBF]',
  grade4: 'bg-[#A9DFBF] border-[#82C9A0]',
}

const MODEL_DISPLAY = {
  'MCA-Lite':     '轻量版（演示）',
  'MCA-Standard': '标准版（演示）',
  'MCA-Pro':      '精准版（演示）',
}

const QUICK_NOTES = [
  '同意AI评级',
  '形态学良好，建议优先移植',
  '需进一步复核',
  '碎片化偏高，谨慎评估',
  '细胞均一性轻度偏差，可接受',
  '已与患者沟通',
  '建议冷冻保存',
  '图像质量一般，评级仅供参考',
]

/* ── 修改评级 Modal ── */
function ModifyGradeModal({ current, onClose, onSave }) {
  const [grade, setGrade] = useState(current)
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-medical-text">修改胚胎评级</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-medical-muted" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">调整后评级</label>
            <select className="input-field" value={grade} onChange={e => setGrade(e.target.value)}>
              {['grade1','grade2','grade3','grade4'].map(g => (
                <option key={g} value={g}>{g.replace('grade', 'Grade ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-medical-text mb-1.5">
              修改理由 <span className="text-medical-red">*</span>
              <span className="text-xs text-medical-muted font-normal ml-1">（医疗合规必填）</span>
            </label>
            <textarea
              rows={3}
              placeholder="请说明修改评级的临床依据…"
              className="input-field resize-none"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">取消</button>
          <button
            onClick={() => onSave(grade, reason)}
            disabled={!reason.trim()}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 备注输入区 ── */
function NoteInput({ onSave, initialValue = '' }) {
  const [text, setText] = useState(initialValue)
  return (
    <div className="space-y-2 mt-2">
      <textarea
        rows={3}
        placeholder="请输入备注内容…"
        className="input-field resize-none text-sm"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        onClick={() => { if (text.trim()) onSave(text); setText('') }}
        disabled={!text.trim()}
        className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        提交备注
      </button>
    </div>
  )
}

export default function AssessmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    showToast,
    currentUser,
    reports: contextReports,
    confirmReport,
    rejectReport,
    modifyReportGrade,
    updateAssessmentStatus,
  } = useAppContext()

  const [assessment, setAssessment]       = useState(null)
  const [patient, setPatient]             = useState(null)

  const [confirmOpen, setConfirmOpen]     = useState(false)
  const [rejectOpen, setRejectOpen]       = useState(false)
  const [modifyOpen, setModifyOpen]       = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [historyOpen, setHistoryOpen]     = useState(true)
  const [confirmed, setConfirmed]         = useState(false)
  const [showPDF, setShowPDF]             = useState(false)
  const [notes, setNotes]                 = useState([])
  const [currentGrade, setCurrentGrade]   = useState(null)
  const [currentGradeLabel, setGradeLabel]= useState(null)
  // 操作记录本地状态（操作后实时追加）
  const [localVersions, setLocalVersions] = useState([])
  useEffect(() => {
    getAssessmentById(id).then(data => {
      if (data) {
        setAssessment(data)
        setNotes(data.doctorNote ? [{ text: data.doctorNote, author: data.doctor, date: data.assessmentDate }] : [])
        setCurrentGrade(data.grade)
        setGradeLabel(data.gradeLabel)
        setLocalVersions(data.versions ?? [])
      }
    })
  }, [id])

  useEffect(() => {
    if (assessment?.patientId) {
      getPatientById(assessment.patientId).then(setPatient)
    }
  }, [assessment?.patientId])

  // 热力图联动状态
  const [hoveredConcept, setHoveredConcept] = useState(null)
  const [quickNoteValue, setQuickNoteValue] = useState('')

  if (!assessment) return null
  const a = assessment

  const relatedReport = contextReports.find(r => r.assessmentId === a.id)
  const relatedReportId = relatedReport?.id ?? null

  const enrichedScores = getMorphologyEvidence(a)


    const appendVersion = (note, grade) => {
    setLocalVersions(prev => {
      let nextVer
      if (prev.length === 0) {
        nextVer = 'v1.0'
      } else {
        const lastVer = prev[prev.length - 1].version
        const match = lastVer.match(/v(\d+)\.(\d+)/)
        nextVer = match
          ? `v${match[1]}.${parseInt(match[2]) + 1}`
          : 'v1.1'
      }
      const now = new Date().toLocaleString('sv').replace('T', ' ').slice(0, 16)
      return [
        ...prev,
        {
          version: nextVer,
          date:    now,
          doctor:  '李明华',
          grade:   grade ?? currentGrade,
          note,
        },
      ]
    })
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    setConfirmed(true)
    if (relatedReportId) {
      confirmReport(relatedReportId, currentUser?.name ?? a.doctor)
    }
    updateAssessmentStatus(a.id, 'approved')
    appendVersion('终审通过，确认评级', currentGrade)
    showToast(`报告 ${a.id} 已确认评级`, 'success')
  }

  const handleReject = () => {
    setRejectOpen(false)
    if (relatedReportId) {
      rejectReport(relatedReportId, currentUser?.name ?? a.doctor)
    }
    updateAssessmentStatus(a.id, 'rejected')
    appendVersion('报告已驳回，退回提交医师', currentGrade)
    showToast('报告已驳回，已通知提交医师', 'warning')
  }

  const handleModify = (newGrade, reason) => {
    setModifyOpen(false)
    setCurrentGrade(newGrade)
    const gradeMap = {
      grade1: '一级胚胎', grade2: '二级胚胎',
      grade3: '三级胚胎', grade4: '四级胚胎',
    }
    setGradeLabel(gradeMap[newGrade] ?? newGrade)
    if (relatedReportId) {
      modifyReportGrade(relatedReportId, newGrade)
    }
    updateAssessmentStatus(a.id, 'reviewing')
    appendVersion(
      reason ? `修改评级为${gradeMap[newGrade] ?? newGrade}，依据：${reason}` : `修改评级为${gradeMap[newGrade] ?? newGrade}`,
      newGrade
    )
    showToast(`评级已修改为 ${gradeMap[newGrade] ?? newGrade}`, 'success')
  }

  const handleAddNote = (text) => {
    setNotes(prev => [...prev, { text, author: currentUser?.name ?? '当前医师', date: new Date().toLocaleString('sv').replace('T', ' ').slice(0, 16) }])
    setShowNoteInput(false)
    showToast('备注已添加', 'success')
  }

  const handlePDFExported = () => {
    // 追加导出记录（mock）
    showToast('PDF 已导出，记录已更新', 'success')
  }

  const doctorLabel = formatDoctorWithTitle(a.doctor)
  const modelLabel  = a.simulated === false ? '分级模型' : MODEL_DISPLAY[a.modelUsed] ?? '标准版（演示）'

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="评估详情"
        breadcrumbs={[
          { label: '报告管理', path: '/reports' },
          { label: `${a.embryoNo} 评估报告` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(`/assessment/${a.id}/compare`)} className="btn-secondary flex items-center gap-1.5">
              <GitCompare className="w-4 h-4" />
              多胚胎对比
            </button>
            <button
              onClick={() => setShowPDF(true)}
              className="btn-primary flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-4 flex-1 overflow-auto">

        {/* PatientInfoBar */}
        {patient && (
          <PatientInfoBar patient={patient} assessment={a} cycleNo={a.cycleNo} />
        )}

        {/* ── 报告头部信息栏 ── */}
        <InfoCard padding={false}>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-px bg-medical-border">
            {[
              { label: '报告编号', value: a.id },
              { label: '版本',     value: a.reportVersion },
              { label: '状态',     value: null, badge: a.status },
              { label: '患者ID',   value: a.patientId },
              { label: '胚胎编号', value: a.embryoNo },
              { label: '操作医师', value: doctorLabel },
              { label: '使用模型', value: `${modelLabel}`, sub: a.simulated === false ? '模型返回结果' : '分级演示数据' },
            ].map(row => (
              <div key={row.label} className="bg-white px-4 py-3">
                <p className="text-xs text-medical-muted mb-0.5">{row.label}</p>
                {row.badge
                  ? <StatusBadge type={row.badge} size="sm" />
                  : (
                    <div>
                      <p className="text-sm font-medium text-medical-text leading-snug">{row.value}</p>
                      {row.sub && <p className="text-xs text-medical-muted">{row.sub}</p>}
                    </div>
                  )
                }
              </div>
            ))}
          </div>
        </InfoCard>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* ── 左侧：图像 + 结论 + 备注 ── */}
          <div className="xl:col-span-3 space-y-4">

            {/* 图像展示区 */}
            <InfoCard title="图像展示" actions={
              a.imageProcessed && (
                <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded">已预处理</span>
              )
            }>
              <MorphologyImages record={a} selected={enrichedScores.find(e => e.id === hoveredConcept)} />
            </InfoCard>

            {/* 综合评级结论区 */}
            <InfoCard title="综合评级结论">
              <div className={`rounded-lg border p-5 mb-4 ${GRADE_BG[currentGrade] ?? 'bg-medical-bg border-medical-border'}`}>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className={`text-5xl font-bold ${GRADE_COLOR[currentGrade]}`}>{currentGradeLabel}</p>
                    <p className="text-xs text-medical-muted mt-1">综合评级</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-medical-muted">AI 置信度</span>
                      <span className="font-semibold text-medical-text">{(a.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-2">
                      <div className="h-2 rounded-full bg-medical-blue transition-all" style={{ width: `${a.confidence * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-medical-muted">
                      <span>{a.simulated === false ? '性能以独立验证为准' : '演示分级结果，非本项目实测性能'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-medical-bg rounded-lg p-4">
                <p className="text-xs font-medium text-medical-muted mb-2">形态观察说明</p>
                <p className="text-sm text-medical-text leading-relaxed">{evidenceSummary(a)}</p>
              </div>
            </InfoCard>

            {/* 备注列表 */}
            {notes.length > 0 && (
              <InfoCard title="医师备注">
                <div className="space-y-3">
                  {notes.map((n, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-medical-bg rounded-lg">
                      <div className="flex-shrink-0 text-right min-w-[64px]">
                        <p className="text-xs text-medical-muted">{n.date}</p>
                        <p className="text-xs font-medium text-medical-text mt-0.5">{n.author}</p>
                      </div>
                      <div className="w-px bg-medical-border flex-shrink-0" />
                      <p className="text-sm text-medical-text flex-1 leading-relaxed">{n.text}</p>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>

          {/* ── 右侧：概念评分卡 + 复核操作 + 版本历史 ── */}
          <div className="xl:col-span-2 space-y-4">

            {/* 形态证据解析（卡片式） */}
            <InfoCard title="形态证据解析">
              <ConceptCardGroup
                scores={enrichedScores}
                hoveredId={hoveredConcept}
                onHover={setHoveredConcept}
              />
            </InfoCard>

            {/* 医师复核操作栏 */}
            <InfoCard title="医师复核">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-medical-muted">当前状态</span>
                  <StatusBadge type={confirmed ? 'approved' : a.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-medical-muted">当前评级</span>
                  <StatusBadge type={currentGrade} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setConfirmOpen(true)}
                    disabled={confirmed}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-colors
                      bg-medical-green text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {confirmed ? '已确认' : '确认评级'}
                  </button>
                  <button
                    onClick={() => setModifyOpen(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium border border-medical-blue text-medical-blue hover:bg-medical-blue-light transition-colors"
                  >
                    修改评级
                  </button>
                </div>
                <button onClick={() => setRejectOpen(true)} className="w-full btn-danger text-sm">
                  驳回报告
                </button>
                <button
                  onClick={() => setShowNoteInput(v => !v)}
                  className="w-full btn-ghost text-sm border border-medical-border"
                >
                  {showNoteInput ? '收起备注' : '+ 添加备注'}
                </button>
                {showNoteInput && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <p className="text-xs text-medical-muted mb-2">快捷备注</p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_NOTES.map(note => (
                          <button
                            key={note}
                            onClick={() => setQuickNoteValue(note)}
                            className="text-xs px-2.5 py-1 rounded-full border border-medical-border
                                       text-medical-muted hover:border-medical-blue hover:text-medical-blue
                                       hover:bg-medical-blue-light transition-colors"
                          >
                            {note}
                          </button>
                        ))}
                      </div>
                    </div>
                    <NoteInput
                      key={quickNoteValue}
                      initialValue={quickNoteValue}
                      onSave={handleAddNote}
                    />
                  </div>
                )}
              </div>
            </InfoCard>

            {/* 版本历史（可折叠） */}
            <InfoCard
              title="操作记录"
              padding={false}
              actions={
                <button
                  onClick={() => setHistoryOpen(v => !v)}
                  className="text-xs text-medical-muted hover:text-medical-text flex items-center gap-1"
                >
                  {historyOpen ? <><ChevronUp className="w-3.5 h-3.5" />收起</> : <><ChevronDown className="w-3.5 h-3.5" />展开</>}
                </button>
              }
            >
              {historyOpen && (
                <div className="divide-y divide-medical-border">
                  {localVersions.map(v => (
                    <div key={v.version} className="flex items-start gap-3 px-4 py-3">
                      <span className="text-xs font-mono bg-medical-bg border border-medical-border px-1.5 py-0.5 rounded text-medical-muted flex-shrink-0 mt-0.5">
                        {v.version}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-medical-text">{v.note}</p>
                        <p className="text-xs text-medical-muted mt-0.5">
                          {formatDoctorWithTitle(v.doctor)} · {v.date}
                        </p>
                      </div>
                      <StatusBadge type={v.grade} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </InfoCard>
          </div>
        </div>
      </div>

      {/* 确认评级弹窗 */}
      <ConfirmModal
        open={confirmOpen}
        title="确认评级"
        message={`确认对报告 ${a.id}（${currentGradeLabel}）进行终审？此操作将记入操作日志。`}
        confirmLabel="确认终审"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* 驳回弹窗 */}
      <ConfirmModal
        open={rejectOpen}
        title="确认驳回报告"
        message="驳回后报告将退回至提交医师，请在备注中说明驳回原因。"
        confirmLabel="确认驳回"
        danger
        onConfirm={handleReject}
        onCancel={() => setRejectOpen(false)}
      />

      {/* 修改评级弹窗 */}
      {modifyOpen && (
        <ModifyGradeModal
          current={currentGrade}
          onClose={() => setModifyOpen(false)}
          onSave={handleModify}
        />
      )}

      {/* PDF预览导出弹窗 */}
      {showPDF && (
        <PDFPreviewModal
          assessment={{ ...a, grade: currentGrade, gradeLabel: currentGradeLabel }}
          patient={patient}
          onClose={() => setShowPDF(false)}
          onExported={handlePDFExported}
        />
      )}
    </div>
  )
}
