import { getMorphologyEvidence, evidenceText } from '../../utils/morphologyEvidence'
/**
 * AgentResultCard.jsx — AI 助手结构化结果卡片
 *
 * Props:
 *   type       — 'patient_list' | 'report_list' | 'report_summary'
 *   data       — 对应类型的数据
 *   onNavigate — (path: string) => void，跳转回调
 *
 * 保留原有等级配色。
 */
import { useState } from 'react'
import { Users, FileText, Copy, Check } from 'lucide-react'

const GRADE_STYLES = {
  grade1: { bg: '#D6EAF8', border: '#AED6F1', color: '#1A6EBD', label: 'Grade 1' },
  grade2: { bg: '#D0E8F8', border: '#7FB3D3', color: '#1A6EBD', label: 'Grade 2' },
  grade3: { bg: '#D5F5E3', border: '#A9DFBF', color: '#27AE60', label: 'Grade 3' },
  grade4: { bg: '#E8F8EF', border: '#82C9A0', color: '#27AE60', label: 'Grade 4' },
}

const STATUS_LABELS = {
  pending: '待复核',
  reviewing: '复核中',
  approved: '已终审',
  rejected: '已驳回',
}

export default function AgentResultCard({ type, data, onNavigate }) {
  const [copied, setCopied] = useState(false)

  /* ── 患者搜索结果 ── */
  if (type === 'patient_list') {
    return (
      <div className="bg-white border border-medical-border rounded-xl p-3 text-sm">
        <div className="flex items-center gap-1.5 mb-2 font-medium text-medical-text">
          <Users className="w-4 h-4 text-medical-blue" />
          <span>找到 {data.length} 位患者</span>
        </div>
        <div className="space-y-1">
          {data.map(p => (
            <div
              key={p.id}
              className="flex items-center justify-between py-1.5 border-b border-medical-border/50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-medical-muted flex-shrink-0">{p.id}</span>
                <span className="font-medium truncate">{p.name}</span>
                <span className="text-medical-muted text-xs flex-shrink-0">{p.age}岁</span>
                <span className="text-medical-muted text-xs flex-shrink-0">{p.doctor}</span>
              </div>
              <button
                onClick={() => onNavigate('/patients/' + p.id)}
                className="text-medical-blue text-xs hover:underline flex-shrink-0 ml-2"
              >
                查看报告
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── 报告列表 ── */
  if (type === 'report_list') {
    return (
      <div className="bg-white border border-medical-border rounded-xl p-3 text-sm">
        <div className="flex items-center gap-1.5 mb-2 font-medium text-medical-text">
          <FileText className="w-4 h-4 text-medical-blue" />
          <span>共 {data.length} 份评估记录</span>
        </div>
        <div className="space-y-1">
          {data.map(r => {
            const gs = GRADE_STYLES[r.grade] ?? GRADE_STYLES.grade1
            return (
              <div
                key={r.id}
                className="flex items-center justify-between py-1.5 border-b border-medical-border/50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    style={{ backgroundColor: gs.bg, borderColor: gs.border, color: gs.color }}
                    className="border text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                  >
                    {gs.label}
                  </span>
                  <span className="font-mono text-xs text-medical-muted flex-shrink-0">{r.embryoNo}</span>
                  <span className="text-medical-muted text-xs flex-shrink-0">
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                  <span className="text-medical-muted text-xs flex-shrink-0 hidden sm:inline">
                    {r.assessmentDate}
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('/assessment/' + r.id)}
                  className="text-medical-blue text-xs hover:underline flex-shrink-0 ml-2"
                >
                  查看详情
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── 胚胎形态观察对比 ── */
  if (type === 'embryo_comparison') {
    const { patientName, cycleNo, embryos } = data
    // 取第一条评估的概念列表作为行标题（所有评估概念 ID 相同）
    const conceptRows = getMorphologyEvidence(embryos[0])

    return (
      <div className="bg-white border border-medical-border rounded-xl p-3 text-sm space-y-3">
        {/* 标题行 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-medical-text">
            <FileText className="w-4 h-4 text-medical-blue flex-shrink-0" />
            <span>{patientName} · 第{cycleNo}周期 · {embryos.length} 枚胚胎形态观察对比</span>
          </div>
        </div>

        {/* 胚胎列头 */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `1fr repeat(${embryos.length}, minmax(0,1fr))` }}>
          <div className="text-xs text-medical-muted font-medium py-1">观察项</div>
          {embryos.map(e => {
            const gs = GRADE_STYLES[e.grade] ?? GRADE_STYLES.grade1
            return (
              <div key={e.id} className="text-center">
                <span
                  style={{ backgroundColor: gs.bg, borderColor: gs.border, color: gs.color }}
                  className="border text-xs font-semibold px-1.5 py-0.5 rounded block truncate"
                >
                  {gs.label}
                </span>
                <div className="text-[10px] text-medical-muted mt-0.5 truncate">{e.embryoNo}</div>
                <div className="text-[10px] text-medical-muted">{e.assessmentDate}</div>
              </div>
            )
          })}
        </div>

        {/* 形态观察行 */}
        <div className="space-y-2 border-t border-medical-border/50 pt-2">
          {conceptRows.map(cs => {
            return (
              <div key={cs.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: `1fr repeat(${embryos.length}, minmax(0,1fr))` }}>
                {/* 概念名 */}
                <div className="text-xs text-medical-muted leading-tight">{cs.name}</div>
                {/* 各胚胎该形态观察 */}
                {embryos.map(e => {
                  const item = getMorphologyEvidence(e).find(s => s.id === cs.id)
                  return <div key={e.id} className="text-[10px] text-medical-muted">{evidenceText(item)}<br/>{item.sourceLabel}</div>
                })}
              </div>
            )
          })}
        </div>

        {/* 综合置信度行 */}
        <div className="border-t border-medical-border/50 pt-2 grid gap-2" style={{ gridTemplateColumns: `1fr repeat(${embryos.length}, minmax(0,1fr))` }}>
          <div className="text-xs text-medical-muted font-medium">综合置信度</div>
          {embryos.map(e => {
            const gs = GRADE_STYLES[e.grade] ?? GRADE_STYLES.grade1
            return (
              <div key={e.id} className="text-center text-xs font-semibold" style={{ color: gs.color }}>
                {Math.round((e.confidence ?? 0) * 100)}%
              </div>
            )
          })}
        </div>

        {/* 跳转链接行 */}
        <div className="border-t border-medical-border/50 pt-2 grid gap-2" style={{ gridTemplateColumns: `1fr repeat(${embryos.length}, minmax(0,1fr))` }}>
          <div />
          {embryos.map(e => (
            <button
              key={e.id}
              onClick={() => onNavigate('/assessment/' + e.id)}
              className="text-medical-blue text-xs hover:underline text-center"
            >
              查看报告
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ── 报告详情 + AI 总结草稿 ── */
  if (type === 'report_summary') {
    const { report, summary } = data
    const gs = GRADE_STYLES[report.grade] ?? GRADE_STYLES.grade1
    const top5 = getMorphologyEvidence(report)

    const handleCopy = () => {
      navigator.clipboard.writeText(summary).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
    }

    return (
      <div className="bg-white border border-medical-border rounded-xl p-3 text-sm space-y-3">
        {/* Grade 色块 */}
        <div
          style={{ backgroundColor: gs.bg, borderColor: gs.border }}
          className="border rounded-lg p-3 flex items-center justify-between"
        >
          <div>
            <span style={{ color: gs.color }} className="text-lg font-bold">{gs.label}</span>
            <span className="text-medical-muted text-xs ml-2">{report.embryoNo}</span>
          </div>
          <span className="text-medical-muted text-xs">{report.assessmentDate}</span>
        </div>

        {/* 形态观察（前 5 项） */}
        <div className="space-y-2">
          {top5.map(e => <div key={e.id} className="flex justify-between gap-2 text-xs text-medical-muted"><span>{e.name}</span><span>{evidenceText(e)} · {e.sourceLabel}</span></div>)}
        </div>

        {/* AI 总结草稿 */}
        <div className="relative">
          <div className="bg-gray-50 rounded-lg p-3 pr-8 font-mono text-xs text-medical-text leading-relaxed">
            {summary}
          </div>
          <button
            onClick={handleCopy}
            className="absolute bottom-2 right-2 p-1 text-medical-muted hover:text-medical-blue transition-colors"
            title="复制草稿"
          >
            {copied
              ? <Check className="w-4 h-4 text-green-500" />
              : <Copy className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    )
  }

  return null
}
