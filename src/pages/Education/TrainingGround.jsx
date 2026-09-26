/**
 * TrainingGround.jsx — 胚胎评估训练场（v3）
 * 两列布局：左列（图像 + 案例列表） / 右列（评估 + 反馈合并）+ 底部进度条
 */
import { useState, useEffect } from 'react'
import { Microscope, ClipboardList, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useEducation } from './EducationLayout'
import { useAuth } from '@/context/AppContext'
import { logEducationAction, EDUCATION_ACTIONS } from '@/utils/educationLogger'
import CaseImagePanel from '@/components/education/CaseImagePanel'
import TrainingCaseCard from '@/components/education/TrainingCaseCard'
import DualStandardPanel, { GRADE_STYLES } from '@/components/education/DualStandardPanel'
import LearningProgressBar from '@/components/education/LearningProgressBar'
import { RETAINED_CONCEPTS } from '@/constants/educationConcepts'

/* ── Grade 筛选按钮 ── */
function GradeFilterBtn({ value, active, onClick }) {
  const label = value === 'all' ? '全部' : `G${value}`
  const activeStyle = value === 'all'
    ? 'bg-blue-600 text-white'
    : {
        1: 'bg-blue-500 text-white',
        2: 'bg-sky-500 text-white',
        3: 'bg-emerald-500 text-white',
        4: 'bg-green-500 text-white',
      }[value]

  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                  ${active
                    ? activeStyle
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  )
}

/* ── 图像占位（未选案例时） ── */
function EmptyImageState() {
  return (
    <div className="aspect-[3/2] rounded-xl border-2 border-dashed border-gray-200
                    bg-gray-50 flex flex-col items-center justify-center gap-2">
      <Microscope className="w-8 h-8 text-gray-200" />
      <p className="text-xs text-gray-400">请从下方列表选择案例</p>
    </div>
  )
}

/* ── 右列空状态 ── */
function EmptyAssessmentState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      <ClipboardList className="w-10 h-10 text-gray-200" />
      <p className="text-sm text-gray-400">从左侧选择案例后开始评估</p>
    </div>
  )
}

