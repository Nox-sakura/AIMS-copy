/**
 * PDFPreviewModal — PDF预览与导出全屏 Modal
 *
 * Props:
 *   assessment  {object}  评估记录（来自 assessments mock）
 *   patient     {object}  患者信息（来自 patients mock），可选
 *   onClose     {func}    关闭回调
 *   onExported  {func}    导出完成回调（用于追加版本记录）
 */
import { useState, useRef } from 'react'
import { X, ChevronDown, Printer } from 'lucide-react'
import { concepts as allConcepts } from '../../mock/concepts'
import { formatDoctorWithTitle } from '../../utils/formatDoctor'
import { useAppContext } from '../../context/AppContext'

const ZOOM_OPTIONS = [
  { label: '50%',      value: 0.5 },
  { label: '75%',      value: 0.75 },
  { label: '100%',     value: 1.0 },
  { label: '适应宽度', value: 'fit' },
]

const GRADE_LABEL = { grade1: '一级胚胎', grade2: '二级胚胎', grade3: '三级胚胎', grade4: '四级胚胎' }
const GRADE_COLOR = { grade1: '#1A5276', grade2: '#1A6EBD', grade3: '#1E8449', grade4: '#196F3D' }

const MODEL_AUC = {
  'MCA-Lite':     '0.8900',
  'MCA-Standard': '0.9288',
  'MCA-Pro':      '0.9500',
}

const MODEL_LABEL = {
  'MCA-Lite':     'MCA-Lite（轻量版）',
  'MCA-Standard': 'MCA-Standard（标准版）',
  'MCA-Pro':      'MCA-Pro（精准版）',
}

