/**
 * DualStandardPanel.jsx — 双标准对比反馈面板（v3）
 * 内联嵌入于右列，不再作为独立列展示
 */
import { Cpu, UserCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { RETAINED_CONCEPTS } from '@/constants/educationConcepts'

/* ── Grade 配色（一级蓝色 → 二级浅蓝 → 三级浅绿 → 四级绿色）── */
export const GRADE_STYLES = {
  1: { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-500',    bar: 'bg-blue-400',    label: 'Grade 1' },
  2: { bg: 'bg-sky-100',     text: 'text-sky-700',     border: 'border-sky-400',     bar: 'bg-sky-400',     label: 'Grade 2' },
  3: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400', bar: 'bg-emerald-400', label: 'Grade 3' },
  4: { bg: 'bg-green-100',   text: 'text-green-700',   border: 'border-green-500',   bar: 'bg-green-400',   label: 'Grade 4' },
}

export function GradeBadge({ grade, size = 'md' }) {
  const s = GRADE_STYLES[grade]
  if (!s) return null
  const sizeClass = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-3 py-1 text-sm font-medium',
    lg: 'px-4 py-1.5 text-base font-semibold',
  }[size]
  return (
    <span
      className={`inline-flex items-center border rounded-lg ${s.bg} ${s.text} ${s.border} ${sizeClass}`}
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {s.label}
    </span>
  )
}

function ConceptScoreRow({ name, score }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-gray-600 truncate mr-1">{name}</span>
        <span className="text-gray-400 flex-shrink-0">{Math.round(score * 100)}%</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  )
}

function ModelCard({ caseData }) {
  return (
    <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-2.5">
      <div className="flex items-center gap-1.5">
        <Cpu className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-xs font-semibold text-gray-700">LWMA-Net 模型</span>
      </div>
      <GradeBadge grade={caseData.modelOutput.grade} size="sm" />
      <div className="space-y-1.5">
        {caseData.modelOutput.concepts.map(c => (
          <ConceptScoreRow key={c.name} name={c.name} score={c.score} />
        ))}
      </div>
      <p className="text-[10px] text-gray-400">AUC 0.9288 · Acc 76.52%</p>
    </div>
  )
}

function HumanCard({ caseData }) {
  return (
    <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-2.5">
      <div className="flex items-center gap-1.5">
        <UserCheck className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs font-semibold text-gray-700">人工标注</span>
      </div>
      <GradeBadge grade={caseData.humanLabel.grade} size="sm" />
      {/* 严格禁止显示任何置信度数值 */}
      <p className="text-xs text-gray-400 leading-relaxed">
        经验胚胎学家标注<br />
        <span className="text-[10px]">仅显示等级，不含置信度</span>
      </p>
    </div>
  )
}

function LearningTip({ userGrade, modelGrade, humanGrade }) {
  const allMatch     = userGrade === modelGrade && userGrade === humanGrade
  const disagreement = modelGrade !== humanGrade
  const matchEither  = userGrade === modelGrade || userGrade === humanGrade
  const humanConcepts = RETAINED_CONCEPTS[humanGrade] ?? []

  if (allMatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[88px]
                      p-5 bg-green-50 rounded-xl border border-green-200 text-center">
        <CheckCircle2 className="w-6 h-6 text-green-600 mb-2 flex-shrink-0" />
        <p className="text-sm font-semibold text-green-700">评估准确！</p>
        <p className="text-xs text-green-600 mt-1">与模型和人工标注完全一致。</p>
      </div>
    )
  }

  if (disagreement && matchEither) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[88px]
                      p-5 bg-orange-50 rounded-xl border border-orange-200 text-center">
        <AlertTriangle className="w-5 h-5 text-orange-500 mb-2 flex-shrink-0" />
        <p className="text-sm font-semibold text-orange-700">模型与人工标注存在分歧</p>
        <p className="text-xs text-orange-600 mt-1">
          LWMA-Net 模型判定 Grade {modelGrade}，人工标注 Grade {humanGrade}，
          建议综合参考两种标准。
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[88px]
                    p-5 bg-red-50 rounded-xl border border-red-200 text-center">
      <XCircle className="w-5 h-5 text-red-500 mb-2 flex-shrink-0" />
      <p className="text-sm font-semibold text-red-700">
        建议重点复习 Grade {humanGrade} 形态特征
      </p>
      <div className="flex flex-wrap justify-center gap-1 mt-2">
        {humanConcepts.slice(0, 5).map(c => (
          <span key={c}
                className="text-[10px] px-1.5 py-0.5 bg-white border border-red-200
                           text-red-600 rounded-full">
            {c}
          </span>
        ))}
        {humanConcepts.length > 5 && (
          <span className="text-[10px] text-red-400 self-center">
            +{humanConcepts.length - 5} 项
          </span>
        )}
      </div>
    </div>
  )
}

export default function DualStandardPanel({ caseData, userGrade, visible }) {
  if (!visible || !caseData || userGrade === null) return null

  return (
    <div className="space-y-4">

      {/* 你的评估 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          你的评估
        </span>
        <GradeBadge grade={userGrade} />
      </div>

      {/* 双标准对比卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <ModelCard caseData={caseData} />
        <HumanCard caseData={caseData} />
      </div>

      {/* 76.52% 说明文字 */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          模型准确率为 76.52%，与人工标注存在差异属正常现象，两者均可作为学习参考。
        </p>
      </div>

      {/* 学习结果提示（垂直居中于盒子内） */}
      <LearningTip
        userGrade={userGrade}
        modelGrade={caseData.modelOutput.grade}
        humanGrade={caseData.humanLabel.grade}
      />
    </div>
  )
}