/* ── 等级选择区 ── */
function GradeSelector({ userGrade, onChange, disabled }) {
  const options = [
    { g: 1, desc: '细胞均一，碎片 < 10%' },
    { g: 2, desc: '轻度不均一，碎片 10–25%' },
    { g: 3, desc: '明显不均一，碎片 25–50%' },
    { g: 4, desc: '严重碎片化，碎片 > 50%' },
  ]

  return (
    <section>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
        选择评估等级
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {options.map(({ g, desc }) => {
          const s = GRADE_STYLES[g]
          const isActive = userGrade === g
          return (
            <button
              key={g}
              onClick={() => !disabled && onChange(g)}
              disabled={disabled}
              className={`p-3 rounded-xl border-2 text-left transition-all duration-150
                          ${isActive
                            ? `${s.border} ${s.bg} shadow-sm`
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}
                          disabled:cursor-default`}
            >
              <p
                className={`text-sm font-semibold ${isActive ? s.text : 'text-gray-600'}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Grade {g}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* ── 概念评估（折叠，可选） ── */
function ConceptAssessment({ grade, selected, onToggle, disabled }) {
  return (
    <details className="group">
      <summary className="flex items-center justify-between cursor-pointer
                           list-none select-none text-xs text-gray-500
                           hover:text-gray-700">
        <span className="flex items-center gap-1.5 font-medium">
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
          概念评估（可选）
        </span>
        <span className="text-gray-400">帮助你深化理解</span>
      </summary>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {(RETAINED_CONCEPTS[grade] ?? []).map(concept => (
          <button
            key={concept}
            onClick={() => !disabled && onToggle(concept)}
            disabled={disabled}
            className={`text-xs px-2 py-1 rounded-full border transition-all
                        ${selected.includes(concept)
                          ? 'bg-blue-100 border-blue-400 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}
                        disabled:cursor-default`}
          >
            {concept}
          </button>
        ))}
      </div>
    </details>
  )
}

/* ── 右列评估 + 反馈合并面板 ── */
function AssessmentPanel({ caseData, learningRecord, updateLearningRecord }) {
  const { user: currentUser } = useAuth()
  const [userGrade, setUserGrade] = useState(null)
  const [selectedConcepts, setSelectedConcepts] = useState([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  /* 切换案例时（key 触发）恢复已提交状态 */
  useEffect(() => {
    const record = learningRecord[caseData.id]
    if (record?.submitted) {
      setIsSubmitted(true)
      setShowPanel(true)
      setUserGrade(record.userGrade)
    }
  }, [])

  const toggleConcept = (concept) => {
    setSelectedConcepts(prev =>
      prev.includes(concept) ? prev.filter(c => c !== concept) : [...prev, concept]
    )
  }

  const handleSubmit = () => {
    if (userGrade === null || isSubmitted) return
    setIsSubmitted(true)
    setShowPanel(true)
    updateLearningRecord(caseData.id, userGrade)
    logEducationAction(
      currentUser?.id ?? 'unknown',
      EDUCATION_ACTIONS.VIEW_FEEDBACK,
      { caseId: caseData.id }
    )
  }

  return (
    <div className="p-5 space-y-5 max-w-2xl">

      {/* ① 选择评估等级 */}
      <GradeSelector
        userGrade={userGrade}
        onChange={setUserGrade}
        disabled={isSubmitted}
      />

      {/* ② 概念评估（折叠，可选） */}
      <ConceptAssessment
        grade={caseData.grade}
        selected={selectedConcepts}
        onToggle={toggleConcept}
        disabled={isSubmitted}
      />

      {/* ③ 提交按钮 */}
      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={userGrade === null}
          className="w-full py-2.5 bg-blue-600 text-white rounded-xl
                     text-sm font-medium hover:bg-blue-700 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          提交评估
        </button>
      ) : (
        <button
          onClick={() => setShowPanel(true)}
          className="w-full py-2.5 border-2 border-green-500 text-green-700
                     rounded-xl text-sm font-medium hover:bg-green-50
                     transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          已完成 · 查看反馈
        </button>
      )}

      {/* ④ 分隔线（提交后出现） */}
      {showPanel && <div className="border-t border-gray-200 pt-1" />}

      {/* ⑤ 双标准反馈面板 */}
      <DualStandardPanel
        caseData={caseData}
        userGrade={userGrade}
        visible={showPanel}
      />
    </div>
  )
}

/* ── 页面根组件 ── */
export default function TrainingGround() {
  const { cases, learningRecord, updateLearningRecord } = useEducation()
  const { user: currentUser } = useAuth()

  const [gradeFilter, setGradeFilter] = useState('all')
  const [selectedCase, setSelectedCase] = useState(null)

  const filteredCases = gradeFilter === 'all'
    ? cases
    : cases.filter(c => c.grade === gradeFilter)

  const handleSelectCase = (caseData) => {
    setSelectedCase(caseData)
    logEducationAction(
      currentUser?.id ?? 'unknown',
      EDUCATION_ACTIONS.START_CASE,
      { caseId: caseData.id }
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* 主体双列区 */}
      <div className="flex flex-1 gap-0 overflow-hidden min-h-0">

        {/* ── 左列 ── */}
        <div className="w-[30%] flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">

          {/* 图像区（固定，不随列表滚动） */}
          <div className="flex-shrink-0 p-4 border-b border-gray-100">
            {selectedCase
              ? <CaseImagePanel caseData={selectedCase} showNavigation={false} />
              : <EmptyImageState />}
          </div>

          {/* Grade 筛选 */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5
                          border-b border-gray-100 bg-gray-50">
            {['all', 1, 2, 3, 4].map(g => (
              <GradeFilterBtn
                key={g}
                value={g}
                active={gradeFilter === g}
                onClick={() => setGradeFilter(g)}
              />
            ))}
          </div>

          {/* 案例列表（可滚动） */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredCases.map(c => (
              <TrainingCaseCard
                key={c.id}
                caseData={c}
                isSelected={selectedCase?.id === c.id}
                isCompleted={!!learningRecord[c.id]?.submitted}
                onClick={() => handleSelectCase(c)}
              />
            ))}
            {filteredCases.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">
                暂无该等级的训练案例
              </p>
            )}
          </div>
        </div>

        {/* ── 右列（固定视口高度，内部滚动） ── */}
        <div className="flex-1 h-full overflow-y-auto bg-gray-50">
          {selectedCase
            ? <AssessmentPanel
                key={selectedCase.id}
                caseData={selectedCase}
                learningRecord={learningRecord}
                updateLearningRecord={updateLearningRecord}
              />
            : <EmptyAssessmentState />}
        </div>
      </div>

      {/* 底部进度条 */}
      <LearningProgressBar cases={cases} learningRecord={learningRecord} />
    </div>
  )
}