/** A4 纸张内容区 */
function A4Report({ assessment: a, patient, includeHeatmap, includeConcepts }) {
  const enriched = a.conceptScores.map(s => ({
    ...s,
    ...(allConcepts.find(c => c.id === s.id) ?? {}),
  }))
  const gradeColor = GRADE_COLOR[a.grade] ?? '#1A6EBD'
  const doctorLabel = formatDoctorWithTitle(a.doctor)
  const modelLabel = MODEL_LABEL[a.modelUsed] ?? a.modelUsed ?? 'MCA-Standard（标准版）'
  const auc = MODEL_AUC[a.modelUsed] ?? '0.9288'
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div
      id="pdf-print-content"
      style={{
        width: 794,
        minHeight: 1123,
        backgroundColor: '#fff',
        padding: '48px 56px',
        fontFamily: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
        fontSize: 13,
        color: '#2C3E50',
        lineHeight: 1.6,
        boxSizing: 'border-box',
      }}
    >
      {/* ① 报告头部 */}
      <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>××××医院</div>
        <div style={{ fontSize: 14, color: '#7F8C8D' }}>胚胎质量评估报告</div>
        <div style={{ position: 'absolute', right: 0, top: 0, fontSize: 12, color: '#7F8C8D', textAlign: 'right', lineHeight: 1.8 }}>
          <div>报告编号：{a.id}</div>
          <div>打印日期：{today}</div>
        </div>
      </div>
      <div style={{ borderTop: '2px solid #DDE3EC', marginBottom: 20 }} />

      {/* ② 患者基本信息区 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, border: '1px solid #DDE3EC' }}>
        <tbody>
          {[
            ['姓    名', patient?.name ?? a.patientName,    '患者ID',   a.patientId],
            ['年    龄', patient ? `${patient.age} 岁` : '—', '取卵日期', a.retrievalDate],
            ['胚胎编号', a.embryoNo,                          'IVF周期',  `第 ${a.cycleNo} 周期`],
            ['主治医生', doctorLabel,                         '科    室',  patient?.department ?? '生殖医学科'],
          ].map(([l1, v1, l2, v2], i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#F9FAFB' : '#fff' }}>
              <td style={{ padding: '6px 10px', color: '#7F8C8D', width: 90, textAlign: 'right', fontSize: 12, border: '1px solid #DDE3EC' }}>{l1}：</td>
              <td style={{ padding: '6px 10px', fontWeight: 500, border: '1px solid #DDE3EC' }}>{v1}</td>
              <td style={{ padding: '6px 10px', color: '#7F8C8D', width: 90, textAlign: 'right', fontSize: 12, border: '1px solid #DDE3EC' }}>{l2}：</td>
              <td style={{ padding: '6px 10px', fontWeight: 500, border: '1px solid #DDE3EC' }}>{v2}</td>
            </tr>
          ))}
          <tr style={{ backgroundColor: '#F9FAFB' }}>
            <td style={{ padding: '6px 10px', color: '#7F8C8D', textAlign: 'right', fontSize: 12, border: '1px solid #DDE3EC' }}>使用模型：</td>
            <td colSpan={3} style={{ padding: '6px 10px', fontWeight: 500, border: '1px solid #DDE3EC' }}>
              {modelLabel}&nbsp;&nbsp;<span style={{ color: '#7F8C8D', fontWeight: 400 }}>AUC参考：{auc}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ③ 图像展示区（可开关） */}
      {includeHeatmap && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2C3E50', marginBottom: 10 }}>图像展示</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {/* 左列：AI 关注区域热力图（对调后移至左侧，使用真实图像） */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 200, borderRadius: 8, border: '1px solid #DDE3EC', overflow: 'hidden' }}>
                <img
                  src="/database/baiyanli_12515_D3_1_8_heatmap.png"
                  alt="AI关注区域热力图"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#7F8C8D', marginTop: 6 }}>AI 关注区域热力图</div>
            </div>
            {/* 右列：原始显微镜图像（对调后移至右侧，使用真实图像） */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 200, borderRadius: 8, border: '1px solid #DDE3EC', overflow: 'hidden' }}>
                <img
                  src="/database/baiyanli_12515_D3_1_8.png"
                  alt="原始显微镜图像"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#7F8C8D', marginTop: 6 }}>原始显微镜图像</div>
            </div>
          </div>
          {a.imageProcessed && (
            <div style={{ fontSize: 11, color: '#7F8C8D', marginTop: 6, textAlign: 'center' }}>图像经分辨率修正处理</div>
          )}
        </div>
      )}

      {/* ④ 综合评级结论区 */}
      <div style={{ border: `2px solid ${gradeColor}33`, borderRadius: 8, padding: '16px 20px', marginBottom: 20, backgroundColor: `${gradeColor}08` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#7F8C8D', marginBottom: 8 }}>综合评级</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: gradeColor }}>{GRADE_LABEL[a.grade] ?? a.gradeLabel}</div>
            <div style={{ fontSize: 11, color: '#7F8C8D' }}>[黑白打印时请参照右侧文字说明]</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#7F8C8D' }}>AI 置信度</span>
              <span style={{ fontWeight: 600 }}>{(a.confidence * 100).toFixed(1)}%</span>
            </div>
            <div style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: 6, width: `${a.confidence * 100}%`, backgroundColor: '#1A6EBD', borderRadius: 3 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7F8C8D', marginTop: 6 }}>
              <span>AUC参考值：{auc}</span>
              <span>模型版本：v2.1</span>
            </div>
          </div>
        </div>
      </div>

      {/* ⑤ AI决策描述 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>评估说明</div>
        <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.8, fontStyle: 'italic', margin: 0 }}>
          {a.aiDecision}
        </p>
      </div>

      {/* ⑥ 概念评分明细（可开关） */}
      {includeConcepts && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>概念评分明细</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ backgroundColor: '#374151', color: '#fff' }}>
                {['概念名称', '所属方向', 'XAI贡献', '方向'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.map((s, i) => (
                <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#F9FAFB' : '#fff' }}>
                  <td style={{ padding: '5px 10px', border: '1px solid #DDE3EC' }}>{s.name ?? s.id}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #DDE3EC' }}>{s.grade ? `Grade ${s.grade[0]}` : '—'}</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #DDE3EC', fontWeight: 600 }}>{s.percent?.toFixed(2) ?? '—'}%</td>
                  <td style={{ padding: '5px 10px', border: '1px solid #DDE3EC' }}>
                    {s.direction === 'pos' ? '正向 ↑' : '负向 ↓'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ⑦ 医生审核区 */}
      <div>
        <div style={{ borderTop: '1px solid #DDE3EC', paddingTop: 16, marginBottom: 12 }} />
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>医生审核意见</div>
        <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 16, minHeight: 40 }}>
          复核意见：{a.doctorNote || '（待填写）'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <div>
            复核医生：___________________________&nbsp;&nbsp;日期：___________
            <div style={{ marginTop: 4, fontSize: 11, color: '#7F8C8D' }}>（签名）</div>
          </div>
          <div style={{ textAlign: 'right', color: '#7F8C8D' }}>
            <div>报告版本：{a.reportVersion}</div>
            <div>终审状态：{a.status === 'approved' ? '已终审' : '待终审'}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #DDE3EC', marginTop: 16 }} />
      </div>

      {/* ⑧ 页脚 */}
      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#9CA3AF', lineHeight: 1.8 }}>
        <div>××××医院 生殖医学科 &nbsp;|&nbsp; 地址：××市××路××号 &nbsp;|&nbsp; 电话：010-XXXXXXXX</div>
        <div>本报告由AI辅助生成，最终诊断以临床医生判断为准，报告结果仅供临床参考。</div>
        <div style={{ marginTop: 4 }}>第 1 页 / 共 1 页</div>
      </div>
    </div>
  )
}

export default function PDFPreviewModal({ assessment, patient, onClose, onExported }) {
  const { showToast } = useAppContext()
  const [zoom, setZoom]                   = useState(1.0)
  const [includeHeatmap, setHeatmap]      = useState(true)
  const [includeConcepts, setConcepts]    = useState(true)
  const [printing, setPrinting]           = useState(false)
  const [showZoomMenu, setShowZoomMenu]   = useState(false)
  const printRef = useRef(null)

  if (!assessment) return null

  const handleExport = () => {
    setPrinting(true)
    // 注入打印样式
    const style = document.createElement('style')
    style.id = '__pdf_print_style__'
    style.textContent = `
      @media print {
        body > * { visibility: hidden !important; }
        #pdf-print-content,
        #pdf-print-content * { visibility: visible !important; }
        #pdf-print-content {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 48px 56px !important;
          box-shadow: none !important;
        }
      }
    `
    document.head.appendChild(style)
    window.print()
    document.head.removeChild(style)
    setPrinting(false)
    showToast('PDF 已导出', 'success')
    onExported?.()
    onClose()
  }

  const zoomValue = zoom === 'fit' ? 'fit' : zoom
  const zoomLabel = ZOOM_OPTIONS.find(o => o.value === zoomValue)?.label ?? '100%'
  const scale = zoom === 'fit' ? undefined : zoom

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.7)' }}>

      {/* 顶部工具栏 */}
      <div
        className="flex items-center gap-4 px-4 py-3 flex-shrink-0"
        style={{ backgroundColor: '#374151', color: '#fff' }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
          title="关闭预览"
        >
          <X size={18} />
        </button>

        {/* 标题 */}
        <span className="text-sm font-medium flex-1 truncate">
          胚胎质量评估报告 — {assessment.id}
        </span>

        {/* 缩放下拉 */}
        <div className="relative">
          <button
            onClick={() => setShowZoomMenu(v => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-white/10 hover:bg-white/20 transition-colors"
          >
            缩放：{zoomLabel}
            <ChevronDown size={14} />
          </button>
          {showZoomMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl overflow-hidden z-10" style={{ minWidth: 120 }}>
              {ZOOM_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => { setZoom(opt.value); setShowZoomMenu(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors
                    ${zoom === opt.value ? 'bg-blue-50 text-medical-blue font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 开关选项 */}
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeHeatmap}
            onChange={e => setHeatmap(e.target.checked)}
            className="rounded"
          />
          包含热力图
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeConcepts}
            onChange={e => setConcepts(e.target.checked)}
            className="rounded"
          />
          包含概念明细
        </label>

        {/* 导出按钮 */}
        <button
          onClick={handleExport}
          disabled={printing}
          className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-60"
          style={{ backgroundColor: '#1A6EBD', color: '#fff' }}
        >
          <Printer size={15} />
          {printing ? '生成中…' : '确认导出'}
        </button>
      </div>

      {/* 预览内容区（深灰背景，居中A4白纸） */}
      <div
        className="flex-1 overflow-auto flex items-start justify-center py-8 px-6"
        style={{ backgroundColor: '#4B5563' }}
      >
        <div
          ref={printRef}
          style={{
            transform: scale ? `scale(${scale})` : undefined,
            transformOrigin: 'top center',
            width: zoom === 'fit' ? '100%' : 794,
            maxWidth: zoom === 'fit' ? 794 : undefined,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            borderRadius: 2,
          }}
        >
          <A4Report
            assessment={assessment}
            patient={patient}
            includeHeatmap={includeHeatmap}
            includeConcepts={includeConcepts}
          />
        </div>
      </div>
    </div>
  )
}
